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
