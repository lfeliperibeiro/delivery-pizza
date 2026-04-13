import path from "path"
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/test/**", "src/main.tsx", "src/assets/**", "src/components/ui/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
