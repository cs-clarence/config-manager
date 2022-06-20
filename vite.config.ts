import { defineConfig } from "vitest/config";
import { VitePluginNode } from "vite-plugin-node";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(async () => {
  return {
    server: {
      port: 3000,
    },
    build: {
      target: "esnext",
      emptyOutDir: true,
      minify: true,
      rollupOptions: {
        output: {
          format: "esm",
        },
      },
    },
    test: {
      globals: true,
    },
    plugins: [
      ...VitePluginNode({
        adapter: "nest",
        tsCompiler: "swc",
        appPath: "./src/index.ts",
        appName: "app",
        exportName: "app",
      }),
      viteTsConfigPaths(),
    ],
    resolve: {
      alias: {},
    },
    optimizeDeps: {
      exclude: [
        "@nestjs/microservices",
        "@nestjs/websockets",
        "cache-manager",
        "class-transformer",
        "class-validator",
        "fastify-swagger",
      ],
    },
  };
});
