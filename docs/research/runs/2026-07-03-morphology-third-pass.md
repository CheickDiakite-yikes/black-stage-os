# 2026-07-03 Morphology Third Pass

## Attempted

A third taste pass on the default active generated field, targeting the
nucleus/orbit/collapse/socket/workbench feel on desktop and phone. This pass
assumes the in-flight direction of the working tree: audit cards are hidden in
the default active view and inspect mode is gated behind an explicit
`?stageAudit=1` route, so the generated morphology field is the only default
surface and has to carry the whole experience.

## What changed

- **Orbit context matter is now legible.** Orbit objects carry a truncated
  `data-orbit-label` rendered through CSS `attr()` pseudo-content (invisible to
  text locators and the accessibility tree, since the field is `aria-hidden`).
  Roles tint edges, and a slow float keeps orbiting matter alive. Orbit radius
  is capped at `40vw` so the ring stays inside phone viewports.
- **Collapse is now visible.** Fixed a real defect: the orbit arrival
  animation's `fill-mode: both` pinned `opacity`/`transform` and silently
  blocked the digesting/resolved state styles, so context never visually
  compressed into the nucleus. Lifecycle states now drop the animation
  explicitly. Resolved matter is absorbed near the nucleus instead of lingering
  as scattered dust. Active collapse vectors carry traveling sparks, and the
  digesting/generating nucleus shows a contracting pull ring.
- **Sockets read as allocated space, not panels.** Corner-tick framing
  (masked border), a role label from `data-socket-label`, grid fill only once
  the socket is filling/resolved, and a slow scan sweep while filling. A
  pending approval holds an amber-cornered blocked socket plus a steady
  boundary ring on the nucleus.
- **Packets travel.** Patch packets animate from the nucleus to their socket
  lane instead of popping in place, so patch growth reads as flow out of the
  digested center.
- **The core yields to dense surfaces.** In approval and workbench phases the
  nucleus/orbit/vector core lifts (composable `translate`/`scale` properties,
  so the breathe animation keeps its `transform`) and recedes above the text
  instead of muddying it. On phone it recedes mostly by scale.
- **Fixed a socket-plane collapse bug.** The workbench tilt transform made the
  unpositioned `.generated-morph-sockets` div the containing block for its
  absolutely positioned sockets, collapsing all of them into a zero-height
  strip at the top of the field. The container now owns `position: absolute;
inset: 0`.
- **Phone guardrails.** The phase rail moved clear of the two-row intent dock,
  and socket/orbit labels are smaller and dimmer on phone.
- **Test hardening.** The reduced-motion proof waited on `data-morph-mode`,
  which settles at thread creation while the phase can still be
  `nucleus_awake`; it now also waits for the phase to leave the wake state
  before sampling evidence. This race was reproduced at baseline without the
  third-pass changes.

## Validation

- `corepack pnpm --filter @blackstage/stage-web typecheck`: passed.
- `corepack pnpm exec eslint` on touched TS files: passed.
- `pnpm test:morphology`: passed 5 of 5 when run with the repo's declared
  `pnpm@8.15.7` through a temporary PATH wrapper. Coverage: startup URL,
  research/planning scenarios, reduced motion, desktop approval-to-artifact
  stream, and phone viewport.
- `git diff --check`: passed.
- Screenshot capture now waits for the generated surface to settle so the
  tracked desktop and phone artifacts record readable text/actions instead of
  the blurred midpoint of the arrival animation.
- Staged Playwright screenshots at 1440x900 and 390x844 were refreshed and
  reviewed for taste.

## Product insight

Once cards are gone, meaning has to live in the field itself: an unlabeled
orbit pill is noise, but the same pill with a six-character role label becomes
visible work. The stage stops feeling generative exactly where geometry has no
semantics attached.

## AI-building insight

Two of the biggest visual defects (invisible collapse, collapsing socket
plane) were not taste problems but CSS mechanics: animation fill-modes
overriding state styles, and transforms silently changing containing blocks.
Morphology passes should audit the interaction of animations with lifecycle
state styles, not only the keyframes themselves.

## Remaining risk

- Socket label density on phone is tuned by eye; a naive-user pass should
  confirm it stays under the clutter threshold.
- The stream is still deterministic fixture-driven; live model-generated patch
  validation remains future work.
