import { describe, expect, it } from 'vitest';
import { hasStoreArrivalLanded, stockholmDateKey } from './store-arrivals';

describe('store-arrivals', () => {
  it('compares Stockholm calendar dates for arrival', () => {
    // 9 Nov 2026 23:00 UTC = 10 Nov morning in Stockholm (CET).
    expect(stockholmDateKey(new Date('2026-11-09T23:00:00.000Z'))).toBe('2026-11-10');
    expect(hasStoreArrivalLanded('2026-11-10', new Date('2026-11-09T10:00:00.000Z'))).toBe(
      false,
    );
    expect(hasStoreArrivalLanded('2026-11-10', new Date('2026-11-09T23:00:00.000Z'))).toBe(true);
    expect(hasStoreArrivalLanded('2026-11-10', new Date('2026-11-11T12:00:00.000Z'))).toBe(true);
  });
});
