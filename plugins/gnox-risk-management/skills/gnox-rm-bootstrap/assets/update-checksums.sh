#!/usr/bin/env bash
# Document-control utility for the gnox-risk-management set.
#
# For every *.md under the docs root:
#   1. Extract the body following the closing YAML frontmatter delimiter.
#   2. Compute sha256 of that body.
#   3. Rewrite the `checksum_sha256:` frontmatter field in place.
# Then emit manifest.sha256 with whole-file hashes for transfer integrity.
#
# Per RR-004, run this after every content revision, AFTER updating
# version / last_revised / revisions[] in the frontmatter by hand.

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

find "$ROOT" -name '*.md' | sort | while read -r f; do
  # Body = everything after the second '---' delimiter line.
  body_hash=$(awk 'fence==2{print} /^---$/{fence++}' "$f" | sha256sum | cut -d' ' -f1)
  # First occurrence only: the frontmatter field. Documents may legitimately
  # contain example checksum_sha256 lines in their bodies (e.g., RR-004 §2).
  sed -i "0,/^checksum_sha256: /s/^checksum_sha256: .*/checksum_sha256: ${body_hash}/" "$f"
  echo "updated  ${f#"$ROOT"/}  ${body_hash:0:12}…"
done

( cd "$ROOT" && find . -name '*.md' | sort | xargs sha256sum ) > "$ROOT/manifest.sha256"
echo "wrote manifest.sha256"
