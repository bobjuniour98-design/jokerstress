import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import prisma from '../../../lib/prisma'

type RunningAttackRow = {
  id: string
  userId: string | null
  target: string | null
  methodName: string | null
  layer: string
  duration: number | null
  expiresAt: Date | null
  serverId: string | null
}

type ServerRow = {
  id: string
  name: string | null
  capacity: number
  type: string | null
  status: string
}

type UserRow = {
  id: string
  username: string
}

function isAdminRank(rank: unknown): boolean {
  const r = typeof rank === 'string' ? rank.toLowerCase() : ''
  return r === 'admin' || r === 'owner'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const rank = (session?.user as { rank?: string } | undefined)?.rank

  if (!session?.user || !isAdminRank(rank)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const [runningAttacksRaw, serversRaw] = await Promise.all([
    prisma.attack.findMany({
      where: {
        status: 'active',
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        expiresAt: 'asc',
      },
      take: 200,
      select: {
        id: true,
        userId: true,
        target: true,
        methodName: true,
        layer: true,
        duration: true,
        expiresAt: true,
        serverId: true,
      },
    }),

    prisma.server.findMany({
      where: {
        status: 'online',
      },
      select: {
        id: true,
        name: true,
        capacity: true,
        type: true,
        status: true,
      },
      orderBy: {
        capacity: 'desc',
      },
    }),
  ])

  const runningAttacks = runningAttacksRaw as RunningAttackRow[]
  const servers = serversRaw as ServerRow[]

  const countsByServer = await prisma.attack.groupBy({
    by: ['serverId'],
    where: {
      status: 'active',
      expiresAt: { gt: new Date() },
    },
    _count: {
      _all: true,
    },
  })

  const countMap = new Map<string, number>()

  for (const row of countsByServer) {
    if (row.serverId != null) {
      countMap.set(row.serverId, row._count._all)
    }
  }

  const serverUsage = servers.map((s: ServerRow) => {
    const running = countMap.get(s.id) ?? 0
    const capacity = s.capacity || 0
    const usagePercent =
      capacity > 0 ? Math.round((running / capacity) * 100) : 0

    return {
      id: s.id,
      name: s.name,
      type: s.type,
      status: s.status,
      running,
      capacity,
      usagePercent,
    }
  })

  const userIds = [
    ...new Set(
      runningAttacks
        .map((a: RunningAttackRow) => a.userId)
        .filter((id): id is string => id != null)
    ),
  ]

  const usersRaw = userIds.length
    ? await prisma.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
        select: {
          id: true,
          username: true,
        },
      })
    : []

  const users = usersRaw as UserRow[]

  const userMap = new Map(
    users.map((u: UserRow) => [u.id, u.username])
  )

  const serverMap = new Map(
    servers.map((s: ServerRow) => [s.id, s])
  )

  const runningAttacksView = runningAttacks.map(
    (a: RunningAttackRow) => ({
      ...a,
      user: a.userId
        ? {
            username: userMap.get(a.userId) ?? 'unknown',
          }
        : {
            username: 'anon',
          },
      server: a.serverId
        ? serverMap.get(a.serverId) ?? null
        : null,
    })
  )

  return res.status(200).json({
    runningAttacks: runningAttacksView,
    serverUsage,
  })
}