import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: session.user.name as string },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark all active attacks for this user as stopped.
    // We no longer query servers because SQLite doesn't support Prisma's `{ has: ... }`
    // filter on a plain string field. This was the source of the validation error.
    const result = await prisma.attack.updateMany({
      where: {
        userId: user.id,
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      data: { status: 'stopped' },
    });

    return res.status(200).json({
      message: `Stopped ${result.count} active attack(s)`,
    });
  } catch (error) {
    console.error('Stop all attacks error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}