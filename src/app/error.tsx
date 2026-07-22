"use client"; // Los error boundaries deben ser Client Components

import Link from "next/link";
import { useEffect } from "react";

// Captura errores de render en Server Components (incluye fallos transitorios de
// BD). Muestra UI amable con reintento en vez de la pantalla cruda de error.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Se registra para correlacionar con los logs de Railway vía error.digest.
    console.error("[app error]", error.digest ?? "(sin digest)", error);
  }, [error]);

  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <div className="text-5xl" aria-hidden>
        ⚠️
      </div>
      <h1 className="mt-4 text-xl font-bold text-white">Algo salió mal</h1>
      <p className="mt-2 text-sm text-slate-400">
        Tuvimos un problema al cargar esta página. Suele ser temporal; vuelve a
        intentarlo en unos segundos.
      </p>
      {error.digest && (
        <p className="mt-3 font-mono text-xs text-slate-600">
          Código de error: {error.digest}
        </p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => unstable_retry()}
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
