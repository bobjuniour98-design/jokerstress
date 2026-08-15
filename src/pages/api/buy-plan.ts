import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../lib/authOptions';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { verifyHcaptchaToken } from '../../lib/verifyHcaptcha';
import { consumeCaptcha } from '../../lib/apiTokenCaptcha';

type CustomPlanInput = {
  concurrents: number;
  maxAttackTime: number;
  membershipDuration: number;
};

function generateRandomString(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

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
      select: { id: true, plan: true, balance: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { planId, customPlan, hcaptchaToken, captchaId, captchaAnswer } = req.body as {
      planId?: number;
      customPlan?: unknown;
      hcaptchaToken?: string;
      captchaId?: string;
      captchaAnswer?: string;
    };

    let captchaValid = false;
    if (typeof hcaptchaToken === 'string' && hcaptchaToken.length > 0) {
      captchaValid = await verifyHcaptchaToken(hcaptchaToken, req);
    }
    if (
      !captchaValid &&
      captchaId != null &&
      String(captchaAnswer ?? '').trim() !== ''
    ) {
      const mathResult = consumeCaptcha(String(captchaId), 'public', String(captchaAnswer));
      captchaValid = mathResult.ok;
    }
    if (!captchaValid) {
      return res.status(400).json({
        message: 'Verification failed. Complete the captcha below and try again.',
      });
    }

    let totalPrice = 0;
    let plan;

    if (planId !== undefined) {
      plan = await prisma.plan.findUnique({
        where: { id: Number(planId) },
        select: { name: true, price: true, apiaccess: true },
      });

      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      totalPrice = plan.price;

      if (user.balance < totalPrice) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      const komaru = await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: totalPrice },
          plan: plan.name,
          planExpire: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          apiAccess: plan.apiaccess,
        },
      });

      return res.status(200).json({ message: 'Plan purchased successfully', plan: komaru.plan });
    } else if (customPlan) {
      if (
        typeof customPlan !== 'object' ||
        customPlan === null ||
        !('concurrents' in customPlan) ||
        !('maxAttackTime' in customPlan) ||
        !('membershipDuration' in customPlan)
      ) {
        return res.status(400).json({ message: 'Invalid custom plan parameters' });
      }

      const typedCustomPlan = customPlan as CustomPlanInput;
      const { concurrents, maxAttackTime, membershipDuration } = typedCustomPlan;

      if (
        concurrents < 1 ||
        concurrents > 500 ||
        maxAttackTime < 500 ||
        maxAttackTime > 36000 ||
        membershipDuration < 1 ||
        membershipDuration > 12
      ) {
        return res.status(400).json({ message: 'Invalid custom plan parameters' });
      }

      const concurrentCost = concurrents * 20;
      const durationCost = Math.ceil(maxAttackTime / 500) * 10;
      const baseCost = concurrentCost + durationCost;
      totalPrice = baseCost * membershipDuration;

      if (user.balance < totalPrice) {
        return res.status(400).json({ message: 'Insufficient balance' });
      }

      const createUniqueCustomPlan = async (): Promise<string> => {
        const MAX_RETRIES = 5;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          const randomString = generateRandomString(8);
          const customPlanName = `Custom-${randomString}`;

          try {
            await prisma.plan.create({
              data: {
                name: customPlanName,
                price: totalPrice,
                concurrent: concurrents,
                cooldown: 0,
                durationType: 'Months',
                period: 'month',
                privateMethods: false,
                apiaccess: true,
                tax: 0,
                vipMethods: 0,
                attackDuration: maxAttackTime,
                freeCanUse: false,
              },
            });
            return customPlanName;
          } catch (error: unknown) {
            if (
              error instanceof Prisma.PrismaClientKnownRequestError &&
              error.code === 'P2002' &&
              Array.isArray(error.meta?.target) &&
              error.meta.target.includes('name')
            ) {
              console.warn(`Duplicate custom plan name detected: ${customPlanName}. Retrying...`);
              continue;
            }
            throw error;
          }
        }
        throw new Error('Failed to generate a unique custom plan name after multiple attempts.');
      };

      const customPlanName = await createUniqueCustomPlan();

      const komaru = await prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: totalPrice },
          plan: customPlanName,
          planExpire: new Date(Date.now() + membershipDuration * 30 * 24 * 60 * 60 * 1000),
          apiAccess: true,
        },
      });

      return res.status(200).json({ message: 'Custom plan purchased successfully', plan: komaru.plan });
    } else {
      return res.status(400).json({ message: 'No valid plan selected' });
    }
  } catch (error: unknown) {
    console.error('Buy plan error:', error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes('name')
    ) {
      return res.status(500).json({ message: 'A unique constraint was violated. Please try again.' });
    }

    return res.status(500).json({ message: 'Internal server error' });
  }
}
