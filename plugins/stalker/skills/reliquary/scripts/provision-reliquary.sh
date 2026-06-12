#!/usr/bin/env bash
# reliquary — provision a file-backed ZFS zpool for /mnt/doom.
# HOST-DEPENDENT: requires zfs/zpool and privilege to create pools.
# Run inside the witness container after the `lxd`/ZFS delegation is granted.
set -euo pipefail

POOL="${1:-reliquary}"
IMG="${2:-/castle/${POOL}.img}"
SIZE="${3:-256M}"
MNT="${4:-/mnt/doom}"

command -v zpool >/dev/null || { echo "zpool not found — install ZFS / delegate /dev/zfs into the container"; exit 1; }

# 1. The vdev is an ordinary file — this is what makes the whole pool exportable
#    as one hashable artifact.
mkdir -p "$(dirname "$IMG")"
[ -e "$IMG" ] && { echo "refusing to overwrite existing vdev: $IMG"; exit 1; }
truncate -s "$SIZE" "$IMG"

# 2. Create the pool on the file vdev.
zpool create -m none "$POOL" "$IMG"

# 3. Datasets: contract (read-only scripture), ledger (append-only signed),
#    gate (the single watched ingress/egress crossing).
zfs create -o mountpoint="$MNT"            "$POOL/contract"
zfs create -o mountpoint="$MNT/ledger"     "$POOL/ledger"
zfs create -o mountpoint="$MNT/gate"       "$POOL/gate"

echo "provisioned pool '$POOL' on $IMG, datasets mounted under $MNT"
echo "next: place contract text + ledger genesis, then run seal.sh"
