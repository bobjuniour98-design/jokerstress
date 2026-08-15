import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  const rank = (session?.user as { rank?: string } | undefined)?.rank?.toLowerCase()
  const isAdmin = rank === 'admin' || rank === 'owner'
  return res.status(200).json({ isAdmin })
}

