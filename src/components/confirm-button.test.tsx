import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmButton } from "./confirm-button";

afterEach(() => vi.restoreAllMocks());

describe("ConfirmButton", () => {
  it("renderiza el contenido del botón", () => {
    render(
      <ConfirmButton action={vi.fn()} confirmMessage="¿Seguro?">
        Eliminar grupo
      </ConfirmButton>
    );
    expect(screen.getByRole("button", { name: "Eliminar grupo" })).toBeInTheDocument();
  });

  it("no ejecuta la acción si el usuario cancela la confirmación", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <ConfirmButton action={action} confirmMessage="¿Seguro?">
        Eliminar
      </ConfirmButton>
    );
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(action).not.toHaveBeenCalled();
  });

  it("ejecuta la acción cuando el usuario confirma", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const user = userEvent.setup();
    render(
      <ConfirmButton action={action} confirmMessage="¿Seguro?">
        Eliminar
      </ConfirmButton>
    );
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(action).toHaveBeenCalledTimes(1);
  });
});
