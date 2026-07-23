import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/actions/auth", () => ({ logout: vi.fn() }));

import { getSession } from "@/lib/session";
import { Nav } from "../nav";

const sessionMock = vi.mocked(getSession);

describe("Nav", () => {
  it("sin sesión muestra el logo pero no el menú de usuario", async () => {
    sessionMock.mockResolvedValue(null as never);
    render(await Nav());
    expect(screen.getByText("⚽ Quiniela Mundial 2026")).toBeInTheDocument();
    expect(screen.queryByText("Salir")).not.toBeInTheDocument();
  });

  it("con sesión muestra el nombre y el botón de salir", async () => {
    sessionMock.mockResolvedValue({ user: { role: "USER", name: "Ana" } } as never);
    render(await Nav());
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Salir")).toBeInTheDocument();
  });
});
