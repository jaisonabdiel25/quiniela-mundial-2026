import type { Team, Match, Group, User } from "@/generated/prisma/client";

// Constructores de datos de prueba con valores por defecto sensatos.
// Pasa solo los campos que le importan al test; el resto se rellena.

export function makeTeam(over: Partial<Team> = {}): Team {
  return {
    id: 1,
    name: "Equipo",
    fifaCode: "AAA",
    flagEmoji: "🏳️",
    groupLetter: "A",
    ...over,
  };
}

export function makeMatch(over: Partial<Match> = {}): Match {
  return {
    id: 1,
    matchNumber: 1,
    stage: "GROUP",
    groupLetter: "A",
    homeTeamId: null,
    awayTeamId: null,
    homePlaceholder: null,
    awayPlaceholder: null,
    kickoff: new Date("2026-06-11T18:00:00Z"),
    venue: "Estadio",
    homeScore: null,
    awayScore: null,
    status: "SCHEDULED",
    ...over,
  };
}

export function makeGroup(over: Partial<Group> = {}): Group {
  return {
    id: "grp_1",
    name: "Los Cracks",
    code: "ABC234",
    ownerId: "user_owner",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    validFrom: null,
    ...over,
  };
}

export function makeUser(over: Partial<User> = {}): User {
  return {
    id: "user_1",
    name: "Jugador",
    email: "jugador@quiniela.local",
    passwordHash: "hash",
    role: "USER",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    ...over,
  };
}
