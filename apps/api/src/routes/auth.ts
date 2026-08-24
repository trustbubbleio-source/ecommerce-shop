import {
  forgotPasswordInputSchema,
  googleAuthInputSchema,
  loginInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
  setPasswordInputSchema,
  updateProfileInputSchema,
  verifyEmailInputSchema,
} from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { verifyGoogleIdToken } from '../lib/google-auth.js';
import { signToken, verifyToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { requireAuth } from '../middleware/auth.js';
import {
  displayNameFromEmail,
  isEmailVerified,
  toPublicUser,
  type StoredUser,
} from '../repositories/users.js';

const REGISTER_PENDING_MESSAGE =
  'Check your inbox — we sent a link to confirm your email and finish signing up.';
const FORGOT_OK_MESSAGE =
  'If an account exists for that email, we sent password reset instructions.';

function authPayload(user: StoredUser, token: string, mustSetPassword = false) {
  return {
    token,
    user: toPublicUser(user),
    mustSetPassword,
  };
}

async function issueSession(user: StoredUser, secret: string, mustSetPassword = false) {
  const token = await signToken({ sub: user.id, email: user.email }, secret);
  return authPayload(user, token, mustSetPassword);
}

export function authRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/providers', (c) =>
    c.json({
      google: deps.env.google.enabled,
    }),
  );

  app.post('/register', validate('json', registerInputSchema), async (c) => {
    const { email } = c.req.valid('json');
    const existing = await deps.users.findByEmail(email);

    let user = existing;
    if (existing) {
      if (isEmailVerified(existing)) {
        return c.json({ error: 'An account with this email already exists' }, 409);
      }
      // Pending signup — just resend the confirmation email.
      user = existing;
    } else {
      user = await deps.users.create({
        email,
        name: displayNameFromEmail(email),
        passwordHash: null,
      });
    }

    const verifyTokenJwt = await signToken(
      { sub: user.id, email: user.email, purpose: 'email-verification' },
      deps.env.jwtSecret,
    );
    const origin = deps.env.webOrigins[0] ?? 'http://localhost:5173';
    const verifyUrl = `${origin}/verify-email?token=${encodeURIComponent(verifyTokenJwt)}`;

    try {
      await deps.email.sendEmailVerification({
        name: user.name,
        email: user.email,
        verifyUrl,
      });
    } catch (error) {
      console.error('[email] verification failed', error);
      return c.json({ error: 'Could not send confirmation email. Please try again later.' }, 502);
    }

    return c.json({ ok: true, message: REGISTER_PENDING_MESSAGE }, 201);
  });

  app.post('/verify-email', validate('json', verifyEmailInputSchema), async (c) => {
    const { token } = c.req.valid('json');
    const payload = await verifyToken(token, deps.env.jwtSecret, 'email-verification');
    if (!payload) {
      return c.json({ error: 'This confirmation link is invalid or has expired.' }, 400);
    }

    const user = await deps.users.markEmailVerified(payload.sub);
    if (!user || user.email !== payload.email) {
      return c.json({ error: 'This confirmation link is invalid or has expired.' }, 400);
    }

    return c.json(await issueSession(user, deps.env.jwtSecret, !user.passwordHash));
  });

  app.post('/login', validate('json', loginInputSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const user = await deps.users.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    if (!isEmailVerified(user)) {
      return c.json(
        {
          error:
            'Please confirm your email first. Check your inbox for the link we sent when you signed up.',
        },
        403,
      );
    }
    return c.json(await issueSession(user, deps.env.jwtSecret));
  });

  app.post('/google', validate('json', googleAuthInputSchema), async (c) => {
    if (!deps.env.google.enabled) {
      return c.json({ error: 'Google sign-in is not configured.' }, 503);
    }
    const { idToken } = c.req.valid('json');
    const identity = await verifyGoogleIdToken(idToken, deps.env.google.clientId);
    if (!identity || !identity.emailVerified) {
      return c.json({ error: 'Google sign-in failed. Please try again.' }, 401);
    }

    let user =
      (await deps.users.findByGoogleSub(identity.sub)) ??
      (await deps.users.findByEmail(identity.email));

    if (user) {
      if (!user.googleSub) {
        user = (await deps.users.linkGoogle(user.id, identity.sub)) ?? user;
      }
      if (!isEmailVerified(user)) {
        user = (await deps.users.markEmailVerified(user.id)) ?? user;
      }
    } else {
      user = await deps.users.create({
        email: identity.email,
        name: identity.name,
        googleSub: identity.sub,
        passwordHash: null,
        emailVerifiedAt: new Date().toISOString(),
      });
    }

    return c.json(await issueSession(user, deps.env.jwtSecret));
  });

  app.post('/set-password', requireAuth(), validate('json', setPasswordInputSchema), async (c) => {
    const payload = c.get('user')!;
    const { password } = c.req.valid('json');
    const passwordHash = await hashPassword(password);
    const user = await deps.users.updatePassword(payload.sub, passwordHash);
    if (!user || !isEmailVerified(user)) {
      return c.json({ error: 'Could not update password.' }, 400);
    }
    return c.json({
      ok: true,
      user: toPublicUser(user),
      message: 'Password saved.',
    });
  });

  app.patch('/me', requireAuth(), validate('json', updateProfileInputSchema), async (c) => {
    const payload = c.get('user')!;
    const { name } = c.req.valid('json');
    const user = await deps.users.updateProfile(payload.sub, { name });
    if (!user || !isEmailVerified(user)) {
      return c.json({ error: 'Could not update profile.' }, 400);
    }
    return c.json({ user: toPublicUser(user) });
  });

  app.post('/forgot-password', validate('json', forgotPasswordInputSchema), async (c) => {
    const { email } = c.req.valid('json');
    const user = await deps.users.findByEmail(email);

    if (user && isEmailVerified(user)) {
      const resetToken = await signToken(
        { sub: user.id, email: user.email, purpose: 'password-reset' },
        deps.env.jwtSecret,
      );
      const origin = deps.env.webOrigins[0] ?? 'http://localhost:5173';
      const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(resetToken)}`;
      try {
        await deps.email.sendPasswordReset({
          name: user.name,
          email: user.email,
          resetUrl,
        });
      } catch (error) {
        console.error('[email] password reset failed', error);
        return c.json({ error: 'Could not send reset email. Please try again later.' }, 502);
      }
    } else if (user && !isEmailVerified(user)) {
      const verifyTokenJwt = await signToken(
        { sub: user.id, email: user.email, purpose: 'email-verification' },
        deps.env.jwtSecret,
      );
      const origin = deps.env.webOrigins[0] ?? 'http://localhost:5173';
      const verifyUrl = `${origin}/verify-email?token=${encodeURIComponent(verifyTokenJwt)}`;
      try {
        await deps.email.sendEmailVerification({
          name: user.name,
          email: user.email,
          verifyUrl,
        });
      } catch (error) {
        console.error('[email] verification resend failed', error);
      }
    }

    return c.json({ ok: true, message: FORGOT_OK_MESSAGE });
  });

  app.post('/reset-password', validate('json', resetPasswordInputSchema), async (c) => {
    const { token, password } = c.req.valid('json');
    const payload = await verifyToken(token, deps.env.jwtSecret, 'password-reset');
    if (!payload) {
      return c.json({ error: 'This reset link is invalid or has expired.' }, 400);
    }

    const passwordHash = await hashPassword(password);
    const user = await deps.users.updatePassword(payload.sub, passwordHash);
    if (!user) {
      return c.json({ error: 'This reset link is invalid or has expired.' }, 400);
    }

    return c.json({
      ok: true,
      message: 'Password updated. You can sign in with your new password.',
    });
  });

  app.get('/me', requireAuth(), async (c) => {
    const payload = c.get('user')!;
    const user = await deps.users.findByEmail(payload.email);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    if (!isEmailVerified(user)) {
      return c.json({ error: 'Email not confirmed' }, 403);
    }
    return c.json({ user: toPublicUser(user) });
  });

  return app;
}
