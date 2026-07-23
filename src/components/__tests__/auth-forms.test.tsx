import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/actions/auth", () => ({
  authenticate: vi.fn(),
  register: vi.fn(),
}));

import { authenticate, register } from "@/lib/actions/auth";
import { LoginForm, RegisterForm } from "../auth-forms";

describe("LoginForm", () => {
  it("muestra los campos de correo y contraseña", () => {
    render(<LoginForm />);
    expect(screen.getByPlaceholderText("Correo")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument();
  });

  it("envía las credenciales y muestra el error que devuelve la acción", async () => {
    vi.mocked(authenticate).mockResolvedValue({
      error: "Correo o contraseña incorrectos",
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByPlaceholderText("Correo"), "ana@correo.com");
    await user.type(screen.getByPlaceholderText("Contraseña"), "secreta");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(
      await screen.findByText("Correo o contraseña incorrectos")
    ).toBeInTheDocument();
    expect(authenticate).toHaveBeenCalledTimes(1);
  });
});

describe("RegisterForm", () => {
  it("muestra nombre, correo y contraseña", () => {
    render(<RegisterForm />);
    expect(screen.getByPlaceholderText("Nombre")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Correo")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Contraseña (mínimo 6 caracteres)")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Registrarme" })).toBeInTheDocument();
  });

  it("llama a la acción de registro al enviar", async () => {
    vi.mocked(register).mockResolvedValue({ error: "Ya existe una cuenta con ese correo" });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("Nombre"), "Ana");
    await user.type(screen.getByPlaceholderText("Correo"), "ana@correo.com");
    await user.type(
      screen.getByPlaceholderText("Contraseña (mínimo 6 caracteres)"),
      "secreta"
    );
    await user.click(screen.getByRole("button", { name: "Registrarme" }));

    expect(await screen.findByText("Ya existe una cuenta con ese correo")).toBeInTheDocument();
    expect(register).toHaveBeenCalledTimes(1);
  });
});
