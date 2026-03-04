# Curriculum System

This document defines how Jarre keeps the curriculum clean, professional, and reusable as a template for autonomous curriculum generation.

## Source of truth

The curriculum is built from canonical DB tables:

- `concepts`
- `concept_prerequisites`
- `resources`
- `resource_concepts`
- `curriculum_phase_metadata` (phase naming/objective/outcomes)

## Resource classes

`resources.curriculum_source` is the authority for classification:

- `core`: canonical curriculum resources used in the main learning path.
- `user_generated`: resources created from user pipelines.
- `experimental`: temporary/testing resources (not part of production curriculum).

Core rules:

- `core` resources must have `created_by IS NULL`.
- `user_generated` resources must have `created_by IS NOT NULL`.
- Known experimental IDs (`yt-*`, `*fasttest*`) are archived by default.

## Library behavior

Core curriculum cards shown in `/library` are filtered to:

- `is_archived = false`
- `curriculum_source = 'core'`
- `created_by IS NULL`

User-added content remains in `user_resources` and is shown separately as added resources.

## Curriculum quality gates

Use scripts before modifying curriculum structure:

- `npm run curriculum:audit`
- `npm run curriculum:audit -- --strict`

Audit checks include:

- concepts with no teaching resource
- resources with no concept mappings
- backward prerequisites (resource/concept depends on future phase)
- duplicate core URLs inside the same phase

## Template generation

Export canonical curriculum template JSON from DB:

- `npm run curriculum:export-template`
- `npm run curriculum:export-template -- --strict`

Outputs:

- `docs/curriculum/core-template.v1.json`
- `docs/curriculum/core-template.v1.audit.json`

Template endpoint:

- `GET /api/curriculum/template`
- `GET /api/curriculum/template?includeAudit=1`

## Future autonomous curricula

For autonomous generation, use the exported template as the base contract:

1. Keep phase objectives and outcomes from `curriculum_phase_metadata`.
2. Reuse concept graph patterns (DAG constraints, no backward prerequisites).
3. Generate phase/resource candidates.
4. Run audit in strict mode before activation.
5. Materialize generated plans into `curricula`, `curriculum_phases`, and `curriculum_resources`.

This preserves a clean production path while enabling safe experimentation.
