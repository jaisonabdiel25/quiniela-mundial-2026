import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/actions/admin", () => ({ saveResult: vi.fn(), assignTeams: vi.fn() }));

import { saveResult } from "@/lib/actions/admin";
import { ResultForm, AssignTeamsForm } from "./admin-forms";

describe("ResultForm", () => {
  it("renderiza los inputs de marcador y el botón", () => {
    render(<ResultForm matchId={5} />);
    expect(screen.getByLabelText("Goles local")).toBeInTheDocument();
    expect(screen.getByLabelText("Goles visitante")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar resultado" })).toBeInTheDocument();
  });

  it("guarda el resultado con el matchId y muestra el error de la acción", async () => {
    vi.mocked(saveResult).mockResolvedValue({ error: "Marcadores inválidos" });
    const user = userEvent.setup();
    render(<ResultForm matchId={7} initialHome={2} initialAway={1} />);

    await user.click(screen.getByRole("button", { name: "Guardar resultado" }));

    expect(await screen.findByText("Marcadores inválidos")).toBeInTheDocument();
    expect(vi.mocked(saveResult).mock.calls[0][0]).toBe(7);
  });
});

describe("AssignTeamsForm", () => {
  it("renderiza los selectores de equipos y el botón asignar", () => {
    render(
      <AssignTeamsForm
        matchId={3}
        teams={[
          { id: 1, name: "Argentina", flagEmoji: "🇦🇷" },
          { id: 2, name: "Brasil", flagEmoji: "🇧🇷" },
        ]}
      />
    );
    expect(screen.getByText("Equipo local")).toBeInTheDocument();
    expect(screen.getByText("Equipo visitante")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Asignar" })).toBeInTheDocument();
    // Cada equipo aparece como opción en ambos selectores.
    expect(screen.getAllByRole("option", { name: "Argentina" })).toHaveLength(2);
  });
});
