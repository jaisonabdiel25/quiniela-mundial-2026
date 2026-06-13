import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBestThirds } from "@/lib/queries";
import { TeamFlag } from "@/components/team-label";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mejores terceros · Quiniela Mundial 2026",
};

// Los 8 mejores terceros (de 12 grupos) avanzan a dieciseisavos.
const QUALIFY = 8;

export default async function TercerosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const thirds = await getBestThirds();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Mejores terceros</h1>
        <p className="text-sm text-slate-400">
          Tercer lugar de cada uno de los 12 grupos. Los{" "}
          <span className="font-semibold text-sky-400">{QUALIFY} mejores</span>{" "}
          avanzan a dieciseisavos. Orden: más puntos, mejor diferencia de goles y
          más goles anotados.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <table className="w-full table-fixed text-xs sm:text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="w-7 px-1 py-2 text-center font-normal">#</th>
              <th className="px-1 py-2 font-normal">Equipo</th>
              <th className="w-12 px-0.5 py-2 text-center font-normal">Grupo</th>
              <th className="w-7 px-0.5 py-2 text-center font-normal" title="Partidos jugados">PJ</th>
              <th className="w-8 px-0.5 py-2 text-center font-normal" title="Diferencia de goles">DG</th>
              <th className="w-8 px-0.5 py-2 text-center font-normal" title="Goles a favor">GF</th>
              <th className="w-8 px-0.5 py-2 text-center font-normal" title="Puntos">Pts</th>
            </tr>
          </thead>
          <tbody>
            {thirds.map((team, i) => {
              const position = i + 1;
              const qualifies = position <= QUALIFY;
              return (
                <tr
                  key={team.teamId}
                  className={`border-b border-slate-800/50 last:border-0 ${
                    position === QUALIFY ? "border-b-2 border-b-sky-800" : ""
                  } ${qualifies ? "bg-sky-950/40" : ""}`}
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
                  <td className="px-0.5 py-1.5 text-center text-slate-300">{team.letter}</td>
                  <td className="px-0.5 py-1.5 text-center text-slate-400">{team.played}</td>
                  <td className="px-0.5 py-1.5 text-center text-slate-300">
                    {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                  </td>
                  <td className="px-0.5 py-1.5 text-center text-slate-300">{team.goalsFor}</td>
                  <td className="px-0.5 py-1.5 text-center font-bold text-sky-400">{team.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        La clasificación es provisional y se actualiza con cada resultado de la
        fase de grupos.
      </p>
    </div>
  );
}
