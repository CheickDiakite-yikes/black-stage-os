# Contributing To Black Stage OS

Thank you for helping shape Blackstage. This project is an early product prototype and a research lab, so contribution quality means both good code and clear reasoning.

## Before You Start

Read:

- `AGENTS.md`
- `docs/00_document_index.md`
- `docs/01_product_manifesto.md`
- `docs/05_system_architecture.md`
- The relevant spec or research log for your change

## Development Setup

```bash
pnpm install
pnpm dev
```

Before opening a pull request, run:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

## Contribution Guidelines

- Keep changes focused and easy to review.
- Prefer TypeScript and serializable domain models.
- Keep core models separate from UI code.
- Preserve the black-stage feeling: calm, cinematic, trustworthy, and not chatbot-like.
- Do not add real external actions without approval gates and visible audit surfaces.
- Do not add dependencies unless they remove real complexity or support a clear product need.
- Respect reduced-motion and accessibility requirements.
- Update docs or research logs when a change affects behavior, architecture, design direction, or research instrumentation.

## Pull Request Checklist

Include:

- What changed.
- Why it changed.
- Screenshots or short clips for visual changes.
- Commands run for validation.
- Known limitations or follow-up work.
- Any research instrumentation impact.

## Commit Attribution

Use a Git email that is verified on your GitHub account so contribution history is attributed correctly.

Maintainers should verify local repo identity before committing:

```bash
git config user.name
git config user.email
```

## Design Contributions

Design changes should preserve the reference direction:

- Deep black field.
- Fine gold/celestial geometry.
- Soft motion.
- Sparse, high-trust interface text.
- No generic chatbot surface.
- No decorative clutter that competes with intent.

## Security And Privacy

Never commit secrets, credentials, tokens, private user data, or personal files. Avoid writing sensitive content into research logs. If your contribution touches memory, external tools, network calls, or approvals, call that out clearly in the PR.

## Code Of Conduct

Be direct, generous, and rigorous. Critique the work, not the person. This project is exploring a new interface category, so disagreement is welcome when it is specific and grounded in the product principles.
