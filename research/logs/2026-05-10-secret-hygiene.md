# Secret Hygiene Log

**Date:** 2026-05-10

## What Changed

- Expanded `.gitignore` for common API keys, cloud credentials, private keys, local provider folders, build caches, and deployment metadata.
- Added `pnpm scan:secrets`, a local high-confidence scanner for tracked files.
- Added Dependabot configuration for weekly npm workspace dependency checks.
- Documented the secret scan command in README and contributing docs.
- Checked GitHub repository security settings for secret scanning and push protection.

## Assumptions

- The first public repository should not track local QA artifacts, build outputs, binary workbooks, duplicate build-pack files, or credential-shaped files.
- High-confidence local scanning is useful before every push, even though GitHub secret scanning is also enabled.

## Problems

- GitHub accepted the security settings update, but `secret_scanning_non_provider_patterns` and `secret_scanning_validity_checks` remained disabled in the API response, likely because those features are not available for this account/repo plan.

## What Should Be Built Next

- Add a CI workflow that runs `pnpm install`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm scan:secrets`, and `pnpm test` on pull requests.
