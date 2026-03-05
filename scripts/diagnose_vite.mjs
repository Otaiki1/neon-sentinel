import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

async function run() {
  const out = {
    cwd: process.cwd(),
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    timestamp: Date.now(),
    resolved: {},
  };

  try {
    const vitePkgJson = require.resolve("vite/package.json");
    out.resolved.vitePackageJson = vitePkgJson;
    const viteDir = path.dirname(vitePkgJson);
    out.resolved.viteDir = viteDir;
    const entries = await fs.readdir(viteDir).catch(() => []);
    out.resolved.viteDirEntries = entries.slice(0, 20);
  } catch (e) {
    out.resolved.viteResolveError = String(e?.message ?? e);
  }

  try {
    const binDir = path.join(process.cwd(), "node_modules", ".bin");
    const bins = await fs.readdir(binDir).catch(() => []);
    out.resolved.binHasVite = bins.includes("vite");
    out.resolved.binCount = bins.length;
    out.resolved.binSample = bins.slice(0, 20);
  } catch (e) {
    out.resolved.binError = String(e?.message ?? e);
  }

  // #region agent log
  fetch("http://127.0.0.1:7247/ingest/bba0575c-b79c-4daa-ac99-7731512b823d", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location: "scripts/diagnose_vite.mjs:1",
      message: "diagnose vite resolution",
      data: out,
      timestamp: Date.now(),
      runId: "pre-fix",
      hypothesisId: "H1",
    }),
  }).catch(() => {});
  // #endregion
}

await run();

