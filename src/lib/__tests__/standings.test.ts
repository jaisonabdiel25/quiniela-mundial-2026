import { describe, it, expect } from "vitest";
import { compareStandings, compareLeaderboard } from "../standings";

const team = (over: Partial<Parameters<typeof compareStandings>[0]> = {}) => ({
  points: 0,
  goalDiff: 0,
  goalsFor: 0,
  name: "",
  ...over,
});

describe("compareStandings", () => {
  it("ordena por puntos primero (descendente)", () => {
    const list = [team({ name: "A", points: 3 }), team({ name: "B", points: 6 })];
    expect(list.sort(compareStandings).map((t) => t.name)).toEqual(["B", "A"]);
  });

  it("desempata por diferencia de goles", () => {
    const list = [
      team({ name: "A", points: 3, goalDiff: 1 }),
      team({ name: "B", points: 3, goalDiff: 4 }),
    ];
    expect(list.sort(compareStandings).map((t) => t.name)).toEqual(["B", "A"]);
  });

  it("desempata por goles a favor cuando puntos y diferencia empatan", () => {
    const list = [
      team({ name: "A", points: 3, goalDiff: 1, goalsFor: 2 }),
      team({ name: "B", points: 3, goalDiff: 1, goalsFor: 5 }),
    ];
    expect(list.sort(compareStandings).map((t) => t.name)).toEqual(["B", "A"]);
  });

  it("desempata por nombre alfabético como último criterio", () => {
    const list = [
      team({ name: "Uruguay", points: 3, goalDiff: 1, goalsFor: 2 }),
      team({ name: "Brasil", points: 3, goalDiff: 1, goalsFor: 2 }),
    ];
    expect(list.sort(compareStandings).map((t) => t.name)).toEqual([
      "Brasil",
      "Uruguay",
    ]);
  });
});

describe("compareLeaderboard", () => {
  it("ordena por puntos primero (descendente)", () => {
    const list = [
      { name: "A", points: 10, exactCount: 5 },
      { name: "B", points: 12, exactCount: 1 },
    ];
    expect(list.sort(compareLeaderboard).map((r) => r.name)).toEqual(["B", "A"]);
  });

  it("desempata por cantidad de marcadores exactos", () => {
    const list = [
      { name: "A", points: 10, exactCount: 2 },
      { name: "B", points: 10, exactCount: 4 },
    ];
    expect(list.sort(compareLeaderboard).map((r) => r.name)).toEqual(["B", "A"]);
  });
});
