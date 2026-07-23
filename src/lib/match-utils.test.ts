import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isLocked, scorePrediction } from "./match-utils";

describe("isLocked", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-11T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("está bloqueado si el kickoff ya pasó", () => {
    expect(isLocked({ kickoff: new Date("2026-06-11T11:00:00Z") })).toBe(true);
  });

  it("no está bloqueado si el kickoff es en el futuro", () => {
    expect(isLocked({ kickoff: new Date("2026-06-11T13:00:00Z") })).toBe(false);
  });

  it("está bloqueado si el kickoff es exactamente ahora (<=)", () => {
    expect(isLocked({ kickoff: new Date("2026-06-11T12:00:00Z") })).toBe(true);
  });
});

describe("scorePrediction", () => {
  it("da 3 puntos por marcador exacto", () => {
    expect(scorePrediction(2, 1, 2, 1)).toBe(3);
    expect(scorePrediction(0, 0, 0, 0)).toBe(3);
  });

  it("da 1 punto por acertar el resultado sin el marcador exacto", () => {
    // victoria local acertada, marcador distinto
    expect(scorePrediction(2, 0, 1, 0)).toBe(1);
    // victoria visitante acertada
    expect(scorePrediction(0, 3, 1, 2)).toBe(1);
    // empate acertado, marcador distinto
    expect(scorePrediction(1, 1, 2, 2)).toBe(1);
  });

  it("da 0 puntos cuando el resultado es incorrecto", () => {
    // predijo victoria local, fue victoria visitante
    expect(scorePrediction(0, 2, 1, 0)).toBe(0);
    // predijo empate, fue victoria local
    expect(scorePrediction(2, 0, 1, 1)).toBe(0);
  });
});
