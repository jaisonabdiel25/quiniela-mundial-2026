// Mock automático de @/lib/prisma para los tests: un cliente Prisma profundo
// (todos los métodos anidados son vi.fn()). Se activa con vi.mock("@/lib/prisma").
// Nunca abre una conexión real — los tests definen los valores de retorno.
import { mockDeep } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";

export const prisma = mockDeep<PrismaClient>();
