---
name: gnox-rm-bootstrap
description: This skill should be used when the user asks to "bootstrap the risk management documentation set", "run gnox-rm-bootstrap", "create the GNOX risk management documents", "set up payload-audit compliance documentation for an AI coding tool", or — against an existing set — asks to "review the risk documents", "revise/extend the documentation set", "audit the controlled documents", "add a stage" (risk-management, QA/QC, engineering, executive), "add a risk scenario" (e.g., print/physical-document egress), "incorporate the approved/final documents", "pin the regulatory/SOP reference corpus" to fix legal and regulatory language against drift, or asks "which methodology version produced this set" (instantiation register / methodology stamp). Wizard-driven on bare invocation; arguments bypass the wizard; routes to maintenance mode when artifacts already exist.
version: 0.7.0
---

# GNOX Risk Management Bootstrap

## Purpose

Single entry point for a controlled risk-management documentation program
covering risk scenarios in the organization's IT / IP space. The
AI-tooling ingress/egress payload-audit case is the **default scenario**;
print/physical-document egress ships as a second; further scenarios are
added as modules without touching this skill. Behaves like an installer: detect state first, then either run the
**Wizard** (no artifacts present — gather the few required inputs, author
the set) or the **Router** (artifacts present — review / revise / extend /
new application / audit / incorporate, always through the versioning
regime). Documents move through a maturity lifecycle — **generic →
proposed → approved → implemented** — and organization-approved "final"
versions are incorporated back into this skill's working knowledge so
future invocations build on them rather than on generic skeletons.

The procedure is invariant; everything shaping artifact form, content, or
function is factored into modules:

| Module | File | Governs |
|---|---|---|
| Compliance profile | `references/profiles/<name>.md` | Obligations, framework families, data/event classes, scales, disclosure posture |
| Risk scenario | `references/scenarios/<name>.md` | The risk subject: system pattern, flows, hazard families, control architecture, characterization, plan substance, diagrams (S1–S7) |
| Stage map | `references/stages.md` | Audience-scoped document modules, dependencies, completion detection |
| Document-set spec | `references/document-set-spec.md` | Per-document section skeletons, cross-reference graph |
| Control architecture | `references/control-architecture.md` | Gateway/CCP model, platform characterization method, flow/diagram catalog |
| Document control | `references/doc-control.md` + `assets/update-checksums.sh` | Frontmatter, checksums, revisions, change triggers |
| Lifecycle & incorporation | `references/lifecycle.md` + `references/incorporated/` | Maturity model, round-trip of approved documents into skill knowledge |
| Corpus control | `references/corpus-control.md` | Pinned regulatory/SOP reference corpus: verbatim-citation discipline, quote verification, drift elimination — the model is never the source of a clause |
| Instantiation | `references/instantiation.md` | Image-manifest semantics: RR-006 layer-resolution register, per-document methodology stamp, build/run custody boundary, upgrade events |
| Source registry | `references/source-registry.md` | Shipped catalog of WHERE authoritative texts are obtained (repositories, APIs, MCP access modes, licensure flags) — registry (upstream, many) vs. register (engagement pin, RR-005); pointers only, perishable, retrieval ≠ authority |

## Invocation

`/gnox-rm-bootstrap [selector ...] [target-directory]`

- **Bare invocation** → state detection → Wizard or Router (the normal,
  installer-like path).
- **Selectors bypass the corresponding prompt** (power-user path): a
  profile name (`default` aliases `us-regulated-default`), a
  `scenario:<id>` selector (default `ai-tooling-payload-audit`), one or
  more `stage:<id>` selectors, or a Router mode (`review`, `revise`,
  `extend`, `audit`, `new`, `incorporate`). Example:
  `/gnox-rm-bootstrap default scenario:print-physical-document-egress
  stage:risk-management`.
- Target directory defaults to `./gnox-risk-management`.

## State detection (always runs first)

1. Resolve the target directory. A controlled set is present when it
   contains `manifest.sha256` or a frontmattered `README.md` with
   `doc_id: IDX-000`.
2. Check `references/incorporated/INDEX.md`: if this organization has
   incorporated approved documents, they are the authoritative starting
   point for any operation on matching doc IDs — generic skeletons are
   used only where no incorporated version exists.
3. **Absent** → Wizard. **Present** → verify integrity (stored body hashes
   vs. recomputed; manifest) before anything else; on mismatch declare a
   document-control nonconformity and route directly to the Audit flow —
   never author or revise on top of a broken chain.
