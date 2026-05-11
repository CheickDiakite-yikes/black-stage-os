import { expect, test, type Locator, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, "../../..");
const screenshotPath = path.join(repoRoot, "artifacts/screenshots/stage-shell-v0.png");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    (
      window as Window & { __blackstageTestDelayMultiplier?: number }
    ).__blackstageTestDelayMultiplier = 0.25;
  });
});

async function installFakeSpeechRecognition(page: Page) {
  await page.addInitScript(() => {
    type SpeechResultEvent = {
      resultIndex: number;
      results: Array<{
        0: {
          transcript: string;
        };
        isFinal: boolean;
      }>;
    };

    class FakeSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = "en-US";
      onstart: (() => void) | null = null;
      onresult: ((event: SpeechResultEvent) => void) | null = null;
      onerror: ((event: { error?: string }) => void) | null = null;
      onend: (() => void) | null = null;

      start() {
        browserWindow.__blackstageSpeechRecognition = this;
        this.onstart?.();
      }

      stop() {
        this.onend?.();
      }

      abort() {
        this.onend?.();
      }

      emitFinal(text: string) {
        this.onresult?.({
          resultIndex: 0,
          results: [
            {
              0: {
                transcript: text
              },
              isFinal: true
            }
          ]
        });
        this.onend?.();
      }
    }

    const browserWindow = window as Window & {
      SpeechRecognition?: typeof FakeSpeechRecognition;
      webkitSpeechRecognition?: typeof FakeSpeechRecognition;
      __blackstageSpeechRecognition?: FakeSpeechRecognition;
    };

    browserWindow.SpeechRecognition = FakeSpeechRecognition;
    browserWindow.webkitSpeechRecognition = FakeSpeechRecognition;
  });
}

async function emitFakeSpeechFinal(page: Page, text: string) {
  await page.evaluate((spokenText) => {
    const browserWindow = window as Window & {
      __blackstageSpeechRecognition?: {
        emitFinal: (text: string) => void;
      };
    };

    browserWindow.__blackstageSpeechRecognition?.emitFinal(spokenText);
  }, text);
}

async function readObjectShift(locator: Locator): Promise<{ x: number; y: number }> {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);

    return {
      x: Number.parseInt(style.getPropertyValue("--object-shift-x"), 10) || 0,
      y: Number.parseInt(style.getPropertyValue("--object-shift-y"), 10) || 0
    };
  });
}

