import { describe, it, expect } from "vitest";
import {
  formatPanama,
  toPanamaDatetimeLocal,
  parsePanamaDatetimeLocal,
} from "./timezone";

describe("parsePanamaDatetimeLocal", () => {
  it("interpreta el string como hora de Panamá (UTC-5) y devuelve el instante UTC", () => {
    const date = parsePanamaDatetimeLocal("2026-06-11T18:00");
    // 18:00 en Panamá = 23:00 UTC
    expect(date?.toISOString()).toBe("2026-06-11T23:00:00.000Z");
  });

  it("acepta segundos opcionales", () => {
    const date = parsePanamaDatetimeLocal("2026-06-11T18:00:30");
    expect(date?.toISOString()).toBe("2026-06-11T23:00:00.000Z");
  });

  it("devuelve null para formato inválido", () => {
    expect(parsePanamaDatetimeLocal("")).toBeNull();
    expect(parsePanamaDatetimeLocal("no-es-fecha")).toBeNull();
    expect(parsePanamaDatetimeLocal("2026-06-11 18:00")).toBeNull();
  });

  it("devuelve null para una fecha con formato correcto pero valores imposibles", () => {
    expect(parsePanamaDatetimeLocal("2026-13-40T99:99")).toBeNull();
  });
});

describe("toPanamaDatetimeLocal", () => {
  it("convierte un instante UTC al string local de Panamá", () => {
    expect(toPanamaDatetimeLocal(new Date("2026-06-11T23:00:00Z"))).toBe(
      "2026-06-11T18:00"
    );
  });

  it("cruza correctamente la medianoche hacia el día anterior", () => {
    // 02:00 UTC = 21:00 del día anterior en Panamá
    expect(toPanamaDatetimeLocal(new Date("2026-06-11T02:00:00Z"))).toBe(
      "2026-06-10T21:00"
    );
  });
});

describe("ida y vuelta parse ↔ format", () => {
  it("preserva el valor local original (Panamá no tiene horario de verano)", () => {
    const local = "2026-12-25T08:30";
    const instant = parsePanamaDatetimeLocal(local);
    expect(instant).not.toBeNull();
    expect(toPanamaDatetimeLocal(instant!)).toBe(local);
  });
});

describe("formatPanama", () => {
  it("formatea la hora en zona de Panamá sin importar la zona del proceso", () => {
    expect(
      formatPanama("2026-06-11T23:00:00Z", {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
    ).toBe("18:00");
  });

  it("usa la fecha de Panamá al cruzar la medianoche", () => {
    // 02:00 UTC del día 11 es todavía el día 10 en Panamá (21:00).
    expect(
      formatPanama("2026-06-11T02:00:00Z", { day: "2-digit" })
    ).toBe("10");
  });
});
