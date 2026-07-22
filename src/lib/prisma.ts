import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Límite conservador de conexiones por instancia: evita agotar el `max_connections`
// del Postgres de Railway cuando dos contenedores se solapan en un despliegue.
// Ajustar si se escala a más réplicas. Timeouts cortos = fallar rápido y claro
// (en vez de colgar el request) y liberar conexiones ociosas pronto.
const adapter = new PrismaPg(
  {
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  },
  {
    // Los errores del pool son asíncronos; sin este listener un fallo de conexión
    // ociosa podría tumbar el proceso. Se registra para correlacionar con los logs.
    onPoolError: (err) => console.error("[prisma] pool error:", err),
  }
);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
