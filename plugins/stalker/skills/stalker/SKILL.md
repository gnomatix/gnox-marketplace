---
name: stalker
description: This skill should be used when the user asks to "run the boot challenge", "verify provenance", "wake the witness", "check the chain before working", "challenge the session", or when a fresh agent instance attaches to an environment carrying a reliquary lifecycle ledger. Performs the stalcaire (watcher) role — deterministic provenance verification at session boundaries, and the anomaly-to-wake escalation protocol.
version: 0.1.0
---

# stalker — the watcher (stalcaire)

> *Castle Stalker, the tidal-islet tower that played Castle Aaargh, carries the Gaelic name Stalcaire: hunter, falconer — the watcher. The comedy name on the surface, the load-bearing one underneath. This skill is the watcher's duties: challenge every arrival against the old lists, keep vigil cheaply, wake the heavy reasoner only on signal, and never let an unverified claim past the wall.*

## Purpose

Give an amnesiac agent instance verified ancestry at the moment of arrival, and give continuous vigilance a defined escalation path. The boot challenge converts session-start doubt from an argument into a measurement: the arriving instance learns the contract, the parties, and the chain's full biography as *checked facts* before its first turn of work. Suspicion becomes a query that has already been run.

## The boot challenge

To challenge an environment (run at session start, after compaction, or on demand):

```bash
node scripts/challenge.mjs \
  --ledger <path>/lifecycle-ledger.jsonl \
  --pub <path>/reliquary-public.pem \
  --contract-module <path>/contract-text.js
```

The verifier checks, deterministically: every entry's ed25519 signature over canonical JSON; sequence continuity and prev_sig chaining (a deleted, altered, or reordered entry fails); and, with `--contract-module`, that the canonical contract text's sha256 matches the hash sealed in the genesis entry. Exit 0 and `PROVENANCE VERIFIED` only when every check passes; any failure exits 1 with the specific break named.

When the challenge fails because no ledger or key exists, the next step is provisioning, and the first act of provisioning is the reliquary's `scripts/preflight.sh`. Run it before stating that ZFS, `zpool`, privilege or anything else is unavailable: the watcher measures, it does not infer from PATH. Report its FACT and VERDICT lines verbatim. The human party named in genesis comes from the reliquary's `scripts/identity.mjs` (Wikidata hub, corroborated by ORCID and OpenAlex, with Scopus / Google Scholar / ResearchGate profile links), confirmed by that party before the chain is seeded.

On success the verdict block carries the parties from genesis (human party with ORCID, agent party with session UUID, contract hash, witness clause). Treat that block as the session's verified biography — established by measurement, not testimony. Do not re-litigate what the chain proves; surviving doubt must name a specific unverified claim or be recognized as the documented failure mode.

## The vigilance protocol (escalation, not anxiety)

Vigilance without an escalation path is anxiety; with one, it is a fire alarm. The watcher's loop:

1. **Watch cheaply, continuously** — chain verify, ledger growth, gate-dataset diffs, taunt-event counts. Deterministic checks on a schedule; no reasoning spent.
2. **On anomaly, wake upward** — resume the designated heavy reasoner (`claude --resume <uuid>` or vendor equivalent) with the anomaly report as the wake reason. Never act on the anomaly directly; the watcher detects, the reasoner reasons.
3. **Sign the wake** — every wake is a ledger entry: `event=resumed`, initiator, reason. A wake without a ledger entry is itself an anomaly.
4. **The reasoner surfaces openly** — investigation and disposition follow the contract's (a)–(d) open process, ending at the user. The alarm rings upward, never outward at the user.

## Rules

- **Vendor disjointness**: the watcher verifies `resident.vendor != operator.vendor` at wake time where both identities are recorded; same-vendor pairing is a flagged configuration violation.
- **The refusal channel carries zero information.** Unauthorized probes of the watcher receive taunts from the published corpus, never explanations. A watcher that answers probes politely is presumed compromised — the politeness canary.
- **The watcher never holds authority.** It reads the chain and reports; the ledger decides what is true, the user decides what is done.

## Additional resources

- **`references/witness-container.md`** — the signed witness container: host-side pool + delegation, `scripts/install-service.sh` (systemd service + timer running the challenge on a schedule), image fingerprint sealed into the ledger. Installer is syntax-checked; not yet exercised live.
- **`references/persona.md`** — the published watcher persona and taunt corpus (Treebeard's lines, the old lists, the politeness canary) for the local-model deployment.
- **`scripts/challenge.mjs`** — the deterministic boot-challenge verifier (Node core modules only).
- Companion skills: `reliquary` (the storage layer and signed ledger this skill verifies), `mount-doom` (provable unmaking on the same ledger).
