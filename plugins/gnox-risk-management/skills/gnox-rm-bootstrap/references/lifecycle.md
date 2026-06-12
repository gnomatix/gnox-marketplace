# Document Maturity Lifecycle and Incorporation

## Maturity model

| Maturity | Frontmatter `status` | Meaning | Advanced by |
|---|---|---|---|
| **Generic** | `draft-skeleton` | Skill-authored skeleton: invariant structure + profile content, all organizational decisions `☐` | the skill (Wizard/Extension) |
| **Proposed** | `draft` → `in-review` | Organization has populated `☐` fields / adapted content; routed for internal review | document owner |
| **Approved** | `approved` | Signed by the designated approver (approver ≠ author, recorded in frontmatter/revision record) | approving authority |
| **Implemented** | `implemented` | The controls/procedures the document specifies are deployed and verified — frontmatter carries `implementation_evidence:` refs (IQ/OQ records, attestation reports, verification runs) | implementing function + verifier |
| (Retired) | `superseded` | Replaced; retained per retention schedule | document control |

Transition evidence is auditable: each maturity advance is a revision
(version bump + revision record) whose `summary` names the transition and
whose record carries the approver/verifier. The Audit flow checks
transition evidence continuity. Revising an `approved`/`implemented`
document demotes it to `in-review` until re-approved — the skill states
this before executing any such revision.

## Incorporation (Router mode `incorporate`)

Purpose: round-trip. The skill ships generic knowledge; the organization
produces approved finals; incorporation makes those finals the skill's
authoritative working knowledge for that organization, so every future
review/revision/extension/new-application starts from reality instead of
from skeletons.

Procedure:

1. **Identify inputs.** The user names final documents (or a whole set).
   Accept only documents bearing the set's frontmatter regime.
2. **Validate before ingest.** Frontmatter complete; `status:` is
   `approved` or `implemented`; body checksum verifies (recompute); the
   revision chain shows the approval transition with approver recorded.
   Reject (with reasons) anything failing validation — incorporation is a
   controlled intake, not a copy.
3. **Ingest verbatim** into `references/incorporated/<set-id>/<doc-file>`
   (set-id = target-directory basename or user-named identifier), and
   append a row to `references/incorporated/INDEX.md`:
   `| doc_id | version | status | source path | ingest date | body sha256 |`.
   Never modify the ingested content.
4. **Mark the boundary.** `incorporated/` is organization-internal: it may
   contain populated organizational decisions. The INDEX header states:
   *"Non-portable. Exclude this directory when sharing or republishing the
   plugin."* The generic plugin remains shareable; the overlay does not.
5. **Activate.** From ingestion onward, state detection prefers
   incorporated versions: revisions start from them; new applications
   offer them as seeds; reviews diff live sets against them; generic
   skeletons apply only to doc IDs with no incorporated version.
6. **Offer generalization (optional, user-approved, sanitized).** Diff
   each approved final against its generic skeleton. Structural
   improvements (better section shapes, missing considerations, clearer
   limits) are candidates for the portable templates
   (`document-set-spec.md`, profiles) — proposed as plugin revisions with
   ALL organizational content stripped (no clause refs, owners,
   thresholds, mappings, or any populated `☐`). Decline-by-default if any
   doubt about sanitization exists. Organizational substance never enters
   portable files.

## Conflict rule

If an incorporated version and a live target-set version of the same
doc_id diverge, report the divergence (versions, dates, checksums) and ask
which is authoritative — never silently overwrite in either direction. The
expected resolution is a Revision in the live set followed by re-approval
and re-incorporation.
