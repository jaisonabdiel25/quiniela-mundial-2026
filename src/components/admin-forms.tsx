"use client";

import { useActionState } from "react";
import { saveResult, assignTeams } from "@/lib/actions/admin";
import type { FormState } from "@/lib/actions/auth";

const scoreClass =
  "w-14 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-center text-zinc-100 focus:border-amber-500 focus:outline-none";

export function ResultForm({
  matchId,
  initialHome,
  initialAway,
}: {
  matchId: number;
  initialHome?: number;
  initialAway?: number;
}) {
  const action = saveResult.bind(null, matchId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input
        type="number"
        name="homeScore"
        min={0}
        max={99}
        required
        defaultValue={initialHome ?? ""}
        className={scoreClass}
        aria-label="Goles local"
      />
      <span className="text-zinc-500">-</span>
      <input
        type="number"
        name="awayScore"
        min={0}
        max={99}
        required
        defaultValue={initialAway ?? ""}
        className={scoreClass}
        aria-label="Goles visitante"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-amber-600 px-3 py-1 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
      >
        {pending ? "..." : "Guardar resultado"}
      </button>
      {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
    </form>
  );
}

export function AssignTeamsForm({
  matchId,
  teams,
  currentHomeId,
  currentAwayId,
}: {
  matchId: number;
  teams: { id: number; name: string; flagEmoji: string }[];
  currentHomeId?: number;
  currentAwayId?: number;
}) {
  const action = assignTeams.bind(null, matchId);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    action,
    undefined
  );
  const selectClass =
    "rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none";
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select name="homeTeamId" defaultValue={currentHomeId ?? ""} required className={selectClass}>
        <option value="" disabled>
          Equipo local
        </option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <span className="text-zinc-500">vs</span>
      <select name="awayTeamId" defaultValue={currentAwayId ?? ""} required className={selectClass}>
        <option value="" disabled>
          Equipo visitante
        </option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-700 px-3 py-1 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
      >
        {pending ? "..." : "Asignar"}
      </button>
      {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
    </form>
  );
}
