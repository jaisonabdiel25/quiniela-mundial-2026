// Setup del entorno jsdom (proyecto de render).
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Desmonta lo renderizado entre tests (sin globals, RTL no lo hace solo).
afterEach(() => {
  cleanup();
});
