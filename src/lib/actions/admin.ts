"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGroupStandings } from "@/lib/queries";
import { scoreSchema } from "@/lib/validation";
import type { FormState } from "@/lib/actions/auth";
import type { Stage } from "@/generated/prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Solo el administrador puede hacer esto");
  }
}

export async function saveResult(
  matchId: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({ homeScore: scoreSchema, awayScore: scoreSchema })
    .safeParse({
      homeScore: formData.get("homeScore"),
      awayScore: formData.get("awayScore"),
    });
  if (!parsed.success) return { error: "Marcadores inválidos" };

  const { homeScore, awayScore } = parsed.data;
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "El partido no existe" };
  if (!match.homeTeamId || !match.awayTeamId) {
    return { error: "Asigna los equipos antes de cargar el resultado" };
  }

  await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: { homeScore, awayScore, status: "FINISHED" },
    }),
    // 3 puntos por marcador exacto, 1 por acertar el resultado, 0 en otro caso.
    // Debe coincidir con `scorePrediction` en @/lib/match-utils.
    prisma.$executeRaw`
      UPDATE "Prediction"
      SET "points" = CASE
        WHEN "homeScore" = ${homeScore}::int AND "awayScore" = ${awayScore}::int THEN 3
        WHEN SIGN("homeScore" - "awayScore") = SIGN(${homeScore}::int - ${awayScore}::int) THEN 1
        ELSE 0
      END
      WHERE "matchId" = ${matchId}
    `,
  ]);

  revalidatePath("/admin");
  revalidatePath("/matches");
  return undefined;
}

export async function clearResult(matchId: number) {
  await requireAdmin();

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  // Solo se puede borrar el resultado de partidos que aún no han iniciado
  if (!match || match.kickoff <= new Date()) return;

  await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: { homeScore: null, awayScore: null, status: "SCHEDULED" },
    }),
    // Quita los puntos calculados; el partido vuelve a estar abierto
    prisma.prediction.updateMany({
      where: { matchId },
      data: { points: null },
    }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/matches");
}

export async function assignTeams(
  matchId: number,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = z
    .object({
      homeTeamId: z.coerce.number().int().positive(),
      awayTeamId: z.coerce.number().int().positive(),
    })
    .safeParse({
      homeTeamId: formData.get("homeTeamId"),
      awayTeamId: formData.get("awayTeamId"),
    });
  if (!parsed.success) return { error: "Selecciona ambos equipos" };
  if (parsed.data.homeTeamId === parsed.data.awayTeamId) {
    return { error: "Los equipos deben ser distintos" };
  }

  await prisma.match.update({
    where: { id: matchId },
    data: parsed.data,
  });

  revalidatePath("/admin");
  revalidatePath("/matches");
  return undefined;
}

