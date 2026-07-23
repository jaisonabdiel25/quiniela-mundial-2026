import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/prisma");
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { prismaMock } from "@/test/prisma-mock";
import { getSession } from "@/lib/session";
import DashboardPage from "../page";

const sessionMock = vi.mocked(getSession);

describe("DashboardPage", () => {
  it("redirige a /login sin sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("muestra los partidos por jugar", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    prismaMock.match.findMany.mockResolvedValue([
      {
        id: 1,
        homeTeam: { name: "Argentina", fifaCode: "ARG" },
        awayTeam: { name: "Brasil", fifaCode: "BRA" },
        homePlaceholder: null,
        awayPlaceholder: null,
        kickoff: new Date("2027-06-11T18:00:00Z"),
        venue: "Estadio",
        status: "SCHEDULED",
      },
    ] as never);
    prismaMock.prediction.findMany.mockResolvedValue([] as never);

    render(await DashboardPage());

    expect(screen.getByRole("heading", { name: "Partidos por jugar" })).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("Brasil")).toBeInTheDocument();
  });
});
