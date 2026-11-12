#!/usr/bin/env bash
# reliquary — tooling preflight. Run this BEFORE stating that any required
# tool or privilege is unavailable. It measures; it does not infer from PATH.
#
# Each line is a fact, FACT <name>: <value>. The final VERDICT lines say which
# runbook steps are possible here, with the exact remedy for each that is not.
# Exit 0 when the ledger half can run; exit 2 when it cannot (no node).
set -uo pipefail

PATH="$PATH:/usr/sbin:/sbin"   # zfs userland lives in sbin; users' PATH often omits it
fact() { printf 'FACT %s: %s\n' "$1" "$2"; }

# 1. Node — the ledger and challenge have no other dependency.
#    Under sudo the invoking user's PATH (mise, nvm) is gone; look there too.
NODE_BIN="$(command -v node 2>/dev/null || true)"
if [ -z "$NODE_BIN" ] && [ -n "${SUDO_USER:-}" ]; then
  NODE_BIN="$(sudo -n -u "$SUDO_USER" -i bash -lc 'command -v node' 2>/dev/null || true)"
fi
if [ -n "$NODE_BIN" ]; then
  NODE_OK=1; fact node "$("$NODE_BIN" --version) at $NODE_BIN"
else
  NODE_OK=0; fact node "absent"
fi

# 2. Container and privilege shape.
CONTAINER="$(cat /run/systemd/container 2>/dev/null || systemd-detect-virt -c 2>/dev/null || echo none)"
fact container "$CONTAINER"
UIDMAP="$(awk 'NR==1{print $1"->"$2"/"$3}' /proc/self/uid_map 2>/dev/null)"
if [ "$UIDMAP" = "0->0/4294967295" ] || [ -z "$UIDMAP" ]; then
  fact userns "init (not unprivileged)"; UNPRIV=0
else
  fact userns "unprivileged, uid_map $UIDMAP"; UNPRIV=1
fi
if sudo -n true 2>/dev/null; then SUDO=1; fact sudo "passwordless, ok"; else SUDO=0; fact sudo "not available non-interactively"; fi

# 3. ZFS: kernel, device node, userland — three separate facts.
if grep -qw '^zfs' /proc/modules 2>/dev/null || grep -qw zfs /proc/filesystems 2>/dev/null; then
  KMOD=1; fact zfs_kernel "module live ($(awk '$1=="zfs"{print "refcount "$3}' /proc/modules))"
else
  KMOD=0; fact zfs_kernel "no zfs module in this kernel"
fi
if [ -e /dev/zfs ]; then DEVZFS=1; fact dev_zfs "$(stat -c '%A %U:%G' /dev/zfs)"; else DEVZFS=0; fact dev_zfs "absent"; fi
ROOTFS="$(findmnt -no FSTYPE,SOURCE / 2>/dev/null || df -T / | awk 'NR==2{print $2" "$1}')"
fact rootfs "$ROOTFS"
if command -v zpool >/dev/null 2>&1 && command -v zfs >/dev/null 2>&1; then
  USERLAND=1; fact zfs_userland "$(zfs version 2>/dev/null | head -1 || echo present) at $(command -v zpool)"
else
  USERLAND=0
  CAND="$(apt-cache policy zfsutils-linux 2>/dev/null | awk '/Candidate:/{print $2}')"
  fact zfs_userland "absent${CAND:+ (apt candidate zfsutils-linux $CAND)}"
fi

# 4. Pool-creation privilege: probe it, do not reason about it.
POOL_OK=0; POOL_WHY="not probed"
if [ "$USERLAND" = 1 ] && [ "$DEVZFS" = 1 ]; then
  SU=""; [ "$(id -u)" != 0 ] && [ "$SUDO" = 1 ] && SU="sudo -n"
  TMPD="$(mktemp -d "${TMPDIR:-/tmp}/reliquary-preflight.XXXXXX")"
  truncate -s 64M "$TMPD/probe.img"
  PNAME="reliqprobe$$"
  if ERR="$($SU zpool create -m none "$PNAME" "$TMPD/probe.img" 2>&1)"; then
    POOL_OK=1; POOL_WHY="created and destroyed probe pool $PNAME"
    $SU zpool destroy "$PNAME" >/dev/null 2>&1
  else
    POOL_WHY="zpool create failed: ${ERR:-no message}"
  fi
  $SU rm -rf "$TMPD" 2>/dev/null || rm -rf "$TMPD"
fi
fact pool_create "$([ "$POOL_OK" = 1 ] && echo ok || echo no) — $POOL_WHY"

# 5. Verdict: which runbook steps can run here, and the remedy for each that cannot.
echo
if [ "$NODE_OK" = 1 ]; then
  echo "VERDICT ledger (keygen/genesis/append/verify, challenge.mjs): POSSIBLE"
else
  echo "VERDICT ledger: BLOCKED — install node (mise use node@lts)"
fi
if [ "$POOL_OK" = 1 ]; then
  echo "VERDICT pool (provision-reliquary.sh, seal.sh, verify-seal.sh): POSSIBLE"
elif [ "$KMOD" = 0 ]; then
  echo "VERDICT pool: BLOCKED — host kernel has no zfs module; this host cannot hold the reliquary"
elif [ "$USERLAND" = 0 ]; then
  echo "VERDICT pool: BLOCKED — kernel has zfs but userland is missing; install zfsutils-linux (apt), then re-run preflight"
elif [ "$DEVZFS" = 0 ]; then
  echo "VERDICT pool: BLOCKED — /dev/zfs not delegated into this container; host: lxc config device add <ct> zfs unix-char path=/dev/zfs"
elif [ "$UNPRIV" = 1 ]; then
  echo "VERDICT pool: BLOCKED — unprivileged container cannot zpool create; host must create the pool and delegate it (zfs zone / lxc disk device with zfs.delegate=true), or run the reliquary on the host"
else
  echo "VERDICT pool: BLOCKED — $POOL_WHY"
fi
[ "$NODE_OK" = 1 ] && exit 0 || exit 2