4. Never re-bootstrap over an existing set.

## Wizard (no artifacts exist)

Ask only what defaults cannot answer, one step at a time, defaults first
(the "hit Enter" option). Use the user-question tool where available.

- **W1 Profile:** Default — `us-regulated-default` (recommended) / a listed
  industry profile (enumerate `references/profiles/`) / Custom (accept a
  user-supplied profile file, or gather the Profile Interface fields
  interactively and write the profile file first). Never silently
  substitute a missing profile.
- **W2 Scenario:** Default — `ai-tooling-payload-audit` (recommended) / a
  listed scenario (enumerate `references/scenarios/`; e.g.,
  `print-physical-document-egress`) / Custom (gather the Scenario
  Interface S1–S7 interactively and write the scenario file first). One
  scenario per document set; additional scenarios for the same
  organization are separate sets ("New application") cross-referenced at
  the obligation-matrix level.
- **W3 Scope:** Full set (recommended) or a stage selection (multi-select)
  from `references/stages.md`: `risk-management`, `qa-qc`, `engineering`,
  `executive`. `foundation` is always included. Apply the stage dependency
  rules (forward-reference placeholders + gap notes for absent
  prerequisite stages).
- **W4 Required inputs:** the platform/components under assessment per the
  scenario's S1 pattern (e.g., vendor client + API + model; or print
  fleet + spooler), requesting owner for frontmatter attribution. Everything organizational
  (owners, thresholds, clause refs, data-class mappings) remains `☐` per
  the profile's disclosure posture — never invented, never asked.
- **W5 Reference corpus:** Defer (default — graceful: every regulatory/SOP
  assertion is emitted as a `☐ corpus-gap` citation for later pinning) /
  Supply now (pin full texts into `<target>/corpus/` with hashes) /
  Pin-by-reference (edition + hash + locator scheme for copyrighted or
  confidential sources). Populates RR-005 per `corpus-control.md`; the
  profile's P10 lists expected source types. For Supply/Pin, consult
  `references/source-registry.md` — the shipped catalog of canonical
  repositories per source type (suggest obtainment paths; record
  `source_registry: SR-##` provenance per RR-005 row; discovery aids
  locate but are never pinned from; entries are perishable, re-verify).

Then execute: **(1) Platform characterization** — verify current platform
facts against vendor primary documentation at run time, classifying every
claim by provenance tier (`control-architecture.md` §3–§4; bundled facts
are expiring examples, not truths). **(2) Author selected stages** per
`stages.md` and `document-set-spec.md`, populating scenario-bound
documents from the selected scenario's S1–S7 content and seeding from
incorporated versions where they exist — applying the invariant
engineering rules (last-controllable-point trade study, HACCP CCPs with
measurable limits, flow inventory, two-tier log/vault, validated Mermaid
diagram catalog). Regulatory/SOP language enters ONLY as verbatim
`[CS-##]`-cited quotes from the pinned corpus or as `☐ corpus-gap`
citations — never from model memory (`corpus-control.md`). New
documents are born at maturity **generic** (`status: draft-skeleton`) and
carry the `bootstrapped_by` methodology stamp (`instantiation.md` §4).
**(3) Install document control** (`doc-control.md`; copy the checksum tool
to `<target>/tools/`; run it) **and author RR-006**, the Instantiation
Register recording the full layer resolution with content hashes
(`instantiation.md` §3). **(4) Verify** — recomputed hashes,
manifest, cross-reference resolution, exact-match verification of every
corpus quote against its cited locator, RR-006 layer hashes vs. the module
files actually consumed, stamp↔register consistency, zero invented
organizational specifics. **(5) Report** — document map, verification results, expiring
platform facts, every `☐` left for the organization, the amendment path,
and the maturity ladder ahead (propose → approve → implement →
incorporate).

## Router (artifacts exist)

Inventory present documents by `doc_id`; derive stage completeness
(`stages.md`) and per-document maturity (`lifecycle.md` status mapping);
report state, then ask the need. Before any WRITE mode: compare the
running skill/plugin version against the set's RR-006 record — on
mismatch, declare a **methodology upgrade event** first
(`instantiation.md` §5); never operate silently under a newer version:

- **Review** — read-only: integrity, cross-reference health,
  `☐`-placeholder inventory, change-trigger/expiry status, stage
  completeness, maturity distribution. Change nothing.
