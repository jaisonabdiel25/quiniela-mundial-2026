import { prisma } from "@/lib/prisma";

export type LeaderboardRow = {
  userId: string;
  name: string;
  points: number;
  exactCount: number;
  predictionCount: number;
};

export type GroupLeaderboardResult = {
  rows: LeaderboardRow[];
  validFrom: Date | null;
};

export async function getGroupLeaderboard(
  groupId: string
): Promise<GroupLeaderboardResult> {
  const [group, members] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId }, select: { validFrom: true } }),
    prisma.groupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const validFrom = group?.validFrom ?? null;
  const userIds = members.map((m) => m.userId);

  let matchIdFilter: { matchId?: { in: number[] } } = {};
  if (validFrom) {
    const validMatches = await prisma.match.findMany({
      where: { kickoff: { gte: validFrom } },
      select: { id: true },
    });
    matchIdFilter = { matchId: { in: validMatches.map((m) => m.id) } };
  }

  const [sums, exacts, counts] = await Promise.all([
    prisma.prediction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, points: { not: null }, ...matchIdFilter },
      _sum: { points: true },
    }),
    prisma.prediction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, points: 3, ...matchIdFilter },
      _count: { _all: true },
    }),
    prisma.prediction.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, ...matchIdFilter },
      _count: { _all: true },
    }),
  ]);

  const sumByUser = new Map(sums.map((s) => [s.userId, s._sum.points ?? 0]));
  const exactByUser = new Map(exacts.map((e) => [e.userId, e._count._all]));
  const countByUser = new Map(counts.map((c) => [c.userId, c._count._all]));

  const rows = members
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

  return { rows, validFrom };
}
