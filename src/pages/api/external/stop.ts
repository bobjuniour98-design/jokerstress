import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
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

  const { key, host, method } = req.query;

  if (!key || !host || !method) {
    return res.status(400).json({ message: 'Missing required parameters' });
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

    const attack = await prisma.attack.findFirst({
      where: {
        userId: user.id,
        target: host as string,
        methodName: method as string,
        status: 'active',
      },
    });

    if (!attack) {
      return res.status(404).json({ message: 'No active attack found for the specified target and method' });
    }

    const server = await prisma.server.findFirst({
      where: {
        status: 'online',
        supportedMethods: { has: (method as string).toUpperCase() },
      },
      select: { endpoint: true },
    });

    if (!server) {
      return res.status(503).json({ message: 'No available servers to stop the attack' });
    }

    const apiUrl = server.endpoint
      .replace('[host]', encodeURIComponent(host as string))
      .replace('[port]', attack.port || '')
      .replace('[time]', attack.duration.toString())
      .replace('[method]', 'STOP')
      .replace('[subnet]', attack.additionalParams?.subnet || '32');

    console.log('Debug: Stop Attack API URL:', apiUrl);

    try {
      const response = await axiosGetWithRetry(apiUrl, { timeout: 10000 }, 2);

      if (response.status === 200) {
        await prisma.attack.update({
          where: { id: attack.id },
          data: { status: 'stopped' },
        });

        console.log('Debug: Attack successfully stopped and updated in database');
        return res.status(200).json({ message: 'Attack stopped successfully' });
      } else {
        console.error('Debug: Server returned non-200 status while stopping attack:', response.status);
        return res.status(500).json({ message: 'Failed to stop attack on server' });
      }
    } catch (error) {
      console.error('Error stopping attack:', error);
      return res.status(500).json({ message: 'Server error while stopping attack' });
    }
  } catch (error) {
    console.error('Stop attack error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
