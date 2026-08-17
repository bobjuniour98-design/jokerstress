import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import { getTwoFactorState } from '../../../../lib/twoFactorStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = String(token.id);
  const state = getTwoFactorState(userId);
  return res.status(200).json({
    enabled: Boolean(state.enabledSecret),
    hasPendingSetup: Boolean(state.pendingSecret),
  });
}
