import { getBadgeTheme, renderBadgeSvg } from './badge-renderer';
import { getSkilltreeIconKeyForCoursePath } from './course-paths';

const COURSE_BADGE_PATH_PATTERN = /^\/badges\/courses\/([^/]+)\.svg$/;
const SUPPORTED_COURSE_BADGE_LANGS = new Set(['en', 'zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);
const COURSE_DATA_CACHE_VERSION = 'v1';
const COURSE_DATA_CACHE_FRESH_SECONDS = 60 * 60 * 6;
const COURSE_DATA_CACHE_STALE_SECONDS = 60 * 60 * 24 * 7;
const COURSE_NEGATIVE_CACHE_SECONDS = 60 * 5;
const COURSE_API_TIMEOUT_MS = 3000;

interface LabExCourseApiResponse {
	course?: {
		alias?: unknown;
		name?: unknown;
		level?: unknown;
		user_count?: unknown;
		updated_at?: unknown;
		skill_tree_name?: unknown;
		skill_tree?: unknown;
		skill_trees?: unknown;
	};
}

interface LabExCoursePath {
	alias?: unknown;
	name?: unknown;
}

interface CachedCourse {
	alias: string;
	lang: string;
	name: string;
	skillTreeName: string;
	skillTree?: string;
	level?: number;
	userCount?: number;
	updatedAt?: string;
	fetchedAt: string;
	freshUntil: string;
}

interface CourseBadgeRouteMatch {
	alias: string;
}

function parseCourseBadgePath(pathname: string): CourseBadgeRouteMatch | null {
	const match = pathname.match(COURSE_BADGE_PATH_PATTERN);
	if (!match) {
		return null;
	}

	try {
		return {
			alias: decodeURIComponent(match[1]),
		};
	} catch {
		return null;
	}
}

function normalizeCourseLang(searchParams: URLSearchParams) {
	const lang = searchParams.get('lang')?.toLowerCase() || 'en';
	return SUPPORTED_COURSE_BADGE_LANGS.has(lang) ? lang : null;
}

function courseCacheKey(alias: string, lang: string) {
	return `course:${COURSE_DATA_CACHE_VERSION}:${lang}:${alias}`;
}

function courseMissCacheKey(alias: string, lang: string) {
	return `course-miss:${COURSE_DATA_CACHE_VERSION}:${lang}:${alias}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function stringValue(value: unknown) {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown) {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getFirstCoursePath(value: unknown) {
	if (!Array.isArray(value)) {
		return undefined;
	}

	return value.find((item): item is LabExCoursePath => isObject(item) && typeof item.alias === 'string');
}

function isCachedCourse(value: unknown): value is CachedCourse {
	return (
		isObject(value) &&
		typeof value.alias === 'string' &&
		typeof value.lang === 'string' &&
		typeof value.name === 'string' &&
		typeof value.skillTreeName === 'string' &&
		typeof value.fetchedAt === 'string' &&
		typeof value.freshUntil === 'string' &&
		(value.skillTree === undefined || typeof value.skillTree === 'string') &&
		(value.level === undefined || typeof value.level === 'number') &&
		(value.userCount === undefined || typeof value.userCount === 'number') &&
		(value.updatedAt === undefined || typeof value.updatedAt === 'string')
	);
}

function normalizeCoursePayload(payload: unknown, alias: string, lang: string, now: Date): CachedCourse | null {
	if (!isObject(payload)) {
		return null;
	}

	const course = (payload as LabExCourseApiResponse).course;
	if (!isObject(course)) {
		return null;
	}

	const firstPath = getFirstCoursePath(course.skill_trees);
	const normalizedAlias = stringValue(course.alias) ?? alias;
	const courseName = stringValue(course.name);
	const skillTreeName = stringValue(course.skill_tree_name) ?? stringValue(firstPath?.name);

	if (!courseName) {
		return null;
	}

	return {
		alias: normalizedAlias,
		lang,
		name: courseName,
		skillTreeName: skillTreeName ?? 'Course',
		skillTree: stringValue(course.skill_tree),
		level: numberValue(course.level),
		userCount: numberValue(course.user_count),
		updatedAt: stringValue(course.updated_at),
		fetchedAt: now.toISOString(),
		freshUntil: new Date(now.getTime() + COURSE_DATA_CACHE_FRESH_SECONDS * 1000).toISOString(),
	};
}

async function fetchCourseFromApi(alias: string, lang: string) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), COURSE_API_TIMEOUT_MS);

	try {
		const response = await fetch(`https://labex.io/api/v2/courses/${encodeURIComponent(alias)}?lang=${encodeURIComponent(lang)}`, {
			headers: {
				Accept: 'application/json',
			},
			signal: controller.signal,
		});

		if (response.status === 404) {
			return { status: 'not_found' as const };
		}

		if (!response.ok) {
			return { status: 'failed' as const };
		}

		const payload = await response.json();
		const course = normalizeCoursePayload(payload, alias, lang, new Date());

		return course ? { status: 'ok' as const, course } : { status: 'not_found' as const };
	} catch {
		return { status: 'failed' as const };
	} finally {
		clearTimeout(timeout);
	}
}

