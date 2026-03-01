import prisma from "../prisma";

export async function auditRegistrations(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      tracks: true,
    },
  });
}
