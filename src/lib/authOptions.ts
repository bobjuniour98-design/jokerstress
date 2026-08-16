import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from './prisma';
import { compare } from 'bcryptjs';
import { verifyHcaptchaToken } from './verifyHcaptcha';
import { getTwoFactorState } from './twoFactorStore';
import { verifyTotpCode } from './totp';

interface ExtendedUser {
  id: string;
  name: string;
  rank?: string;
  premium?: boolean;
  plan?: string;
  planExpire?: Date | null;
  apiAccess?: boolean;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || "some_random_long_string_here_12345",

  // @ts-expect-error - trustHost is valid in some versions but not in current types
  trustHost: true,

  useSecureCookies: process.env.NODE_ENV === 'production',

  providers: [
    CredentialsProvider({
      name: 'Credentials',

      credentials: {
        username: {
          label: 'Username',
          type: 'text',
          placeholder: 'john_doe'
        },
        password: {
          label: 'Password',
          type: 'password'
        },
        hcaptchaToken: {
          label: 'hCaptcha Token',
          type: 'text'
        },
        totpCode: {
          label: '2FA Code',
          type: 'text'
        },
      },

      async authorize(credentials, req) {
        if (!credentials) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username,
          },
        });

        if (user && credentials.password) {
          if (user.rank === 'banned') {
            throw new Error('USER_BANNED');
          }

          // Skip captcha for new users to allow auto-login after registration
          const isRecentlyCreated =
            user.created &&
            (Date.now() - new Date(user.created).getTime() < 60000);

          if (!isRecentlyCreated) {
            const isCaptchaValid = await verifyHcaptchaToken(
              credentials.hcaptchaToken ?? '',
              req
            );

            if (!isCaptchaValid) {
              throw new Error('CAPTCHA_INVALID');
            }
          }

          const isValid = await compare(
            credentials.password,
            user.password
          );

          if (isValid) {
            const twoFactor = getTwoFactorState(Number(user.id));

            if (twoFactor.enabledSecret) {
              const providedCode = credentials.totpCode ?? '';

              if (!providedCode) {
                throw new Error('TOTP_REQUIRED');
              }

              const ok = verifyTotpCode(
                twoFactor.enabledSecret,
                providedCode
              );

              if (!ok) {
                throw new Error('TOTP_INVALID');
              }
            }

            return {
              id: user.id.toString(),
              name: user.username,
              rank: user.rank,
              premium: user.premium,
              plan: user.plan,
              planExpire: user.planExpire,
              apiAccess: user.apiAccess,
            } as ExtendedUser;
          }
        }

        // Catch-all captcha verification for failed logins/invalid users
        // to prevent brute force
        const isCaptchaValid = await verifyHcaptchaToken(
          credentials.hcaptchaToken ?? '',
          req
        );

        if (!isCaptchaValid) {
          throw new Error('CAPTCHA_INVALID');
        }

        return null;
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as ExtendedUser;

        token.id = u.id;
        token.name = u.name;
        token.rank = u.rank;
        token.premium = u.premium;
        token.plan = u.plan;
        token.planExpire = u.planExpire;
        token.apiAccess = u.apiAccess;
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;

        (session.user as ExtendedUser).rank =
          token.rank as string;

        (session.user as ExtendedUser).premium =
          token.premium as boolean;

        (session.user as ExtendedUser).plan =
          token.plan as string;

        (session.user as ExtendedUser).planExpire =
          token.planExpire as Date | null;

        (session.user as ExtendedUser).apiAccess =
          token.apiAccess as boolean;
      }

      return session;
    },
  },

  pages: {
    signIn: '/signin',
    error: '/signin',
  },

  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },

    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },

    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

/*
 * Extend NextAuth's Session type so TypeScript knows
 * that session.user contains our custom user fields.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      rank?: string;
      premium?: boolean;
      plan?: string;
      planExpire?: Date | null;
      apiAccess?: boolean;
    };
  }
}