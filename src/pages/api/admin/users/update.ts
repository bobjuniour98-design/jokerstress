import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import prisma from '../../../../lib/prisma'

function isAdminRank(rank: unknown): boolean {
  const r = typeof rank === 'string' ? rank.toLowerCase() : ''
  return r === 'admin' || r === 'owner'
}

type UpdateBody = {
  username: string
  rank?: string
  plan?: string
  planExpire?: string | null // ISO string or null
  balance?: number
  apiAccess?: boolean
  premium?: boolean
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

  const body = req.body as UpdateBody
  const username = String(body.username ?? '').trim()
  if (!username) {
    return res.status(400).json({ message: 'username is required' })
  }

  const data: Record<string, unknown> = {}
  if (typeof body.rank === 'string') data.rank = body.rank
  if (typeof body.plan === 'string') data.plan = body.plan
  if (body.planExpire === null) data.planExpire = null
  if (typeof body.planExpire === 'string') {
    const d = new Date(body.planExpire)
    if (Number.isNaN(d.getTime())) {
      return res.status(400).json({ message: 'Invalid planExpire' })
    }
    data.planExpire = d
  }
  if (typeof body.balance === 'number' && Number.isFinite(body.balance)) data.balance = body.balance
  if (typeof body.apiAccess === 'boolean') data.apiAccess = body.apiAccess
  if (typeof body.premium === 'boolean') data.premium = body.premium

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'No fields to update' })
  }

  const updated = await prisma.user.update({
    where: { username },
    data,
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

  return res.status(200).json({ message: 'User updated', user: updated })
}