// Asigna automáticamente los 16avos (ROUND_32) usando las posiciones actuales
// de los grupos: resuelve los slots "1° Grupo X" y "2° Grupo X" con el líder y
// el segundo de cada grupo. Los slots de tercero ("3° Grupo …") se dejan para
// asignar a mano.
export async function autoAssignFromGroups() {
  await requireAdmin();

  // Solo se permite cuando toda la fase de grupos está finalizada.
  const pendingGroup = await prisma.match.count({
    where: { stage: "GROUP", status: { not: "FINISHED" } },
  });
  if (pendingGroup > 0) {
    throw new Error(
      "Faltan partidos de la fase de grupos por finalizar antes de asignar los 16avos"
    );
  }

  const standings = await getGroupStandings();
  const byLetter = new Map(standings.map((g) => [g.letter, g.teams]));

  const resolve = (placeholder: string | null): number | null => {
    if (!placeholder) return null;
    const winner = /^1° Grupo (\w)$/.exec(placeholder);
    if (winner) return byLetter.get(winner[1])?.[0]?.teamId ?? null;
    const runnerUp = /^2° Grupo (\w)$/.exec(placeholder);
    if (runnerUp) return byLetter.get(runnerUp[1])?.[1]?.teamId ?? null;
    return null;
  };

  // No tocamos partidos ya finalizados (no deberían existir en 16avos todavía).
  const matches = await prisma.match.findMany({
    where: { stage: "ROUND_32", status: { not: "FINISHED" } },
  });

  for (const m of matches) {
    const homeTeamId = resolve(m.homePlaceholder);
    const awayTeamId = resolve(m.awayPlaceholder);
    const data: { homeTeamId?: number; awayTeamId?: number } = {};
    if (homeTeamId != null) data.homeTeamId = homeTeamId;
    if (awayTeamId != null) data.awayTeamId = awayTeamId;
    if (Object.keys(data).length > 0) {
      await prisma.match.update({ where: { id: m.id }, data });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/matches");
  revalidatePath("/eliminatoria");
}

// Asigna automáticamente una ronda eliminatoria (octavos en adelante) usando
// los resultados de la ronda anterior: resuelve "Ganador P##" con el ganador
// del partido ## y "Perdedor P##" con el perdedor (tercer puesto). Requiere que
// todos los partidos que alimentan esta ronda estén finalizados.
export async function autoAssignKnockoutRound(stage: Stage) {
  await requireAdmin();
  if (stage === "GROUP" || stage === "ROUND_32") {
    throw new Error("Esta ronda no se asigna desde la ronda anterior");
  }

  const targets = await prisma.match.findMany({
    where: { stage, status: { not: "FINISHED" } },
  });

  const parse = (placeholder: string | null) => {
    if (!placeholder) return null;
    const w = /^Ganador P(\d+)$/.exec(placeholder);
    if (w) return { num: Number(w[1]), kind: "winner" as const };
    const l = /^Perdedor P(\d+)$/.exec(placeholder);
    if (l) return { num: Number(l[1]), kind: "loser" as const };
    return null;
  };

  // Partidos de la ronda anterior referenciados por estos cruces.
  const feederNums = new Set<number>();
  for (const t of targets) {
    const h = parse(t.homePlaceholder);
    if (h) feederNums.add(h.num);
    const a = parse(t.awayPlaceholder);
    if (a) feederNums.add(a.num);
  }

  const feeders = await prisma.match.findMany({
    where: { matchNumber: { in: [...feederNums] } },
  });
  const byNum = new Map(feeders.map((m) => [m.matchNumber, m]));

  // Validación: todos los partidos que alimentan esta ronda deben estar listos.
  const pending = [...feederNums].filter(
    (n) => byNum.get(n)?.status !== "FINISHED"
  );
  if (pending.length > 0) {
    throw new Error("La ronda anterior aún no está completa");
  }

  const resolve = (placeholder: string | null): number | null => {
    const parsed = parse(placeholder);
    if (!parsed) return null;
    const f = byNum.get(parsed.num);
    if (!f || f.homeScore == null || f.awayScore == null) return null;
    if (f.homeScore === f.awayScore) return null; // empate: se asigna a mano
    const homeWon = f.homeScore > f.awayScore;
    if (parsed.kind === "winner") return homeWon ? f.homeTeamId : f.awayTeamId;
    return homeWon ? f.awayTeamId : f.homeTeamId;
  };

  for (const t of targets) {
    const homeTeamId = resolve(t.homePlaceholder);
    const awayTeamId = resolve(t.awayPlaceholder);
    const data: { homeTeamId?: number; awayTeamId?: number } = {};
    if (homeTeamId != null) data.homeTeamId = homeTeamId;
    if (awayTeamId != null) data.awayTeamId = awayTeamId;
    if (Object.keys(data).length > 0) {
      await prisma.match.update({ where: { id: t.id }, data });
    }
  }

  revalidatePath("/admin");
  revalidatePath("/matches");
  revalidatePath("/eliminatoria");
}
