import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import prisma from '../../../lib/prisma';
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username: session.user.name ?? undefined },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { attackId } = req.body;

    if (attackId === undefined || attackId === null) {
      return res.status(400).json({ message: 'Missing required parameter: attackId' });
    }

    const attack = await prisma.attack.findFirst({
      where: { id: attackId, userId: user.id, status: 'active' },
    });

    if (!attack) {
      return res.status(404).json({ message: 'No active attack found with the provided ID' });
    }

    if (!attack.methodName || !attack.target || attack.duration == null) {
      return res.status(400).json({ message: 'Attack is missing required parameters' });
    }

    // After the check above, these are safe
    const methodName = attack.methodName;
    const target = attack.target;
    const duration = attack.duration;

    const servers = await prisma.server.findMany({
      where: {
        status: 'online',
      },
      select: {
        endpoint: true,
        supportedMethods: true,
      },
    });

    const server = servers.find((candidate) => {
      if (!candidate.supportedMethods) return false;

      try {
        const methods = JSON.parse(candidate.supportedMethods);
        return (
          Array.isArray(methods) &&
          methods.some(
            (m: unknown) =>
              typeof m === 'string' &&
              m.toUpperCase() === methodName.toUpperCase()
          )
        );
      } catch {
        return false;
      }
    });

    if (!server || !server.endpoint) {
      return res.status(503).json({ message: 'No available servers at the moment' });
    }

    const subnet = attack.subnet || '32';

    const apiUrl = server.endpoint
      .replace('[host]', encodeURIComponent(target))
      .replace('[port]', attack.port || '443')
      .replace('[time]', duration.toString())
      .replace('[method]', 'STOP')
      .replace('[subnet]', subnet);

    console.log('Debug: Stop API URL:', apiUrl);

    try {
      const response = await axiosGetWithRetry(apiUrl, { timeout: 10000 }, 2);

      if (response.status === 200) {
        await prisma.attack.update({
          where: { id: attack.id },
          data: { status: 'stopped' },
        });
        return res.status(200).json({ message: 'Attack stopped successfully' });
      } else {
        console.error(
          `Server returned non-200 status while stopping attack for target ${target}:`,
          response.status
        );
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