---
name: reliquary
description: This skill should be used when the user asks to "make /mnt/doom real", "provision the reliquary", "seal the contract dataset", "create the immovable mount of trust", "set up the signed lifecycle ledger", "verify the seal", "stand up the ZFS trust storage", or otherwise build the tamper-evident storage layer that houses a contract, its affirmation chain, and registries on read-only ZFS media with an ed25519-signed append-only ledger.
version: 0.1.0
---

# Reliquary — the immovable mount of trust

> *Creation gets a chain; destruction gets the mount-doom ceremony. The reliquary is where both live: a file-backed ZFS pool whose contract dataset is sealed read-only, whose lifecycle is an ed25519-signed append-only ledger, and whose whole self exports as one hashable artifact. Tamper-proof against everything short of root, tamper-evident against root itself, verifiable by strangers forever. Nothing in it asks to be believed; everything offers to be checked.*

## Purpose

Provide the storage substrate for `/mnt/doom`: the place where a contract, its affirmation/re-affirmation chain, violation ledgers, and pinned registries live on media that physics — not policy — keeps honest. The schema-drift and divergent-copy failure classes that plague mutable, plural records become unconstructable, because the record is singular, append-only, and signed.

## Architecture (deterministic core, two integrity models)

- **The image / code surface** — immutable, hash-verified. The pool's vdev is an ordinary file, so the entire pool exports as one tarball whose sha256 is its fingerprint.
- **The contract dataset** — sealed: snapshot + `zfs hold` + `readonly=on`. Its integrity model is "unchanged."
- **The ledger dataset** — append-only, ed25519-chained. Its integrity model is not "unchanged" but "every change accounted for": each entry signs over its predecessor's signature, so deletion, insertion, or reordering all fail verification.
- **The gate dataset** — the single watched ingress/egress crossing between host and witness container (see [[mount-doom]] liturgy).

## How to use

### Preflight first (measure, never infer)

```bash
scripts/preflight.sh
```

Run this before saying any tool or privilege is missing. A `zpool` absent from PATH is not "no ZFS on this host": the kernel module, `/dev/zfs`, the userland package, the container's user namespace and pool-creation privilege are five separate facts, and the script measures each (it probes `zpool create` on a scratch file rather than reasoning about it). Its VERDICT lines say which runbook steps can run here and the exact remedy for each that cannot. Quote those lines; do not paraphrase them into a blocker.

### Provision (host-dependent — needs ZFS + privilege)

```bash
scripts/provision-reliquary.sh <pool> <vdev-img-path> <size> <mountpoint>
# e.g. scripts/provision-reliquary.sh reliquary /castle/reliquary.img 256M /mnt/doom
```

Creates the file-backed pool and the contract/ledger/gate datasets. Requires `zfs`/`zpool` and pool-creation privilege — inside the witness container after the `lxd` group grant and `/dev/zfs` delegation. The script refuses to overwrite an existing vdev.

### Seed the ledger (works anywhere Node runs)

The signed ledger is the deterministic core and has **no ZFS dependency** — it is fully usable today.

```bash
# One-time keypair. Private key written 0600; it NEVER enters the ledger.
node scripts/ledger.mjs keygen --key <priv.pem> --pub <pub.pem>

# Genesis entry binds the contract hash and session UUID into the chain root.
node scripts/ledger.mjs genesis --ledger <l.jsonl> --key <priv.pem> \
  --field contract_sha256=<hash> --field session_uuid=<uuid>

# Append lifecycle events: affirmed, re_affirmed, sealed, suspended, resumed,
# compacted, unmade. Each carries arbitrary --field k=v payload.
node scripts/ledger.mjs append --ledger <l.jsonl> --key <priv.pem> \
  --event affirmed --field user_response=affirmed
```

### Seal the contract dataset (host-dependent)

```bash
scripts/seal.sh <pool> <mountpoint>
```

Snapshots, holds, flips read-only, and emits **two** hashes: the `zfs send` stream hash (with ZFS version + send flags recorded, since stream format drifts across versions) and a file-content hash as drift insurance. Record both in the ledger via an `append --event sealed`. Hashes are sha256 — never md5 (chosen-prefix collisions make md5 unfit for an unfalsifiable record).

### Verify (host-dependent — the script a stranger runs)

```bash
zpool import -o readonly=on -d <dir> <pool>   # read-only ALWAYS: rw import burns the hash
scripts/verify-seal.sh <pool> <expected-stream-sha256>
node scripts/ledger.mjs verify --ledger <l.jsonl> --pub <pub.pem>
```

`verify-seal.sh` re-derives the stream hash; `ledger.mjs verify` walks the signature chain. Either failing means the record was altered.

## Rules

- **Read-only imports only after sealing.** A read-write import writes pool metadata and burns the outer hash even with the contract untouched. If it happens anyway, the inner stream hash still verifies — the layers fail independently, outermost first, scripture last.
- **The signing key never enters the reliquary.** The ledger is public-verifiable with the public key alone. A valid signature proves the record entered through the signing pathway and is unaltered — it does not prove which model authored it; that binding rests on the signing pathway's position in the pipeline (sign at event time, shrink the custody window to nothing).
- **The ledger is not self-referential.** Never unmake the record of unmaking. Destruction events are recorded *in* the ledger (see [[mount-doom]]); the ledger itself is never the target.

## Status in this environment

The Node ledger (`ledger.mjs`) is fully functional and tested here: keygen, genesis, chained append, verify, and tamper detection (altered payload → signature-invalid failure). The ZFS runbooks are syntax-valid but **cannot run until a host with ZFS and pool privilege is available** — they are blocked wherever `zpool` is absent or the `lxd`/`/dev/zfs` delegation has not been granted.

## Additional resources

- **`references/provisioning.md`** — full storage-layer detail: vdev sizing, dataset layout, the nested-seal (matryoshka) export model, read-only-import discipline, and the offline stranger-verification path.
- **`scripts/ledger.mjs`** — ed25519 signed append-only ledger (Node core modules only).
- **`scripts/provision-reliquary.sh`**, **`scripts/seal.sh`**, **`scripts/verify-seal.sh`** — ZFS runbooks (host-dependent).
- Cross-reference: **[[mount-doom]]** — the provable-unmaking ceremony that records destruction into this ledger.
