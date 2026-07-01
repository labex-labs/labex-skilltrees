import { getBadgeResourceLabel } from './badge-labels';
import { getBadgeTheme, renderBadgeSvg } from './badge-renderer';
import type { SkillTree, SkillTreeCatalog } from './types';

const SKILLTREE_BADGE_PATH_PATTERN = /^\/badges\/skilltrees\/([^/]+)\.svg$/;
const SUPPORTED_SKILLTREE_BADGE_LANGS = new Set(['en', 'zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);

interface SkilltreeBadgeRouteMatch {
	treeKey: string;
}

function parseSkilltreeBadgePath(pathname: string): SkilltreeBadgeRouteMatch | null {
	const match = pathname.match(SKILLTREE_BADGE_PATH_PATTERN);
	if (!match) {
		return null;
	}

	try {
		return {
			treeKey: decodeURIComponent(match[1]),
		};
	} catch {
		return null;
	}
}

function normalizeSkilltreeBadgeLang(searchParams: URLSearchParams) {
	const lang = searchParams.get('lang')?.toLowerCase() || 'en';
	return SUPPORTED_SKILLTREE_BADGE_LANGS.has(lang) ? lang : null;
}

function skilltreeBadgeErrorResponse(error: string, status: number) {
	return new Response(JSON.stringify({ error }), {
		status,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=60, s-maxage=300',
		},
	});
}

function renderSkilltreeBadgeSvg(skilltree: SkillTree, lang: string, theme: ReturnType<typeof getBadgeTheme>) {
	const secondaryText = `LabEx ${getBadgeResourceLabel('skilltree', lang)}`;

	return renderBadgeSvg({
		iconKey: skilltree.key,
		title: `${secondaryText} - ${skilltree.name}`,
		desc: `LabEx skilltree badge for ${skilltree.key}`,
		primaryText: skilltree.name,
		secondaryText,
		variant: 'default',
		theme,
	});
}

export function handleSkilltreeBadgeRequest(request: Request, catalog: SkillTreeCatalog) {
	const url = new URL(request.url);
	const match = parseSkilltreeBadgePath(url.pathname);
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
		return skilltreeBadgeErrorResponse('method_not_allowed', 405);
	}

	const lang = normalizeSkilltreeBadgeLang(url.searchParams);
	if (!lang) {
		return skilltreeBadgeErrorResponse('unsupported_lang', 404);
	}

	const skilltree = catalog.skilltrees.find((item) => item.key === match.treeKey);
	if (!skilltree) {
		return skilltreeBadgeErrorResponse('skilltree_not_found', 404);
	}

	const etag = JSON.stringify(`${catalog.manifest.hash}:skilltree-badge:${skilltree.key}:${lang}:${theme}`);
	const headers = new Headers({
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'image/svg+xml; charset=utf-8',
		'Cache-Control': 'public, max-age=300, s-maxage=3600',
		ETag: etag,
	});

	if (request.headers.get('If-None-Match') === etag) {
		return new Response(null, {
			status: 304,
			headers,
		});
	}

	const svg = renderSkilltreeBadgeSvg(skilltree, lang, theme);

	return new Response(request.method === 'HEAD' ? null : svg, {
		status: 200,
		headers,
	});
}