test("Stage Shell v0 streams intent into approval-gated artifacts", async ({
  page
}) => {
  test.setTimeout(480_000);
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto("/");

  await expect(page.getByTestId("stage-presence")).toContainText("Speak when ready");

  await page.getByRole("button", { name: "Build BlackStage" }).click();

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Stage Shell v0 plan"
  );
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Simulated runtime only"
  );
  const planObject = page.getByTestId("stage-object-plan_card");

  await planObject.getByRole("button", { name: "Focus Stage Shell v0 plan" }).click({
    force: true
  });
  await expect(planObject).toHaveClass(/stage-object-focused/);
  await planObject.getByRole("button", { name: "Pin Stage Shell v0 plan" }).click({
    force: true
  });
  await expect(planObject).toHaveClass(/stage-object-pinned/);
  await planObject.getByRole("button", { name: "Collapse Stage Shell v0 plan" }).click({
    force: true
  });
  await expect(planObject).toHaveClass(/stage-object-collapsed/);
  await expect(planObject.getByText("Event model")).toHaveCount(0);
  await planObject.getByRole("button", { name: "Expand Stage Shell v0 plan" }).click({
    force: true
  });
  await expect(planObject).toHaveClass(/stage-object-expanded/);
  await expect(planObject).toContainText("Event model");

  const dragHandle = planObject.getByRole("button", {
    name: "Move Stage Shell v0 plan"
  });

  await dragHandle.click({
    force: true
  });

  const shiftAfterMove = await planObject.evaluate((element) =>
    getComputedStyle(element).getPropertyValue("--object-shift-x").trim()
  );

  expect(shiftAfterMove).not.toBe("0px");
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Approval needed to create task prompt cards."
  );
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await expect(page.getByTestId("artifact-stack")).toContainText(
    "Codex Task Brief: Build Stage Shell v0"
  );

  await page.getByRole("button", { name: "Approve", exact: true }).click();

  await expect(page.getByTestId("approval-card")).toContainText("Approval resolved");
  await expect(page.getByTestId("approval-card")).toContainText("Status: approved");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Task 3: Research instrumentation"
  );
  await expect(page.getByTestId("browser-portal-surface")).toContainText(
    "blackstage://validation/stage-shell-v0"
  );
  await expect(page.getByTestId("browser-portal-surface")).toContainText(
    "No external browsing happens in this v0 scenario."
  );
  await expect(page.getByTestId("artifact-stack")).toContainText("approved output");
  await page
    .getByTestId("artifact-editor")
    .fill("Revised artifact body for a board-ready handoff.");
  await page.getByRole("button", { name: "Save revision" }).click();
  await expect(page.getByTestId("artifact-workbench")).toContainText("review");
  await expect(page.getByTestId("artifact-editor")).toHaveValue(
    "Revised artifact body for a board-ready handoff."
  );
  await page.getByRole("button", { name: "Approve artifact" }).click();
  await expect(page.getByTestId("artifact-workbench")).toContainText("approved");

  const artifactDownloadPromise = page.waitForEvent("download");
  await page
    .getByTestId("artifact-workbench")
    .getByRole("button", { name: "Export markdown" })
    .click({ force: true });
  const artifactDownload = await artifactDownloadPromise;

  expect(artifactDownload.suggestedFilename()).toContain("codex-task-brief");
  await expect(page.getByTestId("artifact-workbench")).toContainText("exported");
  await expect(page.getByTestId("research-capture")).toContainText("Research trace");

  const downloadPromise = page.waitForEvent("download");
  await page
    .getByTestId("research-capture")
    .getByRole("button", { name: "Export JSON" })
    .click({ force: true });
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toContain("blackstage-stage-shell");

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".stage-object-constellation")?.scrollTo(0, 0);
    document.querySelector(".artifact-stack")?.scrollTo(0, 0);
  });
  await page.screenshot({
    path: screenshotPath
  });

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("Stage Shell v0 treats text commands as stage-object manipulation", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );

  const specObject = page.getByTestId("stage-object-document_portal");

  await page.getByTestId("intent-input").fill("collapse the spec portal");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });
  await expect(specObject).toHaveClass(/stage-object-collapsed/);
  await expect(page.getByTestId("document-portal-surface")).toHaveCount(0);

  await page.getByTestId("intent-input").fill("show the spec portal");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });
  await expect(specObject).toHaveClass(/stage-object-expanded/);
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );

  await page
    .getByTestId("intent-input")
    .fill("rename the spec portal to Diligence room");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });
  await expect(specObject).toContainText("Diligence room");

  const objectUpdatesWereLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          command_action?: string;
          object_type?: string;
          title?: string;
        };
      }>;
    };

    const objectUpdates =
      snapshot.researchEvents?.filter(
        (event) =>
          event.eventType === "render_object_updated" &&
          event.payload?.object_type === "document_portal"
      ) ?? [];
    const renameWasLogged = snapshot.researchEvents?.some(
      (event) =>
        event.eventType === "user_intervention" &&
        event.payload?.command_action === "rename"
    );
    const renamedObjectWasLogged = objectUpdates.some(
      (event) => event.payload?.title === "Diligence room"
    );

    return objectUpdates.length >= 3 && renameWasLogged && renamedObjectWasLogged;
  });

  expect(objectUpdatesWereLogged).toBe(true);
});

test("Stage Shell v0 records direct object dragging as replayable manipulation", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Stage Shell v0 plan"
  );

  const planObject = page.getByTestId("stage-object-plan_card");
  const dragHandle = planObject.getByRole("button", {
    name: "Drag Stage Shell v0 plan"
  });
  const initialPosition = await readObjectShift(planObject);
  const dragBox = await dragHandle.boundingBox();

  expect(dragBox).not.toBeNull();

  if (!dragBox) {
    return;
  }

  await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    dragBox.x + dragBox.width / 2 + 42,
    dragBox.y + dragBox.height / 2 + 18
  );
  await page.mouse.up();

  const expectedPosition = {
    x: initialPosition.x + 42,
    y: initialPosition.y + 18
  };

  await expect.poll(async () => readObjectShift(planObject)).toEqual(expectedPosition);

  const dragWasLogged = await page.evaluate((expected) => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          object_type?: string;
          position?: {
            x?: number;
            y?: number;
          };
        };
      }>;
    };

    return Boolean(
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "render_object_updated" &&
          event.payload?.object_type === "plan_card" &&
          event.payload.position?.x === expected.x &&
          event.payload.position?.y === expected.y
      )
    );
  }, expectedPosition);

  expect(dragWasLogged).toBe(true);
});

