#!/usr/bin/env bash
# stalker — install the watcher as a systemd service + timer.
# The watcher runs challenge.mjs on a schedule, records the verdict, and never acts.
#
# Usage:
#   install-service.sh --ledger <l.jsonl> --pub <pub.pem> [--contract-module <contract-text.js>]
#                      [--every 5min] [--user]        # --user: per-user units, no sudo
#
# System install (default) writes /etc/systemd/system/stalker-watch.{service,timer} via sudo.
# Intended home: the witness container (see references/witness-container.md), where the
# unit, the plugin and the public key are part of the image whose hash the ledger seals.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EVERY=5min; USERMODE=0; LEDGER=""; PUB=""; CONTRACT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --ledger) LEDGER="$2"; shift 2;; --pub) PUB="$2"; shift 2;;
    --contract-module) CONTRACT="$2"; shift 2;; --every) EVERY="$2"; shift 2;;
    --user) USERMODE=1; shift;; *) echo "unexpected argument: $1"; exit 1;;
  esac
done
[ -n "$LEDGER" ] && [ -n "$PUB" ] || { echo "install-service.sh needs --ledger and --pub"; exit 1; }
NODE="$(command -v node)" || { echo "node not found; run the reliquary preflight"; exit 1; }
STATE="${XDG_STATE_HOME:-$HOME/.local/state}/stalker"
if [ "$USERMODE" = 1 ]; then UNITDIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"; SC="systemctl --user"; SU="";
else UNITDIR=/etc/systemd/system; SC="sudo -n systemctl"; SU="sudo -n"; STATE=/var/lib/stalker; fi
ARGS="--ledger $LEDGER --pub $PUB${CONTRACT:+ --contract-module $CONTRACT}"

$SU mkdir -p "$UNITDIR" "$STATE"
$SU tee "$UNITDIR/stalker-watch.service" >/dev/null <<EOF
[Unit]
Description=stalker: verify the reliquary lifecycle ledger (the watcher reads and reports; it never acts)
After=network.target

[Service]
Type=oneshot
ExecStart=/bin/sh -c '$NODE $HERE/challenge.mjs $ARGS > $STATE/last-verdict.txt 2>&1; rc=\$?; date -u +%%FT%%TZ > $STATE/last-run; echo \$rc > $STATE/last-rc; cat $STATE/last-verdict.txt; exit \$rc'
EOF
$SU tee "$UNITDIR/stalker-watch.timer" >/dev/null <<EOF
[Unit]
Description=stalker: run the boot challenge every $EVERY

[Timer]
OnBootSec=1min
OnUnitActiveSec=$EVERY
Unit=stalker-watch.service

[Install]
WantedBy=timers.target
EOF
$SC daemon-reload
$SC enable --now stalker-watch.timer
$SC start stalker-watch.service || true
echo "installed: $UNITDIR/stalker-watch.{service,timer}, every $EVERY; verdict in $STATE/last-verdict.txt"
$SC list-timers stalker-watch.timer --no-pager | head -3
cat "$STATE/last-verdict.txt" 2>/dev/null | head -3
