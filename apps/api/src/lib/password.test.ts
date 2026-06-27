import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('hashes a password to a non-plaintext value', async () => {
    const hash = await hashPassword('pikachu123');
    expect(hash).not.toBe('pikachu123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('pikachu123');
    expect(await verifyPassword('pikachu123', hash)).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('pikachu123');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
