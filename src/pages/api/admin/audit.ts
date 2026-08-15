import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { getAuditEvents } from '../../../lib/adminModerationStore'

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

  const rawLimit = Number(req.query.limit ?? 100)
  const limit = Number.isFinite(rawLimit) ? rawLimit : 100
  return res.status(200).json({ events: getAuditEvents(limit) })
}

