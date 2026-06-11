"use client";

import { useActionState } from "react";
import { savePrediction, type PredictionState } from "@/lib/actions/predictions";

type Props = {
  matchId: number;
  initialHome?: number;
  initialAway?: number;
};

export function PredictionForm({ matchId, initialHome, initialAway }: Props) {
  const action = savePrediction.bind(null, matchId);
  const [state, formAction, pending] = useActionState<PredictionState, FormData>(
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
        className="w-14 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-center text-slate-100 focus:border-sky-500 focus:outline-none"
        aria-label="Goles local"
      />
      <span className="text-slate-500">-</span>
      <input
        type="number"
        name="awayScore"
        min={0}
        max={99}
        required
        defaultValue={initialAway ?? ""}
        className="w-14 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-center text-slate-100 focus:border-sky-500 focus:outline-none"
        aria-label="Goles visitante"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
      >
        {pending ? "..." : "Guardar"}
      </button>
      {state?.ok && <span className="text-sm text-sky-400">✓</span>}
      {state?.error && (
        <span className="text-sm text-red-400">{state.error}</span>
      )}
    </form>
  );
}
