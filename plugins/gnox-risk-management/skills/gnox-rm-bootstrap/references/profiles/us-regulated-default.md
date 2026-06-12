# Profile: us-regulated-default (v0.1.0)

Widely-scoped US-style regulated-industries pattern. This is the "default"
profile: it produces standard-agnostic documentation sufficient as source
material for laboratory-accreditation, device/quality-regulation,
information-security-management, privacy, and HACCP-style deliverables,
without asserting that any specific regime applies.

## P1 — Generic obligation categories (the obligation→evidence superset)

Emit as the obligation matrix (left column `☐` for internal clause refs):

| # | Category |
|---|---|
| O-1 | Documented risk assessment covering intended use and foreseeable misuse |
| O-2 | Data confidentiality protections, incl. identifiable personal/health-style information |
| O-3 | Audit trail: attributable, legible, contemporaneous, original, accurate; tamper-evident; time-synchronized; redaction-tolerant |
| O-4 | Access control and least privilege over systems and records |
| O-5 | Validation/verification of software tools used in regulated processes |
| O-6 | Adverse-event/nonconformity detection, documentation, reporting within defined clocks |
| O-7 | Corrective and preventive action (CAPA) linkage with effectiveness checks |
| O-8 | Management review with defined quality indicators |
| O-9 | Document control: versioning, approval, revision history, integrity |
| O-10 | Supplier/vendor qualification and agreements |
| O-11 | Change control on validated systems |
| O-12 | Training and competency of personnel on SOPs (cross-ref out of set) |
| O-13 | Records retention schedule |
| O-14 | Business-associate/data-processing agreements where third parties may contact regulated data |

## P2 — Framework families and disclosure posture

Name these ONLY as methodological coordinates (never as applicability
claims): laboratory accreditation (CAP/CLIA-style); device/quality
regulation (FDA QMSR / 21 CFR Part 11-style e-records); ISO management
systems (9001/13485/14971/27001-style); HACCP-style process control;
HIPAA-style privacy/security expectations.

**Posture:** the organization may be unwilling or unable to confirm which
regimes or data classes apply (IP/organizational-privacy constraints).
Treat non-confirmation as a standing condition, not indecision. The
applicability worksheet ships with blank `☐` rows; a jurisdiction/framework
mapping exercise is explicitly assigned to the organization's regulatory
function; documents never state that a named regulation governs.

## P3 — Data classification superset

C-1 public; C-2 internal; C-3 confidential/trade secret; C-4 regulated
personal/health-style data (default: OUT of intended use); C-5
credentials/secrets (always out); C-6 regulated submission/quality records.
Detection-rule column per class left `☐`. Risk categories in operational
artifacts use opaque accession codes (RC-xx) whose mapping stays internal.

## P4 — Event classes and internal clocks

E-1 critical (confirmed C-4/C-5 egress beyond control, audit-integrity
loss, confirmed bypass; notify ☐ within ☐ 1 h); E-2 major (capture gap,
C-3 egress, blocked-but-systemic attempts; ☐ 4 h); E-3 minor
(remediated-in-SLA drift; next business day); E-4 observation (weekly
review). External-reporting determination is a logged legal/privacy
decision per event, including negative determinations.

## P5 — Risk scoring

5-point Severity × Probability × Detectability (inverted), RPN = S×P×D;
acceptability thresholds `☐`; pre- and post-mitigation columns; residual
risks requiring named acceptance.

## P6 — Document series and naming

`IDX-000 README` (map + conventions) · `ES-00x` executive (C-suite
whitepaper; engineering-management briefing) · `RA-001…006` risk assessment
(scope incl. governing policy statement; data flows; hazards; scoring;
obligation matrix; platform behavioral characterization) · `RM-001…004`
mitigation (architecture trade study; HACCP CCP plan; technical controls;
residual-risk acceptance) · `RR-001…004` reporting (audit logging/retention;
adverse events; KPIs/management review; document control) · `IP-000…500`
implementation plans (tier×complexity framework; one per tier; dual-mode
local-LLM auditor). Hazard IDs H-xx grouped: 0x egress, 1x ingress/integrity,
2x audit-system, 3x operational.

## P7 — Disclosure rules (hard)

Never bake into body text: specific clause numbers asserted as binding;
named regulations asserted as applicable; real data-class mappings; org
names/owners; real sensitive patterns (examples must be visibly synthetic,
e.g. `SYNTH-CRED-####`). Every organizational decision is a `☐` field.

## P8 — Optional extensions

MVP-demo directive pattern (contrived-data-only runnable demos per
implementation strategy, scenario→CCP traceability, honest-substitution
register, deterministic mock upstream) may be bootstrapped as an
auto-loaded directive in an `mvp-demos/` workspace on request.

## P10 — Expected corpus source types (types only — never content)

The Reference Corpus Register (RR-005) for this profile expects sources of
these types when pinned: QA/QC SOPs; Risk Management SOPs; Incident
Reporting / adverse-event SOPs; Operating Standards; quality-system and
accreditation-standard texts; applicable regulatory/legal texts and
guidance; data-protection/privacy texts; relevant contractual instruments
(vendor terms, BAA/DPA-style agreements). Which specific texts those are
is an organizational decision recorded only in RR-005 rows (`☐` until
pinned); this profile never names a text as applicable.
