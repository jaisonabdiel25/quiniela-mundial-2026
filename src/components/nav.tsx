import Link from "next/link";
import { auth } from "@/auth";
import { logout } from "@/lib/actions/auth";

export async function Nav() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-emerald-400">
          ⚽ Quiniela Mundial 2026
        </Link>
        {session?.user ? (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/" className="text-zinc-300 hover:text-white">
              Inicio
            </Link>
            <Link href="/matches" className="text-zinc-300 hover:text-white">
              Partidos
            </Link>
            {session.user.role === "ADMIN" && (
              <Link href="/admin" className="text-amber-400 hover:text-amber-300">
                Admin
              </Link>
            )}
            <span className="hidden text-zinc-500 sm:inline">
              {session.user.name}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-zinc-700 px-3 py-1 text-zinc-300 hover:bg-zinc-800"
              >
                Salir
              </button>
            </form>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
