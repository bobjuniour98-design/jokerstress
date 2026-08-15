import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { Attack } from '@prisma/client';
import { getRequestIp, isRequestIpAllowed } from '../../../lib/apiIpWhitelist';
import { getBanInfo } from '../../../lib/adminModerationStore';

async function axiosGetWithRetry(
  url: string,
  options: AxiosRequestConfig,
  retries: number = 2
): Promise<AxiosResponse> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Unexpected error in axiosGetWithRetry');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { key } = req.query;

  if (!key) {
    return res.status(400).json({ message: 'Missing required parameter: key' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { apiToken: key as string },
      select: { id: true, username: true, apiAccess: true, rank: true },
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

    if (!user.apiAccess) {
      return res.status(403).json({ message: 'API access is not enabled for your account' });
    }

    const activeAttacks = await prisma.attack.findMany({
      where: { userId: user.id, status: 'active' },
    });

    if (activeAttacks.length === 0) {
      return res.status(200).json({ message: 'No active attacks to stop' });
    }

    const stopPromises = activeAttacks.map(async (attack: Attack) => {
      const server = await prisma.server.findFirst({
        where: {
          status: 'online',
          supportedMethods: { has: attack.methodName.toUpperCase() },
        },
        select: { endpoint: true },
      });

      if (!server) {
        console.error(`No available server to stop attack for method: ${attack.methodName}`);
        return null;
      }

      const apiUrl = server.endpoint
        .replace('[host]', encodeURIComponent(attack.target))
        .replace('[port]', attack.port || '')
        .replace('[time]', attack.duration.toString())
        .replace('[method]', 'STOP')
        .replace('[subnet]', (attack.additionalParams as { subnet?: string })?.subnet || '32');

      console.log('Debug: Stop All Attack API URL:', apiUrl);

      try {
        const response = await axiosGetWithRetry(apiUrl, { timeout: 10000 }, 2);

        if (response.status === 200) {
          await prisma.attack.update({
            where: { id: attack.id },
            data: { status: 'stopped' },
          });

          console.log(`Debug: Attack for target ${attack.target} stopped successfully`);
        } else {
          console.error(`Debug: Server returned non-200 status while stopping attack for target ${attack.target}:`, response.status);
        }
      } catch (error) {
        console.error(`Error stopping attack for target ${attack.target}:`, error);
      }
    });

    await Promise.all(stopPromises);

    return res.status(200).json({ message: 'All attacks stopped successfully' });
  } catch (error) {
    console.error('Stop all attacks error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
