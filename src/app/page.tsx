import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KickoffTime } from "@/components/kickoff-time";
import { TeamLabel } from "@/components/team-label";

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
      take: 5,
      include: { homeTeam: true, awayTeam: true },
    }),
  ]);

  const predictions = await prisma.prediction.findMany({
    where: { userId, matchId: { in: upcoming.map((m) => m.id) } },
  });
  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Mis grupos</h1>
          <div className="flex gap-2">
            <Link
              href="/groups/new"
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Crear grupo
            </Link>
            <Link
              href="/groups/join"
              className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Unirme con código
            </Link>
          </div>
        </div>
        {memberships.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-700 p-6 text-center text-zinc-400">
            Aún no perteneces a ningún grupo. Crea uno o únete con un código.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ group }) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 hover:border-emerald-600"
              >
                <h2 className="font-semibold text-white">{group.name}</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {group._count.members}{" "}
                  {group._count.members === 1 ? "miembro" : "miembros"} · admin:{" "}
                  {group.owner.name}
                </p>
                <p className="mt-2 font-mono text-sm tracking-widest text-emerald-400">
                  {group.code}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Próximos partidos</h2>
          <Link href="/matches" className="text-sm text-emerald-400 hover:underline">
            Ver todos y predecir →
          </Link>
        </div>
        <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
          {upcoming.map((m) => {
            const p = predictionByMatch.get(m.id);
            return (
              <li key={m.id} className="flex items-center justify-between gap-4 p-3">
                <div>
                  <p className="text-sm text-white">
                    <TeamLabel team={m.homeTeam} placeholder={m.homePlaceholder} />{" "}
                    <span className="text-zinc-500">vs</span>{" "}
                    <TeamLabel team={m.awayTeam} placeholder={m.awayPlaceholder} />
                  </p>
                  <p className="text-xs text-zinc-500">
                    <KickoffTime date={m.kickoff} /> · {m.venue}
                  </p>
                </div>
                {p ? (
                  <span className="rounded bg-zinc-800 px-2 py-1 font-mono text-sm text-emerald-400">
                    {p.homeScore}-{p.awayScore}
                  </span>
                ) : (
                  <span className="text-xs text-amber-400">Sin predicción</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
