import type { I18nLocale, Skill, SkillTree, SkillTreeCatalog } from './types';
import { skilltreeIcons } from './generated/skilltree-icons';

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
	palette: BadgePalette;
	angle: number;
	highlightX: number;
	highlightY: number;
}

interface BadgePalette {
	base: string;
	mid: string;
	deep: string;
	accent: string;
	foil: string;
}

const BADGE_PALETTES: BadgePalette[] = [
	{ base: '#172033', mid: '#31445F', deep: '#070B12', accent: '#8FB7D7', foil: '#D8C68A' },
	{ base: '#132B2B', mid: '#27645F', deep: '#061211', accent: '#89D0C3', foil: '#D7C894' },
	{ base: '#241A32', mid: '#57466A', deep: '#0C0712', accent: '#C7A7DD', foil: '#D8C28E' },
	{ base: '#2A201D', mid: '#6E5147', deep: '#100B09', accent: '#E0B19E', foil: '#D7BB82' },
	{ base: '#202818', mid: '#52664A', deep: '#0B1008', accent: '#BED9A4', foil: '#D8C88C' },
	{ base: '#1B2330', mid: '#445E7A', deep: '#090D14', accent: '#A8CCE4', foil: '#DCC48D' },
	{ base: '#272420', mid: '#6A6257', deep: '#100E0C', accent: '#D0C2AE', foil: '#D4B873' },
	{ base: '#142A34', mid: '#3D7281', deep: '#071116', accent: '#A8D7DD', foil: '#D8C58A' }
];

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

	return {
		palette: BADGE_PALETTES[(seed >>> 8) % BADGE_PALETTES.length],
		angle: 22 + ((seed >>> 16) % 28),
		highlightX: 30 + ((seed >>> 20) % 26),
		highlightY: 18 + ((seed >>> 24) % 22)
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
	const maxCharacters = cjk ? 7 : 14;
	const rawLines = cjk ? splitCjkLine(normalized, maxCharacters) : splitWordsLine(normalized, maxCharacters);
	const lines = rawLines.slice(0, 3);
	const longestLineLength = Math.max(...lines.map((line) => Array.from(line).length), 1);
	const baseSize = lines.length === 1 ? 74 : lines.length === 2 ? 58 : 46;
	const fontSize = Math.max(36, Math.min(baseSize, Math.floor((cjk ? 430 : 500) / longestLineLength)));

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

function renderTextLines(lines: string[], x: number, startY: number, fontSize: number, lineHeight: number) {
	return lines
		.map(
			(line, index) =>
				`<text x="${x}" y="${startY + index * lineHeight}" class="skill-name" font-size="${fontSize}">${escapeXml(line)}</text>`
		)
		.join('');
}

function renderSkilltreeIcon(treeKey: string) {
	const icon = skilltreeIcons[treeKey];

	if (!icon) {
		return '';
	}

	return `
		<g filter="url(#iconLift)">
			<circle cx="512" cy="512" r="176" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.2" stroke-width="1.5" />
			<svg x="352" y="352" width="320" height="320" viewBox="${escapeXml(icon.viewBox)}" aria-hidden="true" focusable="false">
				${icon.body}
			</svg>
		</g>`;
}

function fitArcText(value: string, maxCharacters: number) {
	const normalized = value.trim().replace(/\s+/g, ' ');
	const characters = Array.from(normalized);

	if (characters.length <= maxCharacters) {
		return normalized;
	}

	return `${characters.slice(0, Math.max(1, maxCharacters - 1)).join('')}…`;
}

function renderSkillBadgeSvg(skilltree: SkillTree, skill: Skill, locale: string) {
	const theme = themeFromSkillKey(skill.key);
	const skillName = getLocalizedSkillName(skill, locale);
	const skilltreeName = fitArcText(skilltree.name.toUpperCase(), 22);
	const skillNameIsCjk = hasCjkText(skillName);
	const arcSkillName = fitArcText(skillNameIsCjk ? skillName : skillName.toUpperCase(), skillNameIsCjk ? 16 : 28);
	const bottomArcFontSize = skillNameIsCjk && Array.from(skillName).length <= 4 ? 56 : skillNameIsCjk ? 46 : 38;
	const bottomArcLetterSpacing = skillNameIsCjk ? 6 : 2;
	const { palette } = theme;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_SIZE}" height="${SVG_SIZE}" viewBox="0 0 ${SVG_SIZE} ${SVG_SIZE}" role="img" aria-labelledby="title desc">
	<title id="title">${escapeXml(skilltree.name)} - ${escapeXml(skillName)}</title>
	<desc id="desc">LabEx skill badge for ${escapeXml(skill.key)}</desc>
	<defs>
		<linearGradient id="badgeFill" x1="18%" y1="8%" x2="82%" y2="92%" gradientTransform="rotate(${theme.angle} 0.5 0.5)">
			<stop offset="0%" stop-color="${palette.mid}" />
			<stop offset="48%" stop-color="${palette.base}" />
			<stop offset="100%" stop-color="${palette.deep}" />
		</linearGradient>
		<radialGradient id="surfaceLight" cx="${theme.highlightX}%" cy="${theme.highlightY}%" r="72%">
			<stop offset="0%" stop-color="${palette.accent}" stop-opacity="0.42" />
			<stop offset="48%" stop-color="#ffffff" stop-opacity="0.07" />
			<stop offset="100%" stop-color="#000000" stop-opacity="0" />
		</radialGradient>
		<linearGradient id="edgeStroke" x1="18%" y1="8%" x2="82%" y2="92%">
			<stop offset="0%" stop-color="#ffffff" stop-opacity="0.42" />
			<stop offset="50%" stop-color="${palette.foil}" stop-opacity="0.28" />
			<stop offset="100%" stop-color="#ffffff" stop-opacity="0.16" />
		</linearGradient>
		<linearGradient id="topLine" x1="0%" y1="0%" x2="100%" y2="0%">
			<stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
			<stop offset="50%" stop-color="${palette.accent}" stop-opacity="0.72" />
			<stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
		</linearGradient>
		<filter id="shadow" x="-18%" y="-18%" width="136%" height="140%">
			<feDropShadow dx="0" dy="24" stdDeviation="34" flood-color="#020617" flood-opacity="0.2" />
		</filter>
		<filter id="textLift" x="-20%" y="-20%" width="140%" height="150%">
			<feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#020617" flood-opacity="0.24" />
		</filter>
		<filter id="iconLift" x="-20%" y="-20%" width="140%" height="150%">
			<feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#020617" flood-opacity="0.24" />
		</filter>
		<filter id="grain" x="0" y="0" width="100%" height="100%">
			<feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="7" result="noise" />
			<feColorMatrix in="noise" type="saturate" values="0" />
			<feComponentTransfer>
				<feFuncA type="table" tableValues="0 0.05" />
			</feComponentTransfer>
		</filter>
		<clipPath id="badgeClip">
			<circle cx="512" cy="512" r="424" />
		</clipPath>
		<path id="topTextArc" d="M232 512a280 280 0 0 1 560 0" />
		<path id="bottomTextArc" d="M232 512a280 280 0 0 0 560 0" />
		<style>
			.badge-text {
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif;
				text-anchor: middle;
				fill: #f8fafc;
			}
			.domain-name {
				font-size: 34px;
				font-weight: 760;
				letter-spacing: 6px;
				opacity: 0.8;
				filter: url(#textLift);
			}
			.arc-text {
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif;
				fill: #ffffff;
				font-weight: 820;
				letter-spacing: 3px;
				paint-order: stroke;
				stroke: #0f172a;
				stroke-opacity: 0.12;
				stroke-width: 3px;
				stroke-linejoin: round;
				filter: url(#textLift);
			}
			.top-arc {
				font-size: 42px;
			}
			.bottom-arc {
				font-size: 38px;
				letter-spacing: 2px;
			}
		</style>
	</defs>
	<rect width="1024" height="1024" fill="transparent" />
	<g filter="url(#shadow)">
		<g clip-path="url(#badgeClip)">
			<circle cx="512" cy="512" r="424" fill="url(#badgeFill)" />
			<circle cx="512" cy="512" r="424" fill="url(#surfaceLight)" />
			<circle cx="342" cy="260" r="320" fill="#ffffff" fill-opacity="0.06" />
			<circle cx="740" cy="782" r="380" fill="#020617" fill-opacity="0.18" />
			<path d="M190 676c88 102 195 153 322 153s234-51 322-153" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="16" />
			<circle cx="512" cy="512" r="424" filter="url(#grain)" opacity="0.55" />
		</g>
		<circle cx="512" cy="512" r="436" fill="none" stroke="#020617" stroke-opacity="0.12" stroke-width="18" />
		<circle cx="512" cy="512" r="421" fill="none" stroke="url(#edgeStroke)" stroke-width="5" />
		<circle cx="512" cy="512" r="388" fill="none" stroke="#ffffff" stroke-opacity="0.1" stroke-width="1.5" />
		<circle cx="512" cy="512" r="334" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1" stroke-dasharray="2 14" />
	</g>
	<g class="badge-text">
		<text class="arc-text top-arc">
			<textPath href="#topTextArc" startOffset="50%" text-anchor="middle">${escapeXml(skilltreeName)}</textPath>
		</text>
		${renderSkilltreeIcon(skilltree.key)}
		<text class="arc-text bottom-arc">
			<textPath href="#bottomTextArc" startOffset="50%" text-anchor="middle" font-size="${bottomArcFontSize}" letter-spacing="${bottomArcLetterSpacing}">${escapeXml(
				arcSkillName
			)}</textPath>
		</text>
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
