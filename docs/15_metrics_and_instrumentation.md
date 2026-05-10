# 15 Metrics and Instrumentation

## Instrumentation principle

Blackstage should be instrumented from the first prototype.

We are not only tracking usage. We are tracking whether a new interface paradigm is working and whether AI-assisted building is effective.

## Product event schema

### intent_submitted

Fields:

- event_id
- timestamp
- session_id
- thread_id
- input_mode: voice | text
- intent_text_redacted
- intent_length
- scenario_id
- user_id_hash optional

### thread_created

Fields:

- thread_id
- title
- original_intent_redacted
- created_at
- source

### render_object_created

Fields:

- object_id
- thread_id
- object_type
- title
- created_at
- source_event_id

### agent_event

Fields:

- agent_event_id
- thread_id
- task_id
- agent_name
- event_type
- summary
- timestamp
- evidence_count

### approval_requested

Fields:

- approval_id
- thread_id
- action_type
- risk_level
- scope
- created_at

### approval_resolved

Fields:

- approval_id
- status: approved | rejected | edited | expired
- time_to_resolution
- user_requested_explanation: boolean

### artifact_created

Fields:

- artifact_id
- thread_id
- artifact_type
- title
- created_at
- provenance_count

### user_intervention

Fields:

- intervention_id
- thread_id
- intervention_type: stop | redirect | edit | ask_why | undo | retry
- timestamp
- target_object_id optional

### wow_signal

Fields:

- session_id
- score_1_to_5
- quote optional
- observed_by
- timestamp

## AI-assisted build event schema

### codex_task_started

Fields:

- task_id
- timestamp
- prompt_hash
- docs_referenced
- workstream
- expected_files
- acceptance_criteria_count

### codex_task_completed

Fields:

- task_id
- timestamp
- first_pass_success
- verification_commands_run
- verification_passed
- human_correction_count
- lines_changed optional
- files_changed optional
- notes

### codex_failure_mode

Fields:

- task_id
- failure_type
- severity
- description
- fix
- should_update_agents_md

## Dashboards to build later

### Product dashboard

- Sessions.
- Intent submissions.
- Artifact creation rate.
- Approval requests/resolutions.
- Wow score.
- Time to artifact.
- User intervention rate.

### Build dashboard

- Codex task success rate.
- Human correction count.
- Verification pass rate.
- Most common failure modes.
- Docs updated.
- Research log completion.

## Privacy approach

Use redacted content by default.

The system can store:

- Event types.
- Counts.
- Timing.
- Status.
- Non-sensitive summaries.

Avoid storing:

- Full private transcripts.
- Personal data.
- Secrets.
- Private documents.
- Credentials.
- Financial details.

## Metrics definitions

### Time to first render

Time from intent submission to first non-input stage object.

### Time to artifact

Time from intent submission to artifact creation.

### Agent visibility score

Human rating of how clear the agent's work felt.

### Approval clarity score

Human rating of whether approval cards explained consequence and scope.

### Perceived control score

Human rating of whether they felt in control.

### Wow score

Human rating of whether the demo felt like a new interface category.

### Codex first-pass success

A task is first-pass successful if it satisfies acceptance criteria without requiring a second implementation prompt.

### Human correction count

Number of substantive human interventions needed to make Codex output acceptable.

## Minimum v0 implementation

For Stage Shell v0:

- Use a local event logger.
- Store events in memory and local storage.
- Add an export button to download session events as JSON.
- Add a simple research note generator.
- Avoid sending logs to a server until privacy design is clear.
