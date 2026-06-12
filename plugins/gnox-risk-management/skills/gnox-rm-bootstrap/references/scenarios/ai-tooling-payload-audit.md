# Scenario: ai-tooling-payload-audit (v0.1.0 — default)

One risk scenario within the organization's IT / IP risk space: deployment
of AI-assisted development tooling whose core function exchanges working
content with an external model vendor over a REST API. The auditable
control points are the contents of payloads at network ingress/egress; the
control surface is the content of the strings; mitigation is appropriate
software use minimizing exposure while maximizing functionality.

This file supplies the scenario-bound content consumed by the bootstrap
procedure. The skill machinery (wizard, router, stages, profiles,
lifecycle, document control, scoring) is scenario-agnostic; other IT/IP
risk scenarios (different software, interfaces, or exposure classes) are
added as sibling files under `references/scenarios/` satisfying the
Scenario Interface in SKILL.md — never by editing the skill.

## S1 — System-under-assessment pattern

System elements: client software on workstations; the vendor REST
interface (primary egress); vendor side channels (telemetry, error
reporting, updater, feedback); the organizational audit gateway and log
pipeline; workstation-local data stores at the boundary; vendor
infrastructure out of scope via supplier qualification. Load-bearing
technical facts recorded in RA-001 §5 with change triggers.

## S2 — Data-flow inventory pattern

Egress rows F-E1…F-E10 (model API; each side channel; auth; web tools;
shell egress; remote MCP; hooks) with audit-point and disable columns;
ingress rows F-I1…F-I6 (responses; updates; web content; local file reads;
remote MCP results; session-resume replay). The inventory is the
denominator of every completeness claim.

## S3 — Hazard families

H-0x content egress (regulated data, IP, credentials, side channels,
shell/web/MCP exfiltration); H-1x ingress/integrity (prompt injection,
defective generated code, update compromise, covert-tunnel
detective-only); H-2x audit-system failure (bypass, capture gap, log
integrity, false negatives, log-store breach, TLS weakening, drift,
redaction-key compromise, out-of-band cloud execution); H-3x operational
(version invalidation, alert fatigue, doc-control failure,
remediation-loop impact).

## S4 — Control architecture

Per `../control-architecture.md` §1–§2: application-layer gateway as
CCP-1 with buffer-before-forward, action ladder, and fail-closed
semantics; CCP-2 context-ingress gates; CCP-3 side-channel suppression;
CCP-4 fleet enforcement + egress default-deny; CCP-5 ciphertext-chained
two-tier store with custody vault and crypto-erasure.

## S5 — Platform characterization

Method per `../control-architecture.md` §3 (provenance tiers T1/T2/T3/S,
expiry triggers). Worked expiring facts for the Anthropic/Claude Code
instance per §4 — re-verify at every bootstrap; other vendors get their
own §4-equivalent authored from their primary documentation.

## S6 — Implementation-plan substance

Risk tiers RT-1 Observe → RT-2 Detect → RT-3 Prevent → RT-4 Remediate ×
complexity CL-A/B/C with the lowest-sufficient-complexity selection rule;
dual-mode (inline + async) local-LLM auditor as cross-tier augmentation
with capped authority; TOS-compliance baseline; optional MVP-demo
directive (profile P8) with contrived-data-only corpus and
honest-substitution register.

## S7 — Diagram catalog

D1 iteration anatomy (generation/signing locus); D2 agentic N-iteration
turn; D3 subagent/workflow fan-out; D4 rejection/remediation ladder; D5
non-gateway flows; D6 vendor-side state and out-of-band surfaces; D7
cumulative implementation stack — validated Mermaid, plus the pattern
summary table (threads, POSTs/turn, signed-content obligations, audit
notes).
