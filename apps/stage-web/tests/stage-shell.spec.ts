import { expect, test, type Locator, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, "../../..");
const screenshotPath = path.join(repoRoot, "artifacts/screenshots/stage-shell-v0.png");
const startupScenarioLabels = [
  "Acquisition analysis",
  "Seed round plan",
  "Build BlackStage",
  "Research synthesis"
];

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

      emitInterim(text: string) {
        this.onresult?.({
          resultIndex: 0,
          results: [
            {
              0: {
                transcript: text
              },
              isFinal: false
            }
          ]
        });
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

async function emitFakeSpeechInterim(page: Page, text: string) {
  await page.evaluate((spokenText) => {
    const browserWindow = window as Window & {
      __blackstageSpeechRecognition?: {
        emitInterim: (text: string) => void;
      };
    };

    browserWindow.__blackstageSpeechRecognition?.emitInterim(spokenText);
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

async function submitIntent(page: Page, intentText: string) {
  await page.getByTestId("intent-input").fill(intentText, {
    force: true
  });
  await page.getByTestId("submit-intent").click({
    force: true
  });
}

test("Stage Shell v0 opens to the idle orb instead of saved fixture work", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.addInitScript(() => {
    const savedAt = new Date().toISOString();
    const fixtureThread = {
      id: "legacy_thread",
      title: "Acquisition analysis",
      originalIntent: "Acquire a company?",
      currentObjective: "Legacy fixture should not hydrate.",
      status: "active",
      inputMode: "text",
      renderObjects: [],
      agentEvents: [],
      approvals: [],
      artifacts: [],
      memoryNotes: [],
      decisions: [],
      createdAt: savedAt,
      updatedAt: savedAt
    };

    localStorage.setItem(
      "blackstage.stageShell.v0",
      JSON.stringify({
        sessionId: "legacy_demo_session",
        activeScenarioId: "analyze_acquisition_target",
        currentThread: fixtureThread,
        stageEvents: [],
        researchEvents: [],
        memoryRecords: [],
        savedAt
      })
    );
    localStorage.setItem(
      "blackstage.stageShell.v0.1",
      JSON.stringify({
        sessionId: "current_demo_session",
        activeScenarioId: "analyze_acquisition_target",
        currentThread: fixtureThread,
        stageEvents: [],
        researchEvents: [],
        memoryRecords: [],
        savedAt
      })
    );
  });

  await page.goto("/");

  await expect(page.getByTestId("stage-shell")).toHaveClass(/stage-idle/);
  await expect(page.getByText("Speak when ready")).toBeVisible();
  await expect(page.getByTestId("presence-orb")).toHaveAccessibleName(
    "Start voice input"
  );
  await expect(page.getByTestId("presence-orb")).toBeEnabled();
  await expect(page.getByTestId("intent-capture")).toHaveCSS("opacity", "0");
  await expect(page.getByTestId("intent-capture")).toHaveCSS("pointer-events", "none");
  for (const label of startupScenarioLabels) {
    await expect(page.getByText(label)).toHaveCount(0);
  }

  const storageState = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          activeScenarioId?: string;
          currentThread?: {
            originalIntent?: string;
            status?: string;
          };
        })
      : undefined;

    return {
      activeScenarioId: snapshot?.activeScenarioId,
      currentSnapshotExists: Boolean(rawSnapshot),
      currentThreadOriginalIntent: snapshot?.currentThread?.originalIntent,
      currentThreadStatus: snapshot?.currentThread?.status,
      legacySnapshotExists: Boolean(localStorage.getItem("blackstage.stageShell.v0"))
    };
  });

  expect(storageState).toEqual({
    activeScenarioId: undefined,
    currentSnapshotExists: true,
    currentThreadOriginalIntent: "",
    currentThreadStatus: "paused",
    legacySnapshotExists: false
  });
});

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

  await submitIntent(page, "Build BlackStage");

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Stage Shell v0 plan"
  );
  await expect(page.getByTestId("stage-field-orientation")).toContainText("Thread map");
  await expect(page.getByTestId("stage-field-orientation")).toContainText("Evidence");
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Stage Shell v0 spec"
  );
  await expect(page.getByTestId("document-portal-surface")).toContainText(
    "Local runtime only"
  );
  const planObject = page.getByTestId("stage-object-plan_card");
  const renderFieldEvidence = await page.evaluate(() => {
    const constellation = document.querySelector<HTMLElement>(
      ".stage-object-constellation"
    );
    const intentObject = document.querySelector<HTMLElement>(
      '[data-testid="stage-object-intent_card"]'
    );
    const planObjectElement = document.querySelector<HTMLElement>(
      '[data-testid="stage-object-plan_card"]'
    );
    const documentObject = document.querySelector<HTMLElement>(
      '[data-testid="stage-object-document_portal"]'
    );
    const sceneField = document.querySelector<HTMLElement>(
      '[data-testid="stage-scene-field"]'
    );

    if (
      !constellation ||
      !intentObject ||
      !planObjectElement ||
      !documentObject ||
      !sceneField
    ) {
      return null;
    }

    const intentRect = intentObject.getBoundingClientRect();
    const planRect = planObjectElement.getBoundingClientRect();
    const documentRect = documentObject.getBoundingClientRect();
    const intentCapture = document.querySelector<HTMLElement>(
      '[data-testid="intent-capture"]'
    );
    const commandRect = intentCapture?.getBoundingClientRect();
    const ritualField = document.querySelector<HTMLElement>(
      '[data-testid="stage-ritual-field"]'
    );
    const laborNodes = document.querySelectorAll<HTMLElement>(
      '[data-testid="stage-labor-node"]'
    );
    const approvalThreshold = document.querySelector<HTMLElement>(
      '[data-testid="stage-approval-threshold"]'
    );
    const generatedStream = document.querySelector<HTMLElement>(
      '[data-testid="stage-generated-stream"]'
    );
    const approvalThresholdRect = approvalThreshold?.getBoundingClientRect();
    const generatedStreamRect = generatedStream?.getBoundingClientRect();
    const generatedPatchClock = generatedStream?.querySelector<HTMLElement>(
      ".generated-stream-clock"
    );
    const overlaps = (first: DOMRect, second: DOMRect) =>
      first.left < second.right &&
      first.right > second.left &&
      first.top < second.bottom &&
      first.bottom > second.top;

    return {
      constellationDisplay: getComputedStyle(constellation).display,
      constellationPosition: getComputedStyle(constellation).position,
      constellationOpacity: Number(getComputedStyle(constellation).opacity),
      documentAccent: getComputedStyle(documentObject)
        .getPropertyValue("--object-accent")
        .trim(),
      intentAccent: getComputedStyle(intentObject)
        .getPropertyValue("--object-accent")
        .trim(),
      intentSceneX: Number(intentObject.style.getPropertyValue("--scene-x")),
      planSceneX: Number(planObjectElement.style.getPropertyValue("--scene-x")),
      planSceneY: Number(planObjectElement.style.getPropertyValue("--scene-y")),
      documentSceneY: Number(documentObject.style.getPropertyValue("--scene-y")),
      planSceneDepth: Number(planObjectElement.style.getPropertyValue("--scene-depth")),
      sceneEdgeCount: Number(sceneField.dataset.edgeCount ?? 0),
      sceneNodeCount: Number(sceneField.dataset.nodeCount ?? 0),
      sceneZoneCount: Number(sceneField.dataset.zoneCount ?? 0),
      sceneActiveZoneCount: Number(sceneField.dataset.activeZoneCount ?? 0),
      sceneCameraMode: sceneField.dataset.cameraMode,
      sceneCameraFocusObject: sceneField.dataset.cameraFocusObject,
      workspaceCameraFocusObject: document.querySelector<HTMLElement>(
        '[data-testid="stage-workspace"]'
      )?.dataset.stageCameraFocusObject,
      workspaceCameraDepth: getComputedStyle(
        document.querySelector<HTMLElement>('[data-testid="stage-workspace"]') ??
          sceneField
      )
        .getPropertyValue("--stage-camera-depth")
        .trim(),
      sceneHasFocalStage: Boolean(sceneField.querySelector(".scene-focal-stage")),
      sceneHasCameraAperture: Boolean(
        sceneField.querySelector(".scene-camera-aperture")
      ),
      sceneHasCameraCorridor: Boolean(
        sceneField.querySelector(".scene-camera-corridor")
      ),
      sceneHasZoneFlow: Boolean(sceneField.querySelector(".scene-zone-flow")),
      sceneHasWorkZone: Boolean(
        sceneField.querySelector('[data-scene-zone="work_focus"]')
      ),
      sceneHasFramesEdge: Boolean(
        sceneField.querySelector('[data-scene-relationship="frames"]')
      ),
      sceneHasSupportEdge: Boolean(
        sceneField.querySelector('[data-scene-relationship="supports"]')
      ),
      sceneHasIntentHalo: Boolean(
        sceneField.querySelector('[data-scene-cluster="intent"]')
      ),
      sceneHasPrimaryHalo: Boolean(
        sceneField.querySelector('[data-scene-cluster="primary_work"]')
      ),
      planCameraFocused: planObjectElement.dataset.cameraFocus === "true",
      planObjectId: planObjectElement.dataset.objectId,
      intentCameraFocused: intentObject.dataset.cameraFocus === "true",
      intentParallaxX: getComputedStyle(intentObject)
        .getPropertyValue("--object-parallax-x")
        .trim(),
      ritualExists: Boolean(ritualField),
      ritualHasApproval: ritualField?.dataset.hasApproval === "true",
      ritualEventCount: Number(ritualField?.dataset.eventCount ?? 0),
      laborNodeCount: laborNodes.length,
      thresholdStatus: approvalThreshold?.dataset.approvalStatus,
      thresholdDoesNotCoverPlan: approvalThresholdRect
        ? !overlaps(approvalThresholdRect, planRect)
        : false,
      thresholdDoesNotCoverCommand:
        approvalThresholdRect && commandRect
          ? !overlaps(approvalThresholdRect, commandRect)
          : false,
      generatedStreamVisible:
        Boolean(generatedStream) &&
        Boolean(generatedStreamRect) &&
        generatedStreamRect!.width > 0 &&
        generatedStreamRect!.height > 0,
      generatedFrameSequence: Number(generatedStream?.dataset.frameSequence ?? 0),
      generatedMorphMode: generatedStream?.dataset.morphMode,
      generatedMorphPhase: generatedStream?.dataset.morphPhase,
      generatedMorphVoiceCadence: generatedStream?.dataset.morphVoiceCadence,
      generatedWorkbenchState: generatedStream?.dataset.workbenchState,
      generatedMorphCamera:
        generatedStream?.querySelector<HTMLElement>(".generated-morph-field")
          ?.dataset.morphCamera,
      generatedMorphNucleusExists: Boolean(
        generatedStream?.querySelector(".generated-morph-nucleus")
      ),
      generatedMorphOrbitCount:
        generatedStream?.querySelectorAll(".generated-morph-orbit-object").length ??
        0,
      generatedMorphSocketCount:
        generatedStream?.querySelectorAll(".generated-morph-socket").length ?? 0,
      generatedMorphPhaseCount:
        generatedStream?.querySelectorAll(".generated-morph-phase-rail span")
          .length ?? 0,
      generatedPatchClockText: generatedPatchClock?.textContent ?? "",
      generatedPatchCount:
        generatedStream?.querySelectorAll(".generated-stream-patches span").length ??
        0,
      generatedStreamText: generatedStream?.textContent ?? "",
      generatedStreamTextLength: generatedStream?.textContent?.length ?? 0,
      generatedStreamDetailCount:
        generatedStream?.querySelectorAll(".generated-stream-detail").length ?? 0,
      planRightOfIntent: planRect.left > intentRect.left + 80,
      documentBelowIntent: documentRect.top > intentRect.top + 80,
      objectsDoNotOverlap:
        !overlaps(intentRect, planRect) &&
        !overlaps(intentRect, documentRect) &&
        !overlaps(planRect, documentRect),
      commandDockDoesNotCoverObjects: commandRect
        ? !overlaps(commandRect, intentRect) &&
          !overlaps(commandRect, planRect) &&
          !overlaps(commandRect, documentRect)
        : false
    };
  });

  if (!renderFieldEvidence) {
    throw new Error("Stage render field evidence was not available.");
  }

  expect(renderFieldEvidence.constellationDisplay).toBe("block");
  expect(renderFieldEvidence.constellationPosition).toBe("relative");
  expect(renderFieldEvidence.constellationOpacity).toBeLessThan(0.05);
  expect(renderFieldEvidence.generatedStreamVisible).toBe(true);
  expect(renderFieldEvidence.generatedFrameSequence).toBeGreaterThan(0);
  expect(["coding", "approval"]).toContain(renderFieldEvidence.generatedMorphMode);
  expect([
    "sockets_allocated",
    "context_collapsed",
    "approval_ritual",
    "workbench_revealed"
  ]).toContain(renderFieldEvidence.generatedMorphPhase);
  expect(renderFieldEvidence.generatedMorphVoiceCadence).toBeTruthy();
  expect(renderFieldEvidence.generatedWorkbenchState).toBeTruthy();
  expect(renderFieldEvidence.generatedMorphCamera).toBeTruthy();
  expect(renderFieldEvidence.generatedMorphNucleusExists).toBe(true);
  expect(renderFieldEvidence.generatedMorphOrbitCount).toBeGreaterThanOrEqual(2);
  expect(renderFieldEvidence.generatedMorphSocketCount).toBeGreaterThanOrEqual(2);
  expect(renderFieldEvidence.generatedMorphPhaseCount).toBe(8);
  expect(renderFieldEvidence.generatedPatchClockText).toContain("patch");
  expect(renderFieldEvidence.generatedPatchCount).toBeGreaterThanOrEqual(3);
  expect(renderFieldEvidence.generatedStreamTextLength).toBeGreaterThan(20);
  expect(renderFieldEvidence.generatedStreamDetailCount).toBeGreaterThanOrEqual(1);
  expect(renderFieldEvidence.documentAccent).not.toBe(renderFieldEvidence.intentAccent);
  expect(renderFieldEvidence.planSceneX).toBeGreaterThan(
    renderFieldEvidence.intentSceneX
  );
  expect(renderFieldEvidence.documentSceneY).toBeGreaterThan(
    renderFieldEvidence.planSceneY
  );
  expect(renderFieldEvidence.planSceneDepth).toBeGreaterThan(80);
  expect(renderFieldEvidence.sceneEdgeCount).toBeGreaterThanOrEqual(2);
  expect(renderFieldEvidence.sceneNodeCount).toBeGreaterThanOrEqual(3);
  expect(renderFieldEvidence.sceneZoneCount).toBeGreaterThanOrEqual(5);
  expect(renderFieldEvidence.sceneActiveZoneCount).toBeGreaterThanOrEqual(3);
  expect(renderFieldEvidence.sceneCameraMode).toBeTruthy();
  expect(renderFieldEvidence.sceneCameraFocusObject).toBe(
    renderFieldEvidence.planObjectId
  );
  expect(renderFieldEvidence.workspaceCameraFocusObject).toBe(
    renderFieldEvidence.planObjectId
  );
  expect(Number(renderFieldEvidence.workspaceCameraDepth)).toBeGreaterThan(0);
  expect(renderFieldEvidence.sceneHasFocalStage).toBe(true);
  expect(renderFieldEvidence.sceneHasCameraAperture).toBe(true);
  expect(renderFieldEvidence.sceneHasCameraCorridor).toBe(true);
  expect(renderFieldEvidence.sceneHasZoneFlow).toBe(true);
  expect(renderFieldEvidence.sceneHasWorkZone).toBe(true);
  expect(renderFieldEvidence.sceneHasFramesEdge).toBe(true);
  expect(renderFieldEvidence.sceneHasSupportEdge).toBe(true);
  expect(renderFieldEvidence.sceneHasIntentHalo).toBe(true);
  expect(renderFieldEvidence.sceneHasPrimaryHalo).toBe(true);
  expect(renderFieldEvidence.planCameraFocused).toBe(true);
  expect(renderFieldEvidence.intentCameraFocused).toBe(false);
  expect(renderFieldEvidence.intentParallaxX).not.toBe("0px");
  expect(renderFieldEvidence.ritualExists).toBe(true);
  expect(renderFieldEvidence.ritualEventCount).toBeGreaterThanOrEqual(2);
  expect(renderFieldEvidence.laborNodeCount).toBeGreaterThanOrEqual(2);
  if (renderFieldEvidence.ritualHasApproval) {
    expect(renderFieldEvidence.thresholdDoesNotCoverPlan).toBe(true);
    expect(renderFieldEvidence.thresholdDoesNotCoverCommand).toBe(true);
  }

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
  const pendingRitualEvidence = await page.evaluate(() => {
    const overlaps = (first: DOMRect, second: DOMRect) =>
      !(
        first.right <= second.left ||
        second.right <= first.left ||
        first.bottom <= second.top ||
        second.bottom <= first.top
      );
    const ritualField = document.querySelector<HTMLElement>(
      '[data-testid="stage-ritual-field"]'
    );
    const workspace = document.querySelector<HTMLElement>(
      '[data-testid="stage-workspace"]'
    );
    const approvalThreshold = document.querySelector<HTMLElement>(
      '[data-testid="stage-approval-threshold"]'
    );
    const approvalTether = document.querySelector<HTMLElement>(
      ".stage-approval-tether"
    );
    const planObjectElement = document.querySelector<HTMLElement>(
      '[data-testid="stage-object-plan_card"]'
    );
    const approvalFocusedObject = document.querySelector<HTMLElement>(
      '[data-approval-focus="true"]'
    );
    const intentCapture = document.querySelector<HTMLElement>(
      '[data-testid="intent-capture"]'
    );
    const thresholdRect = approvalThreshold?.getBoundingClientRect();
    const planRect = planObjectElement?.getBoundingClientRect();
    const commandRect = intentCapture?.getBoundingClientRect();
    const intentObject = document.querySelector<HTMLElement>(
      '[data-testid="stage-object-intent_card"]'
    );
    const sceneField = document.querySelector<HTMLElement>(
      '[data-testid="stage-scene-field"]'
    );

    return {
      approvalFocusObject: workspace?.dataset.approvalFocusObject,
      sceneCameraFocusObject: sceneField?.dataset.cameraFocusObject,
      workspaceCameraFocusObject: workspace?.dataset.stageCameraFocusObject,
      approvalFocusedObjectType: approvalFocusedObject?.dataset.testid,
      approvalFocusedObjectId: approvalFocusedObject?.dataset.objectId,
      hasApprovalPendingClass:
        workspace?.classList.contains("stage-workspace-approval-pending") ?? false,
      hasApprovalTether: Boolean(approvalTether),
      hasCameraAperture: Boolean(sceneField?.querySelector(".scene-camera-aperture")),
      hasCameraCorridor: Boolean(sceneField?.querySelector(".scene-camera-corridor")),
      dimmedIntentOpacity: Number(
        intentObject ? getComputedStyle(intentObject).opacity : 1
      ),
      focusedPlanOpacity: Number(
        planObjectElement ? getComputedStyle(planObjectElement).opacity : 0
      ),
      ritualHasApproval: ritualField?.dataset.hasApproval === "true",
      laborNodeCount: document.querySelectorAll('[data-testid="stage-labor-node"]')
        .length,
      thresholdStatus: approvalThreshold?.dataset.approvalStatus,
      thresholdDoesNotCoverPlan:
        thresholdRect && planRect ? !overlaps(thresholdRect, planRect) : false,
      thresholdDoesNotCoverCommand:
        thresholdRect && commandRect ? !overlaps(thresholdRect, commandRect) : false
    };
  });

  expect(pendingRitualEvidence.approvalFocusObject).toBeTruthy();
  expect(pendingRitualEvidence.sceneCameraFocusObject).toBe(
    pendingRitualEvidence.approvalFocusObject
  );
  expect(pendingRitualEvidence.workspaceCameraFocusObject).toBe(
    pendingRitualEvidence.approvalFocusObject
  );
  expect(pendingRitualEvidence.approvalFocusedObjectId).toBe(
    pendingRitualEvidence.approvalFocusObject
  );
  expect(pendingRitualEvidence.approvalFocusedObjectType).toBe(
    "stage-object-plan_card"
  );
  expect(pendingRitualEvidence.hasApprovalPendingClass).toBe(true);
  expect(pendingRitualEvidence.hasApprovalTether).toBe(true);
  expect(pendingRitualEvidence.hasCameraAperture).toBe(true);
  expect(pendingRitualEvidence.hasCameraCorridor).toBe(true);
  expect(pendingRitualEvidence.dimmedIntentOpacity).toBeLessThan(0.8);
  expect(pendingRitualEvidence.focusedPlanOpacity).toBeGreaterThan(0.95);
  expect(pendingRitualEvidence.ritualHasApproval).toBe(true);
  expect(pendingRitualEvidence.laborNodeCount).toBeGreaterThanOrEqual(4);
  expect(pendingRitualEvidence.thresholdStatus).toBe("pending");
  expect(pendingRitualEvidence.thresholdDoesNotCoverPlan).toBe(true);
  expect(pendingRitualEvidence.thresholdDoesNotCoverCommand).toBe(true);

  await page.getByRole("button", { name: "Approve", exact: true }).click({
    force: true
  });

  await expect(page.getByTestId("approval-card")).toContainText("Approval resolved");
  await expect(page.getByTestId("approval-card")).toContainText("Status: approved");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Task 3: Research instrumentation"
  );
  await expect(page.getByTestId("stage-workspace")).toContainText("Memory boundary");
  const approvedFieldEvidence = await page
    .getByTestId("stage-workspace")
    .evaluate((workspace) => {
      const overlaps = (first: DOMRect, second: DOMRect) =>
        !(
          first.right <= second.left ||
          second.right <= first.left ||
          first.bottom <= second.top ||
          second.bottom <= first.top
        );
      const objectRects = Array.from(
        workspace.querySelectorAll<HTMLElement>(".stage-object")
      ).map((element, index) => ({
        title:
          element.querySelector("h2")?.textContent?.trim() ??
          element.dataset.testid ??
          `object-${index}`,
        rect: element.getBoundingClientRect()
      }));
      const objectOverlaps: Array<[string, string]> = [];
      const commandDock = document.querySelector<HTMLElement>(".intent-capture");
      const commandRect = commandDock?.getBoundingClientRect();
      const approvalThreshold = workspace.querySelector<HTMLElement>(
        '[data-testid="stage-approval-threshold"]'
      );
      const approvalThresholdRect = approvalThreshold?.getBoundingClientRect();
      const approvalTether = workspace.querySelector<HTMLElement>(
        ".stage-approval-tether"
      );
      const generatedStream = workspace.querySelector<HTMLElement>(
        '[data-testid="stage-generated-stream"]'
      );
      const generatedStreamRect = generatedStream?.getBoundingClientRect();
      const generatedPatchClock = generatedStream?.querySelector<HTMLElement>(
        ".generated-stream-clock"
      );
      const constellation = workspace.querySelector<HTMLElement>(
        ".stage-object-constellation"
      );

      for (let firstIndex = 0; firstIndex < objectRects.length; firstIndex += 1) {
        for (
          let secondIndex = firstIndex + 1;
          secondIndex < objectRects.length;
          secondIndex += 1
        ) {
          if (overlaps(objectRects[firstIndex].rect, objectRects[secondIndex].rect)) {
            objectOverlaps.push([
              objectRects[firstIndex].title,
              objectRects[secondIndex].title
            ]);
          }
        }
      }

      return {
        activeZoneCount: Number(
          workspace.querySelector<HTMLElement>(".stage-scene-field")?.dataset
            .activeZoneCount ?? 0
        ),
        hasArtifactZone: Boolean(
          workspace.querySelector('[data-scene-zone="artifact_output"]')
        ),
        hasZoneFlow: Boolean(workspace.querySelector(".scene-zone-flow")),
        hasCameraAperture: Boolean(workspace.querySelector(".scene-camera-aperture")),
        hasCameraCorridor: Boolean(workspace.querySelector(".scene-camera-corridor")),
        cameraFocusCount: workspace.querySelectorAll('[data-camera-focus="true"]')
          .length,
        cameraFocusObject: workspace.querySelector<HTMLElement>(
          '[data-camera-focus="true"]'
        )?.dataset.objectId,
        workspaceCameraFocusObject: workspace.dataset.stageCameraFocusObject,
        approvedThresholdStatus: approvalThreshold?.dataset.approvalStatus,
        approvalFocusObject: workspace.dataset.approvalFocusObject,
        approvalFocusCount: workspace.querySelectorAll('[data-approval-focus="true"]')
          .length,
        hasApprovalPendingClass: workspace.classList.contains(
          "stage-workspace-approval-pending"
        ),
        hasApprovalTether: Boolean(approvalTether),
        constellationOpacity: constellation
          ? Number(getComputedStyle(constellation).opacity)
          : 1,
        generatedStreamVisible:
          Boolean(generatedStream) &&
          Boolean(generatedStreamRect) &&
          generatedStreamRect!.width > 0 &&
          generatedStreamRect!.height > 0,
        generatedFrameSequence: Number(generatedStream?.dataset.frameSequence ?? 0),
        generatedMorphMode: generatedStream?.dataset.morphMode,
        generatedMorphPhase: generatedStream?.dataset.morphPhase,
        generatedWorkbenchState: generatedStream?.dataset.workbenchState,
        generatedMorphNucleusExists: Boolean(
          generatedStream?.querySelector(".generated-morph-nucleus")
        ),
        generatedMorphSocketCount:
          generatedStream?.querySelectorAll(".generated-morph-socket").length ?? 0,
        generatedMorphPhaseCount:
          generatedStream?.querySelectorAll(".generated-morph-phase-rail span")
            .length ?? 0,
        generatedPatchClockText: generatedPatchClock?.textContent ?? "",
        generatedPatchCount:
          generatedStream?.querySelectorAll(".generated-stream-patches span")
            .length ?? 0,
        generatedStreamTextLength: generatedStream?.textContent?.length ?? 0,
        laborNodeCount: workspace.querySelectorAll('[data-testid="stage-labor-node"]')
          .length,
        objectCount: objectRects.length,
        objectOverlaps,
        commandOverlaps: commandRect
          ? objectRects
              .filter((object) => overlaps(object.rect, commandRect))
              .map((object) => object.title)
          : [],
        thresholdObjectOverlaps: approvalThresholdRect
          ? objectRects
              .filter((object) => overlaps(object.rect, approvalThresholdRect))
              .map((object) => object.title)
          : []
      };
    });

  expect(approvedFieldEvidence.objectCount).toBeGreaterThanOrEqual(10);
  expect(approvedFieldEvidence.activeZoneCount).toBeGreaterThanOrEqual(4);
  expect(approvedFieldEvidence.hasArtifactZone).toBe(true);
  expect(approvedFieldEvidence.hasZoneFlow).toBe(true);
  expect(approvedFieldEvidence.hasCameraAperture).toBe(true);
  expect(approvedFieldEvidence.hasCameraCorridor).toBe(true);
  expect(approvedFieldEvidence.cameraFocusCount).toBe(1);
  expect(approvedFieldEvidence.workspaceCameraFocusObject).toBe(
    approvedFieldEvidence.cameraFocusObject
  );
  expect(approvedFieldEvidence.approvedThresholdStatus).toBe("approved");
  expect(approvedFieldEvidence.approvalFocusObject).toBeUndefined();
  expect(approvedFieldEvidence.approvalFocusCount).toBe(0);
  expect(approvedFieldEvidence.hasApprovalPendingClass).toBe(false);
  expect(approvedFieldEvidence.hasApprovalTether).toBe(false);
  expect(approvedFieldEvidence.constellationOpacity).toBeLessThan(0.05);
  expect(approvedFieldEvidence.generatedStreamVisible).toBe(true);
  expect(approvedFieldEvidence.generatedFrameSequence).toBeGreaterThan(0);
  expect(approvedFieldEvidence.generatedMorphMode).toBe("artifact");
  expect(approvedFieldEvidence.generatedMorphPhase).toBe("workbench_revealed");
  expect(approvedFieldEvidence.generatedWorkbenchState).toBe("revealed");
  expect(approvedFieldEvidence.generatedMorphNucleusExists).toBe(true);
  expect(approvedFieldEvidence.generatedMorphSocketCount).toBeGreaterThanOrEqual(3);
  expect(approvedFieldEvidence.generatedMorphPhaseCount).toBe(8);
  expect(approvedFieldEvidence.generatedPatchClockText).toContain("patch");
  expect(approvedFieldEvidence.generatedPatchCount).toBeGreaterThanOrEqual(2);
  expect(approvedFieldEvidence.generatedStreamTextLength).toBeGreaterThan(20);
  expect(approvedFieldEvidence.laborNodeCount).toBeGreaterThanOrEqual(7);
  await expect(page.getByTestId("browser-portal-surface")).toContainText(
    "blackstage://validation/stage-shell-v0"
  );
  await expect(page.getByTestId("browser-portal-surface")).toContainText(
    "No external browsing happens in this local run."
  );
  await expect(page.getByTestId("artifact-stack")).toContainText("approved output");
  await expect(page.getByTestId("research-capture")).toContainText("Research trace");

  const generatedSessionEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          currentThread?: {
            artifacts?: Array<{ status?: string; title?: string }>;
          };
          researchEvents?: unknown[];
          stageEvents?: Array<{ type?: string; payload?: { status?: string } }>;
        })
      : undefined;

    return {
      approvalResolved: snapshot?.stageEvents?.some(
        (event) => event.type === "approval.resolved" && event.payload?.status === "approved"
      ),
      approvedArtifact: snapshot?.currentThread?.artifacts?.some(
        (artifact) =>
          artifact.status === "approved" &&
          artifact.title?.includes("Codex Task Brief")
      ),
      researchEventCount: snapshot?.researchEvents?.length ?? 0
    };
  });

  expect(generatedSessionEvidence.approvalResolved).toBe(true);
  expect(generatedSessionEvidence.approvedArtifact).toBe(true);
  expect(generatedSessionEvidence.researchEventCount).toBeGreaterThan(0);
  await page.mouse.move(16, 16);

  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelector(".stage-workspace")?.scrollTo(0, 0);
    document.querySelector(".stage-object-constellation")?.scrollTo(0, 0);
    document.querySelector(".artifact-stack")?.scrollTo(0, 0);
  });
  await page.screenshot({
    path: screenshotPath,
    timeout: 0
  });

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("Stage Shell v0 treats text commands as stage-object manipulation", async ({
  page
}) => {
  test.setTimeout(120_000);

  await page.goto("/");

  await submitIntent(page, "Build BlackStage");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await submitIntent(page, "Build BlackStage");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Stage Shell v0 plan"
  );

  const planObject = page.getByTestId("stage-object-plan_card");
  const dragHandle = planObject.getByRole("button", {
    name: "Drag Stage Shell v0 plan"
  });
  const initialShift = await readObjectShift(planObject);
  const initialStoredPosition = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

    if (!rawSnapshot) {
      return null;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      currentThread?: {
        renderObjects?: Array<{
          type?: string;
          position?: {
            x?: number;
            y?: number;
          };
        }>;
      };
    };
    const planObjectSnapshot = snapshot.currentThread?.renderObjects?.find(
      (object) => object.type === "plan_card"
    );

    return {
      x: planObjectSnapshot?.position?.x ?? 0,
      y: planObjectSnapshot?.position?.y ?? 0
    };
  });
  const dragBox = await dragHandle.boundingBox();

  expect(dragBox).not.toBeNull();
  expect(initialStoredPosition).not.toBeNull();

  if (!dragBox || !initialStoredPosition) {
    return;
  }

  await page.mouse.move(dragBox.x + dragBox.width / 2, dragBox.y + dragBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    dragBox.x + dragBox.width / 2 + 42,
    dragBox.y + dragBox.height / 2 + 18,
    {
      steps: 5
    }
  );
  await page.mouse.up();

  const expectedVisibleShift = {
    x: initialShift.x + 42,
    y: initialShift.y + 18
  };
  const expectedStoredPosition = {
    x: initialStoredPosition.x + 42,
    y: initialStoredPosition.y + 18
  };

  await expect
    .poll(async () => readObjectShift(planObject))
    .toEqual(expectedVisibleShift);

  const dragWasLogged = await page.evaluate((expected) => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
  }, expectedStoredPosition);

  expect(dragWasLogged).toBe(true);
});

