import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/auth", () => ({ authenticate: vi.fn(), register: vi.fn() }));

import LoginPage from "./page";

describe("LoginPage", () => {
  it("muestra el título, el formulario y el enlace a registro", () => {
    render(<LoginPage />);
    expect(screen.getByRole("heading", { name: "Iniciar sesión" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Correo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Regístrate" })).toBeInTheDocument();
  });
});
