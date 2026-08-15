import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import prisma from '../../../../lib/prisma'
import { getBanInfo } from '../../../../lib/adminModerationStore'

function isAdminRank(rank: unknown): boolean {
  const r = typeof rank === 'string' ? rank.toLowerCase() : ''
  return r === 'admin' || r === 'owner'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const rank = (session?.user as { rank?: string } | undefined)?.rank
  if (!session?.user || !isAdminRank(rank)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const username = String(req.query.username ?? '').trim()
  if (!username) {
    return res.status(400).json({ message: 'username is required' })
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      rank: true,
      plan: true,
      planExpire: true,
      balance: true,
      premium: true,
      apiAccess: true,
    },
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  const banInfo = getBanInfo(user.username)
  return res.status(200).json({
    user,
    moderation: {
      isBanned: user.rank === 'banned',
      banReason: banInfo?.reason ?? '',
      bannedAt: banInfo?.at ?? null,
      bannedBy: banInfo?.by ?? null,
    },
  })
}