test("Stage Shell v0 can undo the last object change from event history", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.goto("/");

  await submitIntent(page, "Build BlackStage");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await submitIntent(page, "Build BlackStage");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
  test.setTimeout(180_000);

  await page.goto("/");

  await submitIntent(page, "Seed round plan");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await submitIntent(page, "Build BlackStage");
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await page
    .getByTestId("approval-card")
    .getByRole("button", { name: "Approve", exact: true })
    .click({
      force: true
    });
  await expect(page.getByTestId("approval-card")).toContainText("Approval resolved");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Task 3: Research instrumentation"
  );
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

  await page.getByRole("button", { name: "Approve", exact: true }).click({
    force: true
  });
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "approved into the local queue"
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Harness action packet approved for local queue."
  );

  const actionWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
            status?: string;
            execution?: string;
          };
          status?: string;
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
    const approvalWasResolved = snapshot.stageEvents.some(
      (event) =>
        event.type === "approval.resolved" && event.payload?.status === "approved"
    );
    const queueWasLogged = snapshot.stageEvents.some(
      (event) =>
        event.type === "object.updated" &&
        event.payload?.payload?.status === "approved local queue" &&
        event.payload.payload.execution === "not_started"
    );

    return (
      approvalWasLogged &&
      packetArtifactWasLogged &&
      approvalWasResolved &&
      queueWasLogged
    );
  });

  expect(actionWasLogged).toBe(true);
});

