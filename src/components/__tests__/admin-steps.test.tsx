import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminSteps, type AdminStep } from "../admin-steps";

const steps: AdminStep[] = [
  { label: "Fase de grupos", done: 2, total: 3 },
  { label: "Dieciseisavos", done: 0, total: 8 },
];
const panels = [<div key="a">Panel Grupos</div>, <div key="b">Panel Dieciseisavos</div>];

describe("AdminSteps", () => {
  it("muestra el primer paso activo y su panel", () => {
    render(<AdminSteps steps={steps} panels={panels} />);
    expect(screen.getByText("Panel Grupos")).toBeInTheDocument();
    expect(screen.queryByText("Panel Dieciseisavos")).not.toBeInTheDocument();
    expect(screen.getByText("Paso 1 de 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "← Anterior" })).toBeDisabled();
  });

  it("navega al siguiente paso", async () => {
    const user = userEvent.setup();
    render(<AdminSteps steps={steps} panels={panels} />);

    await user.click(screen.getByRole("button", { name: "Siguiente →" }));

    expect(screen.getByText("Panel Dieciseisavos")).toBeInTheDocument();
    expect(screen.getByText("Paso 2 de 2")).toBeInTheDocument();
  });
});
