# 30 Morphological GenUI Demo Harness

## Purpose

This harness keeps the current Blackstage GenUI direction easy to replay,
review, and defend: black void first, generated morphology second, audit cards
only when inspect mode is summoned.

## Local Demo

Start the Stage web app:

```bash
pnpm demo:morphology
```

Open the demo intent URL:

```text
http://127.0.0.1:5173/?stageIntent=Build%20BlackStage
```

If Vite chooses a different port, use the URL Vite prints and append:

```text
?stageIntent=Build%20BlackStage
```

## Review Beats

1. Open `/` first if you want to verify the idle black void and nucleus.
2. Open the startup-intent URL to watch the field become active.
3. Confirm the generated field shows nucleus, orbit matter, sockets, patch
   clock, semantic mode, and approval ritual before dense audit surfaces.
4. Approve the pending action and confirm the workbench reveal feels earned.
5. Press `Audit` only after the primary stream has been reviewed.
6. On phone width, verify the main field remains operable and inspect mode
   shows a sparse audit layer instead of the full desktop wall.

## One-Command Proof

Run the focused morphology proof:

```bash
pnpm test:morphology
```

This executes the startup-intent demo URL, research/planning scenario checks,
the desktop approval-to-artifact stream, and the phone morphology viewport
guardrail.

## Screenshot Artifacts

The focused proof refreshes:

- `artifacts/screenshots/stage-shell-v0.png`
- `artifacts/screenshots/stage-shell-phone-v0.png`

The phone screenshot is intentionally captured before inspect mode so the saved
artifact represents the main GenUI surface rather than the audit fallback.

## PR Narrative

This slice does not replace one card wall with another. It introduces a
stage-owned morphology layer:

- `StageMorphFrame` compiles stage events and intent-thread state into phase,
  mode, nucleus, orbit, sockets, patches, camera, approval, and workbench data.
- `StageGeneratedStream` renders that frame from the black field.
- Inspect mode keeps cards available for audit without making them the default
  experience.
- Morphology telemetry persists redacted frame evidence for replay and research.
- Desktop and phone e2e proofs enforce the direction.

## Attribution

- Product direction, demo reference, and taste bar: Cheick Diakite.
- Engineering implementation partner: Codex.
- External protocol references used in the research brief are listed in
  `docs/research/runs/2026-06-01-genui-protocol-research-refresh.md`.
