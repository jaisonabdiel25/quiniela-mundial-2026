import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/actions/groups", () => ({
  createGroup: vi.fn(),
  joinGroup: vi.fn(),
  setGroupValidFrom: vi.fn(),
}));

import { createGroup } from "@/lib/actions/groups";
import { CreateGroupForm, JoinGroupForm, ValidFromForm } from "./group-forms";

describe("CreateGroupForm", () => {
  it("renderiza el campo de nombre y el botón", () => {
    render(<CreateGroupForm />);
    expect(
      screen.getByPlaceholderText("Nombre del grupo (ej. Oficina 2026)")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear grupo" })).toBeInTheDocument();
  });

  it("envía el formulario y muestra el error de la acción", async () => {
    vi.mocked(createGroup).mockResolvedValue({ error: "No se pudo generar el grupo" });
    const user = userEvent.setup();
    render(<CreateGroupForm />);

    await user.type(
      screen.getByPlaceholderText("Nombre del grupo (ej. Oficina 2026)"),
      "Oficina 2026"
    );
    await user.click(screen.getByRole("button", { name: "Crear grupo" }));

    expect(await screen.findByText("No se pudo generar el grupo")).toBeInTheDocument();
    expect(createGroup).toHaveBeenCalledTimes(1);
  });
});

describe("JoinGroupForm", () => {
  it("renderiza el campo de código y el botón", () => {
    render(<JoinGroupForm />);
    expect(screen.getByPlaceholderText("Código de 6 caracteres")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unirme al grupo" })).toBeInTheDocument();
  });
});

describe("ValidFromForm", () => {
  it("con validFrom muestra el botón para quitar el límite", () => {
    render(
      <ValidFromForm groupId="g1" validFrom={new Date("2026-06-11T23:00:00Z")} />
    );
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar límite" })).toBeInTheDocument();
  });

  it("sin validFrom no muestra el botón de quitar límite", () => {
    render(<ValidFromForm groupId="g1" validFrom={null} />);
    expect(screen.queryByRole("button", { name: "Quitar límite" })).not.toBeInTheDocument();
  });
});
