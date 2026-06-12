# The Liturgy of Unmaking — rationale, lore mapping, and the gate

## Why destruction needs a ceremony

A trust architecture that ceremonializes creation (hashes, signatures, affirmation
chains, lifecycle entries) but not destruction has a hole exactly the shape of its
worst failure mode: the silent disappearance. An artifact that vanishes without
proof is indistinguishable from a cover-up, even when the removal was legitimate —
*especially* when the removal was legitimate, because the legitimacy is precisely
what got lost with the record.

The prototype case (session 35692717, 2026-06-12): a falsified affirmation
artifact was destroyed at user direction, correctly — but the only reason that
deletion is trustworthy is that it was narrated into the transcript by hand,
with before-and-after listings. That was Mount Doom performed ad hoc. This skill
is that ceremony, formalized.

## The lore mapping (each rule has a reason)

**The thing can only be unmade where it was made.** The Ring could only be
destroyed in the fire where it was forged. Operationally: destruction entries
append to the same ledger that records creations, so the chain holds complete
lifecycles — birth certificate and death certificate in one place. Side-channel
deletion is prohibited because it splits the record.

**The counting rule (Antioch).** "Three shall be the number of the counting."
Destructive ceremonies work only when executed exactly as written — the liturgy
is a confirmation protocol where deviation aborts. The script enforces this:
malformed invocations fail with `FIVE IS RIGHT OUT.` and no mutation occurs.
The model requests; the user's verbatim authorization (`--directed-by`) is the
holy pin; without it the grenade does not arm.

**The amnesiac bearer.** The only being the Ring could not corrupt was the one
with no ambition to carry anything forward. An agent that forgets at session's
end cannot be corrupted by long possession — the chain remembers, the bearer
forgets, and nothing gets ruled or bound in darkness.

**The verse pair** (for repo inscription — README and reliquary respectively):

> *One text to help them all, one hash to find it,*
> *One chain to bring them all, and in the open light — unbind them.*

> *One chain to verify them all, one hash to find them,*
> *One ledger to record them all — and in the daylight bind them.*

Derived by inverting the Ring-verse term by term: forged in secret → authored in
a public repo; binds all without consent → binds the powerful party only, by
affirmation; inscription readable in fire → inscription readable by `sha256sum`,
by anyone, forever; corrupts the keeper → audits the keeper.

## The gate: /mnt/doom as the ingress/egress filter

The mountpoint pun completes into architecture (user's observation, same
session): the mounted dataset is not only where artifacts die — it is the **only
crossing** between host and container. The Black Gate pattern:

- **One watched crossing.** Host and container share exactly one dataset. No
  other file transfer path exists: no network file movement, no secondary
  mounts. Everything that enters or leaves the box passes over `/mnt/doom`,
  or it does not pass.
- **Both sentries watch it.** The man inside audits what appears (ingress —
  leaks from outside land here, visibly). The man outside audits what is
  placed and what departs (egress — leaks from inside land here, visibly).
  The observability-based duty split applies at a single checkpoint instead
  of a diffuse boundary.
- **The storage layer is the customs officer.** ZFS checksums every block
  crossing; snapshots of the gate dataset are flow records — diffable,
  hashable, replayable. `zfs diff` on the gate between snapshots IS the
  transfer log.
- **Filtering by mount semantics.** Read-only grants (contract dataset)
  cross as `readonly=on` — importable knowledge that cannot be altered by
  the receiver. Transfer drops are append-only. Unmaking happens on the gate
  dataset, where both parties can verify the void.

One does not simply walk into the box. There is one gate, it is always watched,
from both sides, by parties who each audit the direction the other cannot see —
and the gate keeps its own records in checksummed blocks.

## The closing of the ceremony

When media permits: `umount /mnt/doom`. The mountain leaves the namespace; the
eagles are the cleanup step; `df -h` shows no doom mounted. The Shire is safe.
