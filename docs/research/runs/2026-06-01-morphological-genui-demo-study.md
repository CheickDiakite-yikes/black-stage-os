# 2026-06-01 Morphological GenUI Demo Study

## Attempted

Studied Cheick's 10-second voice-enabled demo as a product and rendering
reference for Blackstage's next generated-stage direction.

## Prompt / task

Cheick asked Codex to inspect the local demo frame by frame in detail, including
the voice dimension, to understand the target feel before further implementation.

## Source

- Local source video: `/Users/cheickdiakite/Downloads/jgsx_f_ce_erbyq_z_sz_rmp_.mp4`
- Duration: 10.0 seconds
- Video: 1280x720, 24fps
- Audio: AAC source extracted to 16kHz mono WAV for energy analysis

The local video is treated as Cheick-created product reference material. It is
not committed to the repository.

## Frame read

1. `00:00-00:01.1`: black void with a single icy nucleus. The stage feels alive
   before it becomes useful.
2. `00:01.2-00:02.2`: wireframe shell and blurred horizontal context elements
   form around the nucleus.
3. `00:02.2-00:03.1`: context objects orbit the nucleus. They are rectangular,
   but they remain subordinate to the central field and connected geometry.
4. `00:03.2-00:04.0`: objects collapse back into the nucleus. This is the key
   digest move missing from earlier Blackstage attempts.
5. `00:04.0-00:05.2`: the field shifts from icy white to violet and a grid
   appears, signaling a semantic mode change.
6. `00:05.2-00:06.4`: empty sockets and panel positions allocate around the
   nucleus before content fills them.
7. `00:06.4-00:07.3`: generated workbench content appears: code rail, central
   graph, telemetry, and controls.
8. `00:07.3-00:10.0`: the camera tilts into the finished workbench. The final
   interface is dense, but it feels earned because the viewer watched it emerge.

## Audio / voice observation

No local speech-to-text engine was available during the study, so exact words
were not transcribed. Audio energy still showed useful clusters that align with
visual phases:

- `00:00.25-00:00.75`: wake or presence phrase.
- `00:01.25-00:02.25`: context fan-out.
- `00:04.00-00:04.80`: mode shift.
- `00:06.00-00:07.30`: generated-workbench reveal.

## Product insight

The reference does not solve Blackstage by showing better cards. It shows a
stage morphology:

```text
nucleus -> orbit -> collapse -> mode shift -> sockets -> patch growth -> workbench reveal
```

Cards can exist inside this system, but only as temporary contextual matter or
inspectable fallback. The default user experience should be a living render
field with phase changes.

## AI-building insight

The `json-render` lesson remains contract-level: generated UI should be
schema-constrained, catalog-owned, patch-streamed, validated, replayable, and
action-gated. The demo adds the missing Blackstage-specific layer: every patch
must have a visible cinematic phase, not just a DOM destination.

## What Codex did well

- Treated the demo as a timing and morphology reference rather than a screenshot
  style to copy.
- Extracted contact sheets, key frames, waveform, and audio energy.
- Preserved the earlier correction that the black void is the source of truth.

## What failed / needed human intervention

- Exact voice transcription was not possible locally because Whisper, Vosk,
  faster-whisper, and mlx-whisper were not installed.
- Future work should add a local transcription or voice-envelope test harness if
  voice timing becomes implementation-critical.

## Evidence

Generated outside the repository:

- `/tmp/blackstage-demo-contact-4fps.png`
- `/tmp/blackstage-demo-contact-1fps.png`
- `/tmp/blackstage-demo-allframes-contact.png`
- `/tmp/blackstage-demo-waveform.png`
- `/tmp/blackstage-demo-audio.wav`

## Attribution

- Reference demo and product direction: Cheick Diakite.
- Frame/audio analysis and implementation planning: Codex.
- External GenUI contract inspiration: `json-render` by Vercel Labs, studied
  only as a schema/catalog/patch-stream reference.
