"use client";

import { useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/modal";
import { KickoffTime } from "@/components/kickoff-time";
import { TeamLabel } from "@/components/team-label";
import {
  getMemberPredictions,
  type MemberPredictionRow,
  type MemberPredictionsResult,
} from "@/lib/actions/predictions";
import { formatPanama } from "@/lib/timezone";

const DAY_KEY: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

const DAY_LABEL: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
};

function PredictionRow({ row }: { row: MemberPredictionRow }) {
  return (
    <li className="flex flex-col gap-1 py-2.5">
      <p className="text-sm text-white">
        <span className="mr-2 text-xs text-slate-600">P{row.matchNumber}</span>
        <TeamLabel team={row.homeTeam} placeholder={row.homePlaceholder} />{" "}
        {row.finished ? (
          <span className="mx-1 rounded bg-slate-800 px-2 py-0.5 font-mono text-white">
            {row.homeScore}-{row.awayScore}
          </span>
        ) : (
          <span className="text-slate-500">vs</span>
        )}{" "}
        <TeamLabel team={row.awayTeam} placeholder={row.awayPlaceholder} />
      </p>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          <KickoffTime date={row.kickoff} />
        </span>
        <div className="flex items-center gap-2">
          {row.predHome != null ? (
            <span className="font-mono text-slate-300">
              {row.predHome}-{row.predAway}
            </span>
          ) : (
            <span className="text-slate-500">Sin predicción</span>
          )}
          {row.finished && row.points != null && (
            <span
              className={`rounded px-2 py-0.5 font-bold ${
                row.points === 3
                  ? "bg-sky-700 text-white"
                  : row.points === 1
                    ? "bg-violet-700 text-white"
                    : "bg-slate-800 text-slate-400"
              }`}
            >
              {row.points} pts
            </span>
          )}
          {!row.finished && <span className="text-violet-400">En juego</span>}
        </div>
      </div>
    </li>
  );
}

export function MemberPredictionsModal({
  groupId,
  userId,
  name,
}: {
  groupId: string;
  userId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<MemberPredictionsResult | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [pending, startTransition] = useTransition();

  // Agrupa los partidos por día (hora de Panamá), conservando el orden cronológico.
  const days = useMemo(() => {
    const rows = result && "ok" in result ? result.rows : [];
    const map = new Map<string, { label: string; rows: MemberPredictionRow[] }>();
    for (const row of rows) {
      const key = formatPanama(row.kickoff, DAY_KEY);
      if (!map.has(key)) {
        map.set(key, { label: formatPanama(row.kickoff, DAY_LABEL), rows: [] });
      }
      map.get(key)!.rows.push(row);
    }
    return map;
  }, [result]);

  // Día por defecto (el actual, o el más reciente disponible). El día efectivo
  // es el que eligió el usuario o, si no eligió, este por defecto.
  const defaultDay = useMemo(() => {
    if (days.size === 0) return "";
    const keys = [...days.keys()];
    const todayKey = formatPanama(new Date(), DAY_KEY);
    return keys.includes(todayKey) ? todayKey : keys[keys.length - 1];
  }, [days]);

  const currentKey = selectedDay || defaultDay;

  function handleOpen() {
    setOpen(true);
    if (!result) {
      startTransition(async () => {
        setResult(await getMemberPredictions(groupId, userId));
      });
    }
  }

  const currentDay = days.get(currentKey);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Ver predicciones"
        className="group inline-flex items-center gap-1.5 text-left text-white hover:text-sky-400"
      >
        <span className="wrap-break-word group-hover:underline">{name}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-sky-400"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          />
        </svg>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Predicciones de ${name}`}
      >
        {pending ? (
          <p className="py-6 text-center text-sm text-slate-400">Cargando…</p>
        ) : result && "error" in result ? (
          <p className="py-6 text-center text-sm text-red-400">{result.error}</p>
        ) : days.size === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Aún no hay partidos jugados.
          </p>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-400">
              Día:
              <select
                value={currentKey}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm capitalize text-white focus:border-sky-600 focus:outline-none"
              >
                {[...days.entries()].map(([key, day]) => (
                  <option key={key} value={key}>
                    {day.label}
                  </option>
                ))}
              </select>
            </label>
            {currentDay && (
              <ul className="divide-y divide-slate-800">
                {currentDay.rows.map((row) => (
                  <PredictionRow key={row.matchId} row={row} />
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
