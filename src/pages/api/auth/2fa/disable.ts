import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { disableTwoFactor, getTwoFactorState } from '../../../../lib/twoFactorStore';
import { verifyTotpCode } from '../../../../lib/totp';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { code } = req.body as { code?: string };
  if (!code) {
    return res.status(400).json({ message: '2FA code is required' });
  }

  const userId = Number(token.id);
  const state = getTwoFactorState(userId);
  if (!state.enabledSecret) {
    return res.status(400).json({ message: '2FA is not enabled' });
  }

  const valid = verifyTotpCode(state.enabledSecret, code);
  if (!valid) {
    return res.status(400).json({ message: 'Invalid 2FA code' });
  }

  disableTwoFactor(userId);
  return res.status(200).json({ message: '2FA disabled successfully' });
}
