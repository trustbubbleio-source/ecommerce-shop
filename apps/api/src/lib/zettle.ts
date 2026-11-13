import { randomUUID } from 'node:crypto';
import type { Product } from '@akknerds/shared';
import type { Env } from '../env.js';

export interface ZettleStockLine {
  product: Product;
  quantity: number;
}

interface ZettleInventory {
  /** Some Zettle responses use `uuid`, v3 inventories use `inventoryUuid`. */
  uuid?: string;
  inventoryUuid?: string;
  type?: string;
  inventoryType?: string;
  name?: string;
}

function inventoryId(inv: ZettleInventory): string | undefined {
  return inv.inventoryUuid ?? inv.uuid;
}

function inventoryKind(inv: ZettleInventory): string {
  return (inv.inventoryType ?? inv.type ?? inv.name ?? '').toUpperCase();
}

/**
 * PayPal Zettle Inventory API (v3).
 * Disabled when ZETTLE_CLIENT_ID / ZETTLE_API_KEY are missing — local stock still works.
 */
export class ZettleInventoryService {
  private accessToken?: string;
  private accessTokenExpiresAt = 0;
  private storeInventoryUuid?: string;
  private soldInventoryUuid?: string;

  constructor(private readonly env: Env) {}

  get enabled(): boolean {
    return this.env.zettleEnabled;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt - 30_000) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      client_id: this.env.zettleClientId,
      assertion: this.env.zettleApiKey,
    });

    const res = await fetch('https://oauth.zettle.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Zettle OAuth failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.accessTokenExpiresAt = now + data.expires_in * 1000;
    return this.accessToken;
  }

  private async zettleFetch<T>(
    base: string,
    path: string,
    init?: RequestInit,
  ): Promise<{ status: number; data: T | null; text: string }> {
    const token = await this.getAccessToken();
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = null;
      }
    }
    return { status: res.status, data, text };
  }

  private async ensureInventoryUuids(): Promise<{ store: string; sold: string }> {
    if (this.storeInventoryUuid && this.soldInventoryUuid) {
      return { store: this.storeInventoryUuid, sold: this.soldInventoryUuid };
    }

    if (this.env.zettleStoreInventoryUuid && this.env.zettleSoldInventoryUuid) {
      this.storeInventoryUuid = this.env.zettleStoreInventoryUuid;
      this.soldInventoryUuid = this.env.zettleSoldInventoryUuid;
      return { store: this.storeInventoryUuid, sold: this.soldInventoryUuid };
    }

    const { status, data, text } = await this.zettleFetch<{ inventories?: ZettleInventory[] }>(
      'https://inventory.izettle.com',
      '/v3/inventories',
    );
    if (status >= 400) {
      throw new Error(`Zettle inventories failed (${status}): ${text.slice(0, 200)}`);
    }

    const inventories = data?.inventories ?? (Array.isArray(data) ? (data as ZettleInventory[]) : []);
    const store =
      inventories.find((i) => inventoryKind(i) === 'STORE') ??
      inventories.find((i) => inventoryKind(i).includes('STORE'));
    const sold =
      inventories.find((i) => inventoryKind(i) === 'SOLD') ??
      inventories.find((i) => inventoryKind(i).includes('SOLD'));

    const storeId = store ? inventoryId(store) : undefined;
    const soldId = sold ? inventoryId(sold) : undefined;

    if (!storeId || !soldId) {
      throw new Error(
        `Zettle STORE/SOLD inventories not found. Set ZETTLE_STORE_INVENTORY_UUID and ZETTLE_SOLD_INVENTORY_UUID. Saw: ${inventories
          .map((i) => `${inventoryKind(i) || '?'}:${inventoryId(i) ?? 'missing'}`)
          .join(', ')}`,
      );
    }

    this.storeInventoryUuid = storeId;
    this.soldInventoryUuid = soldId;
    return { store: storeId, sold: soldId };
  }

  private linkedLines(lines: ZettleStockLine[]): ZettleStockLine[] {
    return lines.filter(
      (line) =>
        line.quantity > 0 &&
        Boolean(line.product.zettleProductUuid) &&
        Boolean(line.product.zettleVariantUuid),
    );
  }

  /**
   * Move units STORE → SOLD (web/POS sale). No-op when Zettle disabled or product unlinked.
   */
  async reserve(lines: ZettleStockLine[]): Promise<void> {
    if (!this.enabled) return;
    const linked = this.linkedLines(lines);
    if (linked.length === 0) return;

    const { store, sold } = await this.ensureInventoryUuids();
    const payload = {
      // Zettle requires a UUID v4 idempotency key — not a free-form string.
      identifier: randomUUID(),
      movements: linked.map((line) => ({
        productUuid: line.product.zettleProductUuid!,
        variantUuid: line.product.zettleVariantUuid!,
        change: line.quantity,
        from: store,
        to: sold,
      })),
    };

    const { status, text } = await this.zettleFetch(
      'https://inventory.izettle.com',
      '/v3/movements',
      { method: 'POST', body: JSON.stringify(payload) },
    );
    if (status !== 204 && status !== 200) {
      throw new Error(`Zettle reserve failed (${status}): ${text.slice(0, 300)}`);
    }
  }

  /** Move units SOLD → STORE (cancel / abandon). */
  async release(lines: ZettleStockLine[]): Promise<void> {
    if (!this.enabled) return;
    const linked = this.linkedLines(lines);
    if (linked.length === 0) return;

    const { store, sold } = await this.ensureInventoryUuids();
    const payload = {
      identifier: randomUUID(),
      movements: linked.map((line) => ({
        productUuid: line.product.zettleProductUuid!,
        variantUuid: line.product.zettleVariantUuid!,
        change: line.quantity,
        from: sold,
        to: store,
      })),
    };

    const { status, text } = await this.zettleFetch(
      'https://inventory.izettle.com',
      '/v3/movements',
      { method: 'POST', body: JSON.stringify(payload) },
    );
    if (status !== 204 && status !== 200) {
      throw new Error(`Zettle release failed (${status}): ${text.slice(0, 300)}`);
    }
  }
}
