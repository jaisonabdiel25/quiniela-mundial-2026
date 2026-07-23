import { describe, it, expect, vi, type Mock } from "vitest";

// Mockea la capa de datos: usa src/lib/__mocks__/prisma.ts (cliente profundo).
vi.mock("@/lib/prisma");

import { prismaMock } from "@/test/prisma-mock";
import { makeTeam, makeMatch } from "@/test/factories";
import { getGroupStandings, getBestThirds, getGroupLeaderboard } from "./queries";

describe("getGroupStandings", () => {
  it("acumula puntos, goles y resultados desde los partidos finalizados", async () => {
    prismaMock.team.findMany.mockResolvedValue([
      makeTeam({ id: 1, name: "Argentina", fifaCode: "ARG", groupLetter: "A" }),
      makeTeam({ id: 2, name: "Brasil", fifaCode: "BRA", groupLetter: "A" }),
      makeTeam({ id: 3, name: "Chile", fifaCode: "CHI", groupLetter: "A" }),
    ]);
    prismaMock.match.findMany.mockResolvedValue([
      // Argentina 1-0 Brasil
      makeMatch({ id: 1, homeTeamId: 1, awayTeamId: 2, homeScore: 1, awayScore: 0, status: "FINISHED" }),
      // Argentina 2-2 Chile
      makeMatch({ id: 2, homeTeamId: 1, awayTeamId: 3, homeScore: 2, awayScore: 2, status: "FINISHED" }),
      // Brasil 3-1 Chile
      makeMatch({ id: 3, homeTeamId: 2, awayTeamId: 3, homeScore: 3, awayScore: 1, status: "FINISHED" }),
    ]);

    const groups = await getGroupStandings();
    expect(groups).toHaveLength(1);
    const [arg, bra, chi] = groups[0].teams;

    // Argentina: 1 victoria + 1 empate = 4 pts, GF3 GA2
    expect(arg).toMatchObject({
      name: "Argentina",
      played: 2, won: 1, drawn: 1, lost: 0,
      goalsFor: 3, goalsAgainst: 2, goalDiff: 1, points: 4,
    });
    // Brasil: 1 victoria + 1 derrota = 3 pts
    expect(bra).toMatchObject({ name: "Brasil", points: 3, goalsFor: 3, goalsAgainst: 2 });
    // Chile: 1 empate + 1 derrota = 1 pt, GF3 GA5
    expect(chi).toMatchObject({ name: "Chile", points: 1, goalsFor: 3, goalsAgainst: 5, goalDiff: -2 });
  });

  it("deja en cero a los equipos sin partidos finalizados", async () => {
    prismaMock.team.findMany.mockResolvedValue([
      makeTeam({ id: 1, name: "Panamá", groupLetter: "B" }),
    ]);
    prismaMock.match.findMany.mockResolvedValue([]);

    const groups = await getGroupStandings();
    expect(groups[0].teams[0]).toMatchObject({ played: 0, points: 0, goalDiff: 0 });
  });
});

describe("getBestThirds", () => {
  it("toma el tercero de cada grupo y los ordena entre sí", async () => {
    prismaMock.team.findMany.mockResolvedValue([
      // Grupo A: triple empate a 3 pts → el tercero (por nombre) es A3 con 3 pts
      makeTeam({ id: 1, name: "A1", groupLetter: "A" }),
      makeTeam({ id: 2, name: "A2", groupLetter: "A" }),
      makeTeam({ id: 3, name: "A3", groupLetter: "A" }),
      // Grupo B: B1 y B2 ganan, B3 pierde ambos → el tercero es B3 con 0 pts
      makeTeam({ id: 4, name: "B1", groupLetter: "B" }),
      makeTeam({ id: 5, name: "B2", groupLetter: "B" }),
      makeTeam({ id: 6, name: "B3", groupLetter: "B" }),
    ]);
    prismaMock.match.findMany.mockResolvedValue([
      // Grupo A: ciclo de victorias 1-0 → todos con 3 pts, GD 0 (desempata el nombre)
      makeMatch({ id: 1, homeTeamId: 1, awayTeamId: 2, homeScore: 1, awayScore: 0, status: "FINISHED" }),
      makeMatch({ id: 2, homeTeamId: 2, awayTeamId: 3, homeScore: 1, awayScore: 0, status: "FINISHED" }),
      makeMatch({ id: 3, homeTeamId: 3, awayTeamId: 1, homeScore: 1, awayScore: 0, status: "FINISHED" }),
      // Grupo B: B3 pierde ambos → tercero con 0 pts
      makeMatch({ id: 4, homeTeamId: 4, awayTeamId: 6, homeScore: 1, awayScore: 0, status: "FINISHED" }),
      makeMatch({ id: 5, homeTeamId: 5, awayTeamId: 6, homeScore: 1, awayScore: 0, status: "FINISHED" }),
    ]);

    const thirds = await getBestThirds();
    // A3 (3 pts) va por delante de B3 (0 pts)
    expect(thirds.map((t) => t.name)).toEqual(["A3", "B3"]);
    expect(thirds[0]).toMatchObject({ letter: "A", points: 3 });
  });
});

describe("getGroupLeaderboard", () => {
  it("suma puntos, cuenta exactos y ordena por puntos (sin validFrom)", async () => {
    prismaMock.group.findUnique.mockResolvedValue({ validFrom: null } as never);
    prismaMock.groupMember.findMany.mockResolvedValue([
      { userId: "u1", user: { id: "u1", name: "Ana" } },
      { userId: "u2", user: { id: "u2", name: "Beto" } },
    ] as never);
    // groupBy es un método con muchos overloads; se castea para acceder al mock.
    // Orden de las 3 llamadas: sumas, exactos, conteos.
    const groupByMock = prismaMock.prediction.groupBy as unknown as Mock;
    groupByMock
      .mockResolvedValueOnce([
        { userId: "u1", _sum: { points: 10 } },
        { userId: "u2", _sum: { points: 12 } },
      ])
      .mockResolvedValueOnce([
        { userId: "u1", _count: { _all: 2 } },
        { userId: "u2", _count: { _all: 1 } },
      ])
      .mockResolvedValueOnce([
        { userId: "u1", _count: { _all: 5 } },
        { userId: "u2", _count: { _all: 5 } },
      ]);

    const { rows, validFrom } = await getGroupLeaderboard("grp_1");

    expect(validFrom).toBeNull();
    // Beto (12 pts) va primero
    expect(rows.map((r) => r.name)).toEqual(["Beto", "Ana"]);
    expect(rows[0]).toMatchObject({ name: "Beto", points: 12, exactCount: 1, predictionCount: 5 });
    expect(rows[1]).toMatchObject({ name: "Ana", points: 10, exactCount: 2, predictionCount: 5 });
    // Sin validFrom, no se consultan los partidos por ventana de tiempo.
    expect(prismaMock.match.findMany).not.toHaveBeenCalled();
  });
});
