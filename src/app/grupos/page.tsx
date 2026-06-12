import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getGroupStandings } from "@/lib/queries";
import { GroupStandingsTable } from "@/components/group-standings-table";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Grupos del Mundial · Quiniela Mundial 2026",
};

export default async function GruposPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const groups = await getGroupStandings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Grupos del Mundial 2026</h1>
        <p className="text-sm text-slate-400">
          Posiciones reales de cada grupo según los resultados. Los 2 primeros de
          cada grupo avanzan directo.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.letter}
            className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900"
          >
            <h2 className="border-b border-slate-800 p-3 font-semibold text-white">
              Grupo {group.letter}
            </h2>
            <GroupStandingsTable group={group} />
          </section>
        ))}
      </div>
    </div>
  );
}
