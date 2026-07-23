import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/prisma");
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
// La página renderiza MatchesBrowser → MatchRow → PredictionForm: mockeamos su acción.
vi.mock("@/lib/actions/predictions", () => ({ savePrediction: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { prismaMock } from "@/test/prisma-mock";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import MatchesPage from "../page";

const sessionMock = vi.mocked(getSession);

function matchRow() {
  return {
    id: 1,
    matchNumber: 1,
    stage: "GROUP",
    groupLetter: "A",
    homeTeamId: 1,
    awayTeamId: 2,
    homePlaceholder: null,
    awayPlaceholder: null,
    kickoff: new Date("2026-06-11T18:00:00Z"),
    venue: "Estadio Azteca",
    homeScore: 2,
    awayScore: 1,
    status: "FINISHED",
    homeTeam: { name: "México", fifaCode: "MEX" },
    awayTeam: { name: "Canadá", fifaCode: "CAN" },
  };
}

describe("MatchesPage", () => {
  it("redirige a /login sin sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    await expect(
      MatchesPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renderiza los partidos del usuario autenticado", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    prismaMock.match.findMany.mockResolvedValue([matchRow()] as never);
    prismaMock.prediction.findMany.mockResolvedValue([] as never);

    // day=all y hidePast=0 desactivan los filtros de fecha.
    const ui = await MatchesPage({
      searchParams: Promise.resolve({ day: "all", hidePast: "0" }),
    });
    render(ui);

    expect(
      screen.getByRole("heading", { name: "Partidos del Mundial 2026" })
    ).toBeInTheDocument();
    expect(screen.getByText("México")).toBeInTheDocument();
    expect(screen.getByText("Canadá")).toBeInTheDocument();
  });
});
