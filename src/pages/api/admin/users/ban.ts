import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import prisma from '../../../../lib/prisma'
import {
  clearBanInfo,
  pushAuditEvent,
  setBanInfo,
} from '../../../../lib/adminModerationStore'

function isAdminRank(rank: unknown): boolean {
  const r = typeof rank === 'string' ? rank.toLowerCase() : ''
  return r === 'admin' || r === 'owner'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const sessionRank = (session?.user as { rank?: string } | undefined)?.rank
  if (!session?.user || !isAdminRank(sessionRank)) {
    return res.status(403).json({ message: 'Forbidden' })
  }

  const { username, banned, reason } = req.body as {
    username?: string
    banned?: boolean
    reason?: string
  }
  const u = String(username ?? '').trim()
  if (!u || typeof banned !== 'boolean') {
    return res.status(400).json({ message: 'username and banned are required' })
  }
  const actor = String(session.user.name ?? 'admin')
  const cleanedReason = String(reason ?? '').trim()

  if (banned && !cleanedReason) {
    return res.status(400).json({ message: 'Ban reason is required' })
  }

  const updateData = banned
    ? { rank: 'banned' as const, apiAccess: false }
    : { rank: 'user' as const }

  const user = await prisma.user.update({
    where: { username: u },
    data: updateData,
    select: { username: true, rank: true, apiAccess: true },
  })

  if (banned) {
    setBanInfo(u, {
      reason: cleanedReason,
      at: new Date().toISOString(),
      by: actor,
    })
  } else {
    clearBanInfo(u)
  }

  pushAuditEvent({
    at: new Date().toISOString(),
    actor,
    action: banned ? 'BAN_USER' : 'UNBAN_USER',
    target: u,
    details: banned ? `reason=${cleanedReason}` : 'ban cleared',
  })

  return res.status(200).json({
    message: banned ? 'User banned' : 'User unbanned',
    user,
  })
}

