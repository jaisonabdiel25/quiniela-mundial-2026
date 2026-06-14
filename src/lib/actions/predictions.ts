"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Stage } from "@/generated/prisma/client";

const scoreSchema = z.coerce.number().int().min(0).max(99);

export type PredictionState =
  | { ok: true; error?: never }
  | { ok?: never; error: string }
  | undefined;

export async function savePrediction(
  matchId: number,
  _prev: PredictionState,
  formData: FormData
): Promise<PredictionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Debes iniciar sesión" };

  const parsed = z
    .object({ homeScore: scoreSchema, awayScore: scoreSchema })
    .safeParse({
      homeScore: formData.get("homeScore"),
      awayScore: formData.get("awayScore"),
    });
  if (!parsed.success) {
    return { error: "Ingresa marcadores válidos (0 a 99)" };
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "El partido no existe" };
  if (match.kickoff <= new Date()) {
    return { error: "El partido ya comenzó, no puedes modificar tu predicción" };
  }

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    update: parsed.data,
    create: { userId: session.user.id, matchId, ...parsed.data },
  });

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}

export type MemberPredictionRow = {
  matchId: number;
  matchNumber: number;
  kickoff: Date;
  stage: Stage;
  homeTeam: { name: string; fifaCode: string } | null;
  awayTeam: { name: string; fifaCode: string } | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeScore: number | null;
  awayScore: number | null;
  finished: boolean;
  predHome: number | null;
  predAway: number | null;
  points: number | null;
};

export type MemberPredictionsResult =
  | { ok: true; name: string; rows: MemberPredictionRow[] }
  | { error: string };

// Devuelve las predicciones de un integrante del grupo solo para los partidos
// que ya empezaron (kickoff <= ahora), respetando la ventana validFrom del grupo.
// Nunca expone predicciones de partidos futuros (aún sin bloquear).
export async function getMemberPredictions(
  groupId: string,
  targetUserId: string
): Promise<MemberPredictionsResult> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Debes iniciar sesión" };

  // El solicitante debe pertenecer al grupo para ver predicciones de otros.
  const requester = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: session.user.id, groupId } },
  });
  if (!requester) return { error: "No perteneces a este grupo" };

  const [group, target] = await Promise.all([
    prisma.group.findUnique({ where: { id: groupId }, select: { validFrom: true } }),
    prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: targetUserId, groupId } },
      include: { user: { select: { name: true } } },
    }),
  ]);
  if (!group) return { error: "El grupo no existe" };
  if (!target) return { error: "El jugador no pertenece a este grupo" };

  const now = new Date();
  const matches = await prisma.match.findMany({
    where: {
      kickoff: { lte: now, ...(group.validFrom ? { gte: group.validFrom } : {}) },
    },
    include: {
      homeTeam: { select: { name: true, fifaCode: true } },
      awayTeam: { select: { name: true, fifaCode: true } },
    },
    orderBy: { kickoff: "asc" },
  });

  const predictions = await prisma.prediction.findMany({
    where: { userId: targetUserId, matchId: { in: matches.map((m) => m.id) } },
  });
  const predByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  const rows: MemberPredictionRow[] = matches.map((m) => {
    const pred = predByMatch.get(m.id);
    return {
      matchId: m.id,
      matchNumber: m.matchNumber,
      kickoff: m.kickoff,
      stage: m.stage,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      homePlaceholder: m.homePlaceholder,
      awayPlaceholder: m.awayPlaceholder,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      finished: m.status === "FINISHED",
      predHome: pred?.homeScore ?? null,
      predAway: pred?.awayScore ?? null,
      points: pred?.points ?? null,
    };
  });

  return { ok: true, name: target.user.name, rows };
}
