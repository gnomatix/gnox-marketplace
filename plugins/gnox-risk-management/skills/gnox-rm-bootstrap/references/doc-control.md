# Document Control Regime

Apply to every document in the produced set. Enforced by
`assets/update-checksums.sh` (copy into `<target>/tools/`).

## Frontmatter (every document)

```yaml
---
doc_id: <stable ID, never reused>
title: "..."
version: <semver>            # MAJOR meaning-changes-requiring-reapproval /
                             # MINOR additions / PATCH editorial
status: draft-skeleton | draft | in-review | approved | implemented | superseded
                             # maturity mapping per references/lifecycle.md:
                             # generic → proposed → approved → implemented
classification: internal
created: <UTC ISO-8601>
last_revised: <UTC ISO-8601>
checksum_sha256: <sha256 of body AFTER closing frontmatter delimiter>
checksum_scope: body-after-frontmatter
authored_by:                 # agent AND substrate at time of LAST revision
  agent: "<tool name>"
  agent_version: "<tool version>"
  model: "<model/substrate id>"
  requested_by: "<human owner>"
revisions:                   # PRIOR revisions, newest first
  - version: <outgoing semver>
    last_revised: <its timestamp>
    checksum_sha256: <its body hash>
    summary: <one line>
bootstrapped_by:             # methodology stamp (references/instantiation.md §4)
  skill: gnox-rm-bootstrap   # identity + pointer only; full layer
  skill_version: "<at instantiation>"  # resolution lives in RR-006
  register: RR-006
---
```

The body hash cannot cover the frontmatter (self-reference); whole-file
hashes live in `manifest.sha256` for transfer integrity. The tool updates
only the FIRST `checksum_sha256:` line per file, so example checksum lines
may appear in bodies.

## Revision procedure

1. Edit body. 2. Append outgoing `{version, last_revised, checksum, summary}`
to `revisions[]`; bump `version`; update `last_revised` and `authored_by`
with the agent/model actually used. 3. Run the checksum tool. 4. Route per
status workflow; approver ≠ author. 5. Never overwrite superseded versions
in the controlled store.

**Nonconformity:** body hash mismatching frontmatter, or manifest mismatch
⇒ document-control nonconformity; investigate before further use.

## Change triggers forcing re-assessment (not mere edits)

Client/tool version change; model/substrate change; gateway or rule-set
change; vendor endpoint/protocol/terms change; new tool capabilities
enabled (MCP servers, web tooling); organizational scope change;
**reference-corpus change** (new edition/amendment of any pinned CS-##
source — RR-005 revision, impact review of every citing document, quote
re-verification, per `corpus-control.md`); **methodology upgrade**
(any write-mode operation or re-instantiation under a newer
skill/plugin/profile/scenario version than the set's RR-006 records —
RR-006 upgrade event appended + impact review, per `instantiation.md` §5).
Each requires impact review against the platform characterization document
and a verification regression BEFORE fleet rollout.
