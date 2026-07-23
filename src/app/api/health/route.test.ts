import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/prisma");
// NextResponse.json real arrastra el runtime de Next; lo sustituimos por un
// objeto simple {body, status} para poder aseverar el cuerpo y el código.
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    }),
  },
}));

import { prismaMock } from "@/test/prisma-mock";
import { GET } from "./route";

afterEach(() => vi.restoreAllMocks());

describe("GET /api/health", () => {
  it("responde ok (200) cuando la BD es alcanzable", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ "?column?": 1 }] as never);
    const res = await GET();
    expect(res).toEqual({ body: { status: "ok" }, status: 200 });
  });

  it("responde 503 y registra el error cuando la BD falla", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.$queryRaw.mockRejectedValue(new Error("connection refused"));

    const res = await GET();

    expect(res).toEqual({
      body: { status: "error", db: "unreachable" },
      status: 503,
    });
    expect(spy).toHaveBeenCalled();
  });
});
