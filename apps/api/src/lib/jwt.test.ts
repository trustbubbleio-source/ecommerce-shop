import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './jwt.js';

const SECRET = 'unit-test-secret';

describe('jwt', () => {
  it('signs and verifies a token round-trip', async () => {
    const token = await signToken({ sub: 'usr_1', email: 'a@b.com' }, SECRET);
    const payload = await verifyToken(token, SECRET);
    expect(payload).toEqual({ sub: 'usr_1', email: 'a@b.com' });
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signToken({ sub: 'usr_1', email: 'a@b.com' }, SECRET);
    expect(await verifyToken(token, 'other-secret')).toBeNull();
  });

  it('rejects a malformed token', async () => {
    expect(await verifyToken('not-a-jwt', SECRET)).toBeNull();
  });
});
