import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

interface StatsData {
  total_users: number;
  total_attacks: number;
  running_bots: number;
  layer7_usage: number;
  layer4_usage: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [totalUsers, totalAttacks, runningBots, layer7Usage, layer4Usage] = await Promise.all([
      prisma.user.count(),
      prisma.attack.count(),
      prisma.attack.count({ where: { status: 'active' } }),
      prisma.attack.count({ where: { layer: '7', status: 'active' } }),
      prisma.attack.count({ where: { layer: '4', status: 'active' } }),
    ]);

    const statsData: StatsData = {
      total_users: totalUsers,
      total_attacks: totalAttacks,
      running_bots: runningBots,
      layer7_usage: layer7Usage,
      layer4_usage: layer4Usage,
    };

    res.status(200).json(statsData);
  } catch (error) {
    console.error('Stats API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
