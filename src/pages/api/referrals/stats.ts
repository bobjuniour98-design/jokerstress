import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import prisma from '../../../lib/prisma';

function generateReferralCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: session.user.name },
      select: {
        referralCode: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let referralCode = user.referralCode;

    // Generate code for legacy users if they don't have one
    if (!referralCode) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 10) {
        referralCode = generateReferralCode();
        const existing = await prisma.user.findFirst({ where: { referralCode } });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      await prisma.user.update({
        where: { username: session.user.name },
        data: { referralCode },
      });
    }

    interface ReferralUser {
      username: string;
      rank: string;
      plan: string;
      created: Date;
    }

    const referrals = await prisma.user.findMany({
      where: { referredBy: session.user.name },
      select: {
        username: true,
        rank: true,
        plan: true,
        created: true,
      },
      orderBy: {
        created: 'desc',
      },
    }) as ReferralUser[];

    res.status(200).json({
      referralCode: referralCode,
      referrals: referrals.map((r: ReferralUser) => ({ ...r, createdAt: r.created })), // Map to the field name expected by the UI
      totalReferrals: referrals.length,
    });
  } catch (error) {
    console.error('Referral Stats API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

