import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Health check público (el middleware excluye /api). Verifica que la app
// responde y que la BD es alcanzable. Útil para el health check de Railway
// —evita enrutar tráfico a un contenedor que aún no puede consultar la BD—
// y para diagnosticar caídas intermitentes.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[health] fallo al consultar la BD:", err);
    return NextResponse.json(
      { status: "error", db: "unreachable" },
      { status: 503 }
    );
  }
}
