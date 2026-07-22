import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getGroupLeaderboard, getGroupPointsMatrix } from "@/lib/queries";
import { deleteGroup, leaveGroup, removeMember } from "@/lib/actions/groups";
import { ConfirmButton } from "@/components/confirm-button";
import { ValidFromForm } from "@/components/group-forms";
import { MemberPredictionsModal } from "@/components/member-predictions-modal";
import { GroupPointsMatrix } from "@/components/group-points-matrix";
import { formatPanama } from "@/lib/timezone";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
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
  const [{ rows: leaderboard, validFrom }, pointsMatrix] = await Promise.all([
    getGroupLeaderboard(group.id),
    getGroupPointsMatrix(group.id),
  ]);

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
              {formatPanama(validFrom, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full bg-slate-900 text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-2 py-2.5 sm:px-3">#</th>
                <th className="px-2 py-2.5 sm:px-3">Jugador</th>
                <th className="px-1.5 py-2.5 text-right sm:px-3" title="Puntos">
                  <span className="sm:hidden">Pts</span>
                  <span className="hidden sm:inline">Puntos</span>
                </th>
                <th className="px-1.5 py-2.5 text-right sm:px-3" title="Marcadores exactos">
                  <span className="sm:hidden">Ex</span>
                  <span className="hidden sm:inline">Exactos</span>
                </th>
                <th className="px-1.5 py-2.5 text-right sm:px-3" title="Predicciones">
                  <span className="sm:hidden">Pred</span>
                  <span className="hidden sm:inline">Predicciones</span>
                </th>
                {isOwner && <th className="px-2 py-2.5 sm:px-3" />}
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
                  <td className="px-2 py-2.5 text-slate-400 sm:px-3">{i + 1}</td>
                  <td className="px-2 py-2.5 text-white sm:px-3">
                    <MemberPredictionsModal
                      groupId={group.id}
                      userId={row.userId}
                      name={row.name}
                    />
                    {row.userId === group.ownerId && (
                      <span className="ml-2 text-xs text-violet-400">admin</span>
                    )}
                  </td>
                  <td className="px-1.5 py-2.5 text-right font-bold text-sky-400 sm:px-3">
                    {row.points}
                  </td>
                  <td className="px-1.5 py-2.5 text-right text-slate-300 sm:px-3">
                    {row.exactCount}
                  </td>
                  <td className="px-1.5 py-2.5 text-right text-slate-300 sm:px-3">
                    {row.predictionCount}
                  </td>
                  {isOwner && (
                    <td className="px-2 py-2.5 text-right sm:px-3">
                      {row.userId !== userId && (
                        <ConfirmButton
                          action={removeMember.bind(null, group.id, row.userId)}
                          confirmMessage={`¿Expulsar a ${row.name} del grupo?`}
                          className="text-red-400 hover:text-red-300"
                        >
                          <span className="hidden text-xs hover:underline sm:inline">
                            Expulsar
                          </span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4 sm:hidden"
                            aria-label="Expulsar"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 10.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                            />
                          </svg>
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

      <details className="group rounded-lg border border-slate-800 bg-slate-900">
        <summary className="flex cursor-pointer items-center justify-between gap-2 p-3 text-lg font-semibold text-white">
          Puntos por partido
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </summary>
        <div className="border-t border-slate-800 p-3">
          <GroupPointsMatrix members={leaderboard} matrix={pointsMatrix} />
        </div>
      </details>

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
