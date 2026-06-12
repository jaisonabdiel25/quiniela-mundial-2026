import Link from "next/link";
import { auth } from "@/auth";
import { NavMenu } from "@/components/nav-menu";

export async function Nav() {
  const session = await auth();

  return (
    <header className="relative border-b border-slate-800 bg-slate-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-sky-400">
          ⚽ Quiniela Mundial 2026
        </Link>
        {session?.user && (
          <NavMenu
            isAdmin={session.user.role === "ADMIN"}
            userName={session.user.name ?? ""}
          />
        )}
      </div>
    </header>
  );
}
