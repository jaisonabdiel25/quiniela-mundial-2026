import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TeamFlag } from "@/components/team-label";
import { type MatchWithTeams } from "@/lib/match-utils";
import { getGroupStandings } from "@/lib/queries";
import type { Prediction, Stage } from "@/generated/prisma/client";

type TeamMini = { name: string; fifaCode: string };
// Resuelve un placeholder ("1° Grupo A") al equipo que ocupa ese puesto hoy,
// o null si no se puede proyectar (terceros, ganadores de partido, etc.).
type ProjectFn = (placeholder: string | null) => TeamMini | null;

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eliminatoria · Quiniela Mundial 2026",
};

// Etiquetas cortas para que quepan en columnas angostas (móvil).
const SHORT_LABELS: Record<Stage, string> = {
  GROUP: "Grupos",
  ROUND_32: "16avos",
  ROUND_16: "8vos",
  QUARTER: "4tos",
  SEMI: "Semis",
  THIRD_PLACE: "3er puesto",
  FINAL: "Final",
};

// Rondas que se dibujan a los lados del bracket simétrico (sin la final,
// que va al centro). De afuera hacia adentro.
const SIDE_STAGES: Stage[] = ["ROUND_32", "ROUND_16", "QUARTER", "SEMI"];

const LINE = "bg-slate-600";

