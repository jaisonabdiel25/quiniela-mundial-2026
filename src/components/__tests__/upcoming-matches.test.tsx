import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UpcomingMatches, type UpcomingMatch } from "../upcoming-matches";

function match(over: Partial<UpcomingMatch> & { id: number }): UpcomingMatch {
  return {
    homeTeam: { name: "Argentina", fifaCode: "ARG" },
    awayTeam: { name: "Brasil", fifaCode: "BRA" },
    homePlaceholder: null,
    awayPlaceholder: null,
    kickoff: "2027-06-11T18:00:00Z",
    venue: "Estadio Monumental",
    prediction: null,
    ...over,
  };
}

describe("UpcomingMatches", () => {
  it("muestra un estado vacío cuando no hay partidos por jugar", () => {
    render(<UpcomingMatches matches={[]} />);
    expect(screen.getByText("No hay partidos por jugar")).toBeInTheDocument();
  });

  it("lista los partidos con su predicción y enlace al detalle", () => {
    render(
      <UpcomingMatches
        matches={[match({ id: 1, prediction: { homeScore: 2, awayScore: 1 } })]}
      />
    );
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("Brasil")).toBeInTheDocument();
    expect(screen.getByText("2-1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalle" })).toBeInTheDocument();
  });
});
