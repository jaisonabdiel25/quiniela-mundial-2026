import { describe, it, expect } from "vitest";
import { FIFA_TO_ISO } from "../flags";

describe("FIFA_TO_ISO", () => {
  const values = Object.values(FIFA_TO_ISO);

  it("todos los valores tienen forma de código ISO en minúsculas", () => {
    // alfa-2 (mx) o subdivisión de Reino Unido (gb-sct)
    for (const iso of values) {
      expect(iso).toMatch(/^[a-z]{2}(-[a-z]{3})?$/);
    }
  });

  it("mapea Escocia e Inglaterra a sus códigos de subdivisión", () => {
    expect(FIFA_TO_ISO.SCO).toBe("gb-sct");
    expect(FIFA_TO_ISO.ENG).toBe("gb-eng");
  });

  it("no tiene códigos ISO duplicados", () => {
    expect(new Set(values).size).toBe(values.length);
  });
});
