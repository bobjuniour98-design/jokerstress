import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import prisma from '../../../lib/prisma';

interface PlanType {
  name: string;
  concurrent: number;
  attackDuration: number;
}

interface UserType {
  id: string;
  username: string;
  rank: string;
  plan: string;
  planExpire: Date | null;
  balance: number;
  premium: boolean;
  apiAccess: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.name },
      select: {
        id: true,
        username: true,
        rank: true,
        plan: true,
        planExpire: true,
        balance: true,
        premium: true,
        apiAccess: true,
      },
    }) as UserType | null;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = await prisma.plan.findFirst({
      where: { name: user.plan },
      select: { name: true, concurrent: true, attackDuration: true },
    }) as PlanType | null;

    if (!plan) {
      return res.status(200).json({ message: 'No plan found for the user' });
    }

    const now = new Date();
    let remainingTime = 0;
    if (user.planExpire) {
      remainingTime = Math.max(0, Math.floor((user.planExpire.getTime() - now.getTime()) / 1000));
    }

    const responseData = {
      user: {
        id: user.id,
        username: user.username,
        plan: user.plan,
        planExpire: user.planExpire,
        remainingTime,
      },
      plan: {
        name: plan.name,
        concurrent: plan.concurrent,
        attackDuration: plan.attackDuration,
      },
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Plan API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
