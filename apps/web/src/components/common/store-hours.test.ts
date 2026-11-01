import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTodayStoreStatus, todayStoreMessage } from './store-hours';

afterEach(() => {
  vi.useRealTimers();
});

describe('getTodayStoreStatus', () => {
  it('reports closed on Monday and points to Tuesday open', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-02T12:00:00+01:00')); // Monday Stockholm
    const status = getTodayStoreStatus();
    expect(status).toEqual({
      kind: 'closed',
      day: 'Monday',
      nextDay: 'Tuesday',
      nextOpensAt: '13:00',
    });
    expect(todayStoreMessage(status)).toBe(
      'Today the store is closed. We open again Tuesday at 13:00.',
    );
  });

  it('reports open hours on Friday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-06T12:00:00+01:00')); // Friday Stockholm
    const status = getTodayStoreStatus();
    expect(status).toEqual({
      kind: 'open',
      day: 'Friday',
      hours: '13:00–20:00',
      opensAt: '13:00',
    });
    expect(todayStoreMessage(status)).toBe("Today we're open 13:00–20:00.");
  });

  it('points from Sunday to Tuesday', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T18:00:00+01:00')); // Sunday Stockholm
    const status = getTodayStoreStatus();
    expect(status.kind).toBe('closed');
    if (status.kind === 'closed') {
      expect(status.nextDay).toBe('Tuesday');
      expect(status.nextOpensAt).toBe('13:00');
    }
  });
});
