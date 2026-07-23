import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/groups", () => ({
  createGroup: vi.fn(),
  joinGroup: vi.fn(),
  setGroupValidFrom: vi.fn(),
}));

import JoinGroupPage from "./page";

describe("JoinGroupPage", () => {
  it("muestra el título y el formulario de unirse", () => {
    render(<JoinGroupPage />);
    expect(screen.getByRole("heading", { name: "Unirme a un grupo" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Código de 6 caracteres")).toBeInTheDocument();
  });
});
