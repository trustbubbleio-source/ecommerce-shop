import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import type { StorageEnv } from '../env.js';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

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

  private async uploadOne(file: UploadableFile, keyOverride?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Object storage is not configured');
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
    }
    if (file.buffer.byteLength > MAX_BYTES) {
      throw new Error(`File ${file.name} exceeds the 5 MB limit`);
    }

    const ext = EXT_BY_TYPE[file.type] ?? 'bin';
    const key = keyOverride ?? `products/${nanoid(16)}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.env.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.type,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return key;
  }
}