test("Stage Shell v0 can undo the last object change from event history", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );

  const specObject = page.getByTestId("stage-object-document_portal");

  await page
    .getByTestId("intent-input")
    .fill("rename the spec portal to Diligence room");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });
  await expect(specObject).toContainText("Diligence room");

  await page.getByTestId("intent-input").fill("undo last object change");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(specObject).toContainText("Spec portal");
  await expect(specObject).not.toContainText("Diligence room");
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "Reverted Spec portal."
  );

  const undoWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: Array<{
        type?: string;
        payload?: {
          type?: string;
          title?: string;
        };
      }>;
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          intervention_type?: string;
          command_action?: string;
          command_text_redacted?: string;
        };
      }>;
    };

    const undoInterventionWasLogged =
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.intervention_type === "undo" &&
          event.payload.command_action === "undo_object" &&
          event.payload.command_text_redacted === "undo last object change"
      ) ?? false;
    const revertedObjectWasLogged =
      snapshot.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "document_portal" &&
          event.payload.title === "Spec portal"
      ) ?? false;

    return undoInterventionWasLogged && revertedObjectWasLogged;
  });

  expect(undoWasLogged).toBe(true);
});

test("Stage Shell v0 adds local document notes without file writes", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );

  await page
    .getByTestId("intent-input")
    .fill("add note to document keep approval language warm and explicit");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(page.getByTestId("document-portal-surface")).toContainText("local edit");
  await expect(page.getByTestId("document-portal-surface")).toContainText("User note");
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "keep approval language warm and explicit"
  );

  const documentNoteWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: Array<{
        type?: string;
        payload?: {
          type?: string;
          payload?: {
            sections?: Array<{
              label?: string;
              value?: string;
            }>;
          };
        };
      }>;
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          command_action?: string;
          command_value_redacted?: string;
        };
      }>;
    };

    const commandWasLogged =
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "add_document_note" &&
          event.payload.command_value_redacted ===
            "keep approval language warm and explicit"
      ) ?? false;
    const objectWasUpdated =
      snapshot.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "document_portal" &&
          event.payload.payload?.sections?.some(
            (section) =>
              section.label === "User note" &&
              section.value === "keep approval language warm and explicit"
          )
      ) ?? false;

    return commandWasLogged && objectWasUpdated;
  });

  expect(documentNoteWasLogged).toBe(true);
});

test("Stage Shell v0 adds local timeline milestones without calendar writes", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Seed round plan" }).click();
  const timelineObject = page.getByTestId("stage-object-timeline");

  await expect(timelineObject).toContainText("Four-week cadence");
  await expect(timelineObject).toContainText("Warm intros");

  await page
    .getByTestId("intent-input")
    .fill("add milestone to timeline partner memo dry run");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(timelineObject).toContainText("partner memo dry run");
  await expect(timelineObject).toContainText("no calendar event was created");

  const timelineMilestoneWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: Array<{
        type?: string;
        payload?: {
          type?: string;
          payload?: {
            weeks?: string[];
          };
        };
      }>;
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          command_action?: string;
          command_value_redacted?: string;
        };
      }>;
    };

    const commandWasLogged =
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "add_timeline_milestone" &&
          event.payload.command_value_redacted === "partner memo dry run"
      ) ?? false;
    const objectWasUpdated =
      snapshot.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "timeline" &&
          event.payload.payload?.weeks?.includes("partner memo dry run")
      ) ?? false;

    return commandWasLogged && objectWasUpdated;
  });

  expect(timelineMilestoneWasLogged).toBe(true);
});

