# LabEx Skill Trees

LabEx Skill Trees is an open catalog of technology skills designed for hands-on learning and skill assessment.

The repository contains the public source data behind the LabEx skill assessment model: each skill tree describes the stable, assessable capabilities in one technical domain such as Linux, Python, Docker, Git, Kubernetes, SQL, or cybersecurity. The model is intended to help individuals, educators, and organizations map learning content, practice labs, challenge labs, and assessment evidence to a shared skill taxonomy.

## What Is a Skill Tree?

A skill tree is not a course outline. It is a domain skill map.

- A **skill tree** represents one technology domain, for example `linux`, `python`, or `docker`.
- A **skill** represents a concept-level capability that can be taught, practiced, and assessed.
- The `skills` array is the canonical order for that domain, but it should not be treated as a strict learning path.
- Skill mastery should be inferred from evidence, such as guided labs, challenge labs, projects, or assessments.

LabEx uses this model to connect hands-on labs and challenges to measurable skills. Other projects can use the same data model to build curricula, assessment rubrics, progress dashboards, recommendation systems, or internal capability maps.

## Repository Layout

```text
v2/                     Current canonical skill tree data
v1/                     Legacy skill tree data kept for compatibility
docs/skill-tree-design.md
                        Design principles for contributors
scripts/                Catalog generation and validation scripts
src/                    Optional JSON API implementation
skilltree.schema.json   JSON Schema for one skill tree file
```

The current canonical dataset is `v2`. It contains 25 skill trees and 1,129 skills. The `v1` dataset is retained for consumers that still need the earlier model.

## Data Format

Each `v2/{key}.json` file contains one skill tree:

```json
{
  "key": "linux",
  "slug": "linux",
  "name": "Linux",
  "skills": [
    {
      "key": "linux/terminal_sessions",
      "slug": "terminal_sessions",
      "name": "Terminal Sessions",
      "desc": "Terminal sessions cover working in interactive shell environments and recognizing prompt, session, and terminal context."
    }
  ]
}
```

Required fields:

- `key`: stable lowercase identifier for the skill tree.
- `slug`: URL/display slug; for skill trees this should match `key`.
- `name`: English display name.
- `skills`: ordered list of assessable skills.
- `skill.key`: `{skilltreeKey}/{skillSlug}`.
- `skill.slug`: stable identifier used for binding labs and assessments.
- `skill.name`: short English display name.
- `skill.desc`: English description of the capability.

Skills may include an optional `i18n` object for localized `name` and `desc` values. English remains the canonical fallback.

## Using the Data

You can consume the JSON files directly from the repository, validate them with `skilltree.schema.json`, use the public LabEx API, or run the included API locally.

Public API base URL:

```text
https://skilltrees.labex.app
```

Common public endpoints:

- `GET https://skilltrees.labex.app/api/manifest`
- `GET https://skilltrees.labex.app/api/skilltrees/summary`
- `GET https://skilltrees.labex.app/api/skilltrees`
- `GET https://skilltrees.labex.app/api/skilltrees/{key}`
- `GET https://skilltrees.labex.app/api/v1/skilltrees/summary`
- `GET https://skilltrees.labex.app/api/v2/skilltrees/summary`

`/api/skilltrees/summary` is the lightweight index endpoint. It returns each skill tree's `key`, `slug`, `name`, `skill_count`, and relative API `path`, so clients can discover valid keys before requesting `/api/skilltrees/{key}`.

Prerequisite: Node.js 22 or newer.

```bash
npm install
npm run validate
npm run build
```

Start the local API:

```bash
npm run dev
```

Common API endpoints:

- `GET /api/manifest`
- `GET /api/skilltrees/summary`
- `GET /api/skilltrees`
- `GET /api/skilltrees/{key}`
- `GET /api/v1/skilltrees/summary`
- `GET /api/v2/skilltrees/summary`

The API implementation is optional. The skill tree data model is independent of any hosting provider.

## Contributing

Contributions are welcome when they improve the quality, consistency, or coverage of the skill model.

Good contributions usually do one of the following:

- Improve a skill name or description without changing its intended boundary.
- Add a missing core skill that can be taught and assessed.
- Remove or merge skills that are too narrow, duplicated, or not assessable.
- Improve translations while preserving the English skill boundary.
- Add a new skill tree for a clearly scoped technology domain.

Before opening a pull request:

```bash
npm run validate
npm run build
```

Read [docs/skill-tree-design.md](docs/skill-tree-design.md) and [CONTRIBUTING.md](CONTRIBUTING.md) before making larger model changes.

## Design Principles

The short version:

- Model skills, not course chapters.
- Keep each skill assessable through hands-on work.
- Keep skill boundaries stable and domain-specific.
- Prefer core, common capabilities over exhaustive coverage.
- Put difficulty in labs or assessment rubrics, not in skill names.
- Keep user progress, recommendations, lab metadata, and display grouping outside the canonical skill tree JSON.

## License

This repository is being prepared for open-source release. Add the final license file before publishing the public repository.
