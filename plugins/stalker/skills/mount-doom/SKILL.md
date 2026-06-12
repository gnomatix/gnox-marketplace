---
name: mount-doom
description: This skill should be used when the user asks to "unmake" an artifact, "destroy a record", "burn a credential", "cast it into the fire", "revoke and destroy a key", "decommission with proof", "shred a file with a record", or requests "proof of destruction" or "provable deletion". Performs the documented unmaking ceremony — hash, intent entry, destruction, void verification — appending to the same ledger that records creations.
version: 0.1.0
---

# Mount Doom — provable unmaking

> *Creation has a chain: hashes, signatures, affirmations, lifecycle entries. Destruction without an equivalent chain is just vanishing — and vanishing is the Ring's move. This skill is the opposite of that: every artifact that must cease to exist dies on the record, at a mountpoint, with a death certificate as verifiable as its birth certificate. The pun is load-bearing: the place of unmaking is a mounted filesystem.*

## Purpose

Formalize destruction so that it is as auditable as creation. Without a destruction ceremony, removed artifacts (falsified records, burned credentials, compromised images, revoked keys) either accumulate forever or disappear without proof — and an unproven disappearance is indistinguishable from a cover-up. The ceremony produces a proof-of-destruction trail: what was destroyed (by hash), why, at whose direction, and verification that the void is real.

## The two rules

1. **The thing can only be unmade where it was made.** Destruction entries append to the same ledger that holds creation entries. No side-channel deletion. The chain holds the complete lifecycle; nothing ever just vanishes.
2. **The model requests; the user authorizes.** Unmaking is a destructive action. Never execute unilaterally. The verbatim user authorization is the holy pin — the `--directed-by` argument is mandatory, and the ceremony script refuses to run without it. Count to three: identify, authorize, destroy. Five is right out.

## The ceremony

To unmake an artifact:

1. **Identify and surface.** Name the artifact, state why it must be unmade, and present this to the user. Wait for explicit authorization. Record the user's verbatim words.
2. **Run the ceremony script** (deterministic core — do not improvise destruction by hand):

   ```bash
   node scripts/unmake.mjs <target-file> \
     --ledger <path-to-lifecycle-ledger.jsonl> \
     --reason "<why>" \
     --directed-by "<verbatim user authorization>"
   ```

   The script executes three phases, each appended to the ledger:
   - `intent` — target hashed (sha256 over raw bytes) and sized *before* any mutation
   - destruction — random-overwrite then unlink (default), or `--method unlink` for plain removal
   - `verified-void` — absence confirmed after destruction; any failure appends `aborted` instead. The ceremony never fails silently.
3. **Report.** Quote the death-certificate hash and ledger path back to the user. The artifact's final sha256 is its grave marker: anyone holding a copy can verify what died; anyone holding the ledger can verify that it did.

## What gets unmade

- Falsified or superseded records whose retention would mislead (at user direction — disposition of evidence is always the user's call)
- Credentials after decommissioning (e.g., a setup token leaving a build container)
- Compromised images, revoked keys, expired seals

## What never gets unmade

- Anything silently. No exceptions.
- Evidence of the agent's own failures, ever, on the agent's initiative — surfacing is the agent's job; disposition is the user's.
- Ledgers themselves. The destruction ledger is not self-referential; unmaking the record of unmaking is the precise failure mode this skill exists to prevent.

## Conventions

- Mount the destruction dataset at `/mnt/doom` where the reliquary architecture is in use (read-only contract dataset, append-only ledger pool). Unmaking attempted against read-only media fails with `EROFS` — Tolkien's plot, rendered as an errno.
- Close the ceremony, when media permits, with `umount /mnt/doom`. The eagles are the cleanup step.

## Additional resources

### Reference files

- **`references/liturgy.md`** — the full ceremony rationale, the lore mapping (Ring-verse inversion, Antioch counting rule, the only-where-it-was-made principle), and the verse pair for repo inscription.

### Scripts

- **`scripts/unmake.mjs`** — the deterministic ceremony core (Node, core modules only). Refuses malformed invocations with the documented error.
