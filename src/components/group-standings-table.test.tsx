import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GroupStandings, TeamStanding } from "@/lib/queries";
import { GroupStandingsTable } from "./group-standings-table";

function team(over: Partial<TeamStanding> & { teamId: number; name: string }): TeamStanding {
  return {
    fifaCode: "AAA",
    played: 3,
    won: 2,
    drawn: 1,
    lost: 0,
    goalsFor: 5,
    goalsAgainst: 2,
    goalDiff: 3,
    points: 7,
    ...over,
  };
}

describe("GroupStandingsTable", () => {
  it("renderiza cada equipo con su posición y puntos", () => {
    const group: GroupStandings = {
      letter: "A",
      teams: [
        team({ teamId: 1, name: "Argentina", fifaCode: "ARG", points: 9, goalDiff: 4 }),
        team({ teamId: 2, name: "Brasil", fifaCode: "BRA", points: 6, goalDiff: -1 }),
      ],
    };
    render(<GroupStandingsTable group={group} />);

    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(screen.getByText("Brasil")).toBeInTheDocument();
    // Diferencia de goles con signo (valores únicos en la tabla).
    expect(screen.getByText("+4")).toBeInTheDocument();
    expect(screen.getByText("-1")).toBeInTheDocument();
    // Puntos de cada equipo.
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
});
