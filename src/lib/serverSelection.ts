import prisma from './prisma';

export async function findAvailableServer(layer: string, methodName: string, excludeIds: number[] = []) {
  const servers = await prisma.server.findMany({
    where: {
      type: layer === '4' ? 'l4' : 'l7',
      status: 'online',
      id: { notIn: excludeIds },
    },
    select: {
      id: true,
      name: true,
      endpoint: true,
      capacity: true,
      supportedMethods: true,
    },
    orderBy: { capacity: 'desc' },
  });

  console.log('Found servers:', servers.length);

  const needle = methodName.toUpperCase();

  for (const server of servers) {
    // Handle both real array and stringified array
    let methods: string[] = [];
    if (Array.isArray(server.supportedMethods)) {
      methods = server.supportedMethods;
    } else if (typeof server.supportedMethods === 'string') {
      try {
        methods = JSON.parse(server.supportedMethods);
      } catch {
        methods = [];
      }
    }

    const supportsMethod = methods.some(
      (m: string) => m.toUpperCase() === needle || needle.includes(m.toUpperCase())
    );

    if (!supportsMethod) {
      console.log(`Server ${server.name} does not support ${methodName}`);
      continue;
    }

    const activeAttacksOnServer = await prisma.attack.count({
      where: {
        serverId: server.id as any,
        status: 'active',
        expiresAt: { gt: new Date() }
      },
    });

    if (activeAttacksOnServer < (server.capacity || 0)) {
      console.log(`Selected server: ${server.name}`);
      return server;
    }
  }

  return null;
}