import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/queries", () => ({ getGroupStandings: vi.fn() }));

import { prismaMock } from "@/test/prisma-mock";
import { makeMatch } from "@/test/factories";
import { auth } from "@/auth";
import { getGroupStandings } from "@/lib/queries";
import {
  saveResult,
  clearResult,
  assignTeams,
  autoAssignFromGroups,
  autoAssignKnockoutRound,
} from "../admin";

const authMock = vi.mocked(auth);
const loginAdmin = () => authMock.mockResolvedValue({ user: { id: "a", role: "ADMIN" } } as never);
const loginUser = () => authMock.mockResolvedValue({ user: { id: "u", role: "USER" } } as never);

function scores(home: string, away: string) {
  const fd = new FormData();
  fd.set("homeScore", home);
  fd.set("awayScore", away);
  return fd;
}

const FUTURE = new Date("2100-01-01T00:00:00Z");
const PAST = new Date("2020-01-01T00:00:00Z");

describe("saveResult", () => {
  it("rechaza a quien no es admin", async () => {
    loginUser();
    await expect(saveResult(1, undefined, scores("2", "1"))).rejects.toThrow(
      "Solo el administrador"
    );
  });

  it("rechaza marcadores inválidos", async () => {
    loginAdmin();
    const res = await saveResult(1, undefined, scores("abc", "1"));
    expect(res).toEqual({ error: "Marcadores inválidos" });
  });

  it("rechaza si el partido no existe", async () => {
    loginAdmin();
    prismaMock.match.findUnique.mockResolvedValue(null);
    const res = await saveResult(1, undefined, scores("2", "1"));
    expect(res).toEqual({ error: "El partido no existe" });
  });

  it("exige equipos asignados antes de cargar el resultado", async () => {
    loginAdmin();
    prismaMock.match.findUnique.mockResolvedValue(
      makeMatch({ id: 1, homeTeamId: null, awayTeamId: null })
    );
    const res = await saveResult(1, undefined, scores("2", "1"));
    expect(res).toEqual({ error: "Asigna los equipos antes de cargar el resultado" });
  });

  it("guarda el resultado en una transacción cuando todo es válido", async () => {
    loginAdmin();
    prismaMock.match.findUnique.mockResolvedValue(
      makeMatch({ id: 1, homeTeamId: 1, awayTeamId: 2 })
    );
    prismaMock.$transaction.mockResolvedValue([] as never);

    const res = await saveResult(1, undefined, scores("2", "1"));

    expect(res).toBeUndefined();
    expect(prismaMock.match.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { homeScore: 2, awayScore: 1, status: "FINISHED" },
    });
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});

describe("clearResult", () => {
  it("no hace nada si el partido ya comenzó", async () => {
    loginAdmin();
    prismaMock.match.findUnique.mockResolvedValue(makeMatch({ id: 1, kickoff: PAST }));
    await clearResult(1);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("limpia el resultado de un partido que aún no inicia", async () => {
    loginAdmin();
    prismaMock.match.findUnique.mockResolvedValue(makeMatch({ id: 1, kickoff: FUTURE }));
    prismaMock.$transaction.mockResolvedValue([] as never);
    await clearResult(1);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});

describe("assignTeams", () => {
  function teams(home: string, away: string) {
    const fd = new FormData();
    fd.set("homeTeamId", home);
    fd.set("awayTeamId", away);
    return fd;
  }

  it("rechaza equipos iguales", async () => {
    loginAdmin();
    const res = await assignTeams(1, undefined, teams("5", "5"));
    expect(res).toEqual({ error: "Los equipos deben ser distintos" });
    expect(prismaMock.match.update).not.toHaveBeenCalled();
  });

  it("asigna dos equipos distintos", async () => {
    loginAdmin();
    prismaMock.match.update.mockResolvedValue(makeMatch({ id: 1 }));
    const res = await assignTeams(1, undefined, teams("5", "8"));
    expect(res).toBeUndefined();
    expect(prismaMock.match.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { homeTeamId: 5, awayTeamId: 8 },
    });
  });
});

describe("autoAssignFromGroups", () => {
  it("falla si aún hay partidos de grupo sin finalizar", async () => {
    loginAdmin();
    prismaMock.match.count.mockResolvedValue(3);
    await expect(autoAssignFromGroups()).rejects.toThrow("Faltan partidos");
  });

  it("resuelve los 16avos desde las posiciones de grupo", async () => {
    loginAdmin();
    prismaMock.match.count.mockResolvedValue(0);
    vi.mocked(getGroupStandings).mockResolvedValue([
      { letter: "A", teams: [{ teamId: 10 }, { teamId: 11 }, { teamId: 12 }] },
    ] as never);
    prismaMock.match.findMany.mockResolvedValue([
      makeMatch({
        id: 100,
        stage: "ROUND_32",
        homePlaceholder: "1° Grupo A",
        awayPlaceholder: "2° Grupo A",
      }),
    ]);
    prismaMock.match.update.mockResolvedValue(makeMatch({ id: 100 }));

    await autoAssignFromGroups();

    expect(prismaMock.match.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: { homeTeamId: 10, awayTeamId: 11 },
    });
  });
});

describe("autoAssignKnockoutRound", () => {
  it("no permite asignar GROUP ni ROUND_32 desde la ronda anterior", async () => {
    loginAdmin();
    await expect(autoAssignKnockoutRound("ROUND_32")).rejects.toThrow(
      "no se asigna desde la ronda anterior"
    );
  });

  it("falla si la ronda anterior no está completa", async () => {
    loginAdmin();
    prismaMock.match.findMany
      .mockResolvedValueOnce([
        makeMatch({ id: 200, stage: "ROUND_16", homePlaceholder: "Ganador P89" }),
      ])
      .mockResolvedValueOnce([
        makeMatch({ matchNumber: 89, status: "SCHEDULED" }),
      ]);
    await expect(autoAssignKnockoutRound("ROUND_16")).rejects.toThrow(
      "La ronda anterior aún no está completa"
    );
  });

  it("asigna ganador y perdedor del partido anterior", async () => {
    loginAdmin();
    prismaMock.match.findMany
      // targets de la ronda
      .mockResolvedValueOnce([
        makeMatch({
          id: 200,
          stage: "ROUND_16",
          homePlaceholder: "Ganador P89",
          awayPlaceholder: "Perdedor P90",
        }),
      ])
      // partidos que alimentan la ronda
      .mockResolvedValueOnce([
        makeMatch({ matchNumber: 89, status: "FINISHED", homeScore: 2, awayScore: 1, homeTeamId: 1, awayTeamId: 2 }),
        makeMatch({ matchNumber: 90, status: "FINISHED", homeScore: 0, awayScore: 3, homeTeamId: 3, awayTeamId: 4 }),
      ]);
    prismaMock.match.update.mockResolvedValue(makeMatch({ id: 200 }));

    await autoAssignKnockoutRound("ROUND_16");

    // Ganador P89 = equipo local (2-1) = 1; Perdedor P90 = local (0-3) = 3
    expect(prismaMock.match.update).toHaveBeenCalledWith({
      where: { id: 200 },
      data: { homeTeamId: 1, awayTeamId: 3 },
    });
  });
});