test("Stage Shell v0 prepares approved artifacts as harness action packets", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByTestId("artifact-workbench")).toContainText("approved");

  await page
    .getByTestId("artifact-workbench")
    .getByRole("button", { name: "Prepare action" })
    .click({ force: true });

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Harness action packet"
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Harness action packet prepared."
  );
  await expect(page.getByTestId("approval-card")).toContainText(
    "Approve harness action"
  );
  await expect(page.getByTestId("approval-card")).toContainText(
    "does not contact external systems"
  );
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "Prepared a harness action packet"
  );
  await expect(page.getByTestId("artifact-stack")).toContainText(
    "Harness Action Packet"
  );
  await expect(page.getByTestId("artifact-workbench")).toContainText("review");

  const packetDownloadPromise = page.waitForEvent("download");
  await page
    .getByTestId("artifact-workbench")
    .getByRole("button", { name: "Export markdown" })
    .click({ force: true });
  const packetDownload = await packetDownloadPromise;

  expect(packetDownload.suggestedFilename()).toContain("harness-action-packet");
  await expect(page.getByTestId("artifact-workbench")).toContainText("exported");

  const actionWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents: Array<{
        type: string;
        payload?: {
          actionType?: string;
          payload?: {
            worker?: string;
            policy?: string;
          };
          title?: string;
        };
      }>;
    };

    const approvalWasLogged = snapshot.stageEvents.some(
      (event) =>
        event.type === "approval.requested" &&
        event.payload?.actionType === "tool_call" &&
        event.payload?.title?.includes("Approve harness action")
    );
    const packetArtifactWasLogged = snapshot.stageEvents.some(
      (event) =>
        event.type === "artifact.created" &&
        event.payload?.title?.includes("Harness Action Packet")
    );

    return approvalWasLogged && packetArtifactWasLogged;
  });

  expect(actionWasLogged).toBe(true);
});

test("Stage Shell v0 replays the local event log without mutating it", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await expect(page.getByTestId("research-capture")).toContainText("stage events");
  await expect(page.getByLabel("Intent thread")).not.toContainText("working");

  const stageEventCount = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return 0;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: unknown[];
    };

    return snapshot.stageEvents?.length ?? 0;
  });

  expect(stageEventCount).toBeGreaterThan(6);

  await page
    .getByTestId("research-capture")
    .getByRole("button", { name: "Replay trace" })
    .click();

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Stage Shell v0 plan"
  );
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );

  const postReplayStageEventCount = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return 0;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: unknown[];
    };

    return snapshot.stageEvents?.length ?? 0;
  });

  expect(postReplayStageEventCount).toBe(stageEventCount);
});

test("Stage Shell v0 can stop visible agent labor", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.evaluate(() => {
    (
      window as Window & { __blackstageTestDelayMultiplier?: number }
    ).__blackstageTestDelayMultiplier = 4;
  });
  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).dispatchEvent("click");

  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Stopped by user."
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText("cancelled");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await expect(page.getByLabel("Intent thread")).toContainText("paused");
  const stopWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          intervention_type?: string;
        };
      }>;
    };

    return (
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.intervention_type === "stop"
      ) ?? false
    );
  });

  expect(stopWasLogged).toBe(true);
  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Resumed by user."
  );
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts",
    {
      timeout: 35_000
    }
  );

  const resumeWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          intervention_type?: string;
        };
      }>;
    };

    return (
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.intervention_type === "resume"
      ) ?? false
    );
  });

  expect(resumeWasLogged).toBe(true);
});

test("Stage Shell v0 renders models maps simulations and memory objects", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );

  await page.getByRole("button", { name: "Approve", exact: true }).click();

  await expect(page.getByTestId("model-surface")).toContainText(
    "Reality interface model"
  );
  await expect(page.getByTestId("map-surface")).toContainText("Build Stage Shell v0");
  await expect(page.getByTestId("simulation-surface")).toContainText(
    "First five seconds"
  );
  await expect(page.getByTestId("memory-surface")).toContainText("local-first");
  await expect(page.getByTestId("memory-surface")).toContainText(
    "Memory writes require approval"
  );
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Background harness recorder"
  );
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Approval gate blocked workspace write"
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Replayable failure captured"
  );

  await page.getByRole("button", { name: "Run harness" }).click();
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Live harness recorder"
  );
});

