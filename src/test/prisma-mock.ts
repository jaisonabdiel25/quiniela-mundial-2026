import { beforeEach } from "vitest";
import { mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// El mismo objeto que devuelve el mock de "@/lib/prisma", pero tipado como
// mock para poder configurar retornos (.mockResolvedValue, etc.) en los tests.
// Importa este helper en un archivo que ya haya llamado vi.mock("@/lib/prisma").
export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

// Limpia los mocks entre tests para que no se filtre estado.
beforeEach(() => {
  mockReset(prismaMock);
});
