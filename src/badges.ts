import type { I18nLocale, Skill, SkillTree, SkillTreeCatalog } from './types';
import { skilltreeIcons } from './generated/skilltree-icons';

const SUPPORTED_BADGE_LOCALES = new Set(['en', 'zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);
const LOCALIZED_SKILL_LOCALES = new Set(['zh', 'es', 'fr', 'de', 'ja', 'ru', 'ko', 'pt']);
const BADGE_PATH_PATTERN = /^\/badges\/v2\/([a-z]{2})\/([^/]+)\/([^/]+)\.svg$/;
const BADGE_HEIGHT = 40;
const ICON_SIZE = 32;
const ICON_X = 4;
const TEXT_X = 48;
const RIGHT_PADDING = 14;
const MIN_BADGE_WIDTH = 132;
const CHECK_SIZE = 12;
const CHECK_GAP = 4;

type BadgeVariant = 'default' | 'earned' | 'unearned';

interface BadgeRouteMatch {
	locale: string;
	treeKey: string;
	skillSlug: string;
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

function estimateTextWidth(value: string, fontSize: number) {
	return Array.from(value).reduce((width, character) => {
		if (/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff\uac00-\ud7af]/u.test(character)) {
			return width + fontSize;
		}

		if (/[A-Z0-9]/.test(character)) {
			return width + fontSize * 0.68;
		}

		if (/[a-z]/.test(character)) {
			return width + fontSize * 0.56;
		}

		if (/\s/.test(character)) {
			return width + fontSize * 0.34;
		}

		return width + fontSize * 0.42;
	}, 0);
}

function badgeWidthForText(primaryText: string, secondaryText: string, reservesCheck: boolean) {
	const primaryWidth = estimateTextWidth(primaryText, hasCjkText(primaryText) ? 15 : 15);
	const secondaryWidth = estimateTextWidth(secondaryText, hasCjkText(secondaryText) ? 9 : 9);
	const statusWidth = reservesCheck ? CHECK_SIZE + CHECK_GAP : 0;

	return Math.ceil(Math.max(MIN_BADGE_WIDTH, TEXT_X + Math.max(primaryWidth + statusWidth, secondaryWidth) + RIGHT_PADDING + 6));
}

function getLocalizedSkillName(skill: Skill, locale: string) {
	if (locale === 'en' || !LOCALIZED_SKILL_LOCALES.has(locale)) {
		return skill.name;
	}

	return skill.i18n?.[locale as I18nLocale]?.name ?? skill.name;
}

interface BadgeStyle {
	backgroundStops: string;
	borderColor: string;
	innerStrokeColor: string;
	innerStrokeOpacity: number;
	iconOpacity: number;
	iconBackingFill: string;
	iconBackingOpacity: number;
	primaryFill: string;
	secondaryFill: string;
	checkOpacity: number;
}

const BADGE_STYLES: Record<BadgeVariant, BadgeStyle> = {
	default: {
		backgroundStops: `
			<stop offset="0%" stop-color="#20242D" />
			<stop offset="58%" stop-color="#111827" />
			<stop offset="100%" stop-color="#090D14" />`,
		borderColor: '#343B49',
		innerStrokeColor: '#FFFFFF',
		innerStrokeOpacity: 0.08,
		iconOpacity: 1,
		iconBackingFill: '#FFFFFF',
		iconBackingOpacity: 0.08,
		primaryFill: '#F8FAFC',
		secondaryFill: '#AEB8C8',
		checkOpacity: 0
	},
	earned: {
		backgroundStops: `
			<stop offset="0%" stop-color="#20242D" />
			<stop offset="58%" stop-color="#111827" />
			<stop offset="100%" stop-color="#090D14" />`,
		borderColor: '#343B49',
		innerStrokeColor: '#FFFFFF',
		innerStrokeOpacity: 0.08,
		iconOpacity: 1,
		iconBackingFill: '#FFFFFF',
		iconBackingOpacity: 0.08,
		primaryFill: '#F8FAFC',
		secondaryFill: '#AEB8C8',
		checkOpacity: 1
	},
	unearned: {
		backgroundStops: `
			<stop offset="0%" stop-color="#F8FAFC" />
			<stop offset="58%" stop-color="#F1F5F9" />
			<stop offset="100%" stop-color="#E5E7EB" />`,
		borderColor: '#CBD5E1',
		innerStrokeColor: '#FFFFFF',
		innerStrokeOpacity: 0.68,
		iconOpacity: 0.42,
		iconBackingFill: '#CBD5E1',
		iconBackingOpacity: 0.32,
		primaryFill: '#475569',
		secondaryFill: '#94A3B8',
		checkOpacity: 0
	}
};

function getBadgeVariant(searchParams: URLSearchParams): BadgeVariant {
	const earned = searchParams.get('earned');

	if (earned === '1' || earned === 'true') {
		return 'earned';
	}

	if (earned === '0' || earned === 'false') {
		return 'unearned';
	}

	return 'default';
}

function renderSkilltreeIcon(treeKey: string, x: number, y: number, size: number, opacity: number) {
	const icon = skilltreeIcons[treeKey];

	if (!icon) {
		return '';
	}

	return `
		<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${escapeXml(icon.viewBox)}" opacity="${opacity}" aria-hidden="true" focusable="false">
				${icon.body}
		</svg>`;
}

function renderCheckMark(x: number, y: number, opacity: number) {
	if (opacity === 0) {
		return '';
	}

	const centerX = x + CHECK_SIZE / 2;
	const centerY = y + CHECK_SIZE / 2;

	return `
	<g opacity="${opacity}">
		<circle cx="${centerX}" cy="${centerY}" r="6" fill="#22C55E" />
		<path d="m${centerX - 2.9} ${centerY + 0.2} 2 2 3.9-4.3" fill="none" stroke="#FFFFFF" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" />
	</g>`;
}

function renderSkillBadgeSvg(skilltree: SkillTree, skill: Skill, locale: string, variant: BadgeVariant) {
	const skillName = getLocalizedSkillName(skill, locale);
	const skilltreeName = skilltree.name;
	const style = BADGE_STYLES[variant];
	const showsCheck = variant === 'earned';
	const badgeWidth = badgeWidthForText(skillName, skilltreeName, showsCheck);
	const primaryFontSize = hasCjkText(skillName) ? 15 : 15;
	const secondaryFontSize = hasCjkText(skilltreeName) ? 9 : 9;
	const primaryTextX = showsCheck ? TEXT_X + CHECK_SIZE + CHECK_GAP : TEXT_X;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${badgeWidth}" height="${BADGE_HEIGHT}" viewBox="0 0 ${badgeWidth} ${BADGE_HEIGHT}" role="img" aria-labelledby="title desc">
	<title id="title">${escapeXml(skilltree.name)} - ${escapeXml(skillName)}</title>
	<desc id="desc">LabEx skill badge for ${escapeXml(skill.key)}</desc>
	<defs>
		<linearGradient id="badgeFill" x1="0%" y1="0%" x2="100%" y2="100%">
			${style.backgroundStops}
		</linearGradient>
		<style>
			.badge-label {
				font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans SC", "Noto Sans JP", "Noto Sans KR", sans-serif;
			}
			.primary {
				fill: ${style.primaryFill};
				font-weight: 400;
			}
			.secondary {
				fill: ${style.secondaryFill};
				font-weight: 700;
				letter-spacing: 0.9px;
			}
		</style>
	</defs>
	<rect x="0.5" y="0.5" width="${badgeWidth - 1}" height="${BADGE_HEIGHT - 1}" rx="19.5" fill="url(#badgeFill)" stroke="${style.borderColor}" />
	<rect x="1.5" y="1.5" width="${badgeWidth - 3}" height="${BADGE_HEIGHT - 3}" rx="18.5" fill="none" stroke="${style.innerStrokeColor}" stroke-opacity="${style.innerStrokeOpacity}" />
	<circle cx="20" cy="20" r="16.5" fill="${style.iconBackingFill}" fill-opacity="${style.iconBackingOpacity}" />
	${renderSkilltreeIcon(skilltree.key, ICON_X, ICON_X, ICON_SIZE, style.iconOpacity)}
	<g class="badge-label">
		<text x="${TEXT_X}" y="14" class="secondary" font-size="${secondaryFontSize}">${escapeXml(skilltreeName.toUpperCase())}</text>
		${showsCheck ? renderCheckMark(TEXT_X, 19, style.checkOpacity) : ''}
		<text x="${primaryTextX}" y="30" class="primary" font-size="${primaryFontSize}">${escapeXml(skillName)}</text>
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
			'Cache-Control': 'public, max-age=60, s-maxage=300'
		}
	});
}

export function handleBadgeRequest(request: Request, catalog: SkillTreeCatalog) {
	const url = new URL(request.url);
	const match = parseBadgePath(url.pathname);
	const variant = getBadgeVariant(url.searchParams);

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

	const skill = findSkillForBadgePath(skilltree, match.skillSlug);
	if (!skill) {
		return badgeErrorResponse('skill_not_found', 404);
	}

	const etag = JSON.stringify(`${catalog.manifest.hash}:badge:${match.locale}:${skill.key}:${variant}`);
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

	const svg = renderSkillBadgeSvg(skilltree, skill, match.locale, variant);

	return new Response(request.method === 'HEAD' ? null : svg, {
		status: 200,
		headers
	});
}
