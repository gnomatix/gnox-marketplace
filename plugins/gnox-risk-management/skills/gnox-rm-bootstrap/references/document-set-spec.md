# Document-Set Specification

Author in this order. Every document carries the doc-control frontmatter
and cites cross-references by `DOC-ID §n`. Section lists below are the
minimum skeleton; all organizational decisions are `☐` fields.

## IDX-000 — README
Document map table; document-control conventions (frontmatter, checksum
scope, revision procedure, no-silent-edits rule); regeneration command.

## RA-001 — Scope and System Description
§1 Purpose opening with the **governing policy statement** (control points =
payload contents at network ingress/egress; control surface = content of
the strings; mitigation = appropriate use minimizing risk exposure while
maximizing functionality — adapt wording with the user). §2 system elements
SE-1…SE-7 with in/out-of-scope boundary (vendor infrastructure out, via
supplier qualification). §3 intended use + explicitly-out-of-use classes.
§4 operating environment. §5 **load-bearing technical facts** (the 5-row
pattern: configurable base URL with gateway plaintext visibility;
attribution headers; no client payload signing; disableable side channels;
local-file ingress is a workstation control) — each a change trigger.
§6 assumptions/exclusions. §7 roles.

## RA-002 — Data Flow and Asset Inventory
Egress flow table F-E1…F-E10 (model API; telemetry; error reporting;
updater; feedback; auth; web tools; shell; remote MCP; hooks) with audit
point and disable method per row; ingress table F-I1…F-I6 (responses;
updates; web content; local file reads; remote MCP results; session-resume
replay); data-class table per profile P3; data-at-rest copies incl. the
audit store inheriting the highest capturable classification.

## RA-003 — Hazard Identification
H-01…0x egress hazards; H-1x ingress/integrity (incl. prompt injection,
covert-tunnel detective-only limitation); H-2x audit-system hazards
(bypass, capture gap, log integrity, false negatives, log-store breach,
config drift, redaction-key compromise, out-of-band cloud execution);
H-3x operational (version-change invalidation, alert fatigue, doc-control
failure, remediation-loop impact). Completeness review record.

## RA-004 — Risk Analysis and Evaluation
Profile P5 scales; register row per hazard with pre/post columns and
controlling-document citations; evaluation summary; risk–benefit statement.

## RA-005 — Regulatory Applicability Matrix
Profile P1 obligation rows → evidence artifacts in the set; vendor
qualification skeleton (attestations, retention/ZDR terms, contractual
instrument, sub-processor routing decision, **authentication-mode decision
record** with any secondary-sourced claims flagged for legal); profile P2
jurisdiction worksheet with blank applicability rows.

## RA-006 — Platform Behavioral Characterization
Provenance tiers and rules; behavior table B-01…B-1x (claim / tier /
source / independent verification / invalidating triggers) per
control-architecture §4; data-flow diagram catalog D1–D7 (validated
Mermaid) + pattern summary table; coverage statement: documented modes
only, unknown-pattern detection via reconciliation, perishable by design.

## RM-001 — Control Architecture Assessment
Candidate architectures (app-layer gateway / MITM proxy / DPI /
kernel-endpoint / own-cloud); weighted criteria table; assessment
narrative; decision record R-1 (gateway + thin egress default-deny +
side-channel suppression); consequences accepted.

## RM-002 — HACCP-Style Critical Control Point Plan
Seven-principle structure: process flow diagram; CCP-1 gateway
capture/flag (with buffering, action ladder, byte-exact signed-thinking
handling), CCP-2 context-ingress permission gates, CCP-3 side-channel
suppression, CCP-4 fleet enforcement + egress default-deny, CCP-5
integrity-chained store (ciphertext-covered chain, supersession-only
redaction); measurable critical limits; monitoring table; pre-defined
corrective actions; verification (initial parallel-run + seeded-leak,
periodic, change-triggered, retro-scan, independent review); records.

