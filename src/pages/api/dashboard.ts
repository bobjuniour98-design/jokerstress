import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/authOptions';
import prisma from '../../lib/prisma';

interface PlanType {
  name: string;
  concurrent: number;
  attackDuration: number;
}

interface UserType {
  username: string;
  rank: string;
  plan: string;
  planExpire: Date | null;
  balance: number;
  premium: boolean;
  apiAccess: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: session.user.name ?? undefined },
      select: {
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

    const defaultPlan: PlanType = {
      name: 'free',
      concurrent: 0,
      attackDuration: 0,
    };

    const effectivePlan = plan || defaultPlan;

    const [totalUsers, runningBots, layer7Usage, layer4Usage] = await Promise.all([
      prisma.user.count(),
      prisma.attack.count({ where: { status: 'active' } }),
      prisma.attack.count({ where: { layer: '7', status: 'active' } }),
      prisma.attack.count({ where: { layer: '4', status: 'active' } }),
    ]);

    const totalAttacksFromStats = await prisma.stats.aggregate({
      _sum: { TotalAttacks: true },
    });

    const currentAttackCount = await prisma.attack.count();

    const comprehensiveTotalAttacks = (totalAttacksFromStats._sum.TotalAttacks || 0) + currentAttackCount;

    const dashboardData = {
      username: user.username,
      rank: user.rank,
      plan: effectivePlan.name,
      concurrents: effectivePlan.concurrent,
      max_boot_time: effectivePlan.attackDuration,
      plan_expire: user.planExpire,
      balance: user.balance,
      premium: user.premium,
      apiAccess: user.apiAccess,
      stats: {
        total_users: totalUsers,
        total_attacks: comprehensiveTotalAttacks,
        running_bots: runningBots,
        layer7_usage: layer7Usage,
        layer4_usage: layer4Usage,
      },
    };

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
