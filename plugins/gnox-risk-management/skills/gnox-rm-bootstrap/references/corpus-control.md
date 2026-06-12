# Reference Corpus Control

Removes the model from the authority path for regulatory, standards, and
SOP language. The model may locate, quote, and map; it is NEVER the source
of a clause. The source is a pinned, hashed, edition-stamped corpus; every
regulatory sentence in authored output is reproduced verbatim from it with
a verifiable citation — or emitted as an explicit gap. This eliminates
source/temporal drift (editions pinned like a lockfile) and
model/substrate drift (quoted language is byte-identical regardless of
which model runs the bootstrap, because the words come from the corpus).

## The Corpus Register (controlled document RR-005)

One row per source — QA/QC SOPs, Risk Management SOPs, Incident Reporting
SOPs, Operating Standards, regulatory/legal texts:

| Field | Content |
|---|---|
| `source_id` | `CS-##`, stable, never reused |
| `title` / `type` | name + source type (SOP / standard / regulation / guidance / contract) |
| `edition` | edition, version, or amendment level |
| `effective_date` | the date the pinned text speaks as of |
| `publisher` / `provenance` | issuing body; how/when retrieved |
| `storage_mode` | `full-text` (in the set's corpus store) or `reference+hash` (see below) |
| `locator_scheme` | how citations address it (clause / § / page-line) |
| `content_sha256` | hash of the pinned text artifact |
| `license_note` | redistribution constraints (most standards are copyrighted; SOPs confidential) |
| `status` | `pinned` / `deferred` / `superseded` |

Pinned full-text artifacts live in `<target>/corpus/` with a
`corpus/corpus.sha256` manifest regenerated alongside the document
manifest. The corpus store is organization-internal and non-portable
(same boundary rule as `incorporated/`): the plugin ships the pinning
machinery and never any regulatory text.

**`reference+hash` mode** — for sources that cannot be stored (copyright,
confidentiality): the register pins identity and integrity (edition +
hash + locator scheme + access path ☐) while the text stays in its
authoritative system. Quotes from such sources are limited to short
verbatim excerpts; verification at audit time requires the recorded
access path.

## Citation discipline (authoring rule)

1. **Verbatim or nothing.** Language attributed to a source is quoted
   exactly from the pinned text and cited `[CS-## <locator>]`. No
   paraphrase presented as the source's language; no clause reconstructed
   from model memory, ever — including when the model is "sure."
2. **Synthesis separated.** What the document says *about* a quoted
   obligation (mapping to controls, applicability reasoning) is plainly
   the organization's/author's synthesis, never typographically mingled
   with quoted text. Same separation as provenance tiers T1 vs. T3.
3. **No corpus, no claim (fail-closed).** Where the needed source is
   `deferred` or absent, emit a gap citation —
   `☐ corpus-gap: <obligation summary> [requires CS-?? — <source type>]` —
   never a model-supplied substitute. Bootstrap runs corpus-deferred
   gracefully: the set is complete in structure with every regulatory
   assertion gated behind a gap citation until pinning.

## Quote verification (the drift detector)

At author time and at every Audit: extract each `[CS-##]`-cited quote and
exact-match it against the pinned text at the cited locator. Any mismatch
(drifted, truncated, or fabricated quote) is a document-control
nonconformity — same standing as a checksum failure — classified per the
set's event classes and blocking `approved` status until resolved. This
makes "no drift" an auditable property, not an aspiration.

## Change control

A corpus change (new edition, amended SOP) is never silent: it is an
RR-005 revision (version bump, revision record) and a **change trigger**
— every document citing the affected `CS-##` gets an impact review and,
where quotes changed, a Revision through the standard procedure.
Superseded corpus artifacts are retained per the retention schedule.

## Boundary (stated honestly)

Pinning fixes the *language and identity* of sources completely. It does
not fix *interpretation*: whether an obligation→control mapping is
correct remains the legal/regulatory function's judgment, exercised
through the approver≠author maturity ladder. The guarantee delivered:
words attributed to a source are that source's words at a known edition,
frozen, and re-verifiable by anyone with corpus access.
