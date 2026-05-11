import { expect, test } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, "../../..");
const screenshotPath = path.join(repoRoot, "artifacts/screenshots/stage-shell-v0.png");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    (window as Window & { __blackstageTestDelayMultiplier?: number }).__blackstageTestDelayMultiplier =
      0.25;
  });
});

test("Stage Shell v0 streams intent into approval-gated artifacts", async ({ page }) => {
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

  await expect(page.getByTestId("stage-workspace")).toContainText("Stage Shell v0 plan");
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

  const dragHandle = planObject.getByRole("button", { name: "Move Stage Shell v0 plan" });

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

test("Stage Shell v0 treats text commands as stage-object manipulation", async ({ page }) => {
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
  const objectUpdatesWereLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0");

    if (!rawSnapshot) {
      return false;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      researchEvents?: Array<{
        eventType?: string;
        payload?: {
          object_type?: string;
        };
      }>;
    };

    return (
      snapshot.researchEvents?.filter(
        (event) =>
          event.eventType === "render_object_updated" &&
          event.payload?.object_type === "document_portal"
      ).length >= 2
    );
  });

  expect(objectUpdatesWereLogged).toBe(true);
});

test("Stage Shell v0 replays the local event log without mutating it", async ({ page }) => {
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

  await expect(page.getByTestId("stage-workspace")).toContainText("Stage Shell v0 plan");
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
    (window as Window & { __blackstageTestDelayMultiplier?: number }).__blackstageTestDelayMultiplier =
      4;
  });
  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).dispatchEvent("click");

  await expect(page.getByTestId("agent-activity-feed")).toContainText("Stopped by user.");
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
  await expect(page.getByTestId("agent-activity-feed")).toContainText("Resumed by user.");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Approval needed to create task prompt cards.",
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

test("Stage Shell v0 renders models maps simulations and memory objects", async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );

  await page.getByRole("button", { name: "Approve", exact: true }).click();

  await expect(page.getByTestId("model-surface")).toContainText("Reality interface model");
  await expect(page.getByTestId("map-surface")).toContainText("Build Stage Shell v0");
  await expect(page.getByTestId("simulation-surface")).toContainText("First five seconds");
  await expect(page.getByTestId("memory-surface")).toContainText("local-first");
  await expect(page.getByTestId("memory-surface")).toContainText("Memory writes require approval");
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
  await expect(page.getByTestId("stage-workspace")).toContainText("Live harness recorder");
});

test("Stage Shell v0 attaches local context as a private document object", async ({ page }) => {
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

  await expect(page.getByTestId("stage-workspace")).toContainText("Context: stage-note.txt");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Attach this local note as context"
  );
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Local-only context object. No external upload."
  );
  await expect(page.getByTestId("research-capture")).toContainText("context attached");
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
  await page.getByRole("button", { name: "Stage voice" }).click();
  await expect(page.getByTestId("assistant-speech")).toContainText("Stage voice ready");

  await page.getByRole("button", { name: "Build BlackStage" }).click();
  await expect(page.getByTestId("assistant-speech")).toContainText("Intent received");
  await expect(page.getByTestId("stage-workspace")).toContainText("Stage Shell v0 plan");

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
            event.eventType === "assistant_speech" && event.payload?.source === "stage_status"
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

  await page.goto("/");

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText("listening for intent");

  await page.evaluate(() => {
    const browserWindow = window as Window & {
      __blackstageSpeechRecognition?: {
        emitFinal: (text: string) => void;
      };
    };

    browserWindow.__blackstageSpeechRecognition?.emitFinal(
      "Help me plan a seed round and produce the next five investor actions."
    );
  });

  await expect(page.getByTestId("intent-input")).toHaveValue(
    "Help me plan a seed round and produce the next five investor actions."
  );
  await expect(page.getByTestId("stage-workspace")).toContainText("Raise plan");
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "Help me plan a seed round"
  );
});
