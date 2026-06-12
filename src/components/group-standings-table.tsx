import { TeamFlag } from "@/components/team-label";
import type { GroupStandings, TeamStanding } from "@/lib/queries";

function StandingRow({
  team,
  position,
  highlighted,
}: {
  team: TeamStanding;
  position: number;
  highlighted: boolean;
}) {
  const qualifies = position <= 2;
  return (
    <tr
      className={`border-b border-slate-800/50 last:border-0 ${
        highlighted ? "bg-sky-950/40" : ""
      }`}
    >
      <td className="px-1 py-1.5 text-center">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs ${
            qualifies ? "bg-sky-700 font-bold text-white" : "text-slate-400"
          }`}
        >
          {position}
        </span>
      </td>
      <td className="px-1 py-1.5">
        <span className="flex min-w-0 items-center gap-1.5 text-white">
          <TeamFlag fifaCode={team.fifaCode} />
          <span className="truncate">{team.name}</span>
        </span>
      </td>
      <td className="px-0.5 py-1.5 text-center text-slate-400">{team.played}</td>
      <td className="px-0.5 py-1.5 text-center text-slate-400">{team.won}</td>
      <td className="px-0.5 py-1.5 text-center text-slate-400">{team.drawn}</td>
      <td className="px-0.5 py-1.5 text-center text-slate-400">{team.lost}</td>
      <td className="px-0.5 py-1.5 text-center text-slate-300">
        {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
      </td>
      <td className="px-0.5 py-1.5 text-center font-bold text-sky-400">
        {team.points}
      </td>
    </tr>
  );
}

export function GroupStandingsTable({
  group,
  highlightTeamIds,
}: {
  group: GroupStandings;
  highlightTeamIds?: number[];
}) {
  const highlight = new Set(highlightTeamIds ?? []);
  return (
    <table className="w-full table-fixed text-xs sm:text-sm">
      <thead>
        <tr className="text-left text-slate-500">
          <th className="w-7 px-1 py-2 text-center font-normal">#</th>
          <th className="px-1 py-2 font-normal">Equipo</th>
          <th className="w-7 px-0.5 py-2 text-center font-normal" title="Partidos jugados">PJ</th>
          <th className="w-6 px-0.5 py-2 text-center font-normal" title="Ganados">G</th>
          <th className="w-6 px-0.5 py-2 text-center font-normal" title="Empatados">E</th>
          <th className="w-6 px-0.5 py-2 text-center font-normal" title="Perdidos">P</th>
          <th className="w-8 px-0.5 py-2 text-center font-normal" title="Diferencia de goles">DG</th>
          <th className="w-8 px-0.5 py-2 text-center font-normal" title="Puntos">Pts</th>
        </tr>
      </thead>
      <tbody>
        {group.teams.map((team, i) => (
          <StandingRow
            key={team.teamId}
            team={team}
            position={i + 1}
            highlighted={highlight.has(team.teamId)}
          />
        ))}
      </tbody>
    </table>
  );
}
