import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KickoffTime } from "@/components/kickoff-time";
import { PredictionForm } from "@/components/prediction-form";
import { TeamLabel } from "@/components/team-label";
import {
  STAGE_LABELS,
  STAGE_ORDER,
  type MatchWithTeams,
} from "@/lib/match-utils";
import type { Prediction } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function MatchRow({
  match,
  prediction,
}: {
  match: MatchWithTeams;
  prediction?: Prediction;
}) {
  const locked = match.kickoff <= new Date();
  const finished = match.status === "FINISHED";

  return (
    <li className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm text-white">
          <span className="mr-2 text-xs text-slate-600">P{match.matchNumber}</span>
          <TeamLabel team={match.homeTeam} placeholder={match.homePlaceholder} />{" "}
          {finished ? (
            <span className="mx-1 rounded bg-slate-800 px-2 py-0.5 font-mono text-white">
              {match.homeScore}-{match.awayScore}
            </span>
          ) : (
            <span className="text-slate-500">vs</span>
          )}{" "}
          <TeamLabel team={match.awayTeam} placeholder={match.awayPlaceholder} />
        </p>
        <p className="text-xs text-slate-500">
          <KickoffTime date={match.kickoff} /> · {match.venue}
        </p>
      </div>
      <div className="shrink-0">
        {!locked && !finished && match.homeTeamId && match.awayTeamId ? (
          <PredictionForm
            matchId={match.id}
            initialHome={prediction?.homeScore}
            initialAway={prediction?.awayScore}
          />
        ) : !locked && !finished ? (
          <span className="text-xs text-slate-500">
            Disponible cuando se definan los equipos
          </span>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            {prediction ? (
              <span className="font-mono text-slate-300">
                Mi predicción: {prediction.homeScore}-{prediction.awayScore}
              </span>
            ) : (
              <span className="text-slate-500">Sin predicción</span>
            )}
            {finished && prediction?.points != null && (
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  prediction.points === 3
                    ? "bg-sky-700 text-white"
                    : prediction.points === 1
                      ? "bg-violet-700 text-white"
                      : "bg-slate-800 text-slate-400"
                }`}
              >
                {prediction.points} pts
              </span>
            )}
            {!finished && <span className="text-xs text-violet-400">En juego</span>}
          </div>
        )}
      </div>
    </li>
  );
}

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
  const byTime = view === "time";
  const hideFinished = hidePast !== "0";
  const now = new Date();

  const [allMatches, predictions] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.prediction.findMany({ where: { userId: session.user.id } }),
  ]);
  const matches = hideFinished
    ? allMatches.filter((m) => m.kickoff > now)
    : allMatches;
  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));

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

      {byTime ? (
        <TimeView matches={matches} predictionByMatch={predictionByMatch} />
      ) : (
        <GroupView matches={matches} predictionByMatch={predictionByMatch} />
      )}
    </div>
  );
}

function GroupView({
  matches,
  predictionByMatch,
}: {
  matches: MatchWithTeams[];
  predictionByMatch: Map<number, Prediction>;
}) {
  return (
    <>
      {STAGE_ORDER.map((stage) => {
        const stageMatches = matches.filter((m) => m.stage === stage);
        if (stageMatches.length === 0) return null;

        if (stage === "GROUP") {
          const letters = [...new Set(stageMatches.map((m) => m.groupLetter))].sort();
          return (
            <section key={stage}>
              <h2 className="mb-2 text-lg font-semibold text-sky-400">
                {STAGE_LABELS[stage]}
              </h2>
              <div className="space-y-4">
                {letters.map((letter) => (
                  <details
                    key={letter}
                    className="rounded-lg border border-slate-800 bg-slate-900"
                    open={letter === "A"}
                  >
                    <summary className="cursor-pointer p-3 font-medium text-white">
                      Grupo {letter}
                    </summary>
                    <ul className="divide-y divide-slate-800 border-t border-slate-800">
                      {stageMatches
                        .filter((m) => m.groupLetter === letter)
                        .map((m) => (
                          <MatchRow
                            key={m.id}
                            match={m}
                            prediction={predictionByMatch.get(m.id)}
                          />
                        ))}
                    </ul>
                  </details>
                ))}
              </div>
            </section>
          );
        }

        return (
          <section key={stage}>
            <h2 className="mb-2 text-lg font-semibold text-sky-400">
              {STAGE_LABELS[stage]}
            </h2>
            <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
              {stageMatches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  prediction={predictionByMatch.get(m.id)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function TimeView({
  matches,
  predictionByMatch,
}: {
  matches: MatchWithTeams[];
  predictionByMatch: Map<number, Prediction>;
}) {
  const sorted = [...matches].sort(
    (a, b) => a.kickoff.getTime() - b.kickoff.getTime()
  );

  const byDay = new Map<string, MatchWithTeams[]>();
  for (const m of sorted) {
    const key = m.kickoff.toLocaleDateString("es", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(m);
  }

  return (
    <>
      {[...byDay.entries()].map(([day, dayMatches]) => (
        <section key={day}>
          <h2 className="mb-2 text-base font-semibold capitalize text-sky-400">
            {day}
          </h2>
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
            {dayMatches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                prediction={predictionByMatch.get(m.id)}
              />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
