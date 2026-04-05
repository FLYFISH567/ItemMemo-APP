import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const mode = process.argv.includes("--sync") ? "sync" : "check";
const root = process.cwd();
const pairs = [
  ["App.vue", "src/App.vue"],
  ["main.ts", "src/main.ts"],
  ["manifest.json", "src/manifest.json"],
  ["pages.json", "src/pages.json"],
  ["types.ts", "src/types.ts"],
  ["components", "src/components"],
  ["custom-tab-bar", "src/custom-tab-bar"],
  ["pages", "src/pages"],
  ["services", "src/services"],
  ["storage", "src/storage"],
  ["utils", "src/utils"],
];

function hashFile(filePath) {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

function walkFiles(dirPath, baseDir = dirPath) {
  const results = [];
  for (const entry of readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry);
    const st = statSync(fullPath);
    if (st.isDirectory()) {
      results.push(...walkFiles(fullPath, baseDir));
    } else {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, "/"));
    }
  }
  return results.sort();
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

const diffs = [];

for (const [target, source] of pairs) {
  const targetAbs = path.join(root, target);
  const sourceAbs = path.join(root, source);

  if (!existsSync(sourceAbs)) {
    diffs.push(`MISSING_SOURCE ${source}`);
    continue;
  }

  const sourceStat = statSync(sourceAbs);
  if (sourceStat.isDirectory()) {
    if (mode === "sync") {
      ensureDir(targetAbs);
      cpSync(sourceAbs, targetAbs, { recursive: true, force: true });
      continue;
    }

    if (!existsSync(targetAbs)) {
      diffs.push(`MISSING_TARGET_DIR ${target}`);
      continue;
    }

    const sourceFiles = walkFiles(sourceAbs);
    const targetFiles = walkFiles(targetAbs);
    const sourceSet = new Set(sourceFiles);
    const targetSet = new Set(targetFiles);

    for (const rel of sourceFiles) {
      if (!targetSet.has(rel)) {
        diffs.push(`MISSING_TARGET_FILE ${target}/${rel}`);
        continue;
      }
      const sHash = hashFile(path.join(sourceAbs, rel));
      const tHash = hashFile(path.join(targetAbs, rel));
      if (sHash !== tHash) {
        diffs.push(`DIFF_FILE ${target}/${rel}`);
      }
    }

    for (const rel of targetFiles) {
      if (!sourceSet.has(rel)) {
        diffs.push(`EXTRA_TARGET_FILE ${target}/${rel}`);
      }
    }
  } else {
    if (mode === "sync") {
      cpSync(sourceAbs, targetAbs, { force: true });
      continue;
    }

    if (!existsSync(targetAbs)) {
      diffs.push(`MISSING_TARGET_FILE ${target}`);
      continue;
    }

    const sHash = hashFile(sourceAbs);
    const tHash = hashFile(targetAbs);
    if (sHash !== tHash) {
      diffs.push(`DIFF_FILE ${target}`);
    }
  }
}

if (mode === "sync") {
  console.log("SYNC_DONE root mirror has been updated from src");
  process.exit(0);
}

if (diffs.length) {
  console.error("PARITY_FAIL");
  for (const line of diffs) {
    console.error(line);
  }
  process.exit(1);
}

console.log("PARITY_OK root mirror matches src");
