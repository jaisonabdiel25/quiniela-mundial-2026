"use client";

import { Fragment, useState, type ReactNode } from "react";

export type AdminStep = {
  label: string;
  done: number;
  total: number;
};

export function AdminSteps({
  steps,
  panels,
}: {
  steps: AdminStep[];
  panels: ReactNode[];
}) {
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-4">
      {/* Barra de pasos: círculos numerados que se estiran a todo el ancho
          (sin scroll). El nombre de la fase activa va debajo. */}
      <nav className="space-y-2">
        <div className="flex items-center">
          {steps.map((step, i) => {
            const isActive = i === active;
            const complete = step.total > 0 && step.done === step.total;
            return (
              <Fragment key={i}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-current={isActive ? "step" : undefined}
                  title={`${step.label} (${step.done}/${step.total})`}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                    isActive
                      ? "border-sky-500 bg-sky-600 text-white"
                      : complete
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                  }`}
                >
                  {complete ? "✓" : i + 1}
                </button>
                {i < steps.length - 1 && (
                  <span className="h-0.5 flex-1 bg-slate-700" />
                )}
              </Fragment>
            );
          })}
        </div>
        <p className="text-center text-sm">
          <span className="font-medium text-white">{steps[active].label}</span>
          <span className="text-slate-500">
            {" · "}
            {steps[active].done}/{steps[active].total} con resultado
          </span>
        </p>
      </nav>

      {/* Panel del paso activo */}
      <div>{panels[active]}</div>

      {/* Navegación anterior/siguiente */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActive((a) => Math.max(0, a - 1))}
          disabled={active === 0}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Anterior
        </button>
        <span className="text-sm text-slate-500">
          Paso {active + 1} de {steps.length}
        </span>
        <button
          type="button"
          onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}
          disabled={active === steps.length - 1}
          className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
