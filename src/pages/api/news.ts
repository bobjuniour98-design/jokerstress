import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const newsItems = await prisma.news.findMany({
      orderBy: { date: 'desc' },
      take: 10,
    });

    res.status(200).json(newsItems);
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
