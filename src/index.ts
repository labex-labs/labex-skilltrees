import { catalogVersions } from './generated/catalog';
import { handleBadgeRequest } from './badges';
import type { SkillTree, SkillTreeCatalog, SkillTreeSummariesResponse, SkillTreeVersion, SkillTreesResponse, SkillTreeWithBadges } from './types';

const DEFAULT_VERSION = 'v2' satisfies SkillTreeVersion;
const SUPPORTED_VERSIONS = Object.keys(catalogVersions) as SkillTreeVersion[];
const RESPONSE_SCHEMA_VERSION = 'badge-field-2026-06-29';

const JSON_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
	'Access-Control-Allow-Headers': 'Accept, Content-Type, If-None-Match',
	'Content-Type': 'application/json; charset=utf-8',
};

function getCatalog(version: SkillTreeVersion) {
	return catalogVersions[version];
}

function getCacheHeaders(routePathname: string, catalog: SkillTreeCatalog) {
	const maxAge = routePathname === '/manifest' ? '60' : '300';
	const sMaxAge = routePathname === '/manifest' ? '300' : '3600';
	const etag = routePathname === '/manifest' ? catalog.manifest.hash : `${catalog.manifest.hash}:${RESPONSE_SCHEMA_VERSION}`;

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

function getSkilltreePath(version: SkillTreeVersion, key: string) {
	const encodedKey = encodeURIComponent(key);
	return version === DEFAULT_VERSION ? `/api/skilltrees/${encodedKey}` : `/api/${version}/skilltrees/${encodedKey}`;
}

function getBadgePath(skilltreeKey: string, skillSlug: string) {
	const encodedSkilltreeKey = encodeURIComponent(skilltreeKey);
	const badgeFileName = encodeURIComponent(skillSlug.replace(/_/g, '-'));

	return `/badges/v2/en/${encodedSkilltreeKey}/${badgeFileName}.svg`;
}

function withSkillBadges(version: SkillTreeVersion, skilltree: SkillTree): SkillTree | SkillTreeWithBadges {
	if (version !== DEFAULT_VERSION) {
		return skilltree;
	}

	return {
		...skilltree,
		skills: skilltree.skills.map((skill) => ({
			...skill,
			badge: getBadgePath(skilltree.key, skill.slug),
		})),
	};
}

function getSkilltreeSummaries(version: SkillTreeVersion, catalog: SkillTreeCatalog): SkillTreeSummariesResponse {
	return {
		...catalog.manifest,
		skilltrees: catalog.skilltrees.map((skilltree) => ({
			key: skilltree.key,
			slug: skilltree.slug,
			name: skilltree.name,
			skill_count: skilltree.skills.length,
			path: getSkilltreePath(version, skilltree.key),
		})),
	};
}

function rootResponse(request: Request) {
	const catalog = getCatalog(DEFAULT_VERSION);

	return jsonResponse(request, '/', catalog, {
		name: 'labex-skilltrees',
		description: 'HTTP API for LabEx skilltree catalog data.',
		version: catalog.manifest.version,
		default_version: DEFAULT_VERSION,
		versions: SUPPORTED_VERSIONS,
		endpoints: [
			{
				method: 'GET',
				path: '/',
				description: 'Returns this API documentation as JSON.',
			},
			{
				method: 'GET',
				path: '/api/manifest',
				description: 'Returns v2 catalog version, hash, and update timestamp.',
			},
			{
				method: 'GET',
				path: '/api/skilltrees',
				description: 'Returns all canonical v2 skilltrees.',
			},
			{
				method: 'GET',
				path: '/api/skilltrees/summary',
				description: 'Returns keys, names, skill counts, and API paths for canonical v2 skilltrees.',
			},
			{
				method: 'GET',
				path: '/api/skilltrees/{key}',
				description: 'Returns one v2 skilltree by key.',
			},
			{
				method: 'GET',
				path: '/api/{version}/manifest',
				description: 'Returns catalog version, hash, and update timestamp for v1 or v2.',
			},
			{
				method: 'GET',
				path: '/api/{version}/skilltrees',
				description: 'Returns all skilltrees for v1 or v2.',
			},
			{
				method: 'GET',
				path: '/api/{version}/skilltrees/summary',
				description: 'Returns keys, names, skill counts, and API paths for v1 or v2 skilltrees.',
			},
			{
				method: 'GET',
				path: '/api/{version}/skilltrees/{key}',
				description: 'Returns one skilltree by key for v1 or v2.',
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
	version: SkillTreeVersion;
	pathname: string;
}

function normalizePathname(pathname: string): RouteMatch | null {
	const normalizedPathname = pathname.replace(/\/+$/, '') || '/';

	if (normalizedPathname === '/' || normalizedPathname === '/api') {
		return {
			version: DEFAULT_VERSION,
			pathname: '/',
		};
	}

	if (normalizedPathname.startsWith('/api/')) {
		const apiPathname = normalizedPathname.slice('/api'.length) || '/';
		const match = apiPathname.match(/^\/(v1|v2)(\/.*)?$/);

		if (match) {
			return {
				version: match[1] as SkillTreeVersion,
				pathname: match[2] || '/',
			};
		}

		return {
			version: DEFAULT_VERSION,
			pathname: apiPathname,
		};
	}

	return null;
}

function handleRequest(request: Request) {
	const url = new URL(request.url);
	const badgeResponse = handleBadgeRequest(request, getCatalog(DEFAULT_VERSION));
	if (badgeResponse) {
		return badgeResponse;
	}

	const route = normalizePathname(url.pathname);
	const catalog = route ? getCatalog(route.version) : getCatalog(DEFAULT_VERSION);

	if (!route) {
		return errorResponse(request, url.pathname, catalog, 'route_not_found', 404);
	}

	const { pathname } = route;

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
		return jsonResponse(request, pathname, catalog, catalog.manifest);
	}

	if (pathname === '/skilltrees') {
		const body: SkillTreesResponse = {
			...catalog.manifest,
			skilltrees: catalog.skilltrees.map((skilltree) => withSkillBadges(route.version, skilltree)),
		};

		return jsonResponse(request, pathname, catalog, body);
	}

	if (pathname === '/skilltrees/summary') {
		return jsonResponse(request, pathname, catalog, getSkilltreeSummaries(route.version, catalog));
	}

	const skilltreeKey = getSkilltreeKey(pathname);
	if (skilltreeKey) {
		const skilltree = catalog.skilltrees.find((item) => item.key === skilltreeKey);
		return skilltree
			? jsonResponse(request, pathname, catalog, withSkillBadges(route.version, skilltree))
			: errorResponse(request, pathname, catalog, 'skilltree_not_found', 404);
	}

	return errorResponse(request, pathname, catalog, 'route_not_found', 404);
}

export default {
	fetch(request: Request) {
		return handleRequest(request);
	},
};
