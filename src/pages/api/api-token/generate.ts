import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import prisma from '../../../lib/prisma';
import crypto from 'crypto';
import { verifyHcaptchaToken } from '../../../lib/verifyHcaptcha';
import {
  getRequestIp,
  isRequestFromConfiguredWhitelist,
} from '../../../lib/apiIpWhitelist';

const rateLimit = new Map<string, { lastRequestTime: number; requestCount: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 1;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { hcaptchaToken } = req.body as { hcaptchaToken?: string };

  try {
    const user = await prisma.user.findUnique({
      where: { username: session.user.name ?? undefined },
      select: { id: true, apiAccess: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.apiAccess) {
      return res.status(403).json({ message: 'API access is not enabled for your account' });
    }

    const requestIp = getRequestIp(req);
    const skipCaptchaFromWhitelist = isRequestFromConfiguredWhitelist(user.id, requestIp);
    const skipCaptchaEnv =
      process.env.SKIP_HCAPTCHA_API_TOKEN_GENERATE === 'true';

    if (!skipCaptchaFromWhitelist && !skipCaptchaEnv) {
      if (!hcaptchaToken || typeof hcaptchaToken !== 'string') {
        return res.status(400).json({
          message:
            'hCaptcha token required. Save your server IP under API whitelisting to skip captcha from that IP, or complete hCaptcha in the panel.',
        });
      }
      const isCaptchaValid = await verifyHcaptchaToken(hcaptchaToken, req);
      if (!isCaptchaValid) {
        return res.status(400).json({ message: 'hCaptcha verification failed' });
      }
    }

    const userId = user.id;
    const currentTime = Date.now();
    const userLimit = rateLimit.get(userId) || { lastRequestTime: 0, requestCount: 0 };

    if (currentTime - userLimit.lastRequestTime < RATE_LIMIT_WINDOW_MS) {
      if (userLimit.requestCount >= MAX_REQUESTS) {
        return res.status(429).json({ message: 'Too many requests. Please try again later.' });
      }
      userLimit.requestCount += 1;
    } else {
      userLimit.lastRequestTime = currentTime;
      userLimit.requestCount = 1;
    }

    rateLimit.set(userId, userLimit);

    const newApiToken = crypto.randomBytes(32).toString('hex');

    await prisma.user.update({
      where: { id: userId },
      data: { apiToken: newApiToken },
    });

    return res.status(200).json({ message: 'API token generated successfully', apiToken: newApiToken });
  } catch (error) {
    console.error('Generate API token error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
