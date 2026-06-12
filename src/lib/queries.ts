import { prisma } from "@/lib/prisma";

export type TeamStanding = {
  teamId: number;
  name: string;
  fifaCode: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type GroupStandings = {
  letter: string;
  teams: TeamStanding[];
};

export async function getGroupStandings(): Promise<GroupStandings[]> {
  const [teams, matches] = await Promise.all([
    prisma.team.findMany(),
    prisma.match.findMany({
      where: {
        stage: "GROUP",
        status: "FINISHED",
        homeScore: { not: null },
        awayScore: { not: null },
      },
    }),
  ]);

  const standings = new Map<number, TeamStanding>();
  const letterByTeam = new Map<number, string>();
  for (const t of teams) {
    standings.set(t.id, {
      teamId: t.id,
      name: t.name,
      fifaCode: t.fifaCode,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
    letterByTeam.set(t.id, t.groupLetter);
  }

  for (const m of matches) {
    const home = m.homeTeamId ? standings.get(m.homeTeamId) : undefined;
    const away = m.awayTeamId ? standings.get(m.awayTeamId) : undefined;
    if (!home || !away || m.homeScore == null || m.awayScore == null) continue;

    home.played++;
    away.played++;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (m.homeScore < m.awayScore) {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  for (const s of standings.values()) {
    s.goalDiff = s.goalsFor - s.goalsAgainst;
  }

  const byLetter = new Map<string, TeamStanding[]>();
  for (const s of standings.values()) {
    const letter = letterByTeam.get(s.teamId) ?? "?";
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter)!.push(s);
  }

  return [...byLetter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, group]) => ({
      letter,
      teams: group.sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDiff - a.goalDiff ||
          b.goalsFor - a.goalsFor ||
          a.name.localeCompare(b.name)
      ),
    }));
}

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
        // 1° por puntos totales, 2° por marcadores exactos
        b.points - a.points || b.exactCount - a.exactCount
    );

  return { rows, validFrom };
}
