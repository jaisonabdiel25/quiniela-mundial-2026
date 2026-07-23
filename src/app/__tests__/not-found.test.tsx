import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "../not-found";

describe("NotFound (404)", () => {
  it("muestra el mensaje de página no encontrada", () => {
    render(<NotFound />);
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Página no encontrada" })
    ).toBeInTheDocument();
  });

  it("ofrece enlaces al inicio y a los partidos", () => {
    render(<NotFound />);
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Ver partidos" })).toHaveAttribute(
      "href",
      "/matches"
    );
  });
});
