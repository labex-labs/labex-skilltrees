import type { I18nLocale, Skill, SkillTree, SkillTreeCatalog } from './types';

const SUPPORTED_BADGE_LOCALES = new Set(['en', 'zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);
const LOCALIZED_SKILL_LOCALES = new Set(['zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);
const BADGE_PATH_PATTERN = /^\/badges\/v2\/([a-z]{2})\/([^/]+)\/([^/]+)\.svg$/;
const SVG_SIZE = 1024;

interface BadgeRouteMatch {
	locale: string;
	treeKey: string;
	skillSlug: string;
}

interface BadgeTheme {
	hue: number;
	accentHue: number;
	shape: 'circle' | 'hexagon' | 'shield' | 'octagon';
	pattern: 'grid' | 'rays' | 'rings' | 'diagonal';
	rotation: number;
}

function hashString(value: string) {
	let hash = 2166136261;

	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}

	return hash >>> 0;
}

function themeFromSkillKey(skillKey: string): BadgeTheme {
	const seed = hashString(`v2:${skillKey}`);
	const shapes = ['circle', 'hexagon', 'shield', 'octagon'] as const;
	const patterns = ['grid', 'rays', 'rings', 'diagonal'] as const;
	const hue = seed % 360;

	return {
		hue,
		accentHue: (hue + 52 + ((seed >>> 8) % 96)) % 360,
		shape: shapes[(seed >>> 16) % shapes.length],
		pattern: patterns[(seed >>> 20) % patterns.length],
		rotation: (seed >>> 24) % 360
	};
}

function escapeXml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function hasCjkText(value: string) {
	return /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/u.test(value);
}

function splitCjkLine(value: string, maxCharacters: number) {
	const characters = Array.from(value);
	const lines: string[] = [];

	for (let index = 0; index < characters.length; index += maxCharacters) {
		lines.push(characters.slice(index, index + maxCharacters).join(''));
	}

	return lines;
}

function splitWordsLine(value: string, maxCharacters: number) {
	const words = value.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let currentLine = '';

	for (const word of words) {
		const nextLine = currentLine ? `${currentLine} ${word}` : word;

		if (nextLine.length <= maxCharacters || !currentLine) {
			currentLine = nextLine;
			continue;
		}

		lines.push(currentLine);
		currentLine = word;
	}

	if (currentLine) {
		lines.push(currentLine);
	}

	return lines;
}

function fitTextLines(value: string) {
	const normalized = value.trim().replace(/\s+/g, ' ');
	const cjk = hasCjkText(normalized);
	const maxCharacters = cjk ? 9 : 18;
	const rawLines = cjk ? splitCjkLine(normalized, maxCharacters) : splitWordsLine(normalized, maxCharacters);
	const lines = rawLines.slice(0, 3);
	const longestLineLength = Math.max(...lines.map((line) => Array.from(line).length), 1);
	const baseSize = lines.length === 1 ? 84 : lines.length === 2 ? 72 : 60;
	const fontSize = Math.max(42, Math.min(baseSize, Math.floor((cjk ? 560 : 640) / longestLineLength)));

	if (rawLines.length > 3) {
		const lastLine = lines[2] ?? '';
		lines[2] = `${Array.from(lastLine).slice(0, Math.max(1, maxCharacters - 1)).join('')}…`;
	}

	return {
		lines,
		fontSize,
		lineHeight: Math.round(fontSize * 1.1)
	};
}

function getLocalizedSkillName(skill: Skill, locale: string) {
	if (locale === 'en' || !LOCALIZED_SKILL_LOCALES.has(locale)) {
		return skill.name;
	}

	return skill.i18n?.[locale as I18nLocale]?.name ?? skill.name;
}

function badgeShapePath(shape: BadgeTheme['shape']) {
	if (shape === 'hexagon') {
		return '<polygon points="512 90 846 283 846 741 512 934 178 741 178 283" />';
	}

	if (shape === 'shield') {
		return '<path d="M512 83 832 190v270c0 218-128 363-320 477-192-114-320-259-320-477V190L512 83Z" />';
	}

	if (shape === 'octagon') {
		return '<polygon points="342 108 682 108 916 342 916 682 682 916 342 916 108 682 108 342" />';
	}

	return '<circle cx="512" cy="512" r="430" />';
}

function patternMarkup(theme: BadgeTheme) {
	if (theme.pattern === 'rays') {
		return `
			<g opacity="0.24" stroke="url(#accentStroke)" stroke-width="4">
				${Array.from({ length: 24 }, (_, index) => {
					const angle = index * 15 + theme.rotation;
					return `<line x1="512" y1="512" x2="${512 + Math.cos((angle * Math.PI) / 180) * 430}" y2="${
						512 + Math.sin((angle * Math.PI) / 180) * 430
					}" />`;
				}).join('')}
			</g>`;
	}

	if (theme.pattern === 'rings') {
		return `
			<g opacity="0.26" fill="none" stroke="url(#accentStroke)" stroke-width="3">
				<circle cx="512" cy="512" r="150" />
				<circle cx="512" cy="512" r="230" />
				<circle cx="512" cy="512" r="310" />
				<circle cx="512" cy="512" r="390" />
			</g>`;
	}

	if (theme.pattern === 'diagonal') {
		return `
			<g opacity="0.18" stroke="url(#accentStroke)" stroke-width="18">
				${Array.from({ length: 13 }, (_, index) => {
					const offset = -300 + index * 120;
					return `<line x1="${offset}" y1="920" x2="${offset + 620}" y2="300" />`;
				}).join('')}
			</g>`;
	}

	return `
		<g opacity="0.2" stroke="url(#accentStroke)" stroke-width="2">
			${Array.from({ length: 11 }, (_, index) => {
				const offset = 172 + index * 68;
				return `<path d="M${offset} 150v724M150 ${offset}h724" />`;
			}).join('')}
		</g>`;
}

function renderTextLines(lines: string[], x: number, startY: number, fontSize: number, lineHeight: number) {
	return lines
		.map(
			(line, index) =>
				`<text x="${x}" y="${startY + index * lineHeight}" class="skill-name" font-size="${fontSize}">${escapeXml(line)}</text>`
		)
		.join('');
}

function renderSkillBadgeSvg(skilltree: SkillTree, skill: Skill, locale: string) {
	const theme = themeFromSkillKey(skill.key);
	const skillName = getLocalizedSkillName(skill, locale);
	const fittedSkillName = fitTextLines(skillName);
	const skillNameBlockHeight = (fittedSkillName.lines.length - 1) * fittedSkillName.lineHeight;
	const skillNameStartY = 500 - Math.round(skillNameBlockHeight / 2);
	const skilltreeName = skilltree.name.toUpperCase();

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_SIZE}" height="${SVG_SIZE}" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" role="img" aria-labelledby="title desc">
	<title id="title">${escapeXml(skilltree.name)} - ${escapeXml(skillName)}</title>
	<desc id="desc">LabEx skill badge for ${escapeXml(skill.key)}</desc>
	<defs>
		<linearGradient id="badgeFill" x1="18%" y1="12%" x2="82%" y2="88%">
			<stop offset="0%" stop-color="hsl(${theme.hue} 76% 52%)" />
			<stop offset="54%" stop-color="hsl(${theme.accentHue} 68% 42%)" />
			<stop offset="100%" stop-color="hsl(${theme.hue} 72% 24%)" />
		</linearGradient>
		<linearGradient id="accentStroke" x1="0%" y1="0%" x2="100%" y2="100%">
			<stop offset="0%" stop-color="rgb(255,255,255)" stop-opacity="0.85" />
			<stop offset="100%" stop-color="rgb(255,255,255)" stop-opacity="0.1" />
		</linearGradient>
		<filter id="shadow" x="-20%" y="-20%" width="140%" height="145%">
			<feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="rgb(15,23,42)" flood-opacity="0.32" />
		</filter>
		<clipPath id="badgeClip">
			${badgeShapePath(theme.shape)}
		</clipPath>
		<style>
			.badge-text {
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif;
				text-anchor: middle;
				fill: white;
			}
			.domain-name {
				font-size: 40px;
				font-weight: 800;
				letter-spacing: 4px;
				opacity: 0.88;
			}
			.skill-name {
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif;
				text-anchor: middle;
				fill: white;
				font-weight: 850;
				letter-spacing: 0;
				paint-order: stroke;
				stroke: rgb(15,23,42);
				stroke-opacity: 0.22;
				stroke-width: 8px;
				stroke-linejoin: round;
			}
			.badge-key {
				font-size: 30px;
				font-weight: 700;
				letter-spacing: 1px;
				opacity: 0.72;
			}
		</style>
	</defs>
	<rect width="1024" height="1024" fill="transparent" />
	<g filter="url(#shadow)">
		<g clip-path="url(#badgeClip)">
			<rect x="72" y="72" width="880" height="880" fill="url(#badgeFill)" />
			<circle cx="360" cy="250" r="390" fill="rgb(255,255,255)" fill-opacity="0.2" />
			<circle cx="780" cy="820" r="350" fill="rgb(15,23,42)" fill-opacity="0.16" />
			${patternMarkup(theme)}
			<rect x="72" y="72" width="880" height="880" fill="rgb(255,255,255)" fill-opacity="0.04" />
		</g>
		<g fill="none" stroke="rgb(255,255,255)" stroke-opacity="0.72" stroke-width="18">
			${badgeShapePath(theme.shape)}
		</g>
		<g fill="none" stroke="rgb(15,23,42)" stroke-opacity="0.22" stroke-width="5">
			${badgeShapePath(theme.shape)}
		</g>
	</g>
	<g class="badge-text">
		<text x="512" y="300" class="domain-name">${escapeXml(skilltreeName)}</text>
		${renderTextLines(fittedSkillName.lines, 512, skillNameStartY, fittedSkillName.fontSize, fittedSkillName.lineHeight)}
		<text x="512" y="735" class="badge-key">${escapeXml(skill.slug.replace(/_/g, ' '))}</text>
	</g>
</svg>`;
}

