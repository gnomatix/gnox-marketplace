# Instantiation Register and Methodology Stamp (RR-006)

Custom-system-image semantics for engagement instantiation: the bootstrap
is a **build**, the delivered set is a **deployed image**, and RR-006 is
the **image manifest**. This module defines the build-time/run-time custody
boundary, the layer-resolution record, the per-document methodology stamp,
and the upgrade-event rules.

## 1. Build vs. run (the custody boundary)

- **Build time** (Wizard execute phases): the consultant/methodology act.
  Modules resolve — kernel procedure + profile + scenario + stage selection
  + corpus state + incorporated overlay — and materialize into a frozen,
  stamped document set. Resolution happens ONCE, at build; never at read.
- **Run time** (the organization's operation): the set evolves under its
  OWN document-control regime (RR-004) and approval ladder, decoupled from
  methodology evolution. A newer plugin version never silently reaches a
  delivered set.
- Divergence from the image is expected and governed: diffing the live set
  against its RR-006 baseline is an audit of accumulated organizational
  change, not an error.

## 2. Layer model

| Layer | Analog | Recorded in RR-006 as |
|---|---|---|
| Kernel procedure | base image | skill name + version, plugin version |
| Substrate | build toolchain | agent + model versions at build |
| Profile | distribution flavor | profile id + file sha256 |
| Scenario | application payload | scenario id + file sha256 |
| Stage selection | **meta-packages** — content-free dependency manifests expanded at build | stage ids + the stage→doc_id expansion actually performed |
| Corpus state | pinned external repos | RR-005 version + `corpus.sha256` manifest hash, or `deferred` |
| Incorporated overlay | site-local layer | `incorporated/INDEX.md` version + hash, or `none` |

Content addressing throughout: every layer row carries the sha256 of the
module file actually consumed (layer digests), making the resolution
reproducible and tamper-evident.

## 3. RR-006 — Instantiation Register (one per set, `foundation` stage)

Sections, in order:

1. **Build record** (immutable): UTC timestamp, requesting owner, target
   directory, substrate versions.
2. **Layer-resolution table** per §2.
3. **Reproducibility statement**: same layers + same pinned corpus ⇒
   structurally equivalent set with byte-identical regulatory language
   (the corpus-control guarantee restated as a build property).
4. **Upgrade-event log**: append-only. Each re-instantiation or write-mode
   operation under a newer methodology version appends an event (date,
   old→new versions per layer, impact-review reference); prior build
   records are never rewritten — superseded by reference only.

RR-006 carries normal RR-004 frontmatter and enters the checksum regime,
but its build-record rows are immutable facts: revisions may only APPEND
upgrade events or correct clerical errors with a revision record.

**The register is normative.** As with RR-005, the register IS the
authoritative statement — here, of what this set is and what produced it.
A register is itself a standard: the controlled enumeration against which
conformity of the thing it describes is judged.

## 4. Per-document methodology stamp (denormalized pointer)

Every produced document's frontmatter carries:

```yaml
bootstrapped_by:
  skill: gnox-rm-bootstrap
  skill_version: "<version at instantiation>"
  register: RR-006
```

The stamp is deliberately minimal — identity plus a pointer; the full layer
resolution lives only in RR-006 (single source of truth, no drift between
copies). Stamps are set at birth and updated ONLY by an upgrade event.

## 5. Upgrade events (re-instantiation rules)

1. Detect: any write mode (Revision, Extension, New application seeding,
   Incorporate-driven revision) compares the running skill/plugin version
   against the set's RR-006 record. Mismatch ⇒ **declare an upgrade event
   before proceeding** — state it to the user, append the RR-006 event,
   run the doc-control change-trigger impact review.
2. Scope: stamp delta defines upgrade scope — documents re-touched under
   the new version get updated stamps; untouched documents keep their
   original stamp (a set may legitimately carry mixed stamps; RR-006's
   event log explains exactly why and when).
3. Never silent: absence of an upgrade event in RR-006 while mixed or
   newer stamps exist in the set is an audit nonconformity.

## 6. Verification obligations

- **Build verify** (Wizard phase 4): every layer hash in RR-006 matches
  the module file consumed; every authored document's stamp is consistent
  with RR-006's identity row.
- **Audit mode**: recompute stamp↔register consistency across the set;
  verify upgrade-event continuity (every stamp version appears in the
  build record or an upgrade event); RR-006 integrity per the standard
  checksum checks.
