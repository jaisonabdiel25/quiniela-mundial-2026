"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type GroupCard = {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  ownerName: string;
};

export function MyGroupsBar({ groups }: { groups: GroupCard[] }) {
  const pathname = usePathname();

  // Detecta si estamos en la página de un grupo (/groups/[id]); /groups/new y
  // /groups/join no cuentan como página de grupo.
  const match = /^\/groups\/([^/]+)$/.exec(pathname ?? "");
  const currentId =
    match && match[1] !== "new" && match[1] !== "join" ? match[1] : null;
  const onGroupPage = currentId !== null;

  // En la página de un grupo se ocultan el grupo actual y, si no quedan otros
  // (el usuario solo tiene ese grupo), no se muestra la barra.
  const visible = onGroupPage
    ? groups.filter((g) => g.id !== currentId)
    : groups;
  if (onGroupPage && visible.length === 0) return null;

  return (
    <section>
      <div className="mx-auto w-full max-w-5xl px-4 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Mis grupos
          </h2>
          <div className="flex gap-2">
            <Link
              href="/groups/new"
              className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-500"
            >
              Crear grupo
            </Link>
            <Link
              href="/groups/join"
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
            >
              Unirme con código
            </Link>
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">
            Aún no perteneces a ningún grupo. Crea uno o únete con un código.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-sky-600"
              >
                <h3 className="font-semibold text-white">{group.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {group.memberCount}{" "}
                  {group.memberCount === 1 ? "miembro" : "miembros"} · admin:{" "}
                  {group.ownerName}
                </p>
                <p className="mt-2 font-mono text-sm tracking-widest text-sky-400">
                  {group.code}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
