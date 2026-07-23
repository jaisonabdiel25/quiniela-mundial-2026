import type { Prisma, Stage } from "@/generated/prisma/client";

export type MatchWithTeams = Prisma.MatchGetPayload<{
  include: { homeTeam: true; awayTeam: true };
}>;

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: "Fase de grupos",
  ROUND_32: "Dieciseisavos de final",
  ROUND_16: "Octavos de final",
  QUARTER: "Cuartos de final",
  SEMI: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};

export const STAGE_ORDER: Stage[] = [
  "GROUP",
  "ROUND_32",
  "ROUND_16",
  "QUARTER",
  "SEMI",
  "THIRD_PLACE",
  "FINAL",
];

export function isLocked(match: { kickoff: Date }): boolean {
  return match.kickoff <= new Date();
}

// Puntaje de una predicción contra el marcador real:
// 3 por marcador exacto, 1 por acertar el signo del resultado, 0 en otro caso.
// Fuente canónica de la fórmula. OJO: esta lógica está duplicada como SQL crudo
// en `admin.saveResult` y `prisma/simulate-groups.ts` (Prisma no puntúa en JS);
// si cambias la fórmula, mantén esos tres lugares sincronizados.
export function scorePrediction(
  homeScore: number,
  awayScore: number,
  predHome: number,
  predAway: number
): 0 | 1 | 3 {
  if (homeScore === predHome && awayScore === predAway) return 3;
  if (Math.sign(homeScore - awayScore) === Math.sign(predHome - predAway)) return 1;
  return 0;
}
