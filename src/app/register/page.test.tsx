import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/auth", () => ({ authenticate: vi.fn(), register: vi.fn() }));

import RegisterPage from "./page";

describe("RegisterPage", () => {
  it("muestra el título, el formulario y el enlace a login", () => {
    render(<RegisterPage />);
    expect(screen.getByRole("heading", { name: "Crear cuenta" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nombre")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inicia sesión" })).toBeInTheDocument();
  });
});
