import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

export const CATALOG_VERSIONS = {
  v1: "v1",
  v2: "v2"
};

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

async function getLatestSkilltreeCommitDate(rootDir, dataDir) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);

  try {
    const { stdout } = await execFileAsync("git", ["log", "-1", "--format=%cI", "--", dataDir], {
      cwd: rootDir
    });
    const value = stdout.trim();
    return value || null;
  } catch {
    return null;
  }
}

export async function loadSkillTrees(rootDir = process.cwd(), dataDir = CATALOG_VERSIONS.v2) {
  const skilltreesDir = join(rootDir, dataDir);
  const fileNames = (await readdir(skilltreesDir))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  const skillTrees = await Promise.all(
    fileNames.map(async (fileName) => {
      const raw = await readFile(join(skilltreesDir, fileName), "utf8");
      return JSON.parse(raw);
    })
  );

  return skillTrees.sort((a, b) => a.key.localeCompare(b.key));
}

export async function buildCatalog(rootDir = process.cwd(), dataDir = CATALOG_VERSIONS.v2) {
  const skilltrees = await loadSkillTrees(rootDir, dataDir);
  const canonicalJson = stableStringify(skilltrees);
  const hash = `sha256:${createHash("sha256").update(canonicalJson).digest("hex")}`;
  const latestCommitDate = await getLatestSkilltreeCommitDate(rootDir, dataDir);
  const updatedAt = latestCommitDate ?? new Date().toISOString();

  return {
    manifest: {
      version: updatedAt.slice(0, 10),
      hash,
      updated_at: updatedAt
    },
    skilltrees
  };
}
