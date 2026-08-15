import type { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import prisma from '../../../../lib/prisma';
import { buildOtpAuthUrl, generateBase32Secret } from '../../../../lib/totp';
import { setPendingTwoFactorSecret } from '../../../../lib/twoFactorStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(token.id) },
    select: { id: true, username: true },
  });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const secret = generateBase32Secret();
  setPendingTwoFactorSecret(user.id, secret);

  const issuer = 'JokerSTRESS';
  const otpauthUrl = buildOtpAuthUrl(issuer, user.username, secret);

  return res.status(200).json({
    secret,
    otpauthUrl,
    issuer,
    accountName: user.username,
  });
}
