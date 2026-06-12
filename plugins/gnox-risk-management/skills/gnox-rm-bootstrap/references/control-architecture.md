# Control Architecture and Platform Characterization Method

Vendor-portable engineering core. §4's worked facts are the Anthropic/
Claude Code defaults established 2026-06-11 under client 2.1.170 — they are
EXAMPLES with expiry, to be re-verified against current vendor primary
documentation during Phase 1 of every bootstrap.

## 1. Control-point selection (invariant reasoning)

When the control surface is the content of strings in payloads, the audit
point must sit where content exists in final semantic form: an
**application-layer gateway** the client is pointed at via its configurable
base URL. Evaluate candidates (gateway / TLS-terminating MITM proxy /
DPI / kernel-endpoint capture / own-cloud routing) on: payload completeness
and fidelity; transport security preserved; coverage of non-model flows;
vendor support and upgrade resilience; operational cost; flagging and
inline-enforcement capability; fail-closed enforceability. Expected
outcome (re-derive, don't assume): gateway wins for model traffic but sees
ONLY model traffic — pair it with workstation egress default-deny +
side-channel suppression; the pairing is the safety case. Record as a
decision record with dissent/conditions fields.

## 2. CCP model (invariant)

CCP-1 gateway capture/screen (buffer-before-forward; preventive block /
detective alert; action ladder regenerate → accession-cited revision with
tiered hints and per-category specificity ceilings → terminate-turn; retry
cap; fail-closed on engine error or timeout). CCP-2 context-ingress
permission gates on workstations. CCP-3 side-channel suppression. CCP-4
fleet-managed settings + egress default-deny (what makes 1–3
non-bypassable; gateway-held upstream credential so bypassing clients hold
nothing). CCP-5 integrity-chained append-only store: chain over
per-record-DEK ciphertext; redaction by supersession only; two-tier
main-log(tokenized)/vault(verbatim, two-person, short clock) with keyed
HMAC linkage and retained vendor signatures for provenance; crypto-erasure
for retro-redaction.

## 3. Provenance-tier characterization method (invariant)

T1 documented (vendor primary docs, URL-cited) / T2 observed (verified at
own boundary — the gateway converts the visibility deficit into an
observation capability; promote T1→T2 by boundary testing before
validation closes) / T3 unobservable (vendor-internal; attestational/
contractual only; never cite as T1/T2) / S secondary-source qualifier
(community reports, summaries — flag for legal/verification). Every claim
row: ID, claim, tier, source, independent verification method,
established-under versions, invalidating triggers. The characterization is
perishable by design; model stochasticity/substrate mutability is a
permanent T3 row managed by behavioral regression, not verification.

## 4. Worked platform facts — Anthropic / Claude Code (EXPIRING EXAMPLES)

Re-verify each at bootstrap; carry into the RA-006-equivalent with current
sources:

- Stateless Messages API; full history re-sent per iteration; one user
  turn = N REST iterations; flagged strings re-cross ~2N times (audit unit
  = conversation thread via session/agent attribution headers).
- `thinking` blocks generated AND signed server-side; live-turn
  modification ⇒ 400 and poisoned session; completed-turn thinking
  omittable; `text` blocks NOT signature-verified (terminate-turn with
  synthetic text is protocol-legal). Control = block/delete/regenerate,
  never rewrite; log-copy redaction unconstrained.
- Client request payloads unsigned; bearer/API-key auth; no inbound mTLS
  at vendor edge; no auditor-registration mechanism (gateway invisible to
  vendor; "mutual recognition" exists only on the org-side leg via mTLS).
- Gateway routing via `ANTHROPIC_BASE_URL` vendor-supported; forward
  `anthropic-beta`/`anthropic-version`; `X-Claude-Code-Session-Id`/
  `-Agent-Id`/`-Parent-Agent-Id` headers on all requests.
- Side channels (telemetry, Sentry, updater, feedback) disabled by
  `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`; completeness claims depend
  on suppression + egress denial; re-inventory endpoints every release.
- Consumer subscription OAuth incompatible with gateway routing
  (technical + policy; SECONDARY-sourced — legal verifies primary terms);
  use Console API keys under commercial terms, held at the gateway only.
- OpenTelemetry = metadata only, never payloads — reconciliation
  cross-check, not an audit record.
- Out-of-band surfaces bypass the boundary entirely: vendor cloud
  execution (scheduled agents/remote sessions), server-side tools; local
  flows bypass the gateway: remote MCP, shell egress, web tools, hooks —
  cover via managed policy + egress default-deny, never assume the
  gateway sees them.

## 5. Flow inventory and diagram catalog (invariant patterns)

Enumerate egress flows F-E1…n and ingress F-I1…n with audit-point and
disable columns; the inventory is the denominator of every completeness
claim. Diagram catalog (validated Mermaid): D1 single-iteration anatomy
with generation/signing locus; D2 agentic N-iteration turn with
permission-mode placement; D3 subagent/workflow fan-out threads; D4
gateway rejection/remediation ladder; D5 flows NOT traversing the gateway;
D6 vendor-side state and out-of-band surfaces; D7 cumulative
implementation stack. Plus a pattern summary table (threads, POSTs/turn,
signed-content obligations, audit notes) covering: simple turn, extended
thinking, tool loop, interleaved thinking, subagents, workflows,
compaction, session resume, local/remote MCP, hooks, permission modes,
cloud execution.

## 6. LLM-auditor pattern (invariant)

Dual mode: inline judge (small, constrained verdict grammar, uncertain ⇒
hold, timeout ⇒ gateway holds) + async auditors (large models, whole-thread
review, rule-refinement simulation against a labeled synthetic corpus with
proposals routed through change control, NEVER auto-applied). Deterministic
rules remain the enforcing layer; judge payloads are adversarial input —
structural separation, grammar-constrained decoding, no tools/network/
memory, red-team injection cases in the standing verification corpus.
Assurance comes from the harness, not the model.
