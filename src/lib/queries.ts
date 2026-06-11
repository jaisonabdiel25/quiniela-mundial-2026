import { prisma } from "@/lib/prisma";

export type LeaderboardRow = {
  userId: string;
  name: string;
  points: number;
  exactCount: number;
  predictionCount: number;
};

export async function getGroupLeaderboard(
  groupId: string
): Promise<LeaderboardRow[]> {
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: { select: { id: true, name: true } } },
  });
  const userIds = members.map((m) => m.userId);

  const [sums, exacts, counts] = await Promise.all([
    prisma.prediction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, points: { not: null } },
      _sum: { points: true },
    }),
    prisma.prediction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, points: 3 },
      _count: { _all: true },
    }),
    prisma.prediction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds } },
      _count: { _all: true },
    }),
  ]);

  const sumByUser = new Map(sums.map((s) => [s.userId, s._sum.points ?? 0]));
  const exactByUser = new Map(exacts.map((e) => [e.userId, e._count._all]));
  const countByUser = new Map(counts.map((c) => [c.userId, c._count._all]));

  return members
    .map((m) => ({
      userId: m.userId,
      name: m.user.name,
      points: sumByUser.get(m.userId) ?? 0,
      exactCount: exactByUser.get(m.userId) ?? 0,
      predictionCount: countByUser.get(m.userId) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.points - a.points ||
        b.exactCount - a.exactCount ||
        a.name.localeCompare(b.name)
    );
}
