import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/prisma");
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
// Stub del hijo cliente (decide visibilidad por ruta): solo verificamos el mapeo.
vi.mock("@/components/my-groups-bar", () => ({
  MyGroupsBar: ({ groups }: { groups: { id: string; name: string }[] }) => (
    <div>{groups.map((g) => <span key={g.id}>{g.name}</span>)}</div>
  ),
}));

import { prismaMock } from "@/test/prisma-mock";
import { getSession } from "@/lib/session";
import { MyGroups } from "../my-groups";

const sessionMock = vi.mocked(getSession);

describe("MyGroups", () => {
  it("devuelve null si no hay sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    expect(await MyGroups()).toBeNull();
  });

  it("mapea las membresías y las pasa a la barra", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u1" } } as never);
    prismaMock.groupMember.findMany.mockResolvedValue([
      {
        group: {
          id: "g1",
          name: "Oficina 2026",
          code: "ABC234",
          _count: { members: 3 },
          owner: { name: "Ana" },
        },
      },
    ] as never);

    render(await MyGroups());

    expect(screen.getByText("Oficina 2026")).toBeInTheDocument();
  });
});