test("Stage Shell v0 retargets the browser portal locally without browsing", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await page.getByRole("button", { name: "Approve", exact: true }).click();

  const browserPortal = page.getByTestId("browser-portal-surface");

  await expect(browserPortal).toContainText("blackstage://validation/stage-shell-v0");

  await page
    .getByTestId("intent-input")
    .fill("set browser portal to https://platform.openai.com/docs");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(browserPortal).toContainText("https://platform.openai.com/docs");
  await expect(browserPortal).toContainText("local target");
  await expect(browserPortal).toContainText("no external browsing happened");

  const browserRetargetWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: Array<{
        type?: string;
        payload?: {
          type?: string;
          payload?: {
            url?: string;
          };
        };
      }>;
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          command_action?: string;
          command_value_redacted?: string;
        };
      }>;
    };

    const commandWasLogged =
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "set_url" &&
          event.payload.command_value_redacted === "https://platform.openai.com/docs"
      ) ?? false;
    const objectWasUpdated =
      snapshot.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "browser_portal" &&
          event.payload.payload?.url === "https://platform.openai.com/docs"
      ) ?? false;

    return commandWasLogged && objectWasUpdated;
  });

  expect(browserRetargetWasLogged).toBe(true);
});

test("Stage Shell v0 recenters the map portal locally without map services", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await page.getByRole("button", { name: "Approve", exact: true }).click();

  const mapPortal = page.getByTestId("map-surface");

  await expect(mapPortal).toContainText("Build Stage Shell v0");

  await page.getByTestId("intent-input").fill("set map to Boston healthtech buyers");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(mapPortal).toContainText("Boston healthtech buyers");
  await expect(mapPortal).toContainText("local target");
  await expect(mapPortal).toContainText("Requested focus");

  const mapRetargetWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: Array<{
        type?: string;
        payload?: {
          type?: string;
          payload?: {
            center?: string;
          };
        };
      }>;
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          command_action?: string;
          command_value_redacted?: string;
        };
      }>;
    };

    const commandWasLogged =
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "set_map" &&
          event.payload.command_value_redacted === "Boston healthtech buyers"
      ) ?? false;
    const objectWasUpdated =
      snapshot.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "map_portal" &&
          event.payload.payload?.center === "Boston healthtech buyers"
      ) ?? false;

    return commandWasLogged && objectWasUpdated;
  });

  expect(mapRetargetWasLogged).toBe(true);
});

test("Stage Shell v0 updates model scenarios locally without provider calls", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await page.getByRole("button", { name: "Approve", exact: true }).click();

  const modelSurface = page.getByTestId("model-surface");

  await expect(modelSurface).toContainText("Reality interface model");
  await expect(modelSurface).toContainText("approved/exportable");

  await page
    .getByTestId("intent-input")
    .fill("set model Artifact to shipped review packet");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(modelSurface).toContainText("Artifact");
  await expect(modelSurface).toContainText("shipped review packet");
  await expect(modelSurface).toContainText("local target");
  await expect(modelSurface).toContainText("user confidence");

  const modelUpdateWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: Array<{
        type?: string;
        payload?: {
          type?: string;
          payload?: {
            scenarios?: Array<{
              label?: string;
              value?: string;
            }>;
          };
        };
      }>;
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          command_action?: string;
          command_value_redacted?: string;
        };
      }>;
    };

    const commandWasLogged =
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "set_model" &&
          event.payload.command_value_redacted === "Artifact: shipped review packet"
      ) ?? false;
    const objectWasUpdated =
      snapshot.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "model_card" &&
          event.payload.payload?.scenarios?.some(
            (scenario) =>
              scenario.label === "Artifact" &&
              scenario.value === "shipped review packet"
          )
      ) ?? false;

    return commandWasLogged && objectWasUpdated;
  });

  expect(modelUpdateWasLogged).toBe(true);
});

