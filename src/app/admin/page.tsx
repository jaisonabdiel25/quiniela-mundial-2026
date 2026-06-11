import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KickoffTime } from "@/components/kickoff-time";
import { ResultForm, AssignTeamsForm } from "@/components/admin-forms";
import { TeamLabel } from "@/components/team-label";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/match-utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const [matches, teams] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Panel de administración</h1>
        <p className="text-sm text-slate-400">
          Carga los resultados oficiales (recalcula los puntos de todas las
          predicciones) y asigna los equipos a los cruces de eliminatorias.
        </p>
      </div>

      {STAGE_ORDER.map((stage) => {
        const stageMatches = matches.filter((m) => m.stage === stage);
        if (stageMatches.length === 0) return null;
        const pendingCount = stageMatches.filter(
          (m) => m.status !== "FINISHED"
        ).length;

        return (
          <details
            key={stage}
            className="rounded-lg border border-slate-800 bg-slate-900"
            open={stage === "GROUP"}
          >
            <summary className="cursor-pointer p-3 font-medium text-white">
              {STAGE_LABELS[stage]}{" "}
              <span className="text-sm text-slate-500">
                ({stageMatches.length - pendingCount}/{stageMatches.length} con
                resultado)
              </span>
            </summary>
            <ul className="divide-y divide-slate-800 border-t border-slate-800">
              {stageMatches.map((m) => (
                <li key={m.id} className="space-y-2 p-3">
                  <p className="text-sm text-white">
                    <span className="mr-2 text-xs text-slate-600">
                      P{m.matchNumber}
                    </span>
                    <TeamLabel team={m.homeTeam} placeholder={m.homePlaceholder} />{" "}
                    <span className="text-slate-500">vs</span>{" "}
                    <TeamLabel team={m.awayTeam} placeholder={m.awayPlaceholder} />
                    {m.groupLetter && (
                      <span className="ml-2 text-xs text-slate-500">
                        Grupo {m.groupLetter}
                      </span>
                    )}
                    {m.status === "FINISHED" && (
                      <span className="ml-2 rounded bg-sky-900 px-2 py-0.5 text-xs text-sky-300">
                        Finalizado {m.homeScore}-{m.awayScore}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    <KickoffTime date={m.kickoff} /> · {m.venue}
                  </p>
                  <div className="flex flex-wrap items-center gap-4">
                    {stage !== "GROUP" && (
                      <AssignTeamsForm
                        matchId={m.id}
                        teams={teams}
                        currentHomeId={m.homeTeamId ?? undefined}
                        currentAwayId={m.awayTeamId ?? undefined}
                      />
                    )}
                    {m.homeTeamId && m.awayTeamId && (
                      <ResultForm
                        matchId={m.id}
                        initialHome={m.homeScore ?? undefined}
                        initialAway={m.awayScore ?? undefined}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
