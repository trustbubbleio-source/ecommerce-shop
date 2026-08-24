import { SignJWT, jwtVerify } from 'jose';

export type TokenPurpose = 'session' | 'password-reset' | 'email-verification';

export interface TokenPayload {
  sub: string;
  email: string;
  purpose: TokenPurpose;
}

const ALG = 'HS256';
const SESSION_EXPIRY = '7d';
const RESET_EXPIRY = '1h';
const VERIFY_EXPIRY = '24h';

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

function expiryFor(purpose: TokenPurpose): string {
  if (purpose === 'password-reset') return RESET_EXPIRY;
  if (purpose === 'email-verification') return VERIFY_EXPIRY;
  return SESSION_EXPIRY;
}

export async function signToken(
  payload: Omit<TokenPayload, 'purpose'> & { purpose?: TokenPurpose },
  secret: string,
): Promise<string> {
  const purpose = payload.purpose ?? 'session';
  return new SignJWT({ email: payload.email, purpose })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiryFor(purpose))
    .sign(key(secret));
}

export async function verifyToken(
  token: string,
  secret: string,
  expectedPurpose: TokenPurpose = 'session',
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: [ALG] });
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    const purpose = (payload.purpose as TokenPurpose | undefined) ?? 'session';
    if (purpose !== expectedPurpose) return null;
    return { sub: payload.sub, email: payload.email, purpose };
  } catch {
    return null;
  }
}
