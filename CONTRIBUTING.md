# Contributing to LabEx Skill Trees

Thank you for helping improve the LabEx skill assessment model.

This repository is data-first. Most contributions should improve the quality, consistency, or coverage of the skill tree JSON files in `v2/`.

## Before You Start

Read:

- [README.md](README.md)
- [docs/skill-tree-design.md](docs/skill-tree-design.md)
- [skilltree.schema.json](skilltree.schema.json)

Install dependencies:

```bash
npm install
```

Run checks:

```bash
npm run validate
npm run build
```

## What to Contribute

Good contributions include:

- Clearer skill names or descriptions.
- Missing core skills for an existing domain.
- Fixes for duplicated, overly broad, or overly narrow skills.
- Better localized `i18n` text.
- New skill trees for well-scoped technology domains.
- Improvements to validation, docs, or API usability.

Avoid contributions that add:

- User progress or personalization fields.
- Lab implementation details.
- Course lesson order.
- UI grouping or visibility flags.
- Skills that are only single command flags, syntax fragments, or exercise steps.
- Broad category headers that cannot be assessed as leaf capabilities.

## Editing Skill Trees

Use `v2/` for current model changes.

When editing a skill:

- Keep `key` and `slug` stable unless the skill boundary truly changes.
- Keep `skill.key` in `{skilltreeKey}/{skillSlug}` format.
- Write the base `name` and `desc` in English.
- Make `name` short and user-facing.
- Make `desc` a complete sentence that describes the capability.
- Preserve the original skill boundary when updating translations.

When adding a skill, place it near related skills in the `skills` array. The order is canonical, but it is not a strict learning path.

## Pull Request Expectations

For data changes, include:

- Which skill tree changed.
- Why the change improves the assessment model.
- Any identifier changes and their expected compatibility impact.
- Whether translations were reviewed by someone familiar with the technology and language.

For new skill trees, include:

- The domain boundary.
- Why it should be a separate skill tree rather than part of an existing one.
- A short explanation of the intended audience and assessment scenarios.

Before opening the pull request, run:

```bash
npm run validate
npm run build
```

## Compatibility

Downstream systems may bind labs, assessments, analytics, and progress records to skill keys. Treat key and slug changes carefully.

If you need to rename, split, or merge skills, describe the migration path in the pull request.
