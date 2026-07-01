import type { I18nLocale, Skill, SkillTree, SkillTreeCatalog } from './types';
import { formatBadgeSecondaryText } from './badge-labels';
import { getBadgeTheme, getBadgeVariant, renderBadgeSvg } from './badge-renderer';

const SUPPORTED_BADGE_LOCALES = new Set(['en', 'zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);
const LOCALIZED_SKILL_LOCALES = new Set(['zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);
const SKILL_BADGE_PATH_PATTERN = /^\/badges\/skills\/([^/]+)\/([^/]+)\.svg$/;

interface BadgeRouteMatch {
	treeKey: string;
	skillSlug: string;
}

function getLocalizedSkillName(skill: Skill, locale: string) {
	if (locale === 'en' || !LOCALIZED_SKILL_LOCALES.has(locale)) {
		return skill.name;
	}

	return skill.i18n?.[locale as I18nLocale]?.name ?? skill.name;
}

function renderSkillBadgeSvg(skilltree: SkillTree, skill: Skill, locale: string, variant: ReturnType<typeof getBadgeVariant>, theme: ReturnType<typeof getBadgeTheme>) {
	const skillName = getLocalizedSkillName(skill, locale);

	return renderBadgeSvg({
		iconKey: skilltree.key,
		title: `${skilltree.name} - ${skillName}`,
		desc: `LabEx skill badge for ${skill.key}`,
		primaryText: skillName,
		secondaryText: formatBadgeSecondaryText(skilltree.name, 'skill', locale),
		variant,
		theme,
	});
}

function parseBadgePath(pathname: string): BadgeRouteMatch | null {
	const match = pathname.match(SKILL_BADGE_PATH_PATTERN);
	if (!match) {
		return null;
	}

	try {
		return {
			treeKey: decodeURIComponent(match[1]),
			skillSlug: decodeURIComponent(match[2]),
		};
	} catch {
		return null;
	}
}

function getBadgeLocale(searchParams: URLSearchParams) {
	return searchParams.get('lang')?.toLowerCase() || 'en';
}

function findSkillForBadgePath(skilltree: SkillTree, skillSlug: string) {
	const exactSkill = skilltree.skills.find((item) => item.slug === skillSlug);
	if (exactSkill) {
		return exactSkill;
	}

	const normalizedSlug = skillSlug.replace(/-/g, '_');
	if (normalizedSlug === skillSlug) {
		return undefined;
	}

	return skilltree.skills.find((item) => item.slug === normalizedSlug);
}

function badgeErrorResponse(error: string, status: number) {
	return new Response(JSON.stringify({ error }), {
		status,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=60, s-maxage=300',
		},
	});
}

export function handleBadgeRequest(request: Request, catalog: SkillTreeCatalog) {
	const url = new URL(request.url);
	const match = parseBadgePath(url.pathname);
	const locale = getBadgeLocale(url.searchParams);
	const variant = getBadgeVariant(url.searchParams);
	const theme = getBadgeTheme(url.searchParams);

	if (!match) {
		return null;
	}

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
				'Access-Control-Allow-Headers': 'Accept, Content-Type, If-None-Match',
			},
		});
	}

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return badgeErrorResponse('method_not_allowed', 405);
	}

	if (!SUPPORTED_BADGE_LOCALES.has(locale)) {
		return badgeErrorResponse('unsupported_locale', 404);
	}

	const skilltree = catalog.skilltrees.find((item) => item.key === match.treeKey);
	if (!skilltree) {
		return badgeErrorResponse('skilltree_not_found', 404);
	}

	const skill = findSkillForBadgePath(skilltree, match.skillSlug);
	if (!skill) {
		return badgeErrorResponse('skill_not_found', 404);
	}

	const etag = JSON.stringify(`${catalog.manifest.hash}:badge:${locale}:${skill.key}:${variant}:${theme}`);
	const headers = new Headers({
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'image/svg+xml; charset=utf-8',
		'Cache-Control': 'public, max-age=60, s-maxage=300',
		ETag: etag,
	});

	if (request.headers.get('If-None-Match') === etag) {
		return new Response(null, {
			status: 304,
			headers,
		});
	}

	const svg = renderSkillBadgeSvg(skilltree, skill, locale, variant, theme);

	return new Response(request.method === 'HEAD' ? null : svg, {
		status: 200,
		headers,
	});
}
