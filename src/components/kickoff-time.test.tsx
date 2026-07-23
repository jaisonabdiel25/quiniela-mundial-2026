import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { KickoffTime } from "./kickoff-time";

describe("KickoffTime", () => {
  it("renderiza un <time> con el instante UTC en el atributo dateTime", () => {
    const date = "2026-06-11T20:00:00Z";
    const { container } = render(<KickoffTime date={date} />);
    const time = container.querySelector("time");
    expect(time).toBeInTheDocument();
    expect(time!.getAttribute("dateTime")).toBe(new Date(date).toISOString());
  });

  it("muestra la fecha en hora de Panamá (UTC-5), no en UTC", () => {
    // 02:00 UTC del día 12 es todavía el día 11 a las 21:00 en Panamá.
    const { container } = render(<KickoffTime date="2026-06-12T02:00:00Z" />);
    const text = container.querySelector("time")!.textContent ?? "";
    expect(text).toContain("11");
    expect(text).not.toContain("12");
  });

  it("acepta un objeto Date además de un string", () => {
    const d = new Date("2026-06-11T20:00:00Z");
    const { container } = render(<KickoffTime date={d} />);
    expect(container.querySelector("time")!.getAttribute("dateTime")).toBe(d.toISOString());
  });
});
