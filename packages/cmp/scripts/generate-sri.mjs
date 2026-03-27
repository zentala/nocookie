/**
 * Generates Subresource Integrity (SRI) hashes for distribution files.
 *
 * SRI hashes allow browsers to verify that fetched resources (e.g., from a CDN)
 * have not been tampered with. Output is written to dist/sri-hashes.json.
 *
 * Usage: node scripts/generate-sri.mjs
 * CDN pattern: cdn.nocookie.zentala.io/cmp/v{major}/nocookie-cmp.min.js
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "..", "dist");

const TARGET_FILES = [
  "nocookie-cmp.esm.js",
  "nocookie-cmp.umd.cjs",
  "nocookie-cmp.css",
];

/** Computes a SHA-384 SRI hash for the given file content. */
function computeSriHash(content) {
  const hash = createHash("sha384").update(content).digest("base64");
  return `sha384-${hash}`;
}

function main() {
  const hashes = {};
  const missing = [];

  for (const file of TARGET_FILES) {
    const filePath = resolve(distDir, file);
    if (!existsSync(filePath)) {
      missing.push(file);
      continue;
    }
    const content = readFileSync(filePath);
    hashes[`dist/${file}`] = computeSriHash(content);
  }

  if (missing.length > 0) {
    console.error(`Missing dist files: ${missing.join(", ")}`);
    console.error("Run 'pnpm build' first.");
    process.exit(1);
  }

  const outputPath = resolve(distDir, "sri-hashes.json");
  writeFileSync(outputPath, JSON.stringify(hashes, null, 2) + "\n");
  console.log("SRI hashes generated:");
  for (const [file, hash] of Object.entries(hashes)) {
    console.log(`  ${file}: ${hash}`);
  }
}

main();
