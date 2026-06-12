import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KickoffTime } from "@/components/kickoff-time";
import { ResultForm, AssignTeamsForm } from "@/components/admin-forms";
import { TeamLabel } from "@/components/team-label";
import { ConfirmButton } from "@/components/confirm-button";
import { clearResult } from "@/lib/actions/admin";
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
                    {m.status === "FINISHED" && m.kickoff > new Date() && (
                      <ConfirmButton
                        action={clearResult.bind(null, m.id)}
                        confirmMessage="¿Borrar el resultado? El partido se reabre y se quitan los puntos de las predicciones."
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-1 text-sm font-medium text-red-300 transition-colors hover:border-red-700 hover:bg-red-900/40 hover:text-red-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-4 w-4"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                        Borrar resultado
                      </ConfirmButton>
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
