"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { KickoffTime } from "@/components/kickoff-time";
import { TeamLabel } from "@/components/team-label";

export type UpcomingMatch = {
  id: number;
  homeTeam: { name: string; fifaCode: string } | null;
  awayTeam: { name: string; fifaCode: string } | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  kickoff: string;
  venue: string;
  live?: boolean;
  prediction: { homeScore: number; awayScore: number } | null;
};

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 300;

export function UpcomingMatches({ matches }: { matches: UpcomingMatch[] }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  // Debounce: espera DEBOUNCE_MS tras la última tecla antes de filtrar.
  // Al aplicar la búsqueda volvemos a la primera página.
  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, DEBOUNCE_MS);
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageMatches = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por selección…"
          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-600 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-slate-400">
          No hay partidos que coincidan con “{debounced}”.
        </p>
      ) : (
        <>
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
            {pageMatches.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 p-3">
                <div>
                  <p className="text-sm text-white">
                    <TeamLabel team={m.homeTeam} placeholder={m.homePlaceholder} />{" "}
                    <span className="text-slate-500">vs</span>{" "}
                    <TeamLabel team={m.awayTeam} placeholder={m.awayPlaceholder} />
                  </p>
                  <p className="text-xs text-slate-500">
                    {m.live ? (
                      <span className="mr-1 font-medium text-violet-400">
                        En juego ·
                      </span>
                    ) : null}
                    <KickoffTime date={m.kickoff} /> · {m.venue}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/matches/${m.id}`}
                    className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:border-sky-600 hover:text-white"
                  >
                    Ver detalle
                  </Link>
                  {m.prediction ? (
                    <span className="rounded bg-slate-800 px-2 py-1 font-mono text-sm text-sky-400">
                      {m.prediction.homeScore}-{m.prediction.awayScore}
                    </span>
                  ) : (
                    <span className="text-xs text-violet-400">Sin predicción</span>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Anterior
              </button>
              <span className="text-sm text-slate-400">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
