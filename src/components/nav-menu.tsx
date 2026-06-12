"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/lib/actions/auth";

const linkClass = "text-slate-300 hover:text-white";

export function NavMenu({
  isAdmin,
  userName,
}: {
  isAdmin: boolean;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const links = (
    <>
      <Link href="/" className={linkClass} onClick={close}>
        Inicio
      </Link>
      <Link href="/matches" className={linkClass} onClick={close}>
        Partidos
      </Link>
      <Link href="/grupos" className={linkClass} onClick={close}>
        Grupos
      </Link>
      <Link href="/reglas" className={linkClass} onClick={close}>
        Reglas
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          className="text-violet-400 hover:text-violet-300"
          onClick={close}
        >
          Admin
        </Link>
      )}
    </>
  );

  const logoutButton = (
    <form action={logout}>
      <button
        type="submit"
        className="rounded-md border border-slate-700 px-3 py-1 text-slate-300 hover:bg-slate-800"
      >
        Salir
      </button>
    </form>
  );

  return (
    <>
      {/* Escritorio: todo en línea */}
      <nav className="hidden items-center gap-4 text-sm sm:flex">
        {links}
        <span className="text-slate-500">{userName}</span>
        {logoutButton}
      </nav>

      {/* Móvil: botón hamburguesa */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-slate-300 hover:text-white sm:hidden"
        aria-label="Menú"
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={open ? "M6 18 18 6M6 6l12 12" : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"}
          />
        </svg>
      </button>

      {/* Móvil: panel desplegable */}
      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-slate-800 bg-slate-950 sm:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 text-sm">
            {links}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-slate-500">{userName}</span>
              {logoutButton}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
