import {
  PRODUCT_THUMB_MAX_WIDTH,
  detectProductImageMime,
  productImageObjectKey,
  productThumbObjectKey,
} from '@akknerds/shared';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import type { StorageEnv } from '../env.js';

const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export interface UploadableFile {
  name: string;
  type: string;
  buffer: Buffer;
}

export interface StorageServiceOptions {
  client?: Pick<S3Client, 'send'>;
}

async function bodyToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
    const bytes = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(bytes);
  }
  // Node.js Readable
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Uploads product images to S3 and returns CDN-relative object keys. */
export class StorageService {
  private readonly client: Pick<S3Client, 'send'> | null;

  constructor(
    private readonly env: StorageEnv,
    options: StorageServiceOptions = {},
  ) {
    if (options.client) {
      this.client = options.client;
      return;
    }
    this.client = env.enabled
      ? new S3Client({
          region: env.region,
          credentials: {
            accessKeyId: env.accessKeyId,
            secretAccessKey: env.secretAccessKey,
          },
        })
      : null;
  }

  get enabled(): boolean {
    return this.env.enabled;
  }

  get cloudfrontUrl(): string {
    return this.env.cloudfrontUrl;
  }

  resolvePublicUrl(key: string): string | undefined {
    if (!this.env.cloudfrontUrl) return undefined;
    return `${this.env.cloudfrontUrl}/${key.replace(/^\//, '')}`;
  }

  async objectExists(key: string): Promise<boolean> {
    if (!this.enabled || !this.client) return false;
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.env.bucket,
          Key: key,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async uploadProductImages(files: UploadableFile[]): Promise<string[]> {
    if (!this.enabled || !this.client) {
      throw new Error('Object storage is not configured');
    }
    if (files.length === 0) return [];

    const keys: string[] = [];
    for (const file of files) {
      keys.push(await this.uploadOne(file));
    }
    return keys;
  }

  /** Upload a single image, optionally to a fixed key (for deterministic caching). */
  async uploadProductImage(file: UploadableFile, key?: string): Promise<string> {
    return this.uploadOne(file, key);
  }

  /** Upload a restoration assessment photo under restorations/. */
  async uploadRestorationImage(file: UploadableFile, key: string): Promise<string> {
    return this.uploadOne(file, key, { makeThumb: false });
  }

  /**
   * Ensure a WebP kiosk/grid thumbnail exists for a product image key.
   * Returns the thumb object key (and public CDN URL when configured).
   */
  async ensureProductThumb(imagePathOrUrl: string): Promise<{ key: string; url?: string }> {
    if (!this.enabled || !this.client) {
      throw new Error('Object storage is not configured');
    }
    const sourceKey = productImageObjectKey(imagePathOrUrl);
    if (!sourceKey || sourceKey.startsWith('products/thumbs/')) {
      throw new Error('Invalid product image key');
    }
    const thumbKey = productThumbObjectKey(sourceKey);
    if (!thumbKey) throw new Error('Invalid product image key');

    if (await this.objectExists(thumbKey)) {
      return { key: thumbKey, url: this.resolvePublicUrl(thumbKey) };
    }

    const original = await this.client.send(
      new GetObjectCommand({
        Bucket: this.env.bucket,
        Key: sourceKey,
      }),
    );
    const buffer = await bodyToBuffer(original.Body);
    if (!buffer.byteLength) throw new Error('Empty source image');

    await this.writeProductThumb(thumbKey, buffer);
    return { key: thumbKey, url: this.resolvePublicUrl(thumbKey) };
  }

  private async uploadOne(
    file: UploadableFile,
    keyOverride?: string,
    options: { makeThumb?: boolean } = {},
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Object storage is not configured');
    }
    // Trust magic bytes, not the client-provided Content-Type (L9).
    const contentType = detectProductImageMime(file.buffer);
    if (!contentType) {
      throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
    }
    if (file.buffer.byteLength > MAX_BYTES) {
      throw new Error(`File ${file.name} exceeds the 5 MB limit`);
    }

    const ext = EXT_BY_TYPE[contentType] ?? 'bin';
    const key = keyOverride ?? `products/${nanoid(16)}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const makeThumb = options.makeThumb ?? key.startsWith('products/');
    if (makeThumb) {
      try {
        const thumbKey = productThumbObjectKey(key);
        if (thumbKey) await this.writeProductThumb(thumbKey, file.buffer);
      } catch (error) {
        console.warn('[storage] product thumb failed', key, error);
      }
    }

    return key;
  }

  private async writeProductThumb(thumbKey: string, source: Buffer): Promise<void> {
    if (!this.client) throw new Error('Object storage is not configured');
    const webp = await sharp(source)
      .rotate()
      .resize({
        width: PRODUCT_THUMB_MAX_WIDTH,
        height: PRODUCT_THUMB_MAX_WIDTH,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 72, effort: 4 })
      .toBuffer();

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.bucket,
        Key: thumbKey,
        Body: webp,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }
}
