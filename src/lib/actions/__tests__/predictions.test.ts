import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { prismaMock } from "@/test/prisma-mock";
import { makeMatch } from "@/test/factories";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { savePrediction } from "../predictions";

const authMock = vi.mocked(auth);

// Sesión de un usuario autenticado.
function loginAs(id = "user_1") {
  authMock.mockResolvedValue({ user: { id } } as never);
}

// FormData con los marcadores del formulario.
function scores(home: string, away: string) {
  const fd = new FormData();
  fd.set("homeScore", home);
  fd.set("awayScore", away);
  return fd;
}

const FUTURE = new Date("2100-01-01T00:00:00Z");
const PAST = new Date("2020-01-01T00:00:00Z");

describe("savePrediction", () => {
  it("rechaza si no hay sesión", async () => {
    authMock.mockResolvedValue(null as never);
    const res = await savePrediction(1, undefined, scores("2", "1"));
    expect(res).toEqual({ error: "Debes iniciar sesión" });
    expect(prismaMock.match.findUnique).not.toHaveBeenCalled();
  });

  it("rechaza marcadores inválidos", async () => {
    loginAs();
    const res = await savePrediction(1, undefined, scores("abc", "1"));
    expect(res).toEqual({ error: "Ingresa marcadores válidos (0 a 99)" });
    expect(prismaMock.prediction.upsert).not.toHaveBeenCalled();
  });

  it("rechaza si el partido no existe", async () => {
    loginAs();
    prismaMock.match.findUnique.mockResolvedValue(null);
    const res = await savePrediction(99, undefined, scores("2", "1"));
    expect(res).toEqual({ error: "El partido no existe" });
  });

  it("no permite editar un partido ya comenzado (bloqueo por kickoff)", async () => {
    loginAs();
    prismaMock.match.findUnique.mockResolvedValue(makeMatch({ id: 5, kickoff: PAST }));
    const res = await savePrediction(5, undefined, scores("2", "1"));
    expect(res).toEqual({
      error: "El partido ya comenzó, no puedes modificar tu predicción",
    });
    expect(prismaMock.prediction.upsert).not.toHaveBeenCalled();
  });

  it("guarda la predicción cuando el partido sigue abierto", async () => {
    loginAs("user_42");
    prismaMock.match.findUnique.mockResolvedValue(makeMatch({ id: 5, kickoff: FUTURE }));
    prismaMock.prediction.upsert.mockResolvedValue({} as never);

    const res = await savePrediction(5, undefined, scores("2", "1"));

    expect(res).toEqual({ ok: true });
    expect(prismaMock.prediction.upsert).toHaveBeenCalledWith({
      where: { userId_matchId: { userId: "user_42", matchId: 5 } },
      update: { homeScore: 2, awayScore: 1 },
      create: { userId: "user_42", matchId: 5, homeScore: 2, awayScore: 1 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/matches");
  });
});
