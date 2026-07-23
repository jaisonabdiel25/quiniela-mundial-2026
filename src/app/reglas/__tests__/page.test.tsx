import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { getSession } from "@/lib/session";
import ReglasPage from "../page";

const sessionMock = vi.mocked(getSession);

describe("ReglasPage", () => {
  it("redirige a /login sin sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    await expect(ReglasPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("muestra las reglas de puntuación", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    render(await ReglasPage());
    expect(screen.getByRole("heading", { name: "Reglas del juego" })).toBeInTheDocument();
    expect(screen.getByText("Marcador exacto")).toBeInTheDocument();
    expect(screen.getByText("Resultado acertado")).toBeInTheDocument();
  });
});
