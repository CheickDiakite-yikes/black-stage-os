# Security Policy

Black Stage OS is early-stage software. Please treat it as a research prototype, not production infrastructure.

## Supported Versions

Only the current `main` branch is supported.

## Reporting A Vulnerability

Please do not open a public issue for vulnerabilities involving secrets, user data, prompt injection, approval bypasses, or unsafe external actions.

Report privately to the maintainer using the verified GitHub contact channel for the repository owner. Include:

- A short description of the issue.
- Steps to reproduce.
- Potential impact.
- Any suggested fix.

## Project Security Principles

- External actions require explicit human approval.
- User memory and private context require policy boundaries.
- Research logs should avoid sensitive content by default.
- Secrets and credentials must never be committed.
- Simulated demos must be labeled as simulation.
