const BADGE_RESOURCE_LABELS = {
	en: {
		course: 'Course',
		skill: 'Skill',
		skilltree: 'Skilltree',
	},
	zh: {
		course: '课程',
		skill: '技能',
		skilltree: '技能树',
	},
	es: {
		course: 'Curso',
		skill: 'Habilidad',
		skilltree: 'Árbol de habilidades',
	},
	fr: {
		course: 'Cours',
		skill: 'Compétence',
		skilltree: 'Arbre de compétences',
	},
	de: {
		course: 'Kurs',
		skill: 'Fähigkeit',
		skilltree: 'Skilltree',
	},
	ja: {
		course: 'コース',
		skill: 'スキル',
		skilltree: 'スキルツリー',
	},
	ru: {
		course: 'Курс',
		skill: 'Навык',
		skilltree: 'Дерево навыков',
	},
	ko: {
		course: '코스',
		skill: '스킬',
		skilltree: '스킬트리',
	},
	pt: {
		course: 'Curso',
		skill: 'Habilidade',
		skilltree: 'Árvore de habilidades',
	},
} as const;

export type BadgeResourceKind = keyof typeof BADGE_RESOURCE_LABELS.en;

export function getBadgeResourceLabel(kind: BadgeResourceKind, locale: string) {
	const labels = BADGE_RESOURCE_LABELS[locale as keyof typeof BADGE_RESOURCE_LABELS] ?? BADGE_RESOURCE_LABELS.en;
	return labels[kind];
}

export function formatBadgeSecondaryText(name: string, kind: BadgeResourceKind, locale: string) {
	return `${name} ${getBadgeResourceLabel(kind, locale)}`;
}
