"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
  return { ok: true };
}
