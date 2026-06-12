#!/usr/bin/env bash
# reliquary — re-derive the seal hashes and compare against the ledger.
# HOST-DEPENDENT: requires zfs/zpool. This is the script a stranger runs.
# Import the pool READ-ONLY first: a read-write import writes metadata and
# burns the outer hash even if nobody touches the contract.
#   zpool import -o readonly=on -d <dir> reliquary
set -euo pipefail

POOL="${1:-reliquary}"
EXPECT_STREAM="${2:?expected stream_sha256 required}"
SNAP="${POOL}/contract@sealed"

command -v zfs >/dev/null || { echo "zfs not found"; exit 1; }

ACTUAL_STREAM="$(zfs send "$SNAP" | sha256sum | awk '{print $1}')"

if [ "$ACTUAL_STREAM" = "$EXPECT_STREAM" ]; then
  echo "SEAL VALID: $SNAP stream_sha256 matches ($ACTUAL_STREAM)"
  exit 0
else
  echo "SEAL FAILED: $SNAP"
  echo "  expected: $EXPECT_STREAM"
  echo "  actual:   $ACTUAL_STREAM"
  echo "This is an ex-seal." >&2
  exit 1
fi
