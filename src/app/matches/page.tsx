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
          <span className="mr-2 text-xs text-zinc-600">P{match.matchNumber}</span>
          <TeamLabel team={match.homeTeam} placeholder={match.homePlaceholder} />{" "}
          {finished ? (
            <span className="mx-1 rounded bg-zinc-800 px-2 py-0.5 font-mono text-white">
              {match.homeScore}-{match.awayScore}
            </span>
          ) : (
            <span className="text-zinc-500">vs</span>
          )}{" "}
          <TeamLabel team={match.awayTeam} placeholder={match.awayPlaceholder} />
        </p>
        <p className="text-xs text-zinc-500">
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
          <span className="text-xs text-zinc-500">
            Disponible cuando se definan los equipos
          </span>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            {prediction ? (
              <span className="font-mono text-zinc-300">
                Mi predicción: {prediction.homeScore}-{prediction.awayScore}
              </span>
            ) : (
              <span className="text-zinc-500">Sin predicción</span>
            )}
            {finished && prediction?.points != null && (
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  prediction.points === 3
                    ? "bg-emerald-700 text-white"
                    : prediction.points === 1
                      ? "bg-amber-700 text-white"
                      : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {prediction.points} pts
              </span>
            )}
            {!finished && <span className="text-xs text-amber-400">En juego</span>}
          </div>
        )}
      </div>
    </li>
  );
}

export default async function MatchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [matches, predictions] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.prediction.findMany({ where: { userId: session.user.id } }),
  ]);
  const predictionByMatch = new Map(predictions.map((p) => [p.matchId, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Partidos del Mundial 2026</h1>
        <p className="text-sm text-zinc-400">
          Predice el marcador antes del inicio de cada partido. 3 puntos por
          marcador exacto, 1 por acertar el resultado.
        </p>
      </div>

      {STAGE_ORDER.map((stage) => {
        const stageMatches = matches.filter((m) => m.stage === stage);
        if (stageMatches.length === 0) return null;

        if (stage === "GROUP") {
          const letters = [...new Set(stageMatches.map((m) => m.groupLetter))].sort();
          return (
            <section key={stage}>
              <h2 className="mb-2 text-lg font-semibold text-emerald-400">
                {STAGE_LABELS[stage]}
              </h2>
              <div className="space-y-4">
                {letters.map((letter) => (
                  <details
                    key={letter}
                    className="rounded-lg border border-zinc-800 bg-zinc-900"
                    open={letter === "A"}
                  >
                    <summary className="cursor-pointer p-3 font-medium text-white">
                      Grupo {letter}
                    </summary>
                    <ul className="divide-y divide-zinc-800 border-t border-zinc-800">
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
            <h2 className="mb-2 text-lg font-semibold text-emerald-400">
              {STAGE_LABELS[stage]}
            </h2>
            <ul className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
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
    </div>
  );
}
