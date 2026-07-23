import { describe, it, expect, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/auth";
import { getSession } from "./session";

describe("getSession", () => {
  it("delega la lectura de sesión en auth() y devuelve su resultado", async () => {
    const session = { user: { id: "u1", role: "USER" } };
    vi.mocked(auth).mockResolvedValue(session as never);

    await expect(getSession()).resolves.toBe(session);
    expect(auth).toHaveBeenCalled();
  });
});
