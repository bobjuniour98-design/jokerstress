import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import prisma from '../../../lib/prisma'
import { createMathCaptcha } from '../../../lib/apiTokenCaptcha'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.name) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { username: session.user.name },
    select: { id: true, apiAccess: true },
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  if (!user.apiAccess) {
    return res.status(403).json({ message: 'API access is not enabled for your account' })
  }

  const { id, prompt } = createMathCaptcha(user.id)
  return res.status(200).json({ captchaId: id, prompt })
}
