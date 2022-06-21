import { defineConfig } from "vitest/config";
import viteTsConfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig(async () => {
  return {
    build: {
      lib: {
        formats: ["cjs", "es"],
        entry: path.resolve(__dirname, "./src/index.ts"),
        fileName: (format) => `index.${format}.js`,
      },
      target: "esnext",
      emptyOutDir: true,
      minify: true,
      rollupOptions: {
        external: [
          "class-transformer",
          "class-validator",
          "js-yaml",
          "json5",
          "dotenv",
          "merge-deep",
        ],
      },
    },
    test: {
      globals: true,
    },
    plugins: [viteTsConfigPaths()],
  };
});
