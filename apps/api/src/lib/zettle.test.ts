import { describe, expect, it } from 'vitest';
import { loadEnv } from '../env.js';
import { ZettleInventoryService } from './zettle.js';

describe('ZettleInventoryService', () => {
  it('is disabled without credentials', () => {
    const env = loadEnv({ ZETTLE_CLIENT_ID: '', ZETTLE_API_KEY: '' });
    const zettle = new ZettleInventoryService(env);
    expect(zettle.enabled).toBe(false);
  });

  it('no-ops reserve/release when disabled', async () => {
    const env = loadEnv({});
    const zettle = new ZettleInventoryService(env);
    await expect(zettle.reserve([])).resolves.toBeUndefined();
    await expect(zettle.release([])).resolves.toBeUndefined();
  });
});
