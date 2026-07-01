import { catalog } from './generated/catalog';
import { handleBadgeRequest } from './badges';
import { handleCourseBadgeRequest } from './course-badges';
import { handleSkilltreeBadgeRequest } from './skilltree-badges';
import type {
	I18nLocale,
	Skill,
	SkillTree,
	SkillTreeCatalog,
	SkillTreeSummariesResponse,
	SkillTreesResponse,
	SkillTreeWithBadges,
} from './types';

const SUPPORTED_API_LOCALES = new Set(['en', 'zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);
const RESPONSE_SCHEMA_VERSION = 'badge-field-2026-06-29';

const JSON_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
	'Access-Control-Allow-Headers': 'Accept, Content-Type, If-None-Match',
	'Content-Type': 'application/json; charset=utf-8',
};

function getCatalog() {
	return catalog;
}

function getCacheHeaders(routePathname: string, catalog: SkillTreeCatalog) {
	const maxAge = routePathname === '/manifest' ? '60' : '300';
	const sMaxAge = routePathname === '/manifest' ? '300' : '3600';
	const routeScope = routePathname.startsWith('/api/') ? `:${routePathname}` : '';
	const etag = routePathname === '/manifest' ? catalog.manifest.hash : `${catalog.manifest.hash}:${RESPONSE_SCHEMA_VERSION}${routeScope}`;

	return {
		'Cache-Control': `public, max-age=${maxAge}, s-maxage=${sMaxAge}`,
		ETag: JSON.stringify(etag),
	};
}

function jsonResponse(
	request: Request,
	routePathname: string,
	catalog: SkillTreeCatalog,
	body: unknown,
	init: ResponseInit = {},
) {
	const status = init.status ?? 200;
	const headers = new Headers(JSON_HEADERS);

	for (const [key, value] of Object.entries(getCacheHeaders(routePathname, catalog))) {
		headers.set(key, value);
	}

	for (const [key, value] of new Headers(init.headers).entries()) {
		headers.set(key, value);
	}

	if (status === 200 && request.headers.get('If-None-Match') === headers.get('ETag')) {
		return new Response(null, {
			status: 304,
			headers,
		});
	}

	return new Response(request.method === 'HEAD' ? null : JSON.stringify(body), {
		...init,
		status,
		headers,
	});
}

function optionsResponse() {
	return new Response(null, {
		status: 204,
		headers: JSON_HEADERS,
	});
}

function getSkilltreePath(key: string) {
	const encodedKey = encodeURIComponent(key);
	return `/api/skilltrees/${encodedKey}`;
}

function getBadgePath(skilltreeKey: string, skillSlug: string, locale?: string) {
	const encodedSkilltreeKey = encodeURIComponent(skilltreeKey);
	const badgeFileName = encodeURIComponent(skillSlug.replace(/_/g, '-'));
	const badgePath = `/badges/skills/${encodedSkilltreeKey}/${badgeFileName}.svg`;

	if (locale && locale !== 'en') {
		return `${badgePath}?lang=${encodeURIComponent(locale)}`;
	}

	return badgePath;
}

function withSkillBadges(skilltree: SkillTree): SkillTreeWithBadges {
	return {
		...skilltree,
		skills: skilltree.skills.map((skill) => ({
			...skill,
			badge: getBadgePath(skilltree.key, skill.slug),
		})),
	};
}

function localizeSkill(skill: Skill, locale: string) {
	const localizedText = locale === 'en' ? undefined : skill.i18n?.[locale as I18nLocale];

	return {
		key: skill.key,
		slug: skill.slug,
		name: localizedText?.name ?? skill.name,
		desc: localizedText?.desc ?? skill.desc,
	};
}

function localizedSkilltree(skilltree: SkillTree, locale: string) {
	return {
		key: skilltree.key,
		slug: skilltree.slug,
		name: skilltree.name,
		skills: skilltree.skills.map((skill) => ({
			...localizeSkill(skill, locale),
			badge: getBadgePath(skilltree.key, skill.slug, locale),
		})),
	};
}

function getSkilltreeSummaries(catalog: SkillTreeCatalog): SkillTreeSummariesResponse {
	return {
		...catalog.manifest,
		skilltrees: catalog.skilltrees.map((skilltree) => ({
			key: skilltree.key,
			slug: skilltree.slug,
			name: skilltree.name,
			skill_count: skilltree.skills.length,
			path: getSkilltreePath(skilltree.key),
		})),
	};
}

function rootResponse(request: Request) {
	const catalog = getCatalog();

	return jsonResponse(request, '/', catalog, {
		name: 'labex-skilltrees',
		description: 'HTTP API for LabEx skilltree catalog data.',
		version: catalog.manifest.version,
		endpoints: [
			{
				method: 'GET',
				path: '/',
				description: 'Returns this API documentation as JSON.',
			},
			{
				method: 'GET',
				path: '/api/manifest',
				description: 'Returns catalog version, hash, and update timestamp.',
			},
			{
				method: 'GET',
				path: '/api/skilltrees',
				description: 'Returns all skilltrees.',
			},
			{
				method: 'GET',
				path: '/api/skilltrees/summary',
				description: 'Returns keys, names, skill counts, and API paths for skilltrees.',
			},
			{
				method: 'GET',
				path: '/api/skilltrees/{key}',
				description: 'Returns one skilltree by key.',
			},
			{
				method: 'GET',
				path: '/api/{locale}/skilltrees',
				description: 'Returns all skilltrees localized to the requested locale without i18n payloads.',
			},
			{
				method: 'GET',
				path: '/api/{locale}/skilltrees/{key}',
				description: 'Returns one skilltree localized to the requested locale without i18n payloads.',
			},
			{
				method: 'GET',
				path: '/badges/skills/{skilltreeKey}/{skillSlug}.svg',
				description: 'Returns an SVG badge for a skill. Use lang={locale} to localize badge text, earned=true or earned=false to request earned or unearned variants, and theme=light or theme=dark to choose the badge theme.',
			},
			{
				method: 'GET',
				path: '/badges/skilltrees/{skilltreeKey}.svg',
				description: 'Returns an SVG badge for a skilltree. Use theme=light or theme=dark to choose the badge theme.',
			},
		],
	});
}

function errorResponse(request: Request, routePathname: string, catalog: SkillTreeCatalog, error: string, status: number) {
	return jsonResponse(
		request,
		routePathname,
		catalog,
		{ error },
		{
			status,
			headers: {
				'Cache-Control': 'public, max-age=60, s-maxage=300',
			},
		},
	);
}

function getSkilltreeKey(pathname: string) {
	const match = pathname.match(/^\/skilltrees\/([^/]+)$/);
	return match ? decodeURIComponent(match[1]) : null;
}

interface RouteMatch {
	pathname: string;
	locale?: string;
}

function normalizePathname(pathname: string): RouteMatch | null {
	const normalizedPathname = pathname.replace(/\/+$/, '') || '/';

	if (normalizedPathname === '/' || normalizedPathname === '/api') {
		return {
			pathname: '/',
		};
	}

	if (normalizedPathname.startsWith('/api/')) {
		const apiPathname = normalizedPathname.slice('/api'.length) || '/';
		const localizedMatch = apiPathname.match(/^\/([a-z]{2})(\/.*)?$/);

		if (localizedMatch && SUPPORTED_API_LOCALES.has(localizedMatch[1])) {
			return {
				pathname: localizedMatch[2] || '/',
				locale: localizedMatch[1],
			};
		}

		return {
			pathname: apiPathname,
		};
	}

	return null;
}

function getRouteCachePathname(route: RouteMatch) {
	if (!route.locale || route.pathname === '/' || route.pathname === '/manifest') {
		return route.pathname;
	}

	return `/api/${route.locale}${route.pathname}`;
}

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext) {
	const url = new URL(request.url);
	const catalog = getCatalog();
	const courseBadgeResponse = await handleCourseBadgeRequest(request, env, ctx);
	if (courseBadgeResponse) {
		return courseBadgeResponse;
	}

	const skilltreeBadgeResponse = handleSkilltreeBadgeRequest(request, catalog);
	if (skilltreeBadgeResponse) {
		return skilltreeBadgeResponse;
	}

	const badgeResponse = handleBadgeRequest(request, catalog);
	if (badgeResponse) {
		return badgeResponse;
	}

	const route = normalizePathname(url.pathname);

	if (!route) {
		return errorResponse(request, url.pathname, catalog, 'route_not_found', 404);
	}

	const { pathname } = route;
	const cachePathname = getRouteCachePathname(route);

	if (request.method === 'OPTIONS') {
		return optionsResponse();
	}

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return errorResponse(request, pathname, catalog, 'method_not_allowed', 405);
	}

	if (pathname === '/') {
		return rootResponse(request);
	}

	if (pathname === '/manifest') {
		return jsonResponse(request, cachePathname, catalog, catalog.manifest);
	}

	if (pathname === '/skilltrees') {
		const body: SkillTreesResponse = {
			...catalog.manifest,
			skilltrees: catalog.skilltrees.map((skilltree) =>
				route.locale ? localizedSkilltree(skilltree, route.locale) : withSkillBadges(skilltree),
			),
		};

		return jsonResponse(request, cachePathname, catalog, body);
	}

	if (pathname === '/skilltrees/summary') {
		return route.locale
			? errorResponse(request, cachePathname, catalog, 'route_not_found', 404)
			: jsonResponse(request, cachePathname, catalog, getSkilltreeSummaries(catalog));
	}

	const skilltreeKey = getSkilltreeKey(pathname);
	if (skilltreeKey) {
		const skilltree = catalog.skilltrees.find((item) => item.key === skilltreeKey);
		return skilltree
			? jsonResponse(
				request,
				cachePathname,
				catalog,
				route.locale ? localizedSkilltree(skilltree, route.locale) : withSkillBadges(skilltree),
			)
			: errorResponse(request, cachePathname, catalog, 'skilltree_not_found', 404);
	}

	return errorResponse(request, cachePathname, catalog, 'route_not_found', 404);
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		return handleRequest(request, env, ctx);
	},
};
