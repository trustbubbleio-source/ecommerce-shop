import { describe, expect, it } from 'vitest';
import { isPurchaseLocked } from './launch';

describe('isPurchaseLocked', () => {
  it('locks the public during prelaunch', () => {
    expect(isPurchaseLocked(false, true)).toBe(true);
  });

  it('lets admins buy during prelaunch', () => {
    expect(isPurchaseLocked(true, true)).toBe(false);
  });

  it('unlocks everyone after launch', () => {
    expect(isPurchaseLocked(false, false)).toBe(false);
    expect(isPurchaseLocked(true, false)).toBe(false);
  });
});
