import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/prisma");
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/queries", () => ({ getGroupStandings: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { prismaMock } from "@/test/prisma-mock";
import { getSession } from "@/lib/session";
import { getGroupStandings } from "@/lib/queries";
import EliminatoriaPage from "./page";

const sessionMock = vi.mocked(getSession);

describe("EliminatoriaPage", () => {
  it("redirige a /login sin sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    await expect(EliminatoriaPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("dibuja el cuadro con el partido final", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    prismaMock.match.findMany.mockResolvedValue([
      {
        id: 104, matchNumber: 104, stage: "FINAL", groupLetter: null,
        homeTeamId: 1, awayTeamId: 2, homePlaceholder: null, awayPlaceholder: null,
        kickoff: new Date("2026-07-19T19:00:00Z"), venue: "MetLife",
        homeScore: 3, awayScore: 1, status: "FINISHED",
        homeTeam: { id: 1, name: "Argentina", fifaCode: "ARG" },
        awayTeam: { id: 2, name: "Francia", fifaCode: "FRA" },
      },
    ] as never);
    prismaMock.prediction.findMany.mockResolvedValue([] as never);
    vi.mocked(getGroupStandings).mockResolvedValue([]);

    render(await EliminatoriaPage());

    expect(screen.getByRole("heading", { name: /Eliminatoria/ })).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("Francia")).toBeInTheDocument();
  });
});
