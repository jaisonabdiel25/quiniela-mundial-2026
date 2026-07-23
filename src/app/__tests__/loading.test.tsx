import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import Loading from "../loading";

describe("Loading (esqueleto de Suspense)", () => {
  it("renderiza placeholders animados ocultos para lectores de pantalla", () => {
    const { container } = render(<Loading />);
    expect(container.querySelector("[aria-hidden]")).toBeInTheDocument();
    // 2 líneas de encabezado + 5 filas del listado.
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(7);
  });
});
