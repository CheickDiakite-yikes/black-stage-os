import assert from "node:assert/strict";
import test from "node:test";
import {
  createIdleIntentThread,
  createScenarioStageEvents,
  createScenarioThread,
  createStageMorphFixtureTimeline,
  createStageMorphFrame,
  eventToStageMorphPhaseId,
  getStageShellScenario,
  stageMorphPhaseOrder
} from "../dist/index.js";

test("creates an idle nucleus frame without dashboard sockets", () => {
  const thread = createIdleIntentThread("2026-06-01T18:00:00.000Z");
  const frame = createStageMorphFrame([], thread);

  assert.equal(frame.activePhaseId, "nucleus_awake");
  assert.equal(frame.mode, "idle");
  assert.equal(frame.nucleus.status, "idle");
  assert.deepEqual(
    frame.sockets.map((socket) => socket.role),
    ["nucleus"]
  );
  assert.equal(frame.workbench.state, "hidden");
});

test("maps stage events into the morphology phase taxonomy", () => {
  const scenario = getStageShellScenario("build_blackstage");
  const thread = createScenarioThread(
    scenario,
    scenario.intent,
    "2026-06-01T18:00:00.000Z"
  );
  const events = createScenarioStageEvents(scenario, thread).map(
    (timedEvent) => timedEvent.event
  );

  assert.equal(eventToStageMorphPhaseId(events[0]), "nucleus_awake");
  assert.equal(
    eventToStageMorphPhaseId(
      events.find((event) => event.type === "object.created")
    ),
    "context_orbit_started"
  );
  assert.equal(
    eventToStageMorphPhaseId(
      events.find((event) => event.type === "agent.progress")
    ),
    "context_collapsed"
  );
  assert.equal(
    eventToStageMorphPhaseId(
      events.find((event) => event.type === "approval.requested")
    ),
    "approval_ritual"
  );
  assert.equal(
    eventToStageMorphPhaseId(
      events.find((event) => event.type === "artifact.created")
    ),
    "workbench_revealed"
  );
});

test("builds deterministic fixture timelines with earned workbench reveal", () => {
  const timeline = createStageMorphFixtureTimeline("code_task");

  assert.ok(timeline.length > 6);
  assert.equal(timeline[0].frame.activePhaseId, "nucleus_awake");
  assert.ok(
    timeline.some((entry) => entry.frame.activePhaseId === "approval_ritual")
  );

  const finalFrame = timeline.at(-1).frame;

  assert.equal(finalFrame.activePhaseId, "workbench_revealed");
  assert.equal(finalFrame.workbench.state, "revealed");
  assert.ok(finalFrame.patches.length >= 6);
  assert.deepEqual(
    finalFrame.phases.map((phase) => phase.id),
    stageMorphPhaseOrder
  );
  assert.ok(
    finalFrame.sockets.some((socket) => socket.role === "workspace"),
    "fixture should allocate a workspace socket"
  );
});
