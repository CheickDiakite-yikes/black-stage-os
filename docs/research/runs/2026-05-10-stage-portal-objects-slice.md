# Stage Portal Objects Slice

Date: 2026-05-10

## Objective Gap

The broader reality-interface goal calls for documents, browser surfaces, and other dynamic work objects to appear around intent. Before this slice, Stage Shell had typed `document_portal` and `browser_portal` object names, but the UI rendered them like generic payload cards.

## Slice Implemented

- Replaced the duplicate build-labor render object in the Blackstage build fixture with a simulated `document_portal`.
- Added an approval-created simulated `browser_portal` to show where live validation evidence belongs.
- Added first-class document and browser portal renderers inside `StageObjectCard`.
- Styled portal surfaces with quiet document sections and a restrained simulated browser bar.
- Extended e2e coverage to prove both portal surfaces render in the primary Stage Shell flow.

## Boundary

The portals are still simulated v0 render objects. They do not browse externally, load private files, or connect to live browser/computer-use integrations.

## Product Insight

Typed portal surfaces make the stage feel more like a cognitive workspace and less like a set of generic cards. The next leap is to make these portals live, inspectable, and controllable without losing the calm black field.

## Validation Notes

Full gate after implementation:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed; package tests are still placeholder echoes except e2e.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed in the portal slice, and the later natural-command slice expanded the suite to three tests with the full streamed scenario on a 120s budget.
- `pnpm scan:secrets`: passed; no high-confidence secrets found across 107 tracked files.
