import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { GroupPointsMatrix as Matrix } from "@/lib/queries";
import { GroupPointsMatrix } from "../group-points-matrix";

describe("GroupPointsMatrix", () => {
  it("muestra un mensaje cuando no hay partidos jugados", () => {
    render(<GroupPointsMatrix members={[]} matrix={{ matches: [], points: new Map() }} />);
    expect(screen.getByText("Aún no hay partidos jugados.")).toBeInTheDocument();
  });

  it("renderiza la matriz con miembros, puntos y totales", () => {
    const members = [
      { userId: "u1", name: "Ana" },
      { userId: "u2", name: "Beto" },
    ];
    const matrix: Matrix = {
      matches: [
        {
          matchId: 1,
          matchNumber: 1,
          stage: "GROUP",
          kickoff: new Date("2026-06-11T18:00:00Z"),
          finished: true,
          homeScore: 2,
          awayScore: 0,
          homeTeam: { name: "Argentina", fifaCode: "ARG" },
          awayTeam: { name: "Brasil", fifaCode: "BRA" },
          homePlaceholder: null,
          awayPlaceholder: null,
        },
      ],
      points: new Map([
        ["u1:1", 3],
        ["u2:1", 1],
      ]),
    };

    render(<GroupPointsMatrix members={members} matrix={matrix} />);

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Beto")).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("2-0")).toBeInTheDocument();
    // Ana: badge de 3 + total de 3 → dos apariciones de "3".
    expect(screen.getAllByText("3")).toHaveLength(2);
  });
});