function parseBadgePath(pathname: string): BadgeRouteMatch | null {
	const match = pathname.match(BADGE_PATH_PATTERN);

	if (!match) {
		return null;
	}

	try {
		return {
			locale: match[1],
			treeKey: decodeURIComponent(match[2]),
			skillSlug: decodeURIComponent(match[3])
		};
	} catch {
		return null;
	}
}

function badgeErrorResponse(error: string, status: number) {
	return new Response(JSON.stringify({ error }), {
		status,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=60, s-maxage=300'
		}
	});
}

export function handleBadgeRequest(request: Request, catalog: SkillTreeCatalog) {
	const url = new URL(request.url);
	const match = parseBadgePath(url.pathname);

	if (!match) {
		return null;
	}

	if (request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
				'Access-Control-Allow-Headers': 'Accept, Content-Type, If-None-Match'
			}
		});
	}

	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return badgeErrorResponse('method_not_allowed', 405);
	}

	if (!SUPPORTED_BADGE_LOCALES.has(match.locale)) {
		return badgeErrorResponse('unsupported_locale', 404);
	}

	const skilltree = catalog.skilltrees.find((item) => item.key === match.treeKey);
	if (!skilltree) {
		return badgeErrorResponse('skilltree_not_found', 404);
	}

	const skill = skilltree.skills.find((item) => item.slug === match.skillSlug);
	if (!skill) {
		return badgeErrorResponse('skill_not_found', 404);
	}

	const etag = JSON.stringify(`${catalog.manifest.hash}:badge:${match.locale}:${skill.key}`);
	const headers = new Headers({
		'Access-Control-Allow-Origin': '*',
		'Content-Type': 'image/svg+xml; charset=utf-8',
		'Cache-Control': 'public, max-age=60, s-maxage=300',
		ETag: etag
	});

	if (request.headers.get('If-None-Match') === etag) {
		return new Response(null, {
			status: 304,
			headers
		});
	}

	const svg = renderSkillBadgeSvg(skilltree, skill, match.locale);

	return new Response(request.method === 'HEAD' ? null : svg, {
		status: 200,
		headers
	});
}
