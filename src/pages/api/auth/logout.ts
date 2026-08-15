import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (session) {
      res.setHeader('Set-Cookie', [
        'next-auth.csrf-token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
        'next-auth.callback-url=; Max-Age=0; Path=/; SameSite=Lax',
        'next-auth.session-token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax',
      ]);
    }

    res.status(200).json({ refresh: true });
  } catch (error) {
    console.error("Error checking session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
