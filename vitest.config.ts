/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

// Dedicated test config. Vitest prefers vitest.config.ts over vite.config.ts, which keeps the
// Tailwind Vite plugin out of the test pipeline (we don't need CSS processing for unit tests).
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the app's "@" → src alias so imports resolve identically under test.
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    // jsdom gives us a DOM for React Testing Library.
    environment: "jsdom",
    // Expose describe/it/expect/vi globally (also referenced by the setup file).
    globals: true,
    // Runs once before the whole suite: registers jest-dom matchers + global stubs.
    setupFiles: ["./src/test/setup.ts"],
    // Only treat *.test.* / *.spec.* as tests; never pull in app sources as suites.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Components import .css via their tree; we don't assert on styles, so skip processing it.
    css: false,
    // Keep the runner from hanging on stray timers/animation frames in CI.
    clearMocks: true,
    restoreMocks: true,
  },
});
