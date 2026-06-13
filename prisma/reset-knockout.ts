import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Borra las asignaciones de equipos de todas las rondas eliminatorias (16avos
// en adelante). Deja los placeholders ("1° Grupo A", "Ganador P89", …) intactos,
// así el cuadro vuelve a mostrar los textos / la proyección provisional.
//
// Por defecto también reinicia el resultado y el estado de esos partidos, ya
// que un cruce FINISHED sin equipos no tendría sentido. Los puntos de las
// predicciones de esos partidos se limpian para mantener la tabla coherente.
async function resetKnockout() {
  const knockout = await prisma.match.findMany({
    where: { stage: { not: "GROUP" } },
    select: { id: true },
  });
  const ids = knockout.map((m) => m.id);

  await prisma.prediction.updateMany({
    where: { matchId: { in: ids } },
    data: { points: null },
  });

  const result = await prisma.match.updateMany({
    where: { stage: { not: "GROUP" } },
    data: {
      homeTeamId: null,
      awayTeamId: null,
      homeScore: null,
      awayScore: null,
      status: "SCHEDULED",
    },
  });

  console.log(
    `↺ Borradas las asignaciones de ${result.count} partidos eliminatorios.`
  );
  console.log("   Revisa /eliminatoria para confirmar que vuelven los placeholders.");
}

resetKnockout()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
