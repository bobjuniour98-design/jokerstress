import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import prisma from '../../../lib/prisma';
import {
  getWhitelist,
  setWhitelist,
  validateWhitelistInput,
} from '../../../lib/apiIpWhitelist';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

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

  if (req.method === 'GET') {
    return res.status(200).json(getWhitelist(user.id));
  }

  if (req.method === 'POST') {
    const { ipv4, ipv6 } = req.body as { ipv4?: string; ipv6?: string };
    const validationError = validateWhitelistInput(ipv4, ipv6);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const whitelist = setWhitelist(user.id, { ipv4, ipv6 });
    return res.status(200).json({
      message: 'Whitelist updated successfully',
      whitelist,
    });
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
