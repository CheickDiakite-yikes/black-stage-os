# 31 Morphology Deep Pass Two

## Purpose

This is the second 20-slice pass for the Blackstage GenUI stage. The first pass
made the stage stop behaving like a card wall by introducing `StageMorphFrame`,
generated morphology, inspect mode, telemetry, responsive proof, and a demo
harness.

This pass pushes the renderer toward more obvious streaming generation:
transition state, collapse vectors, patch packets, density governance, richer
telemetry, and multi-scenario proof.

## Product Direction

The stage should feel like a black living field constructing work from intent.
The user should see temporal state: what is arriving, what is being digested,
what is blocked by approval, what has been patched, and what has been revealed.
Cards remain an inspect/audit layer only.

## Twenty Slices

1. **Second-pass slice ledger**  
   Add this document and use it as the implementation checklist.

2. **Transition metrics contract**  
   Extend the morph frame with phase index, completion ratio, active phase
   progress, event velocity, and transition reason.

3. **Density governor contract**  
   Add a density/clutter-risk summary so the UI can prove it is suppressing
   card walls rather than hiding them accidentally.

4. **Patch packet contract**  
   Convert morph patches into renderable packet coordinates with status, phase,
   lane, progress, and delay.

5. **Collapse vector contract**  
   Add orbit-to-nucleus vector metadata so digest/collapse is explicit instead
   of implied by opacity.

6. **Core tests for frame depth**  
   Verify transition, density, packet, and vector data on deterministic
   fixtures.

7. **Generated packet renderer**  
   Render patch packets as moving stage-native particles, not text rows.

8. **Collapse vector renderer**  
   Render context compression lines during digest and approval phases.

9. **Density veil renderer**  
   Make the workbench surface react to density without becoming dashboard-like.

10. **Phase progress attributes**  
    Expose phase progress, completion ratio, density, clutter risk, packet count,
    and vector count as DOM attributes for tests and research capture.

11. **Telemetry payload v2**  
    Persist transition, packet, vector, and density metrics in
    `morphology_frame_captured`.

12. **Desktop e2e proof update**  
    Assert the new morphology attributes and visual packet/vector counts.

13. **Phone e2e proof update**  
    Assert the same contract survives on phone without overflow.

14. **Startup URL proof hardening**  
    Keep the demo URL in the proof set so React dev mode cannot strand the
    stream at the first intent event.

15. **Research scenario proof**  
    Add at least one non-code scenario check so morphology is not tuned only for
    `Build BlackStage`.

16. **Planning scenario proof**  
    Add a planning mode check with calmer density and no fake artifact reveal.

17. **Reduced-motion proof**  
    Confirm reduced motion preserves shape and state even when animations are
    damped.

18. **Browser visual QA pass**  
    Capture desktop and phone screenshots through the in-app Browser once the
    code passes e2e.

19. **Research run log**  
    Record what improved, what remains weak, and what Cheick should review.

20. **Pushed PR narrative**  
    Commit and push the pass with a concise summary and validation evidence.

## Success Criteria

- The generated field has visible transition state before dense work appears.
- Patch growth is spatial and temporal, not a static patch list.
- Collapse/digest is visible as context moving toward the nucleus.
- Density is measured and governed.
- Tests prove laptop, phone, startup URL, and at least one alternate scenario.
- The branch remains pushed with Cheick's configured GitHub attribution.
