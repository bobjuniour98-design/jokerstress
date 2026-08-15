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
      where: { username: session.user.name },
      select: { id: true, apiToken: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { apiToken: null },
    });

    return res.status(200).json({ message: 'API token disabled successfully' });
  } catch (error) {
    console.error('Disable API token error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
