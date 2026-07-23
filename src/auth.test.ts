import { describe, it, expect, vi } from "vitest";

type Authorize = (creds: Record<string, unknown> | undefined) => Promise<unknown>;
type Config = { providers: { authorize: Authorize }[] };

// Mockea la capa de datos y bcrypt; captura la config que auth.ts pasa a NextAuth
// para poder invocar el callback `authorize` del provider Credentials en aislado.
// `vi.hoisted` inicializa el contenedor antes de que corra la factory izada.
vi.mock("@/lib/prisma");
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }));

const captured = vi.hoisted(() => ({ config: undefined as Config | undefined }));
vi.mock("next-auth", () => ({
  default: (config: Config) => {
    captured.config = config;
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  },
}));
// Credentials() normalmente envuelve las opciones; aquí las devolvemos tal cual
// para leer directamente `authorize`.
vi.mock("next-auth/providers/credentials", () => ({
  default: (opts: unknown) => opts,
}));

import bcrypt from "bcryptjs";
import { prismaMock } from "@/test/prisma-mock";
import { makeUser } from "@/test/factories";
import "@/auth"; // ejecuta NextAuth(...) al cargar y captura la config

const authorize = captured.config!.providers[0].authorize;

describe("auth Credentials.authorize", () => {
  it("rechaza credenciales con formato inválido sin tocar la BD", async () => {
    expect(await authorize({ email: "no-es-correo", password: "x" })).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("rechaza contraseña vacía", async () => {
    expect(await authorize({ email: "ana@correo.com", password: "" })).toBeNull();
    expect(prismaMock.user.findUnique).not.toHaveBeenCalled();
  });

  it("devuelve null si el usuario no existe (sin comparar hash)", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    expect(await authorize({ email: "ana@correo.com", password: "secreta" })).toBeNull();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("devuelve null si la contraseña no coincide", async () => {
    prismaMock.user.findUnique.mockResolvedValue(makeUser());
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    expect(await authorize({ email: "ana@correo.com", password: "mala" })).toBeNull();
  });

  it("busca el correo normalizado a minúsculas", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    await authorize({ email: "ANA@Correo.com", password: "secreta" });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: "ana@correo.com" },
    });
  });

  it("devuelve id, name, email y role con credenciales válidas", async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      makeUser({ id: "u9", name: "Ana", email: "ana@correo.com", role: "ADMIN" })
    );
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const res = await authorize({ email: "ana@correo.com", password: "secreta" });
    expect(res).toEqual({ id: "u9", name: "Ana", email: "ana@correo.com", role: "ADMIN" });
  });
});
