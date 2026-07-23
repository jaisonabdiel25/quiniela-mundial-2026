import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./modal";

describe("Modal", () => {
  it("no renderiza nada cuando está cerrado", () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}} title="T">
        contenido
      </Modal>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("muestra título, contenido y botón de cerrar cuando está abierto", () => {
    render(
      <Modal open onClose={() => {}} title="Detalle del partido">
        <p>contenido del modal</p>
      </Modal>
    );
    expect(screen.getByRole("dialog", { name: "Detalle del partido" })).toBeInTheDocument();
    expect(screen.getByText("contenido del modal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeInTheDocument();
  });

  it("llama a onClose al pulsar el botón de cerrar", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open onClose={onClose} title="T">x</Modal>);
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cierra con la tecla Escape", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open onClose={onClose} title="T">x</Modal>);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
