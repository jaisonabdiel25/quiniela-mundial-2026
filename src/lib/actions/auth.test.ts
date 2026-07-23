import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");
vi.mock("@/auth", () => ({ signIn: vi.fn(), signOut: vi.fn() }));
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
}));
// Evita cargar los internals reales de next-auth (que requieren el runtime de Next).
vi.mock("next-auth", () => ({ AuthError: class AuthError extends Error {} }));

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prismaMock } from "@/test/prisma-mock";
import { makeUser } from "@/test/factories";
import { signIn, signOut } from "@/auth";
import { register, authenticate, logout } from "./auth";

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("register", () => {
  it("rechaza datos inválidos sin tocar la BD", async () => {
    const res = await register(undefined, form({ name: "A", email: "x", password: "123" }));
    expect(res).toMatchObject({ error: expect.any(String) });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rechaza si el correo ya existe", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());
    const res = await register(
      undefined,
      form({ name: "Ana", email: "ana@correo.com", password: "secreta" })
    );
    expect(res).toEqual({ error: "Ya existe una cuenta con ese correo" });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("crea el usuario (correo en minúsculas) e inicia sesión", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashed" as never);
    prismaMock.user.create.mockResolvedValue(makeUser());

    await register(
      undefined,
      form({ name: "Ana", email: "ANA@Correo.com", password: "secreta" })
    );

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: { name: "Ana", email: "ana@correo.com", passwordHash: "hashed" },
    });
    expect(signIn).toHaveBeenCalledWith("credentials", {
      email: "ana@correo.com",
      password: "secreta",
      redirectTo: "/",
    });
  });
});

describe("authenticate", () => {
  it("devuelve error de credenciales cuando signIn lanza AuthError", async () => {
    vi.mocked(signIn).mockRejectedValue(new AuthError("bad"));

    const res = await authenticate(
      undefined,
      form({ email: "ana@correo.com", password: "mala" })
    );
    expect(res).toEqual({ error: "Correo o contraseña incorrectos" });
  });

  it("relanza errores que no son de auth (p.ej. la redirección de Next)", async () => {
    vi.mocked(signIn).mockRejectedValue(new Error("NEXT_REDIRECT"));
    await expect(
      authenticate(undefined, form({ email: "ana@correo.com", password: "ok" }))
    ).rejects.toThrow("NEXT_REDIRECT");
  });
});

describe("logout", () => {
  it("cierra sesión y redirige a /login", async () => {
    await logout();
    expect(signOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});
