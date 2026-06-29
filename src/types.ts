export type I18nLocale = "zh" | "es" | "fr" | "de" | "ja" | "ru" | "ko" | "pt";

export type I18nText = Partial<Record<I18nLocale, { name?: string; desc?: string }>>;

export interface Skill {
  key: string;
  slug: string;
  name: string;
  desc: string;
  i18n?: I18nText;
}

export interface SkillWithBadge extends Skill {
  badge: string;
}

export interface SkillTree {
  key: string;
  slug: string;
  name: string;
  skills: Skill[];
}

export interface SkillTreeWithBadges extends Omit<SkillTree, "skills"> {
  skills: SkillWithBadge[];
}

export interface SkillTreeSummary {
  key: string;
  slug: string;
  name: string;
  skill_count: number;
  path: string;
}

export interface CatalogManifest {
  version: string;
  hash: string;
  updated_at: string;
}

export interface SkillTreesResponse extends CatalogManifest {
  skilltrees: SkillTreeWithBadges[];
}

export interface SkillTreeSummariesResponse extends CatalogManifest {
  skilltrees: SkillTreeSummary[];
}

export interface SkillTreeCatalog {
  manifest: CatalogManifest;
  skilltrees: SkillTree[];
}
