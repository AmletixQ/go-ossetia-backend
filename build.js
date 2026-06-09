import esbuild from "esbuild";
import { rmSync } from "fs";

const production = process.env.NODE_ENV === "production";

console.log("[+] Starting build...");

rmSync("dist", { recursive: true, force: true });

await esbuild
  .build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: "dist/index.js",
    sourcemap: !production,
    minify: production,

    external: ["@prisma/client"],
    packages: "external",

    tsconfig: "tsconfig.json",

    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV || production}"`,
    },

    logLevel: "info",
  })
  .catch(() => process.exit(1));

console.log("[+] Build completed successfully!");