test("Stage Shell v0 runs local simulation scenarios without external engines", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await page.getByRole("button", { name: "Approve", exact: true }).click();

  const simulationSurface = page.getByTestId("simulation-surface");

  await expect(simulationSurface).toContainText("First five seconds");

  await page
    .getByTestId("intent-input")
    .fill("simulate voice wake with artifact approval");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(simulationSurface).toContainText("voice wake with artifact approval");
  await expect(simulationSurface).toContainText("local run");
  await expect(simulationSurface).toContainText("Local stage simulation only");

  const simulationRunWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: Array<{
        type?: string;
        payload?: {
          type?: string;
          payload?: {
            simulationTitle?: string;
          };
        };
      }>;
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          command_action?: string;
          command_value_redacted?: string;
        };
      }>;
    };

    const commandWasLogged =
      snapshot.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "run_simulation" &&
          event.payload.command_value_redacted === "voice wake with artifact approval"
      ) ?? false;
    const objectWasUpdated =
      snapshot.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "simulation_card" &&
          event.payload.payload?.simulationTitle === "voice wake with artifact approval"
      ) ?? false;

    return commandWasLogged && objectWasUpdated;
  });

  expect(simulationRunWasLogged).toBe(true);
});

test("Stage Shell v0 attaches local context as a private document object", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.goto("/");
  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );
  await expect(page.getByTestId("artifact-stack")).toContainText(
    "Codex Task Brief: Build Stage Shell v0"
  );

  await page.getByTestId("context-file-input").setInputFiles({
    name: "stage-note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "Attach this local note as context. Keep it private and make it inspectable on the stage."
    )
  });

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Context: stage-note.txt"
  );
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Attach this local note as context"
  );
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Local-only context object. No external upload."
  );
  await expect(page.getByTestId("research-capture")).toContainText("context attached");

  await page.getByTestId("context-file-input").setInputFiles({
    name: "investor-list.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "name,stage,check\nAster Capital,seed,250000\nNorthline Ventures,pre-seed,150000"
    )
  });

  const latestDocumentPortal = page.getByTestId("document-portal-surface").last();

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Context: investor-list.csv"
  );
  await expect(latestDocumentPortal).toContainText("CSV structure");
  await expect(latestDocumentPortal).toContainText("2 rows · 3 columns");
  await expect(latestDocumentPortal).toContainText("name, stage, check");

  const structuredContextWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      researchEvents: Array<{
        eventType: string;
        payload?: {
          structured_kind?: string;
          structured_item_count?: number;
          local_only?: boolean;
        };
      }>;
    };

    return snapshot.researchEvents.some(
      (event) =>
        event.eventType === "context_attached" &&
        event.payload?.structured_kind === "csv" &&
        event.payload.structured_item_count === 2 &&
        event.payload.local_only === true
    );
  });

  expect(structuredContextWasLogged).toBe(true);

  await page.getByTestId("context-file-input").setInputFiles({
    name: "market-scenarios.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify([
        {
          scenario: "base",
          arr: 100,
          burn: 45
        },
        {
          scenario: "stretch",
          arr: 160,
          burn: 62
        }
      ])
    )
  });

  const latestJsonDocumentPortal = page.getByTestId("document-portal-surface").last();

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Context: market-scenarios.json"
  );
  await expect(latestJsonDocumentPortal).toContainText("JSON structure");
  await expect(latestJsonDocumentPortal).toContainText(
    "2 array items · keys: scenario, arr, burn"
  );

  const jsonContextWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      researchEvents: Array<{
        eventType: string;
        payload?: {
          structured_kind?: string;
          structured_item_count?: number;
          local_only?: boolean;
        };
      }>;
    };

    return snapshot.researchEvents.some(
      (event) =>
        event.eventType === "context_attached" &&
        event.payload?.structured_kind === "json" &&
        event.payload.structured_item_count === 2 &&
        event.payload.local_only === true
    );
  });

  expect(jsonContextWasLogged).toBe(true);
});

test("Stage Shell v0 renders local image context without uploading it", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.goto("/");
  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );

  await page.getByTestId("context-file-input").setInputFiles({
    name: "stage-card.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYERJgwMAJ73A/0yDRC7AAAAAElFTkSuQmCC",
      "base64"
    )
  });

  const latestDocumentPortal = page.getByTestId("document-portal-surface").last();

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Context: stage-card.png"
  );
  await expect(latestDocumentPortal).toContainText("Session-only local image preview");
  await expect(latestDocumentPortal).toContainText(
    "Local-only context object. No external upload."
  );
  await expect(page.getByTestId("image-context-preview")).toBeVisible();

  const imageContextWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      researchEvents: Array<{
        eventType: string;
        payload?: {
          modality?: string;
          preview_available?: boolean;
          local_only?: boolean;
        };
      }>;
    };

    return snapshot.researchEvents.some(
      (event) =>
        event.eventType === "context_attached" &&
        event.payload?.modality === "image" &&
        event.payload.preview_available === true &&
        event.payload.local_only === true
    );
  });

  expect(imageContextWasLogged).toBe(true);
});

