"use client";

import { useActionState, type ReactNode } from "react";
import { savePrediction, type PredictionState } from "@/lib/actions/predictions";

type Props = {
  matchId: number;
  initialHome?: number;
  initialAway?: number;
  /** Etiquetas de equipos para el layout apilado (nombre junto al input). */
  homeLabel?: ReactNode;
  awayLabel?: ReactNode;
  /** Muestra los inputs junto a los nombres y el botón Guardar debajo. */
  stacked?: boolean;
};

export function PredictionForm({
  matchId,
  initialHome,
  initialAway,
  homeLabel,
  awayLabel,
  stacked,
}: Props) {
  const action = savePrediction.bind(null, matchId);
  const [state, formAction, pending] = useActionState<PredictionState, FormData>(
    action,
    undefined
  );

  const inputClass =
    "w-14 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-center text-slate-100 focus:border-sky-500 focus:outline-none";

  const homeInput = (
    <input
      type="number"
      name="homeScore"
      min={0}
      max={99}
      required
      defaultValue={initialHome ?? ""}
      className={inputClass}
      aria-label="Goles local"
    />
  );
  const awayInput = (
    <input
      type="number"
      name="awayScore"
      min={0}
      max={99}
      required
      defaultValue={initialAway ?? ""}
      className={inputClass}
      aria-label="Goles visitante"
    />
  );
  const submit = (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
    >
      {pending ? "..." : "Guardar"}
    </button>
  );
  const feedback = (
    <>
      {state?.ok && <span className="text-sm text-sky-400">✓</span>}
      {state?.error && <span className="text-sm text-red-400">{state.error}</span>}
    </>
  );

  if (stacked) {
    return (
      <form action={formAction} className="flex flex-col items-center gap-3">
        {/* Los inputs y el "vs" quedan SIEMPRE centrados; cada nombre ocupa
            un lado flexible de igual ancho, pegado a su input. Letra pequeña
            en móvil para que los nombres quepan a los lados. */}
        <div className="flex w-full items-center gap-1.5 pb-6 text-xs font-semibold text-white sm:gap-3 sm:pb-0 sm:text-sm">
          <span className="flex min-w-0 flex-1 basis-0 items-center justify-end">
            {homeLabel}
          </span>
          {homeInput}
          <span className="text-slate-500">vs</span>
          {awayInput}
          <span className="flex min-w-0 flex-1 basis-0 items-center justify-start">
            {awayLabel}
          </span>
        </div>
        {submit}
        <div className="flex min-h-5 items-center gap-2">{feedback}</div>
      </form>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      {homeInput}
      <span className="text-slate-500">-</span>
      {awayInput}
      {submit}
      {feedback}
    </form>
  );
}
