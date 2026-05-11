# Stage Broker Local Server Slice

Date: 2026-05-10

## Prompt / Task

Continue the `/goal` loop by turning the Realtime broker route contract into a local server entrypoint while keeping live provider calls disabled by default.

## What Was Attempted

- Added `apps/stage-broker`, a tiny Node HTTP app that mounts `/api/blackstage/realtime/session`.
- Added `pnpm dev:broker` as a root convenience command.
- Kept the mounted route disabled by default and SDP-only.
- Added tests that hit an actual local TCP server and prove disabled, invalid content-type, and injected-live SDP exchange behavior.
- Kept live OpenAI exchange injected rather than built in, so the app does not make provider calls by default.
- Stabilized browser validation with a reduced-motion Playwright context so the cinematic Stage Shell remains testable.

## What Codex Did Well

- Preserved the trusted-server boundary while moving from pure contract to a mounted local route.
- Avoided adding a web framework before there is a real need.
- Caught ESM/runtime resolution issues in tests and switched the server to explicit built-file imports for local Node execution.

## What Needed Correction

- The new app needed Node types in its `tsconfig`.
- Test strings that looked like secrets were replaced so the secret scanner remains meaningful.
- The full browser proof initially timed out on long animation/actionability waits; reduced-motion validation and measured timeouts were needed.

## Product Insight

The live voice path can now be developed as infrastructure without changing the Stage experience. That is the right order: get the doorway safe, then make the field speak through it.

## AI-Building Insight

Route-level tests against a real local server catch issues that pure contract tests miss, especially ESM packaging and response header behavior.

## Evidence

- `pnpm --filter @blackstage/stage-broker test`: passed with 3 local server subtests.
- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed with 14 `voice-core`, 4 `memory-core`, 13 `agent-runtime`, and 3 `stage-broker` subtests.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with 9 browser tests.
- `pnpm scan:secrets`: passed with no high-confidence secrets across 170 tracked files after final staging.