test("Stage Shell v0 gates local memory writes and deletes", async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto("/");

  await page
    .getByTestId("intent-input")
    .fill("remember Blackstage memory writes stay local and require explicit approval");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(page.getByTestId("approval-card")).toContainText("Save local memory");
  await expect(page.getByTestId("approval-card")).toContainText("memory write");
  await expect(page.getByTestId("memory-surface")).toContainText("proposed");
  await expect(page.getByTestId("memory-surface")).toContainText(
    "Blackstage memory writes stay local"
  );

  await page.getByRole("button", { name: "Approve", exact: true }).click({
    force: true
  });
  await expect(page.getByTestId("approval-card")).toContainText("Status: approved");
  await expect(page.getByTestId("memory-surface")).toContainText("approved");

  await page.getByTestId("intent-input").fill("recall explicit approval");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });
  await expect(page.getByTestId("memory-surface")).toContainText("Recall");
  await expect(page.getByTestId("memory-surface")).toContainText(
    "Blackstage memory writes stay local"
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Recalled 1 local memory match."
  );

  await page.getByRole("button", { name: "Seed round plan" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Approve simulated investor intro prompts",
    {
      timeout: 60_000
    }
  );
  await page
    .getByTestId("intent-input")
    .fill("remember Investor followups need weekly review");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });
  await expect(page.getByTestId("approval-card")).toContainText("Save local memory");
  await page.getByRole("button", { name: "Approve", exact: true }).click({
    force: true
  });
  await page.getByTestId("intent-input").fill("review memories");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });
  await expect(page.getByTestId("memory-surface")).toContainText("Cross-thread review");
  await expect(page.getByTestId("memory-surface")).toContainText(
    "Blackstage memory writes stay local"
  );
  await expect(page.getByTestId("memory-surface")).toContainText(
    "Investor followups need weekly review"
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Reviewed 2 approved local memories."
  );

  await page.getByTestId("intent-input").fill("forget explicit approval");
  await page.getByRole("button", { name: "Send" }).click({
    force: true
  });

  await expect(page.getByTestId("approval-card")).toContainText("Delete local memory");
  await expect(page.getByTestId("approval-card")).toContainText("memory delete");

  await page.getByRole("button", { name: "Approve", exact: true }).click({
    force: true
  });
  await expect(page.getByTestId("memory-surface")).toContainText("deleted");

  const memoryState = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return [];
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      memoryRecords?: Array<{
        status?: string;
        redactedSummary?: string;
      }>;
    };

    return snapshot.memoryRecords ?? [];
  });

  expect(memoryState).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        status: "deleted",
        redactedSummary: expect.stringContaining("Blackstage memory writes stay local")
      })
    ])
  );
});

test("Stage Shell v0 speaks sparse assistant status when Stage voice is enabled", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.addInitScript(() => {
    class FakeSpeechSynthesisUtterance {
      pitch = 1;
      rate = 1;
      volume = 1;

      constructor(public text: string) {}
    }

    const spoken: string[] = [];
    const browserWindow = window as Window & {
      __blackstageSpoken?: string[];
    };

    browserWindow.__blackstageSpoken = spoken;
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: FakeSpeechSynthesisUtterance
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel() {},
        speak(utterance: { text: string }) {
          spoken.push(utterance.text);
        }
      }
    });
  });

  await page.goto("/");

  await expect(page.getByTestId("realtime-broker-status")).toContainText("simulation");
  await expect(page.getByTestId("harness-runner-status")).toContainText("simulation");
  await page.getByRole("button", { name: "Stage voice" }).click();
  await expect(page.getByTestId("assistant-speech")).toContainText("Stage voice ready");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("assistant-speech")).toContainText("Intent received");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Stage Shell v0 plan"
  );

  const voiceEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              source?: string;
            };
          }>;
        })
      : undefined;
    const browserWindow = window as Window & {
      __blackstageSpoken?: string[];
    };

    return {
      assistantSpeechLogged:
        snapshot?.researchEvents?.some(
          (event) =>
            event.eventType === "assistant_speech" &&
            event.payload?.source === "stage_status"
        ) ?? false,
      spoken: browserWindow.__blackstageSpoken ?? []
    };
  });

  expect(voiceEvidence.assistantSpeechLogged).toBe(true);
  expect(voiceEvidence.spoken).toEqual(
    expect.arrayContaining([
      "Stage voice ready. I will speak only the key turns.",
      "Intent received. I am shaping the stage."
    ])
  );
});

