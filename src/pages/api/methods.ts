import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/authOptions';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { type } = req.query;

    if (type && type !== 'l4' && type !== 'l7') {
      return res.status(400).json({ message: 'Invalid type parameter' });
    }

    const filter = type ? { type: type as string } : {};

    const methods = await prisma.method.findMany({
      where: filter,
    });

    res.status(200).json({ methods });
  } catch (error) {
    console.error('Methods API error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
