import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import { Payment } from '@prisma/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payments = await prisma.payment.findMany({
      where: { user: session.user.name as string },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      transactions: payments.map((payment: Payment) => ({
        id: payment.uniqID || payment.id,
        status: payment.status || 'completed',
        amount: payment.amount || 0,
        coin: payment.gateway || 'Admin', 
        date: payment.createdAt.toLocaleDateString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}