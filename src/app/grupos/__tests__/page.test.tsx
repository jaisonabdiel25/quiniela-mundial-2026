import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GroupStandings } from "@/lib/queries";

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/queries", () => ({ getGroupStandings: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { getSession } from "@/lib/session";
import { getGroupStandings } from "@/lib/queries";
import { redirect } from "next/navigation";
import GruposPage from "../page";

const sessionMock = vi.mocked(getSession);
const standingsMock = vi.mocked(getGroupStandings);

describe("GruposPage", () => {
  it("redirige a /login sin sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    await expect(GruposPage()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renderiza la tabla de cada grupo", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    const group: GroupStandings = {
      letter: "A",
      teams: [
        {
          teamId: 1,
          name: "Argentina",
          fifaCode: "ARG",
          played: 3, won: 3, drawn: 0, lost: 0,
          goalsFor: 7, goalsAgainst: 1, goalDiff: 6, points: 9,
        },
      ],
    };
    standingsMock.mockResolvedValue([group]);

    render(await GruposPage());

    expect(screen.getByText("Grupo A")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
  });
});
