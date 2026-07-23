import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/groups", () => ({
  createGroup: vi.fn(),
  joinGroup: vi.fn(),
  setGroupValidFrom: vi.fn(),
}));

import NewGroupPage from "../page";

describe("NewGroupPage", () => {
  it("muestra el título y el formulario de crear grupo", () => {
    render(<NewGroupPage />);
    expect(screen.getByRole("heading", { name: "Crear grupo" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Nombre del grupo (ej. Oficina 2026)")
    ).toBeInTheDocument();
  });
});