async function readCachedCourse(env: Env, alias: string, lang: string) {
	const cached = await env.SKILLTREES_APP_KV.get(courseCacheKey(alias, lang), 'json');
	return isCachedCourse(cached) ? cached : null;
}

async function refreshCourseCache(env: Env, alias: string, lang: string) {
	const result = await fetchCourseFromApi(alias, lang);

	if (result.status === 'ok') {
		await env.SKILLTREES_APP_KV.put(courseCacheKey(alias, lang), JSON.stringify(result.course), {
			expirationTtl: COURSE_DATA_CACHE_STALE_SECONDS,
		});
		await env.SKILLTREES_APP_KV.delete(courseMissCacheKey(alias, lang));
		return result.course;
	}

	if (result.status === 'not_found') {
		await env.SKILLTREES_APP_KV.put(courseMissCacheKey(alias, lang), '1', {
			expirationTtl: COURSE_NEGATIVE_CACHE_SECONDS,
		});
	}

	return null;
}

async function getCourseForBadge(env: Env, ctx: ExecutionContext, alias: string, lang: string) {
	const cached = await readCachedCourse(env, alias, lang);
	const now = Date.now();

	if (cached) {
		const isFresh = Date.parse(cached.freshUntil) > now;
		if (!isFresh) {
			ctx.waitUntil(refreshCourseCache(env, alias, lang));
		}

		return cached;
	}

	const negativeCache = await env.SKILLTREES_APP_KV.get(courseMissCacheKey(alias, lang));
	if (negativeCache) {
		return null;
	}

	return refreshCourseCache(env, alias, lang);
}

function courseBadgeErrorResponse(error: string, status: number) {
	return new Response(JSON.stringify({ error }), {
		status,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=60, s-maxage=300',
		},
	});
}

function getCourseIconKey(course: CachedCourse) {
	return getSkilltreeIconKeyForCoursePath(course.skillTree);
}

export async function handleCourseBadgeRequest(request: Request, env: Env, ctx: ExecutionContext) {
	const url = new URL(request.url);
	const match = parseCourseBadgePath(url.pathname);
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
		return courseBadgeErrorResponse('method_not_allowed', 405);
	}

	const lang = normalizeCourseLang(url.searchParams);
	if (!lang) {
		return courseBadgeErrorResponse('unsupported_lang', 404);
	}

	const course = await getCourseForBadge(env, ctx, match.alias, lang);
	if (!course) {
		return courseBadgeErrorResponse('course_not_found', 404);
	}

	const etag = JSON.stringify(`course-badge:${COURSE_DATA_CACHE_VERSION}:${course.alias}:${course.lang}:${theme}:${course.updatedAt ?? ''}:${course.fetchedAt}`);
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

	const svg = renderBadgeSvg({
		iconKey: getCourseIconKey(course),
		title: `${course.skillTreeName} - ${course.name}`,
		desc: `LabEx course badge for ${course.alias}`,
		primaryText: course.name,
		secondaryText: course.skillTreeName,
		variant: 'default',
		theme,
	});

	return new Response(request.method === 'HEAD' ? null : svg, {
		status: 200,
		headers,
	});
}
