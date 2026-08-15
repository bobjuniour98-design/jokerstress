import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { verifyIPN } from '../../../utils/plisio';
import getRawBody from 'raw-body';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Plisio IPN statuses:
// new, pending, completed, expired, cancelled, error, mismatch
// We credit the user only on 'completed'
const COMPLETED_STATUSES = ['completed'];

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const rawBody = await getRawBody(req, { encoding: 'utf8' });
    const ipnData = Object.fromEntries(new URLSearchParams(rawBody));

    console.log('Plisio IPN received:', JSON.stringify(ipnData));

    if (!process.env.PLISIO_SECRET_KEY) {
      console.error('PLISIO_SECRET_KEY not set');
      res.status(500).send('Server configuration error');
      return;
    }

    const isValid = verifyIPN(ipnData, process.env.PLISIO_SECRET_KEY);

    if (!isValid) {
      console.error('Invalid Plisio IPN signature. Data:', JSON.stringify(ipnData));
      res.status(400).send('Invalid IPN');
      return;
    }

    const txnId = ipnData.txn_id;
    const status = ipnData.status;

    if (!txnId) {
      console.error('IPN missing txn_id');
      res.status(400).send('Missing txn_id');
      return;
    }

    const payment = await prisma.payment.findUnique({
      where: { uniqID: txnId },
    });

    if (!payment) {
      // Respond 200 so Plisio doesn't keep retrying for unknown txns
      console.warn('Payment not found for txn_id:', txnId);
      res.status(200).send('OK');
      return;
    }

    // Avoid double-crediting if already completed
    if (payment.status === 'completed') {
      res.status(200).send('OK');
      return;
    }

    const confirmations = ipnData.confirmations ? parseInt(ipnData.confirmations, 10) : 0;
    const amountPaid = ipnData.amount ? parseFloat(ipnData.amount) : payment.amountPaid;

    await prisma.payment.update({
      where: { uniqID: txnId },
      data: {
        status: status,
        amountPaid: isNaN(amountPaid) ? payment.amountPaid : amountPaid,
        confirmations: isNaN(confirmations) ? payment.confirmations : confirmations,
        hash: ipnData.source_transaction_hash || payment.hash,
      },
    });

    if (COMPLETED_STATUSES.includes(status)) {
      await prisma.user.update({
        where: { username: payment.user },
        data: {
          balance: {
            increment: payment.amount,
          },
        },
      });
      console.log(`Balance credited: +${payment.amount} USD to user ${payment.user} (txn: ${txnId})`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Plisio IPN:', error);
    res.status(500).send('Internal server error');
  }
}

export default handler;
