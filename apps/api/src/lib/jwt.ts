import { SignJWT, jwtVerify } from 'jose';

export interface TokenPayload {
  sub: string;
  email: string;
}

const ALG = 'HS256';
const EXPIRY = '7d';

function key(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: TokenPayload, secret: string): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(key(secret));
}

export async function verifyToken(token: string, secret: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: [ALG] });
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string') return null;
    return { sub: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
