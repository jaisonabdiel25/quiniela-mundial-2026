"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KickoffTime } from "@/components/kickoff-time";
import { PredictionForm } from "@/components/prediction-form";
import { TeamLabel } from "@/components/team-label";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/match-utils";
import { formatPanama } from "@/lib/timezone";
import type { MatchStatus, Stage } from "@/generated/prisma/client";

export type BrowserMatch = {
  id: number;
  matchNumber: number;
  stage: Stage;
  groupLetter: string | null;
  kickoff: string;
  venue: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeTeam: { name: string; fifaCode: string } | null;
  awayTeam: { name: string; fifaCode: string } | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  prediction: { homeScore: number; awayScore: number; points: number | null } | null;
};

const DEBOUNCE_MS = 300;

function MatchRow({ match }: { match: BrowserMatch }) {
  const locked = new Date(match.kickoff) <= new Date();
  const finished = match.status === "FINISHED";
  const prediction = match.prediction;

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
        <Link
          href={`/matches/${match.id}`}
          className="mt-1.5 inline-block rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-sky-600 hover:text-white"
        >
          Ver detalle
        </Link>
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

function GroupView({
  matches,
  searching,
}: {
  matches: BrowserMatch[];
  searching: boolean;
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
                    // Al buscar abrimos todos los grupos para que los resultados sean visibles.
                    open={searching || letter === "A"}
                  >
                    <summary className="cursor-pointer p-3 font-medium text-white">
                      Grupo {letter}
                    </summary>
                    <ul className="divide-y divide-slate-800 border-t border-slate-800">
                      {stageMatches
                        .filter((m) => m.groupLetter === letter)
                        .map((m) => (
                          <MatchRow key={m.id} match={m} />
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
                <MatchRow key={m.id} match={m} />
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function TimeView({ matches }: { matches: BrowserMatch[] }) {
  const sorted = [...matches].sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  const byDay = new Map<string, BrowserMatch[]>();
  for (const m of sorted) {
    const key = formatPanama(m.kickoff, {
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
              <MatchRow key={m.id} match={m} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

export function MatchesBrowser({
  matches,
  view,
}: {
  matches: BrowserMatch[];
  view: "group" | "time";
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Debounce: espera DEBOUNCE_MS tras la última tecla antes de filtrar.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) => {
      const home = (m.homeTeam?.name ?? m.homePlaceholder ?? "").toLowerCase();
      const away = (m.awayTeam?.name ?? m.awayPlaceholder ?? "").toLowerCase();
      return home.includes(q) || away.includes(q);
    });
  }, [matches, debounced]);

  const searching = debounced.trim().length > 0;

  return (
    <div className="space-y-6">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por selección…"
        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-600 focus:outline-none"
      />

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-slate-400">
          {searching
            ? `No hay partidos que coincidan con “${debounced}”.`
            : "No hay partidos para mostrar con los filtros actuales."}
        </p>
      ) : view === "time" ? (
        <TimeView matches={filtered} />
      ) : (
        <GroupView matches={filtered} searching={searching} />
      )}
    </div>
  );
}