test("Stage Shell v0 replays the local event log without mutating it", async ({
  page
}) => {
  test.setTimeout(90_000);

  await page.goto("/");

  await submitIntent(page, "Build BlackStage");
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await expect(page.getByTestId("research-capture")).toContainText("stage events");
  await expect(page.getByLabel("Intent thread")).not.toContainText("working");

  const stageEventCount = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

    if (!rawSnapshot) {
      return 0;
    }

    const snapshot = JSON.parse(rawSnapshot) as {
      stageEvents?: unknown[];
    };

    return snapshot.stageEvents?.length ?? 0;
  });

  expect(stageEventCount).toBeGreaterThan(6);

  await page.getByTestId("research-capture").hover({
    force: true
  });
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
  await submitIntent(page, "Build BlackStage");
  await expect(page.getByRole("button", { name: "Stop" })).toBeVisible();
  await page.getByRole("button", { name: "Stop" }).dispatchEvent("click");

  await expect(page.getByTestId("agent-activity-feed")).toContainText(
    "Stopped by user."
  );
  await expect(page.getByTestId("agent-activity-feed")).toContainText("cancelled");
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible();
  await expect(page.getByLabel("Intent thread")).toContainText("paused");
  const stopWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await submitIntent(page, "Build BlackStage");
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

  await submitIntent(page, "Build BlackStage");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await submitIntent(page, "Build BlackStage");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await submitIntent(page, "Build BlackStage");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await submitIntent(page, "Build BlackStage");
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
  await expect(simulationSurface).toContainText("Local stage run only");

  const simulationRunWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
  await submitIntent(page, "Build BlackStage");
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
  await expect(page.getByTestId("stage-workspace")).toContainText("Text structure");
  await expect(page.getByTestId("stage-workspace")).toContainText("16 words · 1 line");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Attach this local note as context"
  );
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Local-only context object. No external upload."
  );
  await expect(page.getByTestId("research-capture")).toContainText("context attached");

  const textContextWasLogged = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
        event.payload?.structured_kind === "text" &&
        event.payload.structured_item_count === 16 &&
        event.payload.local_only === true
    );
  });

  expect(textContextWasLogged).toBe(true);

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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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
  await submitIntent(page, "Build BlackStage");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await submitIntent(page, "Seed round plan");
  await expect(page.getByTestId("approval-card")).toContainText(
    "Approve local investor intro prompts",
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");

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

  await expect(page.getByTestId("realtime-broker-status")).toContainText("standby");
  await expect(page.getByTestId("harness-runner-status")).toContainText("standby");
  const stageVoiceButton = page.getByRole("button", { name: "Stage voice" });

  await stageVoiceButton.focus();
  await expect(page.getByTestId("intent-capture")).toHaveCSS("pointer-events", "auto");
  await stageVoiceButton.click();
  await expect(page.getByTestId("assistant-speech")).toContainText("Stage voice ready");

  await submitIntent(page, "Build BlackStage");
  await expect(page.getByTestId("assistant-speech")).toContainText("Intent received");
  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Stage Shell v0 plan"
  );

  const voiceEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
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

  for (const label of startupScenarioLabels) {
    await expect(page.getByText(label)).toHaveCount(0);
  }

  await page.getByTestId("presence-orb").click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "listening for intent"
  );
  await expect(page.getByTestId("stage-presence")).toContainText("Listening");
  await expect(page.getByTestId("stage-presence")).toContainText(
    "Say the intent. The stage will shape itself around it."
  );
  await expect(page.getByTestId("presence-orb")).toHaveAccessibleName(
    "Listening for intent"
  );

  await emitFakeSpeechInterim(page, "Help me plan a seed round");
  await expect(page.getByTestId("stage-presence")).toContainText(
    "Help me plan a seed round"
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
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

test("Stage Shell v0 starts the local harness from a spoken command", async ({
  page
}) => {
  test.setTimeout(120_000);

  await installFakeSpeechRecognition(page);

  await page.goto("/");

  await submitIntent(page, "Build BlackStage");
  await expect(page.getByTestId("approval-card")).toContainText(
    "Create three Codex task prompts"
  );
  await page.getByRole("button", { name: "Approve", exact: true }).click();

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "listening for intent"
  );

  await emitFakeSpeechFinal(page, "run harness");

  await expect(page.getByTestId("stage-workspace")).toContainText(
    "Live harness recorder"
  );

  const harnessCommandEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              command_action?: string;
              command_input_mode?: string;
            };
          }>;
        })
      : undefined;

    return (
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "run_harness" &&
          event.payload?.command_input_mode === "voice"
      ) ?? false
    );
  });

  expect(harnessCommandEvidence).toBe(true);
});

