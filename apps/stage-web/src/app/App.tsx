import { createIdleIntentThread } from "@blackstage/stage-core";
import { stageTheme } from "@blackstage/stage-ui";
import { StageShell } from "../components/StageShell";

const idleThread = createIdleIntentThread();

export function App() {
  return <StageShell thread={idleThread} accentColor={stageTheme.accent} />;
}
