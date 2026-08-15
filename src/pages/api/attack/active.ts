import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: session.user.name },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const activeAttacks = await prisma.attack.findMany({
      where: { userId: user.id, status: 'active', expiresAt: { gt: new Date() } },
      select: { id: true, target: true, methodName: true, expiresAt: true, layer: true },
    });

    return res.status(200).json({ attacks: activeAttacks });
  } catch (error) {
    console.error('Error fetching active attacks:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