test("Stage Shell v0 applies spoken correction commands to stage objects", async ({
  page
}) => {
  test.setTimeout(120_000);

  await installFakeSpeechRecognition(page);

  await page.goto("/");

  await submitIntent(page, "Build BlackStage");
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

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "listening for intent"
  );

  await emitFakeSpeechFinal(page, "undo last object change");

  await expect(specObject).toContainText("Spec portal");
  await expect(specObject).not.toContainText("Signal room");
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "Reverted Spec portal."
  );

  const commandEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
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
    const undoWasLogged =
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "undo_object" &&
          event.payload?.command_input_mode === "voice" &&
          event.payload?.command_text_redacted === "undo last object change"
      ) ?? false;

    return collapseWasLogged && renameWasLogged && undoWasLogged;
  });

  expect(commandEvidence).toBe(true);
});

test("Stage Shell v0 annotates arbitrary stage objects by voice", async ({ page }) => {
  test.setTimeout(120_000);

  await installFakeSpeechRecognition(page);

  await page.goto("/");

  await submitIntent(page, "Build BlackStage");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByTestId("map-surface")).toContainText("Build Stage Shell v0");

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "listening for intent"
  );

  await emitFakeSpeechFinal(page, "annotate map with prioritize warm intros");

  await expect(page.getByTestId("object-annotations-map_portal")).toContainText(
    "User annotation"
  );
  await expect(page.getByTestId("object-annotations-map_portal")).toContainText(
    "prioritize warm intros"
  );
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "Annotated Object map."
  );

  const annotationEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              command_action?: string;
              command_input_mode?: string;
              command_value_redacted?: string;
            };
          }>;
          stageEvents?: Array<{
            type?: string;
            payload?: {
              type?: string;
              payload?: {
                annotations?: Array<{
                  label?: string;
                  value?: string;
                }>;
              };
            };
          }>;
        })
      : undefined;

    const commandWasLogged =
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "annotate_object" &&
          event.payload?.command_input_mode === "voice" &&
          event.payload.command_value_redacted === "prioritize warm intros"
      ) ?? false;
    const objectWasUpdated =
      snapshot?.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "map_portal" &&
          event.payload.payload?.annotations?.some(
            (annotation) =>
              annotation.label === "User annotation" &&
              annotation.value === "prioritize warm intros"
          )
      ) ?? false;

    return commandWasLogged && objectWasUpdated;
  });

  expect(annotationEvidence).toBe(true);
});

