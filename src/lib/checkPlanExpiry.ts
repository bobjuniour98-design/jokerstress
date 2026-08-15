import prisma from './prisma';

export const checkPlanExpiry = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planExpire: true, plan: true },
  });

  if (!user || !user.planExpire) return true;

  const now = new Date();
  if (user.planExpire < now) {
    const freePlan = await prisma.plan.findUnique({
      where: { name: 'free' },
    });

    if (freePlan) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: freePlan.name,
          planExpire: null,
          apiAccess: false,
        },
      });
    }

    return false;
  }

  return true;
};
