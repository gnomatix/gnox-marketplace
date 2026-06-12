#!/usr/bin/env bash
# reliquary — seal the contract dataset: snapshot, hold, readonly, dual hashes.
# HOST-DEPENDENT: requires zfs/zpool. Emits the two grave-marker hashes the
# ledger records and any stranger re-derives.
set -euo pipefail

POOL="${1:-reliquary}"
DATASET="${POOL}/contract"
SNAP="${DATASET}@sealed"
MNT="${2:-/mnt/doom}"

command -v zfs >/dev/null || { echo "zfs not found"; exit 1; }

# 1. Freeze content: snapshot, hold (so even root must explicitly release before
#    destroy), and flip the live dataset read-only.
zfs snapshot "$SNAP"
zfs hold reliquary-sealed "$SNAP"
zfs set readonly=on "$DATASET"

# 2. Stream hash — proves the dataset bytes. Record the exact send flags and
#    ZFS version alongside, since stream format can drift across versions.
#    sha256, never md5 (md5 has practical chosen-prefix collisions).
ZFS_VERSION="$(zfs version 2>/dev/null | head -1 || echo unknown)"
STREAM_SHA="$(zfs send "$SNAP" | sha256sum | awk '{print $1}')"

# 3. Content hash — survives any future stream-format drift. Hash file contents
#    in sorted order so the digest is reproducible.
CONTENT_SHA="$(cd "$MNT" && find . -type f -print0 | sort -z | xargs -0 sha256sum | sha256sum | awk '{print $1}')"

echo "SEALED: $SNAP"
echo "  zfs_version:  $ZFS_VERSION"
echo "  send_flags:   (none — plain non-raw, non-large-block stream)"
echo "  stream_sha256:  $STREAM_SHA"
echo "  content_sha256: $CONTENT_SHA"
echo
echo "record both hashes + zfs_version + send_flags in the ledger via:"
echo "  node ledger.mjs append --ledger $MNT/ledger/lifecycle.jsonl --key <priv.pem> \\"
echo "    --event sealed --field stream_sha256=$STREAM_SHA --field content_sha256=$CONTENT_SHA \\"
echo "    --field zfs_version=\"$ZFS_VERSION\" --field send_flags=none"
