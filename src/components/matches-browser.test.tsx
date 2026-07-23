import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// MatchRow anida PredictionForm (para partidos abiertos): mockeamos su acción.
vi.mock("@/lib/actions/predictions", () => ({ savePrediction: vi.fn() }));

import { MatchesBrowser, type BrowserMatch } from "./matches-browser";

function match(over: Partial<BrowserMatch> & { id: number }): BrowserMatch {
  return {
    matchNumber: over.id,
    stage: "GROUP",
    groupLetter: "A",
    kickoff: "2026-06-11T18:00:00Z", // pasado (hoy es 2026-07-22) → bloqueado
    venue: "Estadio",
    status: "FINISHED",
    homeScore: null,
    awayScore: null,
    homeTeamId: 1,
    awayTeamId: 2,
    homeTeam: { name: "Argentina", fifaCode: "ARG" },
    awayTeam: { name: "Brasil", fifaCode: "BRA" },
    homePlaceholder: null,
    awayPlaceholder: null,
    prediction: null,
    ...over,
  };
}

describe("MatchesBrowser", () => {
  it("muestra los partidos y el marcador de los finalizados (vista por hora)", () => {
    render(
      <MatchesBrowser
        matches={[match({ id: 1, homeScore: 2, awayScore: 1 })]}
        view="time"
      />
    );
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("Brasil")).toBeInTheDocument();
    expect(screen.getByText("2-1")).toBeInTheDocument();
  });

  it("agrupa por grupo en la vista de grupos", () => {
    render(
      <MatchesBrowser
        matches={[match({ id: 1, groupLetter: "A", homeScore: 0, awayScore: 0 })]}
        view="group"
      />
    );
    expect(screen.getByText("Grupo A")).toBeInTheDocument();
    expect(screen.getByText("Argentina")).toBeInTheDocument();
  });

  it("muestra un mensaje cuando no hay partidos", () => {
    render(<MatchesBrowser matches={[]} view="time" />);
    expect(
      screen.getByText("No hay partidos para mostrar con los filtros actuales.")
    ).toBeInTheDocument();
  });
});
