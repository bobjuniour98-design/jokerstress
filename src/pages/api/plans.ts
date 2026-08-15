import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

async function manageAttackCollection() {
  try {
    const attackCount = await prisma.attack.count();
    if (attackCount > 100000) {
      await prisma.stats.create({
        data: { TotalAttacks: attackCount },
      });

      await prisma.attack.deleteMany({});

      console.log(`Attack collection exceeded 100000 records. Archived count to Stats and cleared the Attack collection.`);
    }
  } catch (error) {
    console.error('Error managing Attack collection:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await manageAttackCollection();

  if (req.method === 'GET') {
    try {
      const plans = await prisma.plan.findMany({
        where: { name: { not: { startsWith: 'Custom-' } } },
        orderBy: [
          {
            id: 'asc',
          },
        ],
      });
      return res.status(200).json({ plans });
    } catch (error) {
      console.error('Plans API error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
