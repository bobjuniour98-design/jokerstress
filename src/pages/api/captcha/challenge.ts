import type { NextApiRequest, NextApiResponse } from 'next'
import { createMathCaptcha } from '../../../lib/apiTokenCaptcha'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' })
  }

  // Use an identifier based on the user's IP or fallback to 'public'
  const identifier = 'public'

  const { id, prompt } = createMathCaptcha(identifier)
  return res.status(200).json({ captchaId: id, prompt })
}
