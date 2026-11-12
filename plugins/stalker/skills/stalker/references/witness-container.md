# The witness container — where the watcher runs as a service

The watcher is meant to run inside a signed container: an LXD instance whose image
carries the plugin, the public key and the systemd units, and whose image hash is
recorded in the ledger. The reliquary pool is created on the host and delegated in,
so the container never needs pool-creation privilege.

## Host side (needs LXD storage privilege on the host; the witness itself needs none)

Measured on LXD 6.10.1: `zfs.delegate` is a property of the storage **volume**. Setting it
on the disk device is rejected as an invalid option.

```bash
# 1. A custom volume on a ZFS-backed LXD pool, delegated
lxc storage volume create <pool> reliquary size=256MiB zfs.delegate=true

# 2. The witness container, with /dev/zfs and the volume attached
lxc launch ubuntu:24.04 witness
lxc config device add witness zfs unix-char path=/dev/zfs
lxc config device add witness reliquary disk pool=<pool> source=reliquary path=/mnt/doom
```

Where the host operator can `zpool create`, a dedicated file-backed pool
(`scripts/provision-reliquary.sh`) is the stronger form; delegate its root dataset the
same way. Inside the witness, run the reliquary preflight: it reports
`VERDICT pool: DELEGATED` with the dataset name when the delegation works.

Inside the container the delegated dataset is an ordinary ZFS filesystem: `zfs create`,
`snapshot`, `hold`, `readonly=on`, `send` all work under the delegated dataset
(`<pool>/lxd/custom/default_reliquary` on the measured host), and the
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

## Where this was measured (2026-11-12, gemini-exec-host and the witness on srv)

An unprivileged LXD container with `/dev/zfs` delegated and the `lxd` group granted can
reach the LXD socket (`lxc list` answers) and run the zfs userland, but cannot
`zpool create` (user namespace, no CAP_SYS_ADMIN in the init namespace). Hence the split
above: pool on the host, delegation into the witness.

The witness built this way on srv holds child datasets `ledger` and `gate` under the delegated
volume, mounted at `/mnt/doom/ledger` and `/mnt/doom/gate`. DHCP there hands out a resolver that
does not answer; `/etc/netplan/60-witness-dns.yaml` pins the working one. The watcher itself
needs no network.
