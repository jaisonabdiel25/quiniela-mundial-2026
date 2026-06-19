import { TeamFlag } from "@/components/team-label";
import type { GroupPointsMatrix } from "@/lib/queries";

// Etiqueta compacta de un equipo para la columna fija (bandera + código FIFA).
function TeamTag({
  team,
  placeholder,
}: {
  team: { name: string; fifaCode: string } | null;
  placeholder: string | null;
}) {
  if (!team) {
    return <span className="text-slate-500">{placeholder ?? "—"}</span>;
  }
  return (
    <span className="inline-flex items-center gap-1">
      <TeamFlag fifaCode={team.fifaCode} />
      {team.fifaCode}
    </span>
  );
}

// Celda con el color según los puntos (mismos colores que el modal de predicciones).
function PointsBadge({ points }: { points: number }) {
  const cls =
    points === 3
      ? "bg-sky-700 text-white"
      : points === 1
        ? "bg-violet-700 text-white"
        : "bg-slate-800 text-slate-400";
  return (
    <span className={`inline-block min-w-[1.5rem] rounded px-1.5 py-0.5 text-xs font-bold ${cls}`}>
      {points}
    </span>
  );
}

export function GroupPointsMatrix({
  members,
  matrix,
}: {
  members: { userId: string; name: string }[];
  matrix: GroupPointsMatrix;
}) {
  if (matrix.matches.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        Aún no hay partidos jugados.
      </p>
    );
  }

  // Totales por miembro (suma de puntos de partidos puntuados).
  const totals = new Map<string, number>();
  for (const member of members) {
    let sum = 0;
    for (const m of matrix.matches) {
      const pts = matrix.points.get(`${member.userId}:${m.matchId}`);
      if (typeof pts === "number") sum += pts;
    }
    totals.set(member.userId, sum);
  }

  const cellBase = "px-2 py-2 text-center align-middle";
  const stickyBase = "sticky left-0 z-10 px-2 py-2 text-left";

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="min-w-full border-collapse bg-slate-900 text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400">
            <th className={`${stickyBase} bg-slate-900`}>Partido</th>
            {members.map((member) => (
              <th key={member.userId} className={`${cellBase} font-medium text-slate-300`}>
                {member.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.matches.map((m) => (
            <tr key={m.matchId} className="border-b border-slate-800/50 last:border-0">
              <th className={`${stickyBase} bg-slate-900 font-normal text-white`}>
                <span className="flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-xs text-slate-600">P{m.matchNumber}</span>
                  <TeamTag team={m.homeTeam} placeholder={m.homePlaceholder} />
                  {m.finished ? (
                    <span className="font-mono text-slate-300">
                      {m.homeScore}-{m.awayScore}
                    </span>
                  ) : (
                    <span className="text-slate-500">vs</span>
                  )}
                  <TeamTag team={m.awayTeam} placeholder={m.awayPlaceholder} />
                  {!m.finished && (
                    <span className="rounded bg-violet-950 px-1.5 py-0.5 text-xs text-violet-300">
                      En juego
                    </span>
                  )}
                </span>
              </th>
              {members.map((member) => {
                const pts = matrix.points.get(`${member.userId}:${m.matchId}`);
                return (
                  <td key={member.userId} className={cellBase}>
                    {!m.finished ? (
                      <span className="text-slate-700">·</span>
                    ) : typeof pts === "number" ? (
                      <PointsBadge points={pts} />
                    ) : (
                      <span className="text-slate-600">–</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-800 font-semibold text-white">
            <th className={`${stickyBase} bg-slate-900`}>Total</th>
            {members.map((member) => (
              <td key={member.userId} className={`${cellBase} text-sky-400`}>
                {totals.get(member.userId) ?? 0}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
