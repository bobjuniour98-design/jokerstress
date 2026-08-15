import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../lib/authOptions';
import { checkPlanExpiry } from '../lib/checkPlanExpiry';

const checkUserPlan =
  (handler: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const isPlanActive = await checkPlanExpiry(session.user.id);

    if (!isPlanActive) {
      return res.status(403).json({ message: 'Your plan has expired and has been downgraded to free.' });
    }

    return handler(req, res);
  };

export default checkUserPlan;
