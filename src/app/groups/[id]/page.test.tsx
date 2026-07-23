import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/prisma");
vi.mock("@/lib/session", () => ({ getSession: vi.fn() }));
vi.mock("@/lib/queries", () => ({
  getGroupLeaderboard: vi.fn(),
  getGroupPointsMatrix: vi.fn(),
}));
vi.mock("@/lib/actions/groups", () => ({
  deleteGroup: vi.fn(),
  leaveGroup: vi.fn(),
  removeMember: vi.fn(),
  setGroupValidFrom: vi.fn(),
}));
vi.mock("@/lib/actions/predictions", () => ({ getMemberPredictions: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

import { prismaMock } from "@/test/prisma-mock";
import { getSession } from "@/lib/session";
import { getGroupLeaderboard, getGroupPointsMatrix } from "@/lib/queries";
import GroupPage from "./page";

const sessionMock = vi.mocked(getSession);
const params = (id: string) => Promise.resolve({ id });

describe("GroupPage", () => {
  it("redirige a /login sin sesión", async () => {
    sessionMock.mockResolvedValue(null as never);
    await expect(GroupPage({ params: params("g1") })).rejects.toThrow("REDIRECT:/login");
  });

  it("muestra un aviso si el usuario no pertenece al grupo", async () => {
    sessionMock.mockResolvedValue({ user: { id: "u2" } } as never);
    prismaMock.group.findUnique.mockResolvedValue({
      id: "g1", name: "X", code: "ABC234", ownerId: "o", owner: { id: "o", name: "Ana" },
    } as never);
    prismaMock.groupMember.findUnique.mockResolvedValue(null);

    render(await GroupPage({ params: params("g1") }));
    expect(screen.getByText("No perteneces a este grupo.")).toBeInTheDocument();
  });

  it("muestra el grupo, el código y la tabla para el dueño", async () => {
    sessionMock.mockResolvedValue({ user: { id: "owner1" } } as never);
    prismaMock.group.findUnique.mockResolvedValue({
      id: "g1", name: "Los Cracks", code: "ABC234", ownerId: "owner1",
      owner: { id: "owner1", name: "Ana" },
    } as never);
    prismaMock.groupMember.findUnique.mockResolvedValue({ userId: "owner1", groupId: "g1" } as never);
    vi.mocked(getGroupLeaderboard).mockResolvedValue({
      rows: [{ userId: "owner1", name: "Ana", points: 9, exactCount: 2, predictionCount: 5 }],
      validFrom: null,
    });
    vi.mocked(getGroupPointsMatrix).mockResolvedValue({ matches: [], points: new Map() });

    render(await GroupPage({ params: params("g1") }));

    expect(screen.getByRole("heading", { name: "Los Cracks" })).toBeInTheDocument();
    expect(screen.getByText("ABC234")).toBeInTheDocument();
    // El nombre del miembro se muestra como botón (abre sus predicciones).
    expect(screen.getByRole("button", { name: "Ana" })).toBeInTheDocument();
    // El dueño ve la acción de eliminar.
    expect(screen.getByText("Eliminar grupo")).toBeInTheDocument();
  });
});
