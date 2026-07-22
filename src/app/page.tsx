import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { UpcomingMatches } from "@/components/upcoming-matches";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const now = new Date();
  // Ventana "en juego": un partido se considera en curso hasta 2.5 h tras el inicio.
  const LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000;

  const upcomingRaw = await prisma.match.findMany({
    where: { status: { not: "FINISHED" } },
    orderBy: { kickoff: "asc" },
    include: { homeTeam: true, awayTeam: true },
  });

  // Mostrar solo partidos por jugar o en juego: ocultar los finalizados y los que
  // ya pasaron su ventana en vivo. Mismo criterio que la página /matches.
  const upcoming = upcomingRaw.filter(
    (m) => m.kickoff > now || now.getTime() - m.kickoff.getTime() <= LIVE_WINDOW_MS
  );

  const predictions = await prisma.prediction.findMany({
    where: { userId, matchId: { in: upcoming.map((m) => m.id) } },
  });
  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  const upcomingMatches = upcoming.map((m) => {
    const p = predictionByMatch.get(m.id);
    return {
      id: m.id,
      homeTeam: m.homeTeam
        ? { name: m.homeTeam.name, fifaCode: m.homeTeam.fifaCode }
        : null,
      awayTeam: m.awayTeam
        ? { name: m.awayTeam.name, fifaCode: m.awayTeam.fifaCode }
        : null,
      homePlaceholder: m.homePlaceholder,
      awayPlaceholder: m.awayPlaceholder,
      kickoff: m.kickoff.toISOString(),
      venue: m.venue,
      live: m.kickoff <= now,
      prediction: p ? { homeScore: p.homeScore, awayScore: p.awayScore } : null,
    };
  });

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Partidos por jugar</h1>
          <Link href="/matches" className="text-sm text-sky-400 hover:underline">
            Ver todos y predecir →
          </Link>
        </div>
        <UpcomingMatches matches={upcomingMatches} />
      </section>
    </div>
  );
}
