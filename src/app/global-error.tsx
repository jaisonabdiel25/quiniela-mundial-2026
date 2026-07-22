"use client"; // Los error boundaries deben ser Client Components

import { useEffect } from "react";

// Red de seguridad para errores en el propio layout raíz. Reemplaza al layout,
// así que define su <html>/<body> y usa estilos en línea (no carga globals.css).
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error.digest ?? "(sin digest)", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#020617",
          color: "#e2e8f0",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <div style={{ fontSize: "3rem" }} aria-hidden>
            ⚠️
          </div>
          <h1 style={{ marginTop: "1rem", fontSize: "1.25rem", fontWeight: 700, color: "#fff" }}>
            Algo salió mal
          </h1>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#94a3b8" }}>
            Tuvimos un problema temporal. Vuelve a intentarlo en unos segundos.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              marginTop: "1.5rem",
              cursor: "pointer",
              borderRadius: "0.375rem",
              border: "none",
              backgroundColor: "#0284c7",
              padding: "0.5rem 1rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "#fff",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
