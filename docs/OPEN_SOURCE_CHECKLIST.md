# Open Source Readiness Checklist

## Completed Baseline

- MIT license present
- Code of conduct, contributing, and security policy present
- Issue and PR templates present
- CI workflow (lint, test, typecheck, build)
- Dependency review workflow
- Dependabot automation
- Governance and support docs
- Architecture and content policy docs

## Next Actions (High Priority)

- Audit repository assets for third-party copyright compliance (especially educational media/text)
- Resolve current `npm audit` findings (`minimatch` high, `markdown-it` moderate) via dependency upgrades or overrides
- Define public roadmap and release cadence
- Add maintainer ownership metadata (`CODEOWNERS`) once team handles are confirmed
- Add explicit support/discussion links in issue template config when public URLs are finalized

## Next Actions (Medium Priority)

- Increase unit/integration coverage for API routes and critical learner flows
- Gradually reduce current lint warning debt
- Publish contribution examples (small, medium, large PR templates)
- Define versioning and release tagging policy for stable milestones

## Next Actions (Optional)

- Add architecture decision records (ADRs)
- Add performance budgets and benchmarks for heavy UI routes
- Add automated license scanning for dependencies
