"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { FormState } from "@/lib/actions/auth";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Solo el administrador puede hacer esto");
  }
}

const scoreSchema = z.coerce.number().int().min(0).max(99);

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
    // 3 puntos por marcador exacto, 1 por acertar el resultado, 0 en otro caso
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
