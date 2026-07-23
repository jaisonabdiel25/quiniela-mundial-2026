import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/prisma");
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/actions/admin", () => ({
  autoAssignFromGroups: vi.fn(),
  autoAssignKnockoutRound: vi.fn(),
  clearResult: vi.fn(),
  saveResult: vi.fn(),
  assignTeams: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { prismaMock } from "@/test/prisma-mock";
import { getSession } from "@/lib/session";
import AdminPage from "../page";

const sessionMock = vi.mocked(getSession);

describe("AdminPage", () => {
  it("redirige a la home si no es admin", async () => {
    sessionMock.mockResolvedValue({ user: { role: "USER" } } as never);
    await expect(AdminPage()).rejects.toThrow("REDIRECT:/");
  });

  it("muestra el panel con los pasos y el formulario de resultado", async () => {
    sessionMock.mockResolvedValue({ user: { role: "ADMIN", id: "a" } } as never);
    prismaMock.match.findMany.mockResolvedValue([
      {
        id: 1, matchNumber: 1, stage: "GROUP", groupLetter: "A",
        homeTeamId: 1, awayTeamId: 2, homePlaceholder: null, awayPlaceholder: null,
        kickoff: new Date("2027-06-11T18:00:00Z"), venue: "Estadio",
        homeScore: null, awayScore: null, status: "SCHEDULED",
        homeTeam: { id: 1, name: "Argentina", fifaCode: "ARG" },
        awayTeam: { id: 2, name: "Brasil", fifaCode: "BRA" },
      },
    ] as never);
    prismaMock.team.findMany.mockResolvedValue([
      { id: 1, name: "Argentina", flagEmoji: "🇦🇷" },
      { id: 2, name: "Brasil", flagEmoji: "🇧🇷" },
    ] as never);

    render(await AdminPage());

    expect(screen.getByRole("heading", { name: "Panel de administración" })).toBeInTheDocument();
    expect(screen.getByText("Fase de grupos")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    // El partido tiene ambos equipos → aparece el formulario de resultado.
    expect(screen.getByRole("button", { name: "Guardar resultado" })).toBeInTheDocument();
  });
});
