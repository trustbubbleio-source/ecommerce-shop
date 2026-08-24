import { OAuth2Client } from 'google-auth-library';

export interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

/**
 * Verifies a Google Identity Services ID token.
 * Returns null when the token is invalid or the client id is not configured.
 */
export async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
): Promise<GoogleIdentity | null> {
  if (!clientId) return null;
  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) return null;
    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      name: (payload.name?.trim() || payload.email.split('@')[0] || 'Collector').slice(0, 80),
      emailVerified: payload.email_verified === true,
    };
  } catch {
    return null;
  }
}
