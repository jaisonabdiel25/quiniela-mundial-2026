import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MatchesBrowser, type BrowserMatch } from "@/components/matches-browser";

export const dynamic = "force-dynamic";

function ViewToggle({
  current,
  hidePast,
}: {
  current: "group" | "time";
  hidePast: boolean;
}) {
  const base = "px-3 py-1.5 text-sm rounded-md transition-colors";
  const active = "bg-slate-700 text-white";
  const inactive = "text-slate-400 hover:text-white";
  const showParam = hidePast ? "" : "&hidePast=0";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-lg border border-slate-700 bg-slate-900 p-1">
        <Link href={`?view=group${showParam}`} className={`${base} ${current === "group" ? active : inactive}`}>
          Por grupos
        </Link>
        <Link href={`?view=time${showParam}`} className={`${base} ${current === "time" ? active : inactive}`}>
          Por hora
        </Link>
      </div>
      <Link
        href={`?view=${current}${hidePast ? "&hidePast=0" : ""}`}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
          hidePast
            ? "border-sky-700 bg-sky-950 text-sky-300"
            : "border-slate-700 bg-slate-900 text-slate-400 hover:text-white"
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-sm border ${hidePast ? "border-sky-500 bg-sky-500" : "border-slate-500"}`}>
          {hidePast && <span className="flex h-full w-full items-center justify-center text-[10px] font-bold leading-none text-white">✓</span>}
        </span>
        Ocultar pasados
      </Link>
    </div>
  );
}

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; hidePast?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { view, hidePast } = await searchParams;
  const byTime = view !== "group";
  const hideFinished = hidePast !== "0";
  const now = new Date();

  const [allMatches, predictions] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.prediction.findMany({ where: { userId: session.user.id } }),
  ]);
  // Un partido "en juego" es uno que ya inició pero no ha terminado. Lo
  // mostramos dentro de una ventana razonable tras el inicio (~2.5h).
  const LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000;
  const matches = hideFinished
    ? allMatches.filter((m) => {
        if (m.kickoff > now) return true;
        return (
          m.status !== "FINISHED" &&
          now.getTime() - m.kickoff.getTime() <= LIVE_WINDOW_MS
        );
      })
    : allMatches;
  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  const browserMatches: BrowserMatch[] = matches.map((m) => {
    const p = predictionByMatch.get(m.id);
    return {
      id: m.id,
      matchNumber: m.matchNumber,
      stage: m.stage,
      groupLetter: m.groupLetter,
      kickoff: m.kickoff.toISOString(),
      venue: m.venue,
      status: m.status,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      homeTeamId: m.homeTeamId,
      awayTeamId: m.awayTeamId,
      homeTeam: m.homeTeam
        ? { name: m.homeTeam.name, fifaCode: m.homeTeam.fifaCode }
        : null,
      awayTeam: m.awayTeam
        ? { name: m.awayTeam.name, fifaCode: m.awayTeam.fifaCode }
        : null,
      homePlaceholder: m.homePlaceholder,
      awayPlaceholder: m.awayPlaceholder,
      prediction: p
        ? { homeScore: p.homeScore, awayScore: p.awayScore, points: p.points }
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Partidos del Mundial 2026</h1>
          <p className="text-sm text-slate-400">
            Predice el marcador antes del inicio de cada partido. 3 puntos por
            marcador exacto, 1 por acertar el resultado.
          </p>
        </div>
        <ViewToggle current={byTime ? "time" : "group"} hidePast={hideFinished} />
      </div>

      <MatchesBrowser matches={browserMatches} view={byTime ? "time" : "group"} />
    </div>
  );
}