test("Stage Shell v0 accepts a spoken final intent when browser speech is available", async ({
  page
}) => {
  test.setTimeout(90_000);

  await installFakeSpeechRecognition(page);

  await page.goto("/");

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "listening for intent"
  );

  await emitFakeSpeechFinal(
    page,
    "Help me plan a seed round and produce the next five investor actions."
  );

  await expect(page.getByTestId("intent-input")).toHaveValue(
    "Help me plan a seed round and produce the next five investor actions."
  );
  await expect(page.getByTestId("stage-workspace")).toContainText("Raise plan");
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "Help me plan a seed round"
  );

  const inputModeWasVoice = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              input_mode?: string;
            };
          }>;
        })
      : undefined;

    return (
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "intent_submitted" &&
          event.payload?.input_mode === "voice"
      ) ?? false
    );
  });

  expect(inputModeWasVoice).toBe(true);
});

test("Stage Shell v0 applies spoken correction commands to stage objects", async ({
  page
}) => {
  test.setTimeout(120_000);

  await installFakeSpeechRecognition(page);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );

  const specObject = page.getByTestId("stage-object-document_portal");

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "listening for intent"
  );

  await emitFakeSpeechFinal(page, "collapse the spec portal");

  await expect(page.getByTestId("voice-transcript")).toContainText(
    "collapse the spec portal"
  );
  await expect(specObject).toHaveClass(/stage-object-collapsed/);
  await expect(page.getByTestId("document-portal-surface")).toHaveCount(0);
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "Collapsed Spec portal."
  );

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "listening for intent"
  );

  await emitFakeSpeechFinal(page, "rename the spec portal to Signal room");

  await expect(specObject).toContainText("Signal room");
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "Renamed Spec portal to Signal room."
  );

  const commandEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              command_action?: string;
              command_input_mode?: string;
              command_text_redacted?: string;
            };
          }>;
        })
      : undefined;

    const collapseWasLogged =
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "collapse" &&
          event.payload?.command_input_mode === "voice" &&
          event.payload?.command_text_redacted === "collapse the spec portal"
      ) ?? false;
    const renameWasLogged =
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "rename" &&
          event.payload?.command_input_mode === "voice" &&
          event.payload?.command_text_redacted ===
            "rename the spec portal to Signal room"
      ) ?? false;

    return collapseWasLogged && renameWasLogged;
  });

  expect(commandEvidence).toBe(true);
});

test("Stage Shell v0 applies spoken artifact revision commands", async ({ page }) => {
  test.setTimeout(120_000);

  await installFakeSpeechRecognition(page);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("artifact-stack")).toContainText(
    "Codex Task Brief: Build Stage Shell v0"
  );

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await emitFakeSpeechFinal(
    page,
    "revise artifact to Ship the black stage as a quiet command center"
  );

  await expect(page.getByTestId("artifact-workbench")).toContainText("review");
  await expect(page.getByTestId("artifact-editor")).toHaveValue(
    "Ship the black stage as a quiet command center"
  );
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "Updated Codex Task Brief: Build Stage Shell v0."
  );

  const revisionEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              intervention_type?: string;
              command_input_mode?: string;
              command_text_redacted?: string;
            };
          }>;
        })
      : undefined;

    return (
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.intervention_type === "edit" &&
          event.payload?.command_input_mode === "voice" &&
          event.payload?.command_text_redacted ===
            "revise artifact to Ship the black stage as a quiet command center"
      ) ?? false
    );
  });

  expect(revisionEvidence).toBe(true);
});
