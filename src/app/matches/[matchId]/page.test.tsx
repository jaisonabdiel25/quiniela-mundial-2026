import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/prisma");
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/queries", () => ({ getGroupStandings: vi.fn() }));
vi.mock("@/lib/actions/predictions", () => ({ savePrediction: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

import { prismaMock } from "@/test/prisma-mock";
import { getSession } from "@/lib/session";
import { getGroupStandings } from "@/lib/queries";
import MatchDetailPage from "./page";

const sessionMock = vi.mocked(getSession);
const params = (matchId: string) => Promise.resolve({ matchId });

describe("MatchDetailPage", () => {
  it("redirige a /login sin sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    await expect(MatchDetailPage({ params: params("5") })).rejects.toThrow("REDIRECT:/login");
  });

  it("devuelve notFound si el partido no existe", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    prismaMock.match.findUnique.mockResolvedValue(null);
    await expect(MatchDetailPage({ params: params("5") })).rejects.toThrow("NOT_FOUND");
  });

  it("muestra el detalle de un partido de grupo finalizado con su tabla", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    prismaMock.match.findUnique.mockResolvedValue({
      id: 5, matchNumber: 10, stage: "GROUP", groupLetter: "A",
      homeTeamId: 1, awayTeamId: 2, homePlaceholder: null, awayPlaceholder: null,
      kickoff: new Date("2020-01-01T00:00:00Z"), venue: "Estadio",
      homeScore: 2, awayScore: 1, status: "FINISHED",
      homeTeam: { id: 1, name: "Argentina", fifaCode: "ARG" },
      awayTeam: { id: 2, name: "Brasil", fifaCode: "BRA" },
    } as never);
    prismaMock.prediction.findUnique.mockResolvedValue(null);
    vi.mocked(getGroupStandings).mockResolvedValue([
      {
        letter: "A",
        teams: [
          { teamId: 1, name: "Argentina", fifaCode: "ARG", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, goalDiff: 1, points: 3 },
          { teamId: 2, name: "Brasil", fifaCode: "BRA", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, goalDiff: -1, points: 0 },
        ],
      },
    ] as never);
    prismaMock.match.findMany.mockResolvedValue([] as never);

    render(await MatchDetailPage({ params: params("5") }));

    expect(screen.getByText(/Fase de grupos/)).toBeInTheDocument();
    expect(screen.getByText("2-1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Grupo A" })).toBeInTheDocument();
  });
});
