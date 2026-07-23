import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminFiltersContext, MatchList, type MatchListItem } from "../match-list";

const items: MatchListItem[] = [
  { key: 1, node: <span>Partido abierto</span>, hideable: false },
  { key: 2, node: <span>Partido jugado</span>, hideable: true },
];

function renderWith(showFinished: boolean) {
  return render(
    <AdminFiltersContext.Provider value={{ showFinished }}>
      <MatchList items={items} />
    </AdminFiltersContext.Provider>
  );
}

describe("MatchList", () => {
  it("oculta los partidos jugados por defecto y avisa cuántos oculta", () => {
    renderWith(false);
    expect(screen.getByText("Partido abierto")).toBeInTheDocument();
    expect(screen.queryByText("Partido jugado")).not.toBeInTheDocument();
    expect(screen.getByText("1 partido jugado oculto.")).toBeInTheDocument();
  });

  it("muestra todos los partidos con el filtro activo", () => {
    renderWith(true);
    expect(screen.getByText("Partido abierto")).toBeInTheDocument();
    expect(screen.getByText("Partido jugado")).toBeInTheDocument();
  });
});
