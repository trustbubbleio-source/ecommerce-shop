import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from './jwt.js';

const SECRET = 'unit-test-secret';

describe('jwt', () => {
  it('signs and verifies a session token round-trip', async () => {
    const token = await signToken({ sub: 'usr_1', email: 'a@b.com' }, SECRET);
    const payload = await verifyToken(token, SECRET);
    expect(payload).toEqual({ sub: 'usr_1', email: 'a@b.com', purpose: 'session' });
  });

  it('rejects a password-reset token as a session token', async () => {
    const token = await signToken(
      { sub: 'usr_1', email: 'a@b.com', purpose: 'password-reset' },
      SECRET,
    );
    expect(await verifyToken(token, SECRET)).toBeNull();
    expect(await verifyToken(token, SECRET, 'password-reset')).toMatchObject({
      sub: 'usr_1',
      purpose: 'password-reset',
    });
  });

  it('verifies an email-verification token', async () => {
    const token = await signToken(
      { sub: 'usr_1', email: 'a@b.com', purpose: 'email-verification' },
      SECRET,
    );
    expect(await verifyToken(token, SECRET)).toBeNull();
    expect(await verifyToken(token, SECRET, 'email-verification')).toMatchObject({
      purpose: 'email-verification',
    });
  });

  it('rejects a token signed with a different secret', async () => {
    const token = await signToken({ sub: 'usr_1', email: 'a@b.com' }, SECRET);
    expect(await verifyToken(token, 'other-secret')).toBeNull();
  });

  it('rejects a malformed token', async () => {
    expect(await verifyToken('not-a-jwt', SECRET)).toBeNull();
  });
});
