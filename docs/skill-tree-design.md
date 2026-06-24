# Skill Tree Design Guide

This document explains how to design and maintain LabEx Skill Trees for an open contributor community.

The goal is to keep the model stable enough for learning analytics and assessment, while still allowing the catalog to improve as technologies evolve.

## Core Definition

A LabEx Skill Tree is a concept-level skill index for one technology domain.

- A **skill tree** is a domain map, for example Linux, Python, Docker, Git, Kubernetes, or PostgreSQL.
- A **skill** is a stable capability that can be taught, practiced, and assessed.
- A **lab** or assessment can bind to one or more skills and provide evidence about mastery.

Skill Trees should not be treated as course outlines, lesson lists, certification blueprints, or content inventory. They answer:

> What capabilities exist in this domain, and which of them has a learner demonstrated?

They do not directly answer:

> What lesson should every learner take next?

Learning paths, recommendations, difficulty levels, and user progress should be built on top of the skill model rather than encoded inside the skill tree JSON.

## Data Model Boundaries

Canonical skill tree JSON should contain:

- Stable skill tree identity: `key`, `slug`, and `name`.
- An ordered `skills` array.
- Stable skill identity: `key` and `slug`.
- User-facing English `name` and `desc`.
- Optional localized `i18n` display text for skills.

Canonical skill tree JSON should not contain:

- User state such as learned, completed, followed, score, or confidence.
- Lab implementation details.
- Course lesson order.
- Temporary content inventory.
- Personalized recommendations.
- UI grouping, visibility flags, or product-specific display configuration.
- Difficulty levels such as Basic, Intermediate, or Advanced as separate skills.

The `skills` array order is the canonical ordering for the domain. It may be used for display, but it is not a strict prerequisite graph.

## Skill Granularity

Use concept-level granularity.

A good skill is small enough to be assessed, but broad enough to transfer across more than one exercise.

Good examples:

- File Permissions
- Exception Handling
- Docker Images
- Git Branching
- SQL Joins
- Kubernetes Services

Too broad:

- Linux Administration
- Python Basics
- Database Management
- Web Development
- Security Fundamentals

Too narrow:

- Run `ls -l`
- Use `list.append()`
- Add the Docker `-p` flag
- Write one `try/catch` block
- Click a specific UI option

A practical test: one guided lab should be able to teach the skill, one challenge lab should be able to assess it, and several different labs should be able to provide evidence for the same skill over time.

## Domain Boundaries

Each skill tree needs a clear boundary. A skill belongs in a tree when it is part of that domain's core capability model, not merely because it is often used nearby.

Examples:

- Git workflows belong in the Git tree, not the Linux tree, even though Git is often used in Linux terminals.
- Shell language semantics belong in the Shell tree, not the Linux tree, even though Linux users often write shell scripts.
- Docker image building belongs in the Docker tree, not the Kubernetes tree, even though Kubernetes runs container images.
- General cybersecurity concepts belong in Cybersecurity, while tool-specific operation belongs in Nmap, Hydra, or Wireshark.

When a lab crosses domains, bind the lab to multiple skills from multiple skill trees. Do not duplicate the same capability across trees just because one scenario uses several technologies.

## Skill vs Capability Area

Skills should be leaf capabilities. They should not act as broad category headers.

Avoid adding both a broad umbrella skill and its children:

- `File Operations` plus `Path Handling`, `Reading Files`, and `Writing Files`.
- `Standard Library Usage` plus `Regular Expressions`, `Date and Time`, and `Logging`.
- `Code Documentation` plus `Docstrings` and `Comments`.

Use capability areas during design and review, but do not encode them as canonical skill records unless the area itself is directly assessable at a stable granularity.

## Naming Rules

### Skill Tree Fields

`key`:

- Lowercase ASCII.
- Stable over time.
- Matches the file name: `v2/{key}.json`.
- Uses `-` or `_` only when the domain naturally needs multiple words.

`slug`:

- Must match `key` for skill tree files.

`name`:

- English display name.
- Short and recognizable.

### Skill Fields

`skill.key` must use:

```text
{skilltreeKey}/{skillSlug}
```

`skill.slug`:

- Unique within the skill tree.
- ASCII-only.
- Stable enough for lab bindings and progress mapping.
- Prefer concepts over exercise actions.
- Avoid prefixes such as `learn_`, `intro_to_`, `use_`, or `practice_`.
- Avoid single option names such as `grep_i` unless the option itself is the assessable capability.

`skill.name`:

- Short, user-facing capability label.
- No trailing punctuation.
- Prefer capability wording over implementation steps.

`skill.desc`:

- Complete English sentence.
- Explains what the learner understands or can do.
- Does not mention a specific lab, course, product state, or user completion.

## Localization

English `name` and `desc` are the canonical source and fallback. Do not add `en` inside `i18n`.

Supported locale keys:

- `zh`
- `es`
- `fr`
- `de`
- `ja`
- `ru`
- `ko`
- `pt`

Localization should preserve the original skill boundary. It should not turn a skill into a course title, marketing phrase, instruction, or broader/narrower concept.

If a translation cannot be reviewed for technical accuracy, omit it and let consumers fall back to English.

## Versioning

The current canonical model is `v2`.

The `v1` directory is kept for compatibility with consumers that still depend on the earlier data. New model work should target `v2` unless a maintainer explicitly asks for a compatibility change.

Stable identifiers matter. Renaming a skill slug or key can break lab bindings, analytics, and downstream integrations. Prefer improving `name` and `desc` when the intended skill boundary remains the same.

When a skill boundary changes materially, treat it as a model change:

- Explain the old and new boundary in the pull request.
- Check affected labs or downstream bindings if known.
- Prefer additive changes when compatibility matters.

## Adding a Skill

Before adding a skill, ask:

- Is this part of the core domain boundary?
- Is it a reusable capability rather than a one-off task?
- Can it be taught in a guided lab?
- Can it be assessed in a challenge lab or project?
- Is the granularity similar to neighboring skills?
- Would the skill still make sense if current LabEx content changed?
- Is it better modeled as a capability area or lab-level detail?

Do not add a skill only because one lab currently exists. Also do not omit a core skill only because there is no lab yet.

## Removing or Merging a Skill

Consider removal or merge when:

- A skill is only a command option, syntax fragment, or one exercise step.
- A skill duplicates another skill.
- A skill is outside the domain boundary.
- A skill is an umbrella category rather than an assessable leaf capability.
- A skill is merely a difficulty level of another skill.

When removing or merging, explain the impact on downstream bindings if known.

## Review Checklist

Use this checklist for pull requests that modify skill tree data:

- The JSON passes `npm run validate`.
- The skill tree `key`, `slug`, and file name match.
- Every skill key matches `{skilltreeKey}/{skillSlug}`.
- New skills are assessable concept-level capabilities.
- Skill names are short and user-facing.
- Descriptions are complete sentences and describe capabilities.
- No user state, lab metadata, display grouping, or recommendation data is added.
- Domain boundaries are clear.
- There are no obvious parent/child duplicate skills in the same tree.
- Translations preserve the English skill boundary.
- Identifier changes are called out explicitly.
