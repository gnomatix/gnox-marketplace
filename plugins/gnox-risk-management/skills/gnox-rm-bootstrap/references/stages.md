# Stage Modules

Audience-scoped, independently invokable slices of the document set.
Default mapping below (a profile may override via optional P9). Document
IDs refer to the default series (profile P6).

| Stage id | Audience | Documents |
|---|---|---|
| `foundation` | (always included) | IDX-000 README, `tools/update-checksums.sh`, document-control conventions, RR-005 Reference Corpus Register (shell — populated at W5 or by later controlled intake), RR-006 Instantiation Register (authored at build: layer resolution, methodology stamp record, upgrade-event log) |
| `risk-management` | Risk Management team | RA-001, RA-002, RA-003, RA-004, RA-005, RA-006, RM-001, RM-004 |
| `qa-qc` | QA/QC | RM-002, RR-001, RR-002, RR-003, RR-004 |
| `engineering` | IT / Engineering | RM-003, IP-000, IP-100, IP-200, IP-300, IP-400, IP-500, ES-002 |
| `executive` | C-Suite | ES-001 |

## Dependency rules

Recommended order: `foundation` → `risk-management` → `qa-qc` →
`engineering` → `executive`.

- `qa-qc` depends on `risk-management`: the CCP plan (RM-002) controls
  hazards (RA-003) and the audit-record spec (RR-001) cites flows (RA-002).
- `engineering` depends on `risk-management` and `qa-qc`: RM-003 implements
  RM-002's CCPs; IP plans cite both.
- `executive` cites RA-004 §5, RM-001's decision record, and RM-004.
- RR-004 (controlled document-control procedure) is authored with `qa-qc`,
  but the *regime itself* (frontmatter + checksum tool + conventions in
  IDX-000) is installed by `foundation` regardless — if `foundation` exists
  without `qa-qc`, IDX-000 carries a gap note pointing at the pending
  RR-004.

**Forward-reference rule:** when a selected stage cites a document in an
absent stage, author the citation as `→ <DOC-ID> (pending — stage <id> not
yet authored)`, record the gap in an IDX-000 "stage gaps" list, and tell
the user which stage closes it. Never fail the run, never inline-duplicate
the missing content.

## Completion detection

A stage is complete when every document ID in its row exists in the target
with valid frontmatter and a verifying checksum. Partial stages are
reported as such (present/missing IDs). Detection is by `doc_id`, never by
filename.

## Stage-wise revision

Re-invoking a stage that is already complete is a Router **Revision** or
**Extension** operation on that stage's documents — versioning regime
applies; a stage is never silently re-authored from scratch.
