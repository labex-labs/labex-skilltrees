import { skilltreeIcons } from './generated/skilltree-icons';

const BADGE_HEIGHT = 40;
const ICON_SIZE = 32;
const ICON_X = 4;
const TEXT_X = 48;
const RIGHT_PADDING = 10;
const MIN_BADGE_WIDTH = 132;
const CHECK_SIZE = 12;
const CHECK_GAP = 4;
const SECONDARY_LETTER_SPACING = 0.9;

export type BadgeVariant = 'default' | 'earned' | 'unearned';
export type BadgeTheme = 'dark' | 'light';

export interface BadgeSvgOptions {
	iconKey?: string;
	title: string;
	desc: string;
	primaryText: string;
	secondaryText: string;
	variant: BadgeVariant;
	theme: BadgeTheme;
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
	unearnedStroke: string;
	earnedFill: string;
	earnedCheckStroke: string;
}

const DARK_BADGE_STYLE: BadgeStyle = {
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
	unearnedStroke: '#94A3B8',
	earnedFill: '#22C55E',
	earnedCheckStroke: '#FFFFFF',
};

const LIGHT_BADGE_STYLE: BadgeStyle = {
	backgroundStops: `
		<stop offset="0%" stop-color="#FFFFFF" />
		<stop offset="58%" stop-color="#F8FAFC" />
		<stop offset="100%" stop-color="#EEF2F7" />`,
	borderColor: '#CBD5E1',
	innerStrokeColor: '#FFFFFF',
	innerStrokeOpacity: 0.8,
	iconOpacity: 0.92,
	iconBackingFill: '#0F172A',
	iconBackingOpacity: 0.06,
	primaryFill: '#0F172A',
	secondaryFill: '#475569',
	unearnedStroke: '#64748B',
	earnedFill: '#16A34A',
	earnedCheckStroke: '#FFFFFF',
};

const BADGE_STYLES: Record<BadgeTheme, Record<BadgeVariant, BadgeStyle>> = {
	dark: {
		default: DARK_BADGE_STYLE,
		earned: DARK_BADGE_STYLE,
		unearned: DARK_BADGE_STYLE,
	},
	light: {
		default: LIGHT_BADGE_STYLE,
		earned: LIGHT_BADGE_STYLE,
		unearned: LIGHT_BADGE_STYLE,
	},
};

export function escapeXml(value: string) {
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
	const secondaryWidth =
		estimateTextWidth(secondaryText, hasCjkText(secondaryText) ? 9 : 9) +
		Math.max(0, Array.from(secondaryText).length - 1) * SECONDARY_LETTER_SPACING;
	const statusWidth = reservesCheck ? CHECK_SIZE + CHECK_GAP : 0;

	return Math.ceil(Math.max(MIN_BADGE_WIDTH, TEXT_X + Math.max(primaryWidth + statusWidth, secondaryWidth) + RIGHT_PADDING));
}

function renderSkilltreeIcon(treeKey: string | undefined, x: number, y: number, size: number, opacity: number) {
	const icon = skilltreeIcons[treeKey ?? 'labex'] ?? skilltreeIcons.labex;

	if (!icon) {
		return '';
	}

	return `
		<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="${escapeXml(icon.viewBox)}" opacity="${opacity}" aria-hidden="true" focusable="false">
				${icon.body}
		</svg>`;
}

function renderStatusIcon(x: number, y: number, variant: BadgeVariant, style: BadgeStyle) {
	if (variant === 'default') {
		return '';
	}

	const centerX = x + CHECK_SIZE / 2;
	const centerY = y + CHECK_SIZE / 2;

	if (variant === 'unearned') {
		return `
	<g>
		<circle cx="${centerX}" cy="${centerY}" r="5.35" fill="none" stroke="${style.unearnedStroke}" stroke-width="1.35" stroke-dasharray="1.6 2.1" stroke-linecap="round" />
	</g>`;
	}

	return `
	<g>
		<circle cx="${centerX}" cy="${centerY}" r="6" fill="${style.earnedFill}" />
		<path d="m${centerX - 2.9} ${centerY + 0.2} 2 2 3.9-4.3" fill="none" stroke="${style.earnedCheckStroke}" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" />
	</g>`;
}

export function getBadgeVariant(searchParams: URLSearchParams): BadgeVariant {
	const earned = searchParams.get('earned');

	if (earned === '1' || earned === 'true') {
		return 'earned';
	}

	if (earned === '0' || earned === 'false') {
		return 'unearned';
	}

	return 'default';
}

export function getBadgeTheme(searchParams: URLSearchParams): BadgeTheme {
	return searchParams.get('theme') === 'light' ? 'light' : 'dark';
}

export function renderBadgeSvg(options: BadgeSvgOptions) {
	const style = BADGE_STYLES[options.theme][options.variant];
	const showsStatus = options.variant !== 'default';
	const secondaryText = options.secondaryText.toUpperCase();
	const badgeWidth = badgeWidthForText(options.primaryText, secondaryText, showsStatus);
	const primaryFontSize = hasCjkText(options.primaryText) ? 15 : 15;
	const secondaryFontSize = hasCjkText(secondaryText) ? 9 : 9;
	const primaryTextX = showsStatus ? TEXT_X + CHECK_SIZE + CHECK_GAP : TEXT_X;

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${badgeWidth}" height="${BADGE_HEIGHT}" viewBox="0 0 ${badgeWidth} ${BADGE_HEIGHT}" role="img" aria-labelledby="title desc">
	<title id="title">${escapeXml(options.title)}</title>
	<desc id="desc">${escapeXml(options.desc)}</desc>
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
		${renderSkilltreeIcon(options.iconKey, ICON_X, ICON_X, ICON_SIZE, style.iconOpacity)}
	<g class="badge-label">
		<text x="${TEXT_X}" y="14" class="secondary" font-size="${secondaryFontSize}">${escapeXml(secondaryText)}</text>
		${renderStatusIcon(TEXT_X, 19, options.variant, style)}
		<text x="${primaryTextX}" y="30" class="primary" font-size="${primaryFontSize}">${escapeXml(options.primaryText)}</text>
	</g>
</svg>`;
}
