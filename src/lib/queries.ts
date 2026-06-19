import { prisma } from "@/lib/prisma";
import type { Stage } from "@/generated/prisma/client";

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

export type BestThirdRow = TeamStanding & { letter: string };

// Clasificación de los terceros de cada grupo (los 8 mejores avanzan).
// Orden: 1° más puntos, 2° mejor diferencia de goles, 3° más goles anotados.
export async function getBestThirds(): Promise<BestThirdRow[]> {
  const groups = await getGroupStandings();

  const thirds = groups
    .map((g) => {
      const third = g.teams[2];
      return third ? { ...third, letter: g.letter } : null;
    })
    .filter((t): t is BestThirdRow => t !== null);

  return thirds.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
  );
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

export type PointsMatrixMatch = {
  matchId: number;
  matchNumber: number;
  stage: Stage;
  kickoff: Date;
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: { name: string; fifaCode: string } | null;
  awayTeam: { name: string; fifaCode: string } | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
};

export type GroupPointsMatrix = {
  matches: PointsMatrixMatch[];
  // clave `${userId}:${matchId}` -> puntos de la predicción (null si aún sin puntuar)
  points: Map<string, number | null>;
};

// Matriz de puntos por partido y participante. Solo expone partidos que ya
// empezaron (kickoff <= ahora), respetando la ventana validFrom del grupo —
// nunca revela predicciones de partidos futuros. Confía en el guard de la
// página (igual que getGroupLeaderboard), no re-verifica membresía.
export async function getGroupPointsMatrix(
  groupId: string
): Promise<GroupPointsMatrix> {
  const [group, members] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId }, select: { validFrom: true } }),
    prisma.groupMember.findMany({ where: { groupId }, select: { userId: true } }),
  ]);

  const validFrom = group?.validFrom ?? null;
  const userIds = members.map((m) => m.userId);
  const now = new Date();

  const matchRecords = await prisma.match.findMany({
    where: {
      kickoff: { lte: now, ...(validFrom ? { gte: validFrom } : {}) },
    },
    include: {
      homeTeam: { select: { name: true, fifaCode: true } },
      awayTeam: { select: { name: true, fifaCode: true } },
    },
    orderBy: { kickoff: "asc" },
  });

  const predictions = await prisma.prediction.findMany({
    where: { userId: { in: userIds }, matchId: { in: matchRecords.map((m) => m.id) } },
    select: { userId: true, matchId: true, points: true },
  });

  const points = new Map<string, number | null>(
    predictions.map((p) => [`${p.userId}:${p.matchId}`, p.points])
  );

  const matches: PointsMatrixMatch[] = matchRecords.map((m) => ({
    matchId: m.id,
    matchNumber: m.matchNumber,
    stage: m.stage,
    kickoff: m.kickoff,
    finished: m.status === "FINISHED",
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homePlaceholder: m.homePlaceholder,
    awayPlaceholder: m.awayPlaceholder,
  }));

  return { matches, points };
}