## RM-003 — Technical Controls Implementation
Concrete client env/settings for the platform (verify at bootstrap);
credential custody (gateway-held upstream key, credential-free
workstations, mTLS); gateway behavioral requirements (buffer-before-
forward, action ladder, accession-preamble injection as cached stable
prefix, thinking byte-exact, fail-closed); two-tier store + key custody;
managed-settings JSON with permission deny rules; egress allowlist;
metadata-only telemetry; IQ/OQ qualification skeleton.

## RM-004 — Residual Risk and Acceptance
Named residual risks (no payload attribution; probabilistic detection;
detective-window egress; vendor-side handling; insider out-of-scope) with
compensating factors and acceptance record; re-acceptance triggers.

## RR-001 — Audit Logging and Retention
Per-exchange record content table (full payloads, attribution, versions in
force, HMAC/redaction fields, retained vendor signatures, remediation
trace); completeness claim definition (capture ∧ suppression ∧
reconciliation); flagging-to-triage; §5a two-tier structure (tokenized
main log + custody vault as designated authorized system of record; keyed
HMAC, provenance chain to vendor signature); retention schedule with
divergent clocks; §6a crypto-erasure procedure.

## RR-002 — Adverse Event and Incident Reporting
Profile P4 classes; escalation/clocks; containment runbooks (credential
rotation; exposure assessment; bypass isolation; integrity freeze);
external-reporting determination including negative determinations; CAPA
linkage with risk-register feedback; event register.

## RR-003 — Periodic Review and Management Reporting
KPI table (capture completeness, attestation rate, fail-closed integrity,
chain pass rate, seeded recall, flag precision, triage SLA, recurrence,
exception inventory); reporting cadence; management-review inputs/outputs;
annual full review.

## RR-004 — Document Control and Change Management
The doc-control.md regime as a controlled document; change-trigger table;
roles.

## RR-005 — Reference Corpus Register
Per `corpus-control.md`: one row per pinned source (CS-## / title / type /
edition / effective date / publisher / storage mode full-text·reference+hash /
locator scheme / content sha256 / license note / status
pinned·deferred·superseded); corpus-store location and `corpus.sha256`
manifest reference; deferred-source gap inventory; quote-verification
procedure reference; corpus change-trigger statement. Authored as a shell
with `foundation`; populated at wizard step W5 or by later controlled
intake.

## RR-006 — Instantiation Register
Per `instantiation.md`: the set's image manifest. Immutable build record
(UTC timestamp, requesting owner, target, substrate agent/model versions);
layer-resolution table with content hashes (kernel skill+plugin versions,
profile file, scenario file, stage→document expansion as performed, corpus
state RR-005/`corpus.sha256` or `deferred`, incorporated-overlay INDEX or
`none`); reproducibility statement (same layers + same pinned corpus ⇒
equivalent set, byte-identical regulatory language); append-only
upgrade-event log (re-instantiation under a newer methodology is an
explicit change-triggered event — prior build records never rewritten).
The register is normative: the authoritative statement of what this set is
and what produced it. Authored by `foundation` at build time; every
produced document's `bootstrapped_by` stamp denormalizes its identity row.

## IP-000…IP-500 — Implementation Plans
IP-000: risk tiers RT-1 Observe → RT-2 Detect → RT-3 Prevent → RT-4
Remediate × complexity CL-A/B/C, **normative selection rule** (lowest
complexity satisfying critical limits — simplicity is assurance),
TOS-compliance baseline, component-qualification standard, plan matrix,
cumulative-stack reference diagram. IP-100…400: one plan per tier
(objective, limits satisfied/not, per-CL architecture, honest "not
justified"/"not achievable" cells, upgrade path). IP-500: dual-mode
(inline + async) local-LLM auditor: mode table, purpose-selected model
battery, prompt-injection hardening, serving substrate, sizing, capped
authority ("cage not animal").

## ES-001 / ES-002 — Executive Documents
ES-001 C-suite whitepaper: situation, what changed, plan, what it buys,
honest limits, the ask (approval/budget/timeline/risk acceptance/sponsor).
ES-002 engineering-management briefing: architecture in one paragraph,
why-not-alternatives, CCP ownership table, bounding engineering facts,
delivery phases, reading order — every claim cited to a document section.
