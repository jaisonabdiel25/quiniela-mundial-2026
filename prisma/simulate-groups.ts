import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Marcador aleatorio con sesgo a valores bajos (0-4 goles, lo típico).
function randomScore(): number {
  const r = Math.random();
  if (r < 0.3) return 0;
  if (r < 0.6) return 1;
  if (r < 0.82) return 2;
  if (r < 0.94) return 3;
  return 4;
}

// Recalcula los puntos de las predicciones de los partidos de grupo finalizados:
// 3 por marcador exacto, 1 por acertar el resultado, 0 en otro caso.
// Debe coincidir con `scorePrediction` en src/lib/match-utils.ts.
async function recomputeGroupPredictionPoints() {
  await prisma.$executeRaw`
    UPDATE "Prediction" p
    SET "points" = CASE
      WHEN p."homeScore" = m."homeScore" AND p."awayScore" = m."awayScore" THEN 3
      WHEN SIGN(p."homeScore" - p."awayScore") = SIGN(m."homeScore" - m."awayScore") THEN 1
      ELSE 0
    END
    FROM "Match" m
    WHERE p."matchId" = m."id"
      AND m."stage" = 'GROUP'
      AND m."status" = 'FINISHED'
      AND m."homeScore" IS NOT NULL
      AND m."awayScore" IS NOT NULL
  `;
}

async function simulate() {
  const matches = await prisma.match.findMany({
    where: {
      stage: "GROUP",
      homeTeamId: { not: null },
      awayTeamId: { not: null },
    },
    orderBy: { matchNumber: "asc" },
  });

  for (const m of matches) {
    await prisma.match.update({
      where: { id: m.id },
      data: {
        homeScore: randomScore(),
        awayScore: randomScore(),
        status: "FINISHED",
      },
    });
  }

  await recomputeGroupPredictionPoints();
  console.log(`✅ Simulados ${matches.length} partidos de la fase de grupos.`);
  console.log("   Mira /grupos, /terceros y /eliminatoria para ver cómo va quedando.");
}

async function reset() {
  const result = await prisma.match.updateMany({
    where: { stage: "GROUP" },
    data: { homeScore: null, awayScore: null, status: "SCHEDULED" },
  });

  const groupMatches = await prisma.match.findMany({
    where: { stage: "GROUP" },
    select: { id: true },
  });
  await prisma.prediction.updateMany({
    where: { matchId: { in: groupMatches.map((m) => m.id) } },
    data: { points: null },
  });

  console.log(`↺ Reiniciados ${result.count} partidos de grupo (sin resultado).`);
}

async function main() {
  const isReset = process.argv.includes("--reset");
  if (isReset) {
    await reset();
  } else {
    await simulate();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
