import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { UpcomingMatches } from "@/components/upcoming-matches";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [memberships, upcoming] = await Promise.all([
    prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true } },
            owner: { select: { name: true } },
          },
        },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.match.findMany({
      where: { kickoff: { gt: new Date() } },
      orderBy: { kickoff: "asc" },
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);

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
      prediction: p ? { homeScore: p.homeScore, awayScore: p.awayScore } : null,
    };
  });

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Mis grupos</h1>
          <div className="flex gap-2">
            <Link
              href="/groups/new"
              className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
            >
              Crear grupo
            </Link>
            <Link
              href="/groups/join"
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Unirme con código
            </Link>
          </div>
        </div>
        {memberships.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-slate-400">
            Aún no perteneces a ningún grupo. Crea uno o únete con un código.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ group }) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-sky-600"
              >
                <h2 className="font-semibold text-white">{group.name}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {group._count.members}{" "}
                  {group._count.members === 1 ? "miembro" : "miembros"} · admin:{" "}
                  {group.owner.name}
                </p>
                <p className="mt-2 font-mono text-sm tracking-widest text-sky-400">
                  {group.code}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Partidos por jugar</h2>
          <Link href="/matches" className="text-sm text-sky-400 hover:underline">
            Ver todos y predecir →
          </Link>
        </div>
        <UpcomingMatches matches={upcomingMatches} />
      </section>
    </div>
  );
}