// Una columna (rama izquierda o derecha) del bracket simétrico, con los
// conectores tipo "llave" hacia el centro:
//  - tramo horizontal de salida (tarjeta → borde interno)
//  - tramo vertical que une cada par de partidos
//  - tramo horizontal de entrada (borde externo ← ronda anterior)
function RoundColumn({
  title,
  matches,
  predByMatch,
  side,
  isOutermost,
  project,
}: {
  title: string;
  matches: MatchWithTeams[];
  predByMatch: Map<number, Prediction>;
  side: "left" | "right";
  isOutermost: boolean;
  project?: ProjectFn;
}) {
  const single = matches.length === 1;
  const outEdge = side === "left" ? "right-0" : "left-0"; // hacia el centro
  const inEdge = side === "left" ? "left-0" : "right-0"; // hacia afuera

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <h2 className="mb-2 text-center text-[10px] font-semibold text-sky-400 lg:text-xs">
        {title}
      </h2>
      <div className="flex flex-1 flex-col">
        {matches.map((m, i) => {
          const topOfPair = i % 2 === 0;
          return (
            <div
              key={m.id}
              className="relative flex flex-1 items-center px-1.5 lg:px-2.5"
            >
              {/* entrada desde la ronda anterior */}
              {!isOutermost && (
                <span
                  className={`absolute ${inEdge} top-1/2 h-px w-1.5 ${LINE} lg:w-2.5`}
                />
              )}
              {/* salida de la tarjeta hacia el centro */}
              <span
                className={`absolute ${outEdge} top-1/2 h-px w-1.5 ${LINE} lg:w-2.5`}
              />
              {/* mitad vertical que une el par (no aplica si hay una sola) */}
              {!single && (
                <span
                  className={`absolute ${outEdge} w-px ${LINE} ${
                    topOfPair ? "bottom-0 top-1/2" : "bottom-1/2 top-0"
                  }`}
                />
              )}
              <div className="w-full">
                <BracketCard
                  match={m}
                  prediction={predByMatch.get(m.id)}
                  project={project}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Extrae el nº de partido del que proviene un cruce ("Ganador P89" → 89).
// Los partidos de 16avos vienen de los grupos (sin "P##"), así que son hojas.
function feederNumber(placeholder: string | null): number | null {
  if (!placeholder) return null;
  const m = /P(\d+)/.exec(placeholder);
  return m ? Number(m[1]) : null;
}

function BracketCard({
  match,
  prediction,
  project,
}: {
  match: MatchWithTeams;
  prediction?: Prediction;
  project?: ProjectFn;
}) {
  const finished = match.status === "FINISHED";

  const teamRow = (
    team: MatchWithTeams["homeTeam"],
    placeholder: string | null,
    score: number | null
  ) => {
    // Si el equipo aún no está asignado, intenta proyectarlo (1°/2° de grupo).
    const projected = team ? null : (project?.(placeholder) ?? null);
    const display = team ?? projected;
    return (
      <div className="flex items-center gap-1">
        {display ? (
          <span className={projected ? "opacity-60" : ""}>
            <TeamFlag fifaCode={display.fifaCode} />
          </span>
        ) : (
          <span className="text-slate-600">·</span>
        )}
        {/* Nombre/placeholder solo en pantallas grandes; en móvil basta la bandera. */}
        <span
          className={`hidden min-w-0 flex-1 truncate lg:inline ${
            projected ? "italic text-slate-400" : "text-white"
          }`}
        >
          {display ? display.name : (placeholder ?? "Por definir")}
        </span>
        {finished && (
          <span className="ml-auto shrink-0 font-mono text-white">{score}</span>
        )}
      </div>
    );
  };

  return (
    <Link
      href={`/matches/${match.id}`}
      title={`P${match.matchNumber}`}
      className="block rounded border border-slate-800 bg-slate-900 p-1 text-[10px] leading-tight transition-colors hover:border-sky-600 lg:text-xs"
    >
      <div className="space-y-0.5">
        {teamRow(match.homeTeam, match.homePlaceholder, match.homeScore)}
        {teamRow(match.awayTeam, match.awayPlaceholder, match.awayScore)}
      </div>
      {prediction && (
        <div className="mt-0.5 hidden border-t border-slate-800 pt-0.5 text-[10px] text-sky-400 lg:block">
          Tu: {prediction.homeScore}-{prediction.awayScore}
        </div>
      )}
    </Link>
  );
}

export default async function EliminatoriaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [matches, predictions, standings] = await Promise.all([
    prisma.match.findMany({
      where: { stage: { not: "GROUP" } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchNumber: "asc" },
    }),
    prisma.prediction.findMany({ where: { userId: session.user.id } }),
    getGroupStandings(),
  ]);
  const predByMatch = new Map(predictions.map((p) => [p.matchId, p]));
  const byNumber = new Map(matches.map((m) => [m.matchNumber, m]));

  // Proyección en vivo de los 16avos: 1° y 2° de cada grupo según las
  // posiciones actuales (solo si el grupo ya jugó algún partido).
  const standByGroup = new Map<string, TeamMini[]>();
  for (const g of standings) {
    if (g.teams.some((t) => t.played > 0)) {
      standByGroup.set(
        g.letter,
        g.teams.map((t) => ({ name: t.name, fifaCode: t.fifaCode }))
      );
    }
  }
  const project: ProjectFn = (placeholder) => {
    if (!placeholder) return null;
    const winner = /^1° Grupo (\w)$/.exec(placeholder);
    if (winner) return standByGroup.get(winner[1])?.[0] ?? null;
    const runnerUp = /^2° Grupo (\w)$/.exec(placeholder);
    if (runnerUp) return standByGroup.get(runnerUp[1])?.[1] ?? null;
    return null;
  };

  // Recorrido DFS desde la final para fijar el orden vertical de las hojas
  // (16avos). Así cada partido posterior queda entre sus dos alimentadores.
  const leafOrder = new Map<number, number>();
  let counter = 0;
  const assignLeafOrder = (num: number) => {
    const m = byNumber.get(num);
    if (!m) return;
    const home = feederNumber(m.homePlaceholder);
    const away = feederNumber(m.awayPlaceholder);
    if (home == null && away == null) {
      if (!leafOrder.has(num)) leafOrder.set(num, counter++);
      return;
    }
    if (home != null) assignLeafOrder(home);
    if (away != null) assignLeafOrder(away);
  };
  const finalMatch = matches.find((m) => m.stage === "FINAL");
  if (finalMatch) assignLeafOrder(finalMatch.matchNumber);

  // Clave de orden de un partido = índice de su primera hoja descendiente.
  const keyCache = new Map<number, number>();
  const orderKey = (num: number): number => {
    const cached = keyCache.get(num);
    if (cached != null) return cached;
    const m = byNumber.get(num);
    const home = m ? feederNumber(m.homePlaceholder) : null;
    const away = m ? feederNumber(m.awayPlaceholder) : null;
    let k: number;
    if (home == null && away == null) {
      k = leafOrder.get(num) ?? num;
    } else {
      const keys: number[] = [];
      if (home != null) keys.push(orderKey(home));
      if (away != null) keys.push(orderKey(away));
      k = keys.length ? Math.min(...keys) : num;
    }
    keyCache.set(num, k);
    return k;
  };

  const sortByKey = (a: MatchWithTeams, b: MatchWithTeams) =>
    orderKey(a.matchNumber) - orderKey(b.matchNumber);

  const thirdPlace = matches.find((m) => m.stage === "THIRD_PLACE");

  // Bracket simétrico: reparte cada partido en la mitad izquierda o derecha
  // según a qué semifinal alimenta (recorriendo desde cada semi hacia atrás).
  const half = new Map<number, "left" | "right">();
  const markHalf = (num: number, side: "left" | "right") => {
    const m = byNumber.get(num);
    if (!m || half.has(num)) return;
    half.set(num, side);
    const h = feederNumber(m.homePlaceholder);
    const a = feederNumber(m.awayPlaceholder);
    if (h != null) markHalf(h, side);
    if (a != null) markHalf(a, side);
  };
  if (finalMatch) {
    const semiA = feederNumber(finalMatch.homePlaceholder);
    const semiB = feederNumber(finalMatch.awayPlaceholder);
    if (semiA != null) markHalf(semiA, "left");
    if (semiB != null) markHalf(semiB, "right");
  }

  const sideColumn = (stage: Stage, side: "left" | "right") =>
    matches
      .filter((m) => m.stage === stage && half.get(m.matchNumber) === side)
      .sort(sortByKey);

  const leftColumns = SIDE_STAGES.map((stage) => ({
    stage,
    matches: sideColumn(stage, "left"),
  })).filter((c) => c.matches.length > 0);

  const rightColumns = [...SIDE_STAGES]
    .reverse()
    .map((stage) => ({ stage, matches: sideColumn(stage, "right") }))
    .filter((c) => c.matches.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Eliminatoria · Mundial 2026</h1>
        <p className="text-sm text-slate-400">
          Cuadro de la fase final. Toca cualquier cruce para ver el detalle y
          predecir. Los equipos se definen al avanzar cada ronda.
        </p>
      </div>

      {/* Bracket simétrico que converge a la final. Columnas flexibles que
          se reparten el ancho, así cabe completo sin scroll horizontal tanto
          en teléfono como en escritorio. Los conectores usan el padding
          interno de cada columna, por eso el contenedor no lleva gap. */}
      <div className="flex items-stretch">
        {leftColumns.map((col) => (
          <RoundColumn
            key={`l-${col.stage}`}
            title={SHORT_LABELS[col.stage]}
            matches={col.matches}
            predByMatch={predByMatch}
            side="left"
            isOutermost={col.stage === "ROUND_32"}
            project={project}
          />
        ))}

        {/* Centro: la final, alineada verticalmente con las semifinales. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="mb-2 select-none text-center text-[10px] font-bold text-amber-400 lg:text-xs">
            {SHORT_LABELS.FINAL}
          </h2>
          <div className="relative flex flex-1 items-center px-1.5 lg:px-2.5">
            <span className={`absolute left-0 top-1/2 h-px w-1.5 ${LINE} lg:w-2.5`} />
            <span className={`absolute right-0 top-1/2 h-px w-1.5 ${LINE} lg:w-2.5`} />
            {finalMatch && (
              <div className="w-full">
                <BracketCard
                  match={finalMatch}
                  prediction={predByMatch.get(finalMatch.id)}
                />
              </div>
            )}
          </div>
        </div>

        {rightColumns.map((col) => (
          <RoundColumn
            key={`r-${col.stage}`}
            title={SHORT_LABELS[col.stage]}
            matches={col.matches}
            predByMatch={predByMatch}
            side="right"
            isOutermost={col.stage === "ROUND_32"}
            project={project}
          />
        ))}
      </div>

      <p className="text-center text-[11px] text-slate-500">
        Los equipos <span className="text-slate-400 opacity-60">atenuados</span>
        <span className="hidden lg:inline">
          {" "}(<span className="italic text-slate-400">en cursiva</span>)
        </span>{" "}
        son una proyección provisional (1° y 2° de cada grupo según las
        posiciones actuales). Los terceros y rondas siguientes se definen al
        avanzar el torneo.
      </p>

      {/* El tercer puesto no forma parte del camino de ganadores, va aparte. */}
      {thirdPlace && (
        <div className="flex flex-col items-center">
          <h2 className="mb-2 text-center text-xs font-semibold text-sky-400">
            {SHORT_LABELS.THIRD_PLACE}
          </h2>
          <div className="w-1/3 sm:w-44 lg:w-40">
            <BracketCard
              match={thirdPlace}
              prediction={predByMatch.get(thirdPlace.id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
