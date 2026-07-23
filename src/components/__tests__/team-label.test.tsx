import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamFlag, TeamLabel } from "../team-label";

describe("TeamFlag", () => {
  it("renderiza la bandera con la clase ISO correspondiente al código FIFA", () => {
    const { container } = render(<TeamFlag fifaCode="ARG" />);
    expect(container.querySelector("span.fi-ar")).toBeInTheDocument();
  });

  it("no renderiza nada si el código FIFA no está mapeado", () => {
    const { container } = render(<TeamFlag fifaCode="ZZZ" />);
    expect(container.firstChild).toBeNull();
  });
});

describe("TeamLabel", () => {
  it("muestra el placeholder cuando no hay equipo asignado", () => {
    render(<TeamLabel team={null} placeholder="1° Grupo A" />);
    expect(screen.getByText("1° Grupo A")).toBeInTheDocument();
  });

  it('cae a "Por definir" cuando no hay equipo ni placeholder', () => {
    render(<TeamLabel team={null} placeholder={null} />);
    expect(screen.getByText("Por definir")).toBeInTheDocument();
  });

  it("muestra el nombre y la bandera cuando hay equipo", () => {
    const { container } = render(
      <TeamLabel team={{ name: "Argentina", fifaCode: "ARG" }} placeholder={null} />
    );
    expect(screen.getByText("Argentina")).toBeInTheDocument();
    expect(container.querySelector("span.fi-ar")).toBeInTheDocument();
  });
});
