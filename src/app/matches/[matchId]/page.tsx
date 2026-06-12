import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGroupStandings } from "@/lib/queries";
import { GroupStandingsTable } from "@/components/group-standings-table";
import { KickoffTime } from "@/components/kickoff-time";
import { PredictionForm } from "@/components/prediction-form";
import { TeamFlag, TeamLabel } from "@/components/team-label";
import {
  STAGE_LABELS,
  isLocked,
  type MatchWithTeams,
} from "@/lib/match-utils";

export const dynamic = "force-dynamic";

// Etiqueta de equipo para el formulario de predicción:
// móvil → bandera grande con el nombre debajo; sm+ → bandera y nombre en línea.
function PredictionTeamLabel({
  team,
  placeholder,
}: {
  team: { name: string; fifaCode: string } | null;
  placeholder: string | null;
}) {
  if (!team) {
    return (
      <span className="text-xs text-slate-400 sm:text-base">
        {placeholder ?? "Por definir"}
      </span>
    );
  }
  return (
    <span className="relative flex items-center justify-center">
      <span className="text-5xl leading-none sm:text-base">
        <TeamFlag fifaCode={team.fifaCode} />
      </span>
      <span
        className="absolute left-1/2 top-full mt-1 w-max max-w-[38vw] -translate-x-1/2 text-center text-[11px] leading-tight
          sm:static sm:left-auto sm:top-auto sm:ml-1.5 sm:mt-0 sm:w-auto sm:max-w-none sm:translate-x-0 sm:text-base"
      >
        {team.name}
      </span>
    </span>
  );
}

function MiniMatchRow({
  match,
  current,
}: {
  match: MatchWithTeams;
  current?: boolean;
}) {
  const finished = match.status === "FINISHED";
  const content = (
    <div className="flex items-center justify-between gap-3 p-3">
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
      </div>
      {current && (
        <span className="shrink-0 rounded bg-sky-700 px-2 py-0.5 text-xs font-bold text-white">
          Este partido
        </span>
      )}
    </div>
  );

  if (current) {
    return <li className="bg-sky-950/40">{content}</li>;
  }
  return (
    <li className="transition-colors hover:bg-slate-800/50">
      <Link href={`/matches/${match.id}`} className="block">
        {content}
      </Link>
    </li>
  );
}

function TeamPath({
  teamId,
  teamName,
  matches,
}: {
  teamId: number;
  teamName: string;
  matches: MatchWithTeams[];
}) {
  const teamMatches = matches.filter(
    (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
  );
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-white">
        Recorrido de {teamName}
      </h3>
      {teamMatches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-800 p-3 text-xs text-slate-500">
          Sin otros partidos
        </p>
      ) : (
        <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
          {teamMatches.map((m) => (
            <MiniMatchRow key={m.id} match={m} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId: matchIdParam } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const matchId = Number(matchIdParam);
  if (!Number.isInteger(matchId)) notFound();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { homeTeam: true, awayTeam: true },
  });
  if (!match) notFound();

  const teamIds = [match.homeTeamId, match.awayTeamId].filter(
    (id): id is number => id != null
  );

  const [prediction, standings, bracketMatches, teamMatches] = await Promise.all([
    prisma.prediction.findUnique({
      where: { userId_matchId: { userId, matchId } },
    }),
    match.stage === "GROUP" ? getGroupStandings() : Promise.resolve(null),
    match.stage === "GROUP"
      ? Promise.resolve<MatchWithTeams[]>([])
      : prisma.match.findMany({
          where: { stage: match.stage },
          include: { homeTeam: true, awayTeam: true },
          orderBy: { matchNumber: "asc" },
        }),
    teamIds.length > 0
      ? prisma.match.findMany({
          where: {
            id: { not: matchId },
            OR: [
              { homeTeamId: { in: teamIds } },
              { awayTeamId: { in: teamIds } },
            ],
          },
          include: { homeTeam: true, awayTeam: true },
          orderBy: { kickoff: "asc" },
        })
      : Promise.resolve<MatchWithTeams[]>([]),
  ]);

  const group =
    match.stage === "GROUP" && standings
      ? standings.find((g) => g.letter === match.groupLetter) ?? null
      : null;

  const locked = isLocked(match);
  const finished = match.status === "FINISHED";

  return (
    <div className="space-y-6">
      <Link href="/matches" className="text-sm text-sky-400 hover:underline">
        ← Volver a partidos
      </Link>

      {/* Encabezado del partido (con predicción integrada) */}
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-5">
        <p className="text-center text-xs uppercase tracking-wide text-sky-400">
          {STAGE_LABELS[match.stage]}
          {match.groupLetter ? ` · Grupo ${match.groupLetter}` : ""} · P
          {match.matchNumber}
        </p>

        {!locked && !finished && match.homeTeamId && match.awayTeamId ? (
          <div className="mt-4">
            <PredictionForm
              matchId={match.id}
              initialHome={prediction?.homeScore}
              initialAway={prediction?.awayScore}
              stacked
              homeLabel={
                <PredictionTeamLabel
                  team={match.homeTeam}
                  placeholder={match.homePlaceholder}
                />
              }
              awayLabel={
                <PredictionTeamLabel
                  team={match.awayTeam}
                  placeholder={match.awayPlaceholder}
                />
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-3 flex items-center justify-center gap-4 text-lg font-semibold text-white">
              <span className="flex-1 text-right">
                <TeamLabel team={match.homeTeam} placeholder={match.homePlaceholder} />
              </span>
              {finished ? (
                <span className="rounded bg-slate-800 px-3 py-1 font-mono text-xl">
                  {match.homeScore}-{match.awayScore}
                </span>
              ) : (
                <span className="text-slate-500">vs</span>
              )}
              <span className="flex-1 text-left">
                <TeamLabel team={match.awayTeam} placeholder={match.awayPlaceholder} />
              </span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm">
              {!locked && !finished ? (
                <span className="text-slate-500">
                  Disponible cuando se definan los equipos
                </span>
              ) : (
                <>
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
                  {!finished && (
                    <span className="text-xs text-violet-400">En juego</span>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <p className="mt-4 text-center text-xs text-slate-500">
          <KickoffTime date={match.kickoff} /> · {match.venue}
        </p>
      </section>

      {/* Tabla de posiciones (grupo) o bracket (eliminatoria) */}
      {group ? (
        <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
          <h2 className="border-b border-slate-800 p-3 font-semibold text-white">
            Grupo {group.letter}
          </h2>
          <GroupStandingsTable group={group} highlightTeamIds={teamIds} />
        </section>
      ) : bracketMatches.length > 0 ? (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-sky-400">
            {STAGE_LABELS[match.stage]}
          </h2>
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-900">
            {bracketMatches.map((m) => (
              <MiniMatchRow key={m.id} match={m} current={m.id === match.id} />
            ))}
          </ul>
        </section>
      ) : null}

      {/* Recorrido de los equipos */}
      {teamIds.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {match.homeTeam && (
            <TeamPath
              teamId={match.homeTeam.id}
              teamName={match.homeTeam.name}
              matches={teamMatches}
            />
          )}
          {match.awayTeam && (
            <TeamPath
              teamId={match.awayTeam.id}
              teamName={match.awayTeam.name}
              matches={teamMatches}
            />
          )}
        </div>
      )}
    </div>
  );
}
