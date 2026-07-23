import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resuelve el alias "@/*" de tsconfig.json de forma nativa (Vite).
  resolve: { tsconfigPaths: true },
  test: {
    // Dos proyectos según el tipo de test:
    //  - node  → lógica/acciones/queries (*.test.ts)
    //  - jsdom → render de componentes y páginas (*.test.tsx)
    projects: [
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
          clearMocks: true,
        },
      },
      {
        resolve: { tsconfigPaths: true },
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          setupFiles: ["src/test/setup-dom.ts"],
          clearMocks: true,
        },
      },
    ],
    // La cobertura se configura a nivel raíz (aplica a ambos proyectos).
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Con `include` puesto, Vitest reporta TODOS los archivos que coincidan
      // (incluidos los que no tocan los tests, que salen en 0%).
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "src/generated/**",
        "src/**/*.d.ts",
        // Utilidades solo de test (mocks, factorías, helpers).
        "src/test/**",
        "src/**/__mocks__/**",
      ],
    },
  },
});
