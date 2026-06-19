"use client";

import { createContext, useContext, type ReactNode } from "react";

// Estado de los filtros del panel de administración, compartido entre todas
// las fases vía contexto (el switch vive en <AdminSteps>).
export const AdminFiltersContext = createContext<{ showFinished: boolean }>({
  showFinished: false,
});

export type MatchListItem = {
  key: number;
  node: ReactNode;
  // El partido se puede ocultar: ya finalizó y su kickoff ya pasó.
  hideable: boolean;
};

export function MatchList({ items }: { items: MatchListItem[] }) {
  const { showFinished } = useContext(AdminFiltersContext);

  const visible = showFinished ? items : items.filter((it) => !it.hideable);
  const hiddenCount = items.length - visible.length;

  return (
    <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
      {visible.map((it) => (
        <li key={it.key} className="space-y-2 p-3">
          {it.node}
        </li>
      ))}
      {hiddenCount > 0 && (
        <li className="p-3 text-center text-xs text-slate-500">
          {visible.length === 0
            ? "Todos los partidos de esta fase ya se jugaron — activa “Mostrar partidos jugados” para verlos."
            : `${hiddenCount} partido${hiddenCount === 1 ? "" : "s"} jugado${
                hiddenCount === 1 ? "" : "s"
              } oculto${hiddenCount === 1 ? "" : "s"}.`}
        </li>
      )}
    </ul>
  );
}
