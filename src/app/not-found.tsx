import Link from "next/link";

// Pantalla 404 propia (en español). Se muestra para URLs sin ruta y para las
// llamadas a notFound() de /groups/[id] y /matches/[matchId].
export default function NotFound() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <div className="text-6xl font-bold text-sky-500">404</div>
      <h1 className="mt-4 text-xl font-bold text-white">
        Página no encontrada
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        El enlace que seguiste no existe o el contenido ya no está disponible.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-500"
        >
          Ir al inicio
        </Link>
        <Link
          href="/matches"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800"
        >
          Ver partidos
        </Link>
      </div>
    </div>
  );
}