- **Revision** — named documents through the revision procedure
  (`doc-control.md`): bump version, append revision record, update
  `authored_by`, regenerate checksums. Revising an `approved`/
  `implemented` document demotes it to `in-review` until re-approved —
  state this to the user before proceeding.
- **Extension** — add missing stages, documents (component dossiers,
  implementation plans), profiles, or profile P8 extensions (e.g., the
  MVP-demo directive). New documents enter at v0.1.0/generic.
- **New application** — a separate set for another tool/vendor/scope:
  re-enter the Wizard with a new target; offer to seed from this
  organization's incorporated documents.
- **Audit** — full verification pass: every stored hash recomputed,
  manifest, revision-record continuity, approver≠author on approved
  documents, maturity-transition evidence present (`lifecycle.md`),
  **quote verification** — every `[CS-##]` citation exact-matched against
  the pinned corpus at its locator (`corpus-control.md`) — RR-005
  integrity and corpus-manifest check, **stamp↔register consistency** —
  every document's `bootstrapped_by` consistent with RR-006 and
  upgrade-event continuity for any mixed stamps (`instantiation.md` §6) —
  due change triggers since
  `established under`. Findings classified per the set's event classes.
- **Incorporate** — the user provides "final" (approved or implemented)
  versions; ingest them into `references/incorporated/` per the procedure
  in `lifecycle.md`, making them this skill's authoritative working
  knowledge for future runs. Corpus sources enter through the same
  controlled-intake discipline: validate, hash, register in RR-005, then
  resolve any now-closable `☐ corpus-gap` citations via Revision. Offer (never force) a sanitized
  generalization pass: divergences between approved finals and the
  generic skeletons become candidate improvements to the portable
  templates — with all organizational content stripped.

When the user's request already names the need, skip the menu and execute.

## Profile Interface (modularity contract)

A profile MUST define: (P1) obligation categories; (P2) framework families
+ applicability-disclosure posture; (P3) data classification superset;
(P4) event classes and clock defaults; (P5) scoring scales and threshold
placeholders; (P6) document series and naming; (P7) disclosure rules
(never baked into body text); (P8) optional extensions. Optional (P9):
stage-map override; (P10) expected corpus source types — types only,
never content or named texts. Adding a jurisdiction or posture = adding a
profile file; this skill file never changes for that.

## Scenario Interface (modularity contract)

A scenario MUST define: (S1) system-under-assessment pattern and boundary;
(S2) data-flow inventory pattern, explicitly naming any flows with NO
technical audit point; (S3) hazard families on the H-0x/1x/2x/3x grouping;
(S4) control architecture mapped onto CCP-1…5, applying the governing
principle — controls at the last point where content exists in
inspectable, controllable form — with honest detective-only scoring where
no such point exists; (S5) platform/component characterization specifics
(provenance tiers, expiring facts marked); (S6) implementation-plan
substance on the RT×CL framework; (S7) diagram catalog. Adding a risk
scenario = adding a scenario file satisfying this contract.

## Additional Resources

- **`references/lifecycle.md`** — maturity model (generic → proposed →
  approved → implemented), transition evidence, incorporation procedure.
- **`references/stages.md`** — stage modules, audiences, dependencies,
  completion detection.
- **`references/profiles/us-regulated-default.md`** — the default profile.
- **`references/scenarios/ai-tooling-payload-audit.md`** — default
  scenario (AI tooling, REST payload audit).
- **`references/scenarios/print-physical-document-egress.md`** — second
  scenario (print fleet, physical + paperless egress).
- **`references/document-set-spec.md`** — document map and skeletons.
- **`references/control-architecture.md`** — invariant engineering core +
  expiring worked platform facts.
- **`references/corpus-control.md`** — pinned reference corpus regime:
  RR-005 register schema, citation discipline, quote verification,
  fail-closed corpus gaps.
- **`references/instantiation.md`** — RR-006 Instantiation Register,
  methodology stamp, layer model, upgrade events.
- **`references/source-registry.md`** — shipped catalog of authoritative-
  text repositories (public/licensed, access modes incl. MCP, pin rules).
- **`references/doc-control.md`** / **`assets/update-checksums.sh`** — the
  versioning regime every mode must respect.
- **`references/incorporated/`** — organization-internal overlay of
  approved finals (created on first incorporation; non-portable).