test("Stage Shell v0 updates arbitrary object summaries by voice", async ({ page }) => {
  test.setTimeout(120_000);

  await installFakeSpeechRecognition(page);

  await page.goto("/");

  await submitIntent(page, "Build BlackStage");
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(page.getByTestId("model-surface")).toContainText(
    "Reality interface model"
  );

  await page.getByRole("button", { name: "Speak" }).click({
    force: true
  });
  await expect(page.getByTestId("voice-transcript")).toContainText(
    "listening for intent"
  );

  await emitFakeSpeechFinal(page, "set model summary to watch the harness voice stack");

  await expect(page.getByTestId("stage-object-model_card")).toContainText(
    "watch the harness voice stack"
  );
  await expect(page.getByTestId("assistant-speech")).toContainText(
    "Updated Interface model summary."
  );

  const summaryEvidence = await page.evaluate(() => {
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
    const snapshot = rawSnapshot
      ? (JSON.parse(rawSnapshot) as {
          researchEvents?: Array<{
            eventType?: string;
            payload?: {
              command_action?: string;
              command_input_mode?: string;
              command_value_redacted?: string;
            };
          }>;
          stageEvents?: Array<{
            type?: string;
            payload?: {
              type?: string;
              summary?: string;
              payload?: {
                userSummary?: string;
                guardrail?: string;
              };
            };
          }>;
        })
      : undefined;

    const commandWasLogged =
      snapshot?.researchEvents?.some(
        (event) =>
          event.eventType === "user_intervention" &&
          event.payload?.command_action === "update_summary" &&
          event.payload?.command_input_mode === "voice" &&
          event.payload.command_value_redacted === "watch the harness voice stack"
      ) ?? false;
    const objectWasUpdated =
      snapshot?.stageEvents?.some(
        (event) =>
          event.type === "object.updated" &&
          event.payload?.type === "model_card" &&
          event.payload.summary === "watch the harness voice stack" &&
          event.payload.payload?.userSummary === "watch the harness voice stack" &&
          event.payload.payload?.guardrail?.includes("stored locally")
      ) ?? false;

    return commandWasLogged && objectWasUpdated;
  });

  expect(summaryEvidence).toBe(true);
});

test("Stage Shell v0 applies spoken artifact revision commands", async ({ page }) => {
  test.setTimeout(120_000);

  await installFakeSpeechRecognition(page);

  await page.goto("/");

  await submitIntent(page, "Build BlackStage");
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
    const rawSnapshot = localStorage.getItem("blackstage.stageShell.v0.1");
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
