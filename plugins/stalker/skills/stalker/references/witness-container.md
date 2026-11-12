# The witness container — where the watcher runs as a service

The watcher is meant to run inside a signed container: an LXD instance whose image
carries the plugin, the public key and the systemd units, and whose image hash is
recorded in the ledger. The reliquary pool is created on the host and delegated in,
so the container never needs pool-creation privilege.

## Host side (needs zpool privilege; run where the reliquary preflight says `pool: POSSIBLE`)

```bash
# 1. The file-backed pool (scripts/provision-reliquary.sh does this where it can run)
truncate -s 256M /castle/reliquary.img
zpool create -m none reliquary /castle/reliquary.img
zfs create -o mountpoint=none reliquary/root

# 2. The witness container, with /dev/zfs and the dataset delegated (ZFS 2.2+, LXD 5.x)
lxc launch ubuntu:24.04 witness
lxc config device add witness zfs unix-char path=/dev/zfs
lxc config device add witness reliquary disk source=reliquary/root path=/mnt/doom zfs.delegate=true
```

Inside the container the delegated dataset is an ordinary ZFS filesystem: `zfs create`,
`snapshot`, `hold`, `readonly=on`, `send` all work under `reliquary/root`, and the
contract / ledger / gate datasets are created there with `provision-reliquary.sh`'s
layout (mountpoints `/mnt/doom`, `/mnt/doom/ledger`, `/mnt/doom/gate`).

## Inside the witness

```bash
# plugin + public key are in the image; private key is NOT (it stays with the signer)
scripts/install-service.sh --ledger /mnt/doom/ledger/lifecycle-ledger.jsonl \
  --pub /mnt/doom/reliquary-public.pem --contract-module /mnt/doom/contract-text.js --every 5min
```

`stalker-watch.timer` runs `challenge.mjs` on the schedule; the verdict lands in
`/var/lib/stalker/last-verdict.txt` with `last-rc` and `last-run`. A non-zero `last-rc`
is the anomaly that wakes the heavy reasoner (SKILL.md, vigilance protocol step 2). The
watcher itself never appends to the ledger and never acts.

## Signing the container

```bash
lxc publish witness --alias witness-sealed            # image fingerprint = sha256 of the tarball
lxc image info witness-sealed | grep Fingerprint
node ledger.mjs append --ledger ... --key ... --event sealed --field witness_image_sha256=<fingerprint>
```

The fingerprint goes into the ledger as a `sealed` event, so the chain names the exact
image the watcher runs in, and `lxc image export` reproduces the tarball for a stranger
to hash.

## Where this was measured (2026-11-12, gemini-exec-host)

An unprivileged LXD container with `/dev/zfs` delegated and the `lxd` group granted can
reach the LXD socket (`lxc list` answers) and run the zfs userland, but cannot
`zpool create` (user namespace, no CAP_SYS_ADMIN in the init namespace). Hence the split
above: pool on the host, delegation into the witness.
