import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getGroupLeaderboard } from "@/lib/queries";
import { deleteGroup, leaveGroup, removeMember } from "@/lib/actions/groups";
import { ConfirmButton } from "@/components/confirm-button";
import { ValidFromForm } from "@/components/group-forms";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const group = await prisma.group.findUnique({
    where: { id },
    include: { owner: { select: { id: true, name: true } } },
  });
  if (!group) notFound();

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: group.id } },
  });
  if (!membership) {
    return (
      <div className="mx-auto mt-12 max-w-sm text-center">
        <p className="text-slate-300">No perteneces a este grupo.</p>
        <Link
          href="/groups/join"
          className="mt-4 inline-block text-sky-400 hover:underline"
        >
          Unirme con un código →
        </Link>
      </div>
    );
  }

  const isOwner = group.ownerId === userId;
  const { rows: leaderboard, validFrom } = await getGroupLeaderboard(group.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          <p className="text-sm text-slate-400">
            Administrador: {group.owner.name}
          </p>
        </div>
        <div className="rounded-lg border border-sky-800 bg-sky-950 px-4 py-2 text-center">
          <p className="text-xs text-sky-300">Código para invitar</p>
          <p className="font-mono text-xl font-bold tracking-widest text-sky-400">
            {group.code}
          </p>
        </div>
      </div>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-white">
            Tabla de posiciones
          </h2>
          {validFrom && (
            <span className="rounded-full border border-violet-700 bg-violet-950 px-3 py-0.5 text-xs text-violet-300">
              Desde{" "}
              {new Date(validFrom).toLocaleString("es", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full bg-slate-900 text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="p-3">#</th>
                <th className="p-3">Jugador</th>
                <th className="p-3 text-right">Puntos</th>
                <th className="p-3 text-right">Exactos</th>
                <th className="p-3 text-right">Predicciones</th>
                {isOwner && <th className="p-3" />}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr
                  key={row.userId}
                  className={`border-b border-slate-800/50 last:border-0 ${
                    row.userId === userId ? "bg-sky-950/40" : ""
                  }`}
                >
                  <td className="p-3 text-slate-400">{i + 1}</td>
                  <td className="p-3 text-white">
                    {row.name}
                    {row.userId === group.ownerId && (
                      <span className="ml-2 text-xs text-violet-400">admin</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-bold text-sky-400">
                    {row.points}
                  </td>
                  <td className="p-3 text-right text-slate-300">{row.exactCount}</td>
                  <td className="p-3 text-right text-slate-300">
                    {row.predictionCount}
                  </td>
                  {isOwner && (
                    <td className="p-3 text-right">
                      {row.userId !== userId && (
                        <ConfirmButton
                          action={removeMember.bind(null, group.id, row.userId)}
                          confirmMessage={`¿Expulsar a ${row.name} del grupo?`}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Expulsar
                        </ConfirmButton>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isOwner && (
        <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-300">
            Configuración de la tabla
          </h3>
          <ValidFromForm groupId={group.id} validFrom={validFrom} />
        </section>
      )}

      <div className="flex gap-3">
        {isOwner ? (
          <ConfirmButton
            action={deleteGroup.bind(null, group.id)}
            confirmMessage="¿Eliminar el grupo definitivamente? Esta acción no se puede deshacer."
            className="rounded-md border border-red-800 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950"
          >
            Eliminar grupo
          </ConfirmButton>
        ) : (
          <ConfirmButton
            action={leaveGroup.bind(null, group.id)}
            confirmMessage="¿Salir de este grupo?"
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
          >
            Salir del grupo
          </ConfirmButton>
        )}
      </div>
    </div>
  );
}
