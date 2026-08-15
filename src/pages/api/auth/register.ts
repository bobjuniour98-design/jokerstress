import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { verifyHcaptchaToken } from '../../../lib/verifyHcaptcha';

function generateReferralCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { username, password, hcaptchaToken, referralCode: providedReferralCode } = req.body;

  if (!username || !password || !hcaptchaToken) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const isCaptchaValid = await verifyHcaptchaToken(hcaptchaToken, req);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'hCaptcha verification failed' });
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(422).json({ message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const secretKey = crypto.randomBytes(16).toString('hex');

    // Generate unique referral code for the new user
    let referralCode = generateReferralCode();
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existing = await prisma.user.findFirst({ where: { referralCode } });
      if (!existing) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode();
      }
      attempts++;
    }

    // Verify referrer if provided
    let referredBy = null;
    if (providedReferralCode) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode: providedReferralCode },
      });
      if (referrer) {
        referredBy = referrer.username;
      }
    }

    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        secretKey,
        rank: 'user',
        plan: 'free',
        premium: false,
        apiAccess: false,
        balance: 0.0,
        referralCode,
        referredBy,
      },
    });

    return res.status(201).json({ success: true, message: 'User created' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}