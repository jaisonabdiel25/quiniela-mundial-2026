import { describe, it, expect } from "vitest";
import { authConfig } from "./auth.config";

// Helper: invoca el callback authorized con un estado de auth y una ruta.
type Auth = { user?: { role?: string } } | null;
function authorize(auth: Auth, pathname: string) {
  const nextUrl = new URL(`http://localhost${pathname}`);
  return authConfig.callbacks!.authorized!({
    auth,
    request: { nextUrl },
  } as never);
}

describe("authConfig.authorized (guardia de rutas)", () => {
  it("bloquea rutas protegidas sin sesión", () => {
    expect(authorize(null, "/matches")).toBe(false);
  });

  it("permite /login y /register sin sesión", () => {
    expect(authorize(null, "/login")).toBe(true);
    expect(authorize(null, "/register")).toBe(true);
  });

  it("redirige a la home a un usuario logueado que visita /login", () => {
    const res = authorize({ user: { role: "USER" } }, "/login");
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).headers.get("location")).toBe("http://localhost/");
  });

  it("permite rutas normales a un usuario autenticado", () => {
    expect(authorize({ user: { role: "USER" } }, "/matches")).toBe(true);
  });

  it("bloquea /admin a un usuario no-admin (redirige a la home)", () => {
    const res = authorize({ user: { role: "USER" } }, "/admin");
    expect(res).toBeInstanceOf(Response);
    expect((res as Response).headers.get("location")).toBe("http://localhost/");
  });

  it("permite /admin a un ADMIN", () => {
    expect(authorize({ user: { role: "ADMIN" } }, "/admin")).toBe(true);
  });
});

describe("authConfig callbacks jwt/session", () => {
  it("jwt copia id y role del usuario al token", () => {
    const token = authConfig.callbacks!.jwt!({
      token: {},
      user: { id: "u1", role: "ADMIN" },
    } as never);
    expect(token).toMatchObject({ id: "u1", role: "ADMIN" });
  });

  it("jwt deja el token intacto si no hay user", () => {
    const token = authConfig.callbacks!.jwt!({ token: { id: "prev" } } as never);
    expect(token).toEqual({ id: "prev" });
  });

  it("session expone id y role desde el token", () => {
    const session = authConfig.callbacks!.session!({
      session: { user: {} },
      token: { id: "u1", role: "ADMIN" },
    } as never);
    expect(session.user).toMatchObject({ id: "u1", role: "ADMIN" });
  });
});
