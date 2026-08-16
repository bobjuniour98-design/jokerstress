import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/authOptions';
import axios from 'axios';
import { verifyHcaptchaToken } from '../../../lib/verifyHcaptcha';

const PLISIO_API_URL = 'https://api.plisio.net/api/v1/invoices/new';
const COOLDOWN_PERIOD = 30 * 1000; // 30 sec

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { amount, currency, hcaptchaToken } = req.body;

  if (!amount || !currency || !hcaptchaToken) {
    return res.status(400).json({ message: 'Amount, currency and hCaptcha token are required' });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  const isCaptchaValid = await verifyHcaptchaToken(hcaptchaToken, req);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'hCaptcha verification failed' });
  }

  try {
    const now = new Date();
    const cooldownDate = new Date(now.getTime() - COOLDOWN_PERIOD);

    const user = await prisma.user.findUnique({
      where: { username: session.user.name as string },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fixed: createdAt is DateTime in schema, not unix timestamp
    const recentPayment = await prisma.payment.findFirst({
      where: {
        user: user.username,
        createdAt: {
          gt: cooldownDate,
        },
      },
    });

    if (recentPayment) {
      const recentPaymentTime = recentPayment.createdAt.getTime();
      const remainingTime = (
        (COOLDOWN_PERIOD - (now.getTime() - recentPaymentTime)) /
        1000
      ).toFixed(1);
      return res.status(429).json({
        message: `Please wait ${remainingTime} seconds before creating a new payment.`,
      });
    }

    if (!process.env.PLISIO_SECRET_KEY || !process.env.NEXT_PUBLIC_BASE_URL) {
      console.error('Missing environment variables: PLISIO_SECRET_KEY or NEXT_PUBLIC_BASE_URL');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const orderNumber = `DEP-${Date.now()}`;

    const response = await axios.get(PLISIO_API_URL, {
      params: {
        api_key: process.env.PLISIO_SECRET_KEY,
        source_currency: 'USD',
        source_amount: parsedAmount.toString(),
        currency,
        email: '',
        order_number: orderNumber,
        order_name: 'JokerStress Deposit',
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
      },
      timeout: 15000,
    });

    const data = response.data;

    if (data.status !== 'success' || !data.data) {
      console.error('Plisio API error:', JSON.stringify(data));
      return res.status(500).json({
        message: data.data?.message || 'Failed to create payment invoice',
      });
    }

    const plisio = data.data;

    // WARNING: Your current Prisma Payment model is missing most of these fields.
    // This will only work after you update the schema (see note below).
    // For now we cast so TypeScript stops complaining.
    const newPayment = await prisma.payment.create({
      data: {
        user: user.username,
        plan: 'Deposit', // temporary mapping because schema requires `plan`
        amount: parsedAmount,
        status: 'PENDING',
        // The following fields do NOT exist in your current schema.
        // Uncomment them AFTER you update the Prisma schema.
        // uniqID: plisio.txn_id,
        // type: 'Deposit',
        // cryptoAddress: plisio.wallet_hash,
        // cryptoAmount: parseFloat(plisio.amount),
        // cryptoURI: plisio.invoice_url,
        // gateway: plisio.currency,
        // expireTimestamp: plisio.expire_utc ? parseInt(plisio.expire_utc, 10) : null,
      } as any,
    });

    return res.status(200).json({
      success: true,
      payment: {
        id: (newPayment as any).uniqID || newPayment.id,
        address: (newPayment as any).cryptoAddress || null,
        amount: (newPayment as any).cryptoAmount || parsedAmount,
        currency: (newPayment as any).gateway || currency,
        invoiceUrl: (newPayment as any).cryptoURI || plisio.invoice_url,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Plisio request failed:',
        error.response?.status,
        JSON.stringify(error.response?.data)
      );
      return res.status(502).json({
        message: error.response?.data?.data?.message || 'Payment gateway request failed',
      });
    }
    console.error('Error creating payment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}