import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma");
vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
// redirect() en Next lanza para cortar la ejecución; lo replicamos.
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { prismaMock } from "@/test/prisma-mock";
import { makeGroup } from "@/test/factories";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  createGroup,
  joinGroup,
  leaveGroup,
} from "./groups";

const authMock = vi.mocked(auth);

function loginAs(id = "user_1") {
  authMock.mockResolvedValue({ user: { id } } as never);
}

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.set(k, v);
  return fd;
}

describe("createGroup", () => {
  it("reintenta cuando el código único colisiona (P2002) y luego redirige", async () => {
    loginAs("owner_1");
    prismaMock.group.create
      .mockRejectedValueOnce({ code: "P2002" })
      .mockResolvedValueOnce(makeGroup({ id: "grp_x", ownerId: "owner_1" }));

    await expect(createGroup(undefined, form({ name: "Mi Grupo" }))).rejects.toThrow(
      "REDIRECT:/groups/grp_x"
    );
    expect(prismaMock.group.create).toHaveBeenCalledTimes(2);
    expect(redirect).toHaveBeenCalledWith("/groups/grp_x");
  });

  it("rechaza un nombre demasiado corto sin tocar la BD", async () => {
    loginAs();
    const res = await createGroup(undefined, form({ name: "ab" }));
    expect(res).toMatchObject({ error: expect.stringContaining("al menos 3") });
    expect(prismaMock.group.create).not.toHaveBeenCalled();
  });
});

describe("joinGroup", () => {
  it("rechaza un código con longitud distinta de 6", async () => {
    loginAs();
    const res = await joinGroup(undefined, form({ code: "ABC" }));
    expect(res).toEqual({ error: "El código debe tener 6 caracteres" });
    expect(prismaMock.group.findUnique).not.toHaveBeenCalled();
  });

  it("rechaza si no existe un grupo con ese código", async () => {
    loginAs();
    prismaMock.group.findUnique.mockResolvedValue(null);
    const res = await joinGroup(undefined, form({ code: "ZZZ999" }));
    expect(res).toEqual({ error: "No existe ningún grupo con ese código" });
  });

  it("normaliza el código, agrega al miembro y redirige", async () => {
    loginAs("user_7");
    prismaMock.group.findUnique.mockResolvedValue(makeGroup({ id: "grp_1" }));
    prismaMock.groupMember.upsert.mockResolvedValue({} as never);

    await expect(
      joinGroup(undefined, form({ code: " abc234 " }))
    ).rejects.toThrow("REDIRECT:/groups/grp_1");

    // El código se recorta y pasa a mayúsculas antes de buscar.
    expect(prismaMock.group.findUnique).toHaveBeenCalledWith({ where: { code: "ABC234" } });
    expect(prismaMock.groupMember.upsert).toHaveBeenCalledWith({
      where: { userId_groupId: { userId: "user_7", groupId: "grp_1" } },
      update: {},
      create: { userId: "user_7", groupId: "grp_1" },
    });
  });
});

describe("leaveGroup", () => {
  it("el dueño no puede abandonar su propio grupo", async () => {
    loginAs("owner_1");
    prismaMock.group.findUnique.mockResolvedValue(makeGroup({ id: "grp_1", ownerId: "owner_1" }));

    await leaveGroup("grp_1");

    expect(prismaMock.groupMember.deleteMany).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("un miembro normal sí puede salir", async () => {
    loginAs("member_2");
    prismaMock.group.findUnique.mockResolvedValue(makeGroup({ id: "grp_1", ownerId: "owner_1" }));
    prismaMock.groupMember.deleteMany.mockResolvedValue({ count: 1 } as never);

    await expect(leaveGroup("grp_1")).rejects.toThrow("REDIRECT:/");
    expect(prismaMock.groupMember.deleteMany).toHaveBeenCalledWith({
      where: { userId: "member_2", groupId: "grp_1" },
    });
  });
});
