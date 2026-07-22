// Fallback de Suspense mientras corren las queries dinámicas de cada página.
// Esqueleto simple para que la navegación no se sienta congelada.
export default function Loading() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded bg-slate-800" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-800/60" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border border-slate-800 bg-slate-900"
          />
        ))}
      </div>
    </div>
  );
}
