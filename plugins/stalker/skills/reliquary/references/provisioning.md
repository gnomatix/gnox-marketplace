# Reliquary provisioning — storage-layer detail

## The vdev is a file, on purpose

A file-backed zpool (`truncate -s <size> contract.img && zpool create <pool> <path>`)
is what makes the entire trust apparatus a single content-addressed object. The
pool's whole state — code surface, ledger, sealed contract — lives inside one
file; one sha256 covers all of it. LXD/ZFS share the host kernel, so a container
needs `/dev/zfs` passed through or a dataset delegation (`security.delegate` /
`zfs zone` on ZFS 2.2+) — one `lxc config device add` at build time.

## Dataset layout

| Dataset            | Integrity model     | Mount            | Purpose                                  |
|--------------------|---------------------|------------------|------------------------------------------|
| `<pool>/contract`  | unchanged (sealed)  | `/mnt/doom`      | contract text, UUID-inked scripture      |
| `<pool>/ledger`    | every change signed | `/mnt/doom/ledger` | ed25519 lifecycle chain                 |
| `<pool>/gate`      | flow-recorded       | `/mnt/doom/gate` | single ingress/egress crossing           |

## The nested seal (matryoshka)

Every layer is independently sealed, every doll a seal:

```
contract (UUID inked in)
  └─ read-only dataset snapshot (zfs hold, immutable)
       └─ zpool (block checksums on every read)
            └─ one vdev file
                 └─ container image
                      └─ tarball, one sha256
```

The outer tarball hash transitively pins the vdev file byte-for-byte; the vdev
determines the dataset; the dataset contains the scripture. Two independent
verification paths: check the outer seal (`sha256sum` the tarball) without
knowing ZFS exists, OR extract `contract.img`, `zpool import -d . <pool>` on any
machine with ZFS, and reproduce the inner stream hash. Both roads end at the same
published numbers.

## Read-only-import discipline

After sealing, the pool is opened only `zpool import -o readonly=on`. A
read-write import writes transaction-group and hostid metadata and burns the
outer hash even if the contract is untouched. Graceful failure: if a rw import
happens anyway, the **inner** stream hash survives — the snapshot is immutable,
`zfs send` still reproduces the ledger's number, and the contract remains
provable. Layers fail independently, outermost first, scripture last.

## Why sha256, not md5

MD5 has had practical chosen-prefix collisions for two decades: an adversary can
construct two different streams with the same MD5. An unfalsifiable-contract
pipeline cannot tolerate that. Everything in this architecture is sha256.

## Continuous self-audit

`zpool scrub <pool>` verifies every block's checksum — bit rot, media decay, and
silent corruption are detected by the storage layer itself, on demand, forever.
The contract does not merely sit sealed; it is continuously self-auditing at rest.

## The offline stranger-verification path

A sealed instance export is a self-contained evidentiary unit: contract,
affirmation chain, violation logs, lifecycle records, AND the machinery that
verifies them, frozen under one published hash. A reviewer needs only
`sha256sum`, `zpool`/`zfs`, and the published numbers + public key — no access to
the originating host, no trust in operator testimony. Import the pool read-only,
run `verify-seal.sh` and `ledger.mjs verify`, and every claim checks out or it
does not. Independently reproducible, fully offline.
