# Local Context Intake Slice

Date: 2026-05-10

## Objective Gap

The reality-interface goal calls for voice, text, and multimodal precision. Before this slice, Stage Shell could accept text and mocked browser speech, but it could not turn user-provided local context into a stage object.

## Slice Implemented

- Added `context.attached` stage events.
- Added `context_attached` research events with safe metadata only.
- Added an `Attach` control to the intent bar for local text, markdown, JSON, CSV, and image files.
- Created a pinned `document_portal` render object for each selected file.
- Included text excerpts for text-like files, while keeping the file local and not uploading anything.
- Added e2e coverage proving a local text file becomes an inspectable private document object and is logged as context attachment.

## Boundary

This is a local v0 intake path. It does not upload files, OCR images, parse PDFs, persist binary contents, or connect to external document stores.

## Product Insight

The stage feels more like a workspace when exact context can be summoned as an object instead of pasted into a chat box. The privacy boundary must stay visible because attached context can be sensitive.

## Validation Notes

Full gate after implementation:

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: passed; package tests are still placeholder echoes except e2e.
- `pnpm build`: passed.
- `pnpm test:e2e`: passed with five tests, including the local context attachment test.
- `pnpm scan:secrets`: passed; no high-confidence secrets found across 107 tracked files.
