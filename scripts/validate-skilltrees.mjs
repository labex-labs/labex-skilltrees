import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { CATALOG_VERSIONS } from "./catalog.mjs";

const LOCALES = new Set(["zh", "es", "fr", "de", "ja", "ru", "ko", "pt"]);
const TREE_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const SKILL_SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

const failures = [];

function fail(filePath, message) {
  failures.push(`${filePath}: ${message}`);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function validateLocalizedText(filePath, skillKey, i18n) {
  if (i18n === undefined) {
    return;
  }

  if (!i18n || typeof i18n !== "object" || Array.isArray(i18n)) {
    fail(filePath, `${skillKey}.i18n must be an object when present`);
    return;
  }

  for (const [locale, value] of Object.entries(i18n)) {
    if (!LOCALES.has(locale)) {
      fail(filePath, `${skillKey}.i18n uses unsupported locale "${locale}"`);
      continue;
    }

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      fail(filePath, `${skillKey}.i18n.${locale} must be an object`);
      continue;
    }

    for (const key of Object.keys(value)) {
      if (key !== "name" && key !== "desc") {
        fail(filePath, `${skillKey}.i18n.${locale}.${key} is not allowed`);
      }
    }

    if ("name" in value && !isNonEmptyString(value.name)) {
      fail(filePath, `${skillKey}.i18n.${locale}.name must be a non-empty string`);
    }

    if ("desc" in value && !isNonEmptyString(value.desc)) {
      fail(filePath, `${skillKey}.i18n.${locale}.desc must be a non-empty string`);
    }
  }
}

function validateSkill(filePath, treeKey, skill, seenSkillKeys, seenSkillSlugs) {
  if (!skill || typeof skill !== "object" || Array.isArray(skill)) {
    fail(filePath, "each skill must be an object");
    return;
  }

  for (const key of Object.keys(skill)) {
    if (!["key", "slug", "name", "desc", "i18n"].includes(key)) {
      fail(filePath, `${skill.key ?? "unknown skill"}.${key} is not allowed`);
    }
  }

  if (!isNonEmptyString(skill.slug) || !SKILL_SLUG_PATTERN.test(skill.slug)) {
    fail(filePath, `${skill.key ?? "unknown skill"} must have a valid slug`);
  }

  const expectedKey = `${treeKey}/${skill.slug}`;
  if (skill.key !== expectedKey) {
    fail(filePath, `${skill.key ?? "unknown skill"} key must equal ${expectedKey}`);
  }

  if (seenSkillKeys.has(skill.key)) {
    fail(filePath, `${skill.key} is duplicated`);
  }
  seenSkillKeys.add(skill.key);

  if (seenSkillSlugs.has(skill.slug)) {
    fail(filePath, `${skill.slug} slug is duplicated`);
  }
  seenSkillSlugs.add(skill.slug);

  if (!isNonEmptyString(skill.name)) {
    fail(filePath, `${skill.key} must have a non-empty name`);
  }

  if (typeof skill.desc !== "string") {
    fail(filePath, `${skill.key} desc must be a string`);
  }

  validateLocalizedText(filePath, skill.key, skill.i18n);
}

async function validateTree(rootDir, version, fileName) {
  const filePath = join(version, fileName);
  const raw = await readFile(join(rootDir, filePath), "utf8");
  let tree;

  try {
    tree = JSON.parse(raw);
  } catch (error) {
    fail(filePath, `invalid JSON: ${error.message}`);
    return;
  }

  for (const key of Object.keys(tree)) {
    if (!["key", "slug", "name", "skills"].includes(key)) {
      fail(filePath, `${key} is not allowed at the skill tree root`);
    }
  }

  const expectedTreeKey = fileName.replace(/\.json$/, "");
  if (tree.key !== expectedTreeKey) {
    fail(filePath, `key must equal file name "${expectedTreeKey}"`);
  }

  if (tree.slug !== tree.key) {
    fail(filePath, "slug must equal key");
  }

  if (!isNonEmptyString(tree.key) || !TREE_KEY_PATTERN.test(tree.key)) {
    fail(filePath, "key must be a lowercase ASCII identifier");
  }

  if (!isNonEmptyString(tree.name)) {
    fail(filePath, "name must be a non-empty string");
  }

  if (!Array.isArray(tree.skills) || tree.skills.length === 0) {
    fail(filePath, "skills must be a non-empty array");
    return;
  }

  const seenSkillKeys = new Set();
  const seenSkillSlugs = new Set();
  for (const skill of tree.skills) {
    validateSkill(filePath, tree.key, skill, seenSkillKeys, seenSkillSlugs);
  }
}

async function validateVersion(rootDir, version) {
  const fileNames = (await readdir(join(rootDir, version)))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  if (fileNames.length === 0) {
    fail(version, "must contain at least one skill tree JSON file");
  }

  for (const fileName of fileNames) {
    await validateTree(rootDir, version, fileName);
  }
}

for (const version of Object.values(CATALOG_VERSIONS)) {
  await validateVersion(process.cwd(), version);
}

if (failures.length > 0) {
  console.error(`${failures.length} validation issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Skill tree validation passed");
