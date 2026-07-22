import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { KickoffTime } from "@/components/kickoff-time";
import { ResultForm, AssignTeamsForm } from "@/components/admin-forms";
import { TeamLabel } from "@/components/team-label";
import { ConfirmButton } from "@/components/confirm-button";
import { AdminSteps, type AdminStep } from "@/components/admin-steps";
import { MatchList } from "@/components/match-list";
import {
  autoAssignFromGroups,
  autoAssignKnockoutRound,
  clearResult,
} from "@/lib/actions/admin";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/match-utils";
import type { Stage } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

// Panel con el botón de asignación automática (mismo estilo para todas las rondas).
function AutoAssignPanel({
  title,
  description,
  note,
  buttonLabel,
  confirmMessage,
  action,
  disabled,
}: {
  title: string;
  description: string;
  note: string;
  buttonLabel: string;
  confirmMessage: string;
  action: () => Promise<void>;
  disabled: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-medium text-white">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
          {disabled && <p className="mt-1 text-xs text-amber-400">{note}</p>}
        </div>
        <ConfirmButton
          action={action}
          disabled={disabled}
          confirmMessage={confirmMessage}
          className="shrink-0 rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-sky-600"
        >
          {buttonLabel}
        </ConfirmButton>
      </div>
    </div>
  );
}

// Para cada ronda eliminatoria, la ronda que la alimenta (para validar/asignar).
const PREVIOUS_STAGE: Partial<Record<Stage, Stage>> = {
  ROUND_16: "ROUND_32",
  QUARTER: "ROUND_16",
  SEMI: "QUARTER",
  THIRD_PLACE: "SEMI",
  FINAL: "SEMI",
};

export default async function AdminPage() {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const now = new Date();

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

      {(() => {
        const stages = STAGE_ORDER.filter((stage) =>
          matches.some((m) => m.stage === stage)
        );

        // Una ronda está "completa" si tiene partidos y todos finalizaron.
        const stageAllFinished = (s: Stage) => {
          const sm = matches.filter((m) => m.stage === s);
          return sm.length > 0 && sm.every((m) => m.status === "FINISHED");
        };
        // El botón de auto-asignar 16avos depende de la fase de grupos.
        const groupComplete = stageAllFinished("GROUP");

        const steps: AdminStep[] = stages.map((stage) => {
          const sm = matches.filter((m) => m.stage === stage);
          return {
            label: STAGE_LABELS[stage],
            done: sm.filter((m) => m.status === "FINISHED").length,
            total: sm.length,
          };
        });

        const panels = stages.map((stage) => {
          const stageMatches = matches.filter((m) => m.stage === stage);
          const prevStage = PREVIOUS_STAGE[stage];
          return (
            <div key={stage} className="space-y-3">
              {stage === "ROUND_32" && (
                <AutoAssignPanel
                  title="Asignar 16avos automáticamente"
                  description="Coloca al 1° y 2° de cada grupo en sus cruces según las posiciones actuales. Solo te quedará asignar a mano los terceros."
                  note="Disponible cuando todos los partidos de la fase de grupos estén finalizados."
                  buttonLabel="Asignar 1° y 2° automáticamente"
                  confirmMessage="¿Asignar los 16avos con el 1° y 2° actuales de cada grupo? Sobrescribe los equipos ya puestos en esos cruces (no toca los terceros ni partidos finalizados)."
                  action={autoAssignFromGroups}
                  disabled={!groupComplete}
                />
              )}
              {prevStage && (
                <AutoAssignPanel
                  title={`Asignar ${STAGE_LABELS[stage].toLowerCase()} automáticamente`}
                  description="Coloca a los ganadores de cada cruce de la ronda anterior (y los perdedores, en el partido por el tercer puesto)."
                  note={`Disponible cuando "${STAGE_LABELS[prevStage]}" esté completa.`}
                  buttonLabel="Asignar según la ronda anterior"
                  confirmMessage={`¿Asignar ${STAGE_LABELS[stage]} con los ganadores de la ronda anterior? Sobrescribe los equipos ya puestos (no toca partidos finalizados ni cruces empatados).`}
                  action={autoAssignKnockoutRound.bind(null, stage)}
                  disabled={!stageAllFinished(prevStage)}
                />
              )}
              <MatchList
                items={stageMatches.map((m) => ({
                  key: m.id,
                  hideable: m.status === "FINISHED" && m.kickoff <= now,
                  node: (
                  <>
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
                  </>
                  ),
                }))}
              />
            </div>
          );
        });

        return <AdminSteps steps={steps} panels={panels} />;
      })()}
    </div>
  );
}
