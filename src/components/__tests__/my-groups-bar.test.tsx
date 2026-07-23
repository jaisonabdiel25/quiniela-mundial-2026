import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

import { usePathname } from "next/navigation";
import { MyGroupsBar, type GroupCard } from "../my-groups-bar";

const pathMock = vi.mocked(usePathname);

function card(id: string, name: string): GroupCard {
  return { id, name, code: "ABC234", memberCount: 2, ownerName: "Ana" };
}

describe("MyGroupsBar", () => {
  it("muestra las tarjetas de los grupos con acciones", () => {
    pathMock.mockReturnValue("/");
    render(<MyGroupsBar groups={[card("g1", "Oficina 2026")]} />);
    expect(screen.getByText("Oficina 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Crear grupo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Unirme con código" })).toBeInTheDocument();
  });

  it("muestra un mensaje cuando no hay grupos", () => {
    pathMock.mockReturnValue("/");
    render(<MyGroupsBar groups={[]} />);
    expect(
      screen.getByText("Aún no perteneces a ningún grupo. Crea uno o únete con un código.")
    ).toBeInTheDocument();
  });

  it("oculta el grupo actual cuando se está en su página", () => {
    pathMock.mockReturnValue("/groups/g1");
    render(<MyGroupsBar groups={[card("g1", "Uno"), card("g2", "Dos")]} />);
    expect(screen.queryByText("Uno")).not.toBeInTheDocument();
    expect(screen.getByText("Dos")).toBeInTheDocument();
  });
});
