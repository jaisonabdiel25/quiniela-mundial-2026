import { describe, it, expect } from "vitest";
// Importa por el alias "@/" a propósito, para verificar que Vitest resuelve
// los paths de tsconfig igual que la app.
import { scoreSchema } from "@/lib/validation";

describe("scoreSchema", () => {
  it("acepta los límites válidos 0 y 99", () => {
    expect(scoreSchema.safeParse("0")).toMatchObject({ success: true, data: 0 });
    expect(scoreSchema.safeParse("99")).toMatchObject({ success: true, data: 99 });
  });

  it("coacciona strings numéricos a número", () => {
    expect(scoreSchema.safeParse("3")).toMatchObject({ success: true, data: 3 });
  });

  it("rechaza negativos", () => {
    expect(scoreSchema.safeParse("-1").success).toBe(false);
  });

  it("rechaza valores mayores a 99", () => {
    expect(scoreSchema.safeParse("100").success).toBe(false);
  });

  it("rechaza decimales", () => {
    expect(scoreSchema.safeParse("1.5").success).toBe(false);
  });

  it("rechaza valores no numéricos (coacciona a NaN)", () => {
    expect(scoreSchema.safeParse("abc").success).toBe(false);
    expect(scoreSchema.safeParse("1,5").success).toBe(false);
  });

  it("coacciona el string vacío a 0 (comportamiento de z.coerce.number)", () => {
    // Nota: el schema hereda esta coacción; el formulario nunca envía vacío
    // porque el input es type=number y requerido.
    expect(scoreSchema.safeParse("")).toMatchObject({ success: true, data: 0 });
  });
});
