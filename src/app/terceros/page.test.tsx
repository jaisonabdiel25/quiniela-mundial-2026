import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/queries", () => ({ getBestThirds: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { getSession } from "@/lib/session";
import { getBestThirds } from "@/lib/queries";
import TercerosPage from "./page";

const sessionMock = vi.mocked(getSession);

describe("TercerosPage", () => {
  it("redirige a /login sin sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    await expect(TercerosPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("lista los mejores terceros", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    vi.mocked(getBestThirds).mockResolvedValue([
      {
        teamId: 1,
        name: "Panamá",
        fifaCode: "PAN",
        letter: "A",
        played: 3,
        won: 1, drawn: 1, lost: 1,
        goalsFor: 4, goalsAgainst: 3, goalDiff: 1,
        points: 4,
      },
    ] as never);

    render(await TercerosPage());

    expect(screen.getByRole("heading", { name: "Mejores terceros" })).toBeInTheDocument();
    expect(screen.getByText("Panamá")).toBeInTheDocument();
  });
});
