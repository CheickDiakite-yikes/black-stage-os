# 18 Risk Register

## Product risks

### R1: Blackstage feels like a chatbot with a black background

Severity: critical  
Mitigation: prioritize render objects, intent threads, agent feed, artifacts, and approval rituals before chat history.

### R2: Interface feels too abstract or intimidating

Severity: high  
Mitigation: use clear demo scenarios, progressive disclosure, and direct artifact value.

### R3: Voice-native becomes annoying

Severity: medium  
Mitigation: always support text and direct manipulation. Treat voice as native, not exclusive.

### R4: Users do not trust agent actions

Severity: critical  
Mitigation: visible agent labor, approvals, evidence, audit logs, and reversible actions.

### R5: Too much UI appears at once

Severity: high  
Mitigation: progressive disclosure and focus mode.

## Technical risks

### R6: Overbuilding architecture too early

Severity: high  
Mitigation: build Stage Shell v0 as vertical slice with clean core models.

### R7: Agent runtime becomes unsafe

Severity: critical  
Mitigation: sandboxing, approvals, audit logs, and clear tool boundaries.

### R8: Memory creates privacy risk

Severity: high  
Mitigation: scoped memory, inspect/delete controls, no silent long-term memory.

### R9: Real-time voice latency hurts experience

Severity: medium  
Mitigation: start with text + voice experiment; optimize after render model works.

### R10: UI performance suffers from animation/render complexity

Severity: medium  
Mitigation: use lightweight DOM/CSS first; profile before adding heavy 3D.

## Research risks

### R11: Findings are anecdotal

Severity: medium  
Mitigation: define metrics, collect session logs, compare against baselines.

### R12: Build logs leak private information

Severity: high  
Mitigation: redaction and privacy-safe event logging.

### R13: Team overclaims results

Severity: high  
Mitigation: clearly separate hypotheses, internal observations, user data, and conclusions.

## Business risks

### R14: The product is too broad

Severity: high  
Mitigation: use Stage Shell v0 and founder/operator wedge before full OS.

### R15: Incumbents copy surface aesthetic

Severity: medium  
Mitigation: moat is interaction model, data/event architecture, research, product taste, and execution speed.

### R16: Users want integrations before trust layer is ready

Severity: high  
Mitigation: do not ship real external actions without approval and audit foundation.

## AI-building risks

### R17: Codex implements generic solutions

Severity: high  
Mitigation: strong docs, small tasks, UX review, and repeated correction.

### R18: Codex introduces architectural drift

Severity: high  
Mitigation: typed domain models, AGENTS.md, architecture reviews, and tests.

### R19: Codex hides subtle bugs behind passing builds

Severity: medium  
Mitigation: human review, tests, demo fixtures, and research logs.

### R20: Team becomes too dependent on AI output

Severity: medium  
Mitigation: Cheick remains taste/final decision owner; GPT-5.5 Pro challenges assumptions; Codex output is reviewed.
