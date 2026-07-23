import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/actions/predictions", () => ({ savePrediction: vi.fn() }));

import { savePrediction } from "@/lib/actions/predictions";
import { PredictionForm } from "./prediction-form";

describe("PredictionForm", () => {
  it("renderiza los inputs de marcador y el botón guardar", () => {
    render(<PredictionForm matchId={5} />);
    expect(screen.getByLabelText("Goles local")).toBeInTheDocument();
    expect(screen.getByLabelText("Goles visitante")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("en layout apilado muestra las etiquetas de los equipos", () => {
    render(
      <PredictionForm
        matchId={5}
        stacked
        homeLabel={<span>Local FC</span>}
        awayLabel={<span>Visita FC</span>}
      />
    );
    expect(screen.getByText("Local FC")).toBeInTheDocument();
    expect(screen.getByText("Visita FC")).toBeInTheDocument();
  });

  it("guarda la predicción para el matchId dado y muestra el ✓", async () => {
    vi.mocked(savePrediction).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<PredictionForm matchId={7} initialHome={1} initialAway={0} />);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("✓")).toBeInTheDocument();
    expect(savePrediction).toHaveBeenCalled();
    // La acción va "bindeada" con el matchId como primer argumento.
    expect(vi.mocked(savePrediction).mock.calls[0][0]).toBe(7);
  });

  it("muestra el error que devuelve la acción", async () => {
    vi.mocked(savePrediction).mockResolvedValue({
      error: "El partido ya comenzó, no puedes modificar tu predicción",
    });
    const user = userEvent.setup();
    render(<PredictionForm matchId={9} initialHome={2} initialAway={2} />);

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("El partido ya comenzó, no puedes modificar tu predicción")
    ).toBeInTheDocument();
  });
});
