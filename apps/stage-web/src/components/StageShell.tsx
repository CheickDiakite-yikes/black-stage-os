import type { IntentThread } from "@blackstage/stage-core";
import type { CSSProperties } from "react";

type StageShellProps = {
  thread: IntentThread;
  accentColor: string;
};

export function StageShell({ thread, accentColor }: StageShellProps) {
  const stageStyle = {
    "--stage-accent": accentColor
  } as CSSProperties;

  return (
    <main className="stage-shell" style={stageStyle}>
      <div className="stage-fluid-field" aria-hidden="true" />
      <div className="stage-stars stage-stars-slow" aria-hidden="true" />
      <div className="stage-stars stage-stars-near" aria-hidden="true" />
      <div className="stage-map" aria-hidden="true">
        <svg className="constellation constellation-nw" viewBox="0 0 320 260">
          <path d="M12 144 L74 178 L112 128 L168 112 L236 38 L306 92" />
          <path d="M112 128 L132 218 L196 244" />
          <circle cx="12" cy="144" r="3" />
          <circle cx="74" cy="178" r="4" />
          <circle cx="112" cy="128" r="5" />
          <circle cx="168" cy="112" r="2" />
          <circle cx="236" cy="38" r="4" />
          <circle cx="306" cy="92" r="5" />
          <circle cx="132" cy="218" r="2" />
          <circle cx="196" cy="244" r="3" />
        </svg>
        <svg className="constellation constellation-sw" viewBox="0 0 340 300">
          <path d="M18 112 C78 92 126 126 164 182 S252 250 326 204" />
          <path d="M82 244 L142 208 L206 260 L278 228" />
          <circle cx="18" cy="112" r="2" />
          <circle cx="82" cy="244" r="4" />
          <circle cx="142" cy="208" r="2" />
          <circle cx="164" cy="182" r="5" />
          <circle cx="206" cy="260" r="3" />
          <circle cx="278" cy="228" r="4" />
          <circle cx="326" cy="204" r="2" />
        </svg>
        <svg className="constellation constellation-ne" viewBox="0 0 360 280">
          <path d="M42 42 C98 118 168 152 282 86" />
          <path d="M216 174 L268 112 L334 62" />
          <circle cx="42" cy="42" r="4" />
          <circle cx="98" cy="118" r="2" />
          <circle cx="168" cy="152" r="3" />
          <circle cx="216" cy="174" r="5" />
          <circle cx="268" cy="112" r="2" />
          <circle cx="282" cy="86" r="3" />
          <circle cx="334" cy="62" r="4" />
        </svg>
        <svg className="constellation constellation-se" viewBox="0 0 420 320">
          <path d="M20 244 C92 138 164 94 246 76 S372 44 410 18" />
          <path d="M214 190 L254 156 L306 196 L288 252 L230 246 Z" />
          <circle cx="20" cy="244" r="5" />
          <circle cx="214" cy="190" r="3" />
          <circle cx="230" cy="246" r="2" />
          <circle cx="246" cy="76" r="2" />
          <circle cx="254" cy="156" r="4" />
          <circle cx="288" cy="252" r="3" />
          <circle cx="306" cy="196" r="3" />
          <circle cx="410" cy="18" r="2" />
        </svg>
      </div>
      <div className="stage-depth" aria-hidden="true" />
      <section className="stage-presence" aria-labelledby="stage-title">
        <div className="presence-orbit" aria-hidden="true">
          <div className="presence-core" />
        </div>
        <div className="stage-copy">
          <h1 id="stage-title">Speak when ready</h1>
          <div className="prompt-rule" aria-hidden="true" />
        </div>
      </section>
      <form className="intent-capture" aria-label="Intent capture">
        <label className="sr-only" htmlFor="intent-input">
          Speak intent, or type with precision.
        </label>
        <input
          id="intent-input"
          name="intent"
          autoComplete="off"
          aria-describedby="stage-status"
          placeholder="type if needed"
          type="text"
        />
      </form>
      <p className="stage-memory-status">memory on · private</p>
      <p className="sr-only" id="stage-status">
        {thread.currentObjective}
      </p>
    </main>
  );
}
