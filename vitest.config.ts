import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resuelve el alias "@/*" de tsconfig.json de forma nativa (Vite),
  // sin necesidad del plugin vite-tsconfig-paths.
  resolve: { tsconfigPaths: true },
  test: {
    // Lógica pura de dominio: no se necesita DOM.
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Limpia el historial de llamadas de todos los mocks entre tests
    // (no borra sus implementaciones), para que no se filtre estado.
    clearMocks: true,
    coverage: {
      provider: "v8",
      // "text" imprime la tabla en la terminal; "html" genera un reporte
      // navegable en coverage/index.html.
      reporter: ["text", "html"],
      // Con `include` puesto, Vitest reporta TODOS los archivos que coincidan
      // (incluidos los que no tocan los tests, que salen en 0%).
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.ts",
        "src/generated/**",
        "src/**/*.d.ts",
        // Utilidades solo de test (mocks, factorías, helpers).
        "src/test/**",
        "src/**/__mocks__/**",
      ],
    },
  },
});
