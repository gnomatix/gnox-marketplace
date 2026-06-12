# Scenario: print-physical-document-egress (v0.1.0)

A second risk scenario in the organization's IT / IP risk space: networked
printers/MFDs producing tangible documents. Its defining property inverts
the payload-audit case: the final egress leg is **analog** — once a page
leaves the output tray, content passes beyond all technical control and
can walk out of the building with an unknown individual far more easily
than a string can pass an audited gateway. Therefore the governing
principle is the same one that selected the LLM gateway: **place the
control at the last point where the content exists in inspectable,
controllable digital form** — the print pipeline — and pair it with
physical-custody controls for the analog tail.

## S1 — System-under-assessment pattern

Workstation print clients/drivers; print server / spooler (the last
digital point — CCP-1 analog); networked printers/MFDs with onboard
storage, firmware, and vendor maintenance channels; MFD secondary
functions (scan-to-email/USB/cloud, copy, fax); output trays and the
physical space between tray and building exit; badge/release
infrastructure. Vendor device internals out of scope via supplier
qualification (device dossier per the component-dossier pattern — a
printer receives the same assessment discipline as an advanced AI).

## S2 — Data-flow inventory pattern

Egress: F-E1 print jobs workstation→spooler (digital, inspectable); F-E2
spooler→device (digital); F-E3 device→paper (analog conversion — the
boundary crossing); F-E4 physical document→building exit (analog,
uninspectable); F-E5 scan-to-external destinations; F-E6 device storage
retention (latent copies on disk/NVRAM); F-E7 device vendor
telemetry/maintenance channels; F-E8 fax; F-E9 **device-initiated digital
egress** — a modified/implanted device (firmware or hardware) capturing
job content and exfiltrating it over the network or retaining it for
later collection: a "paperless" risk window in which the print
infrastructure egresses content without ever producing paper. Ingress:
F-I1 firmware/driver updates; F-I2 inbound print from external sources.
Two rows dominate the analysis: F-E4 has NO technical audit point (only
custody controls), and F-E9 turns the output device itself into a covert
digital egress node — every completeness claim must address both
explicitly.

## S3 — Hazard families

H-0x content egress: unattended output collected by the wrong person;
sanctioned print walking out (insider or visitor); scan-to-personal
destinations; reprint-from-device-storage; hardcopy of regulated data
without marking/accountability. H-1x integrity/ingress: malicious
firmware, driver compromise, inbound job abuse; **device
tampering/implant creating the paperless window (F-E9)** — every job that
transits the device is exposed regardless of release controls, the analog
of the covert-tunnel hazard in the payload-audit scenario, and likewise
detective-only at the device itself: prevention lives in the network
controls around it. H-2x control-system
failure: spool-audit bypass (direct-IP printing around the print server),
release-system outage failing open, device disk disposal without
sanitization, log integrity. H-3x operational: badge-sharing/tailgating at
release, alert fatigue on content rules, device fleet drift, doc-control
failure.

## S4 — Control architecture

CCP-1 print-management gateway at the spooler: all jobs forced through a
managed queue (direct-IP printing blocked at network layer — the egress
default-deny analog); content-aware inspection of rendered jobs
(deterministic rules + classifier on the accession-table model); preventive
block-and-hold for designated classes; **pull-printing/badge release** so
no page renders until an authenticated person stands at the device (the
buffering/fail-closed analog — release-system down ⇒ jobs hold, never
print). CCP-2 source gates: which applications/repositories may print
designated classes. CCP-3 device hardening: disable scan-to-external/USB
per policy, disable vendor channels not allowlisted, storage encryption +
end-of-life sanitization. CCP-4 fleet enforcement: managed drivers, queue
configuration attestation, network segmentation of devices — and,
against F-E9, **egress default-deny FROM devices**: printers/MFDs may
initiate connections only to the print server and allowlisted vendor
endpoints; any other device-originated traffic is a high-severity alert
(a tampered device cannot exfiltrate through a network that refuses its
connections); firmware integrity/attestation per vendor capability ☐,
honestly scored as partial where the platform offers none. CCP-5
integrity-chained job-audit store (who/what/when/where released, content
flags, page hashes) with the two-tier tokenized-log/vault pattern for
flagged content. Physical tail: custody procedures, marked output,
clean-desk/collection SLAs, visitor controls — documented as
*procedural* controls with honest detective-only scoring (RA-004), since
no gateway exists for paper.

## S5 — Platform characterization

Per-device-model dossier with provenance tiers: T1 vendor documentation
(storage behavior, retention, sanitization procedures, telemetry
endpoints); T2 observed at boundary (network captures of device traffic,
verification that disabled functions are dead); T3 vendor-internal
(firmware internals, disk controller behavior) — attestational only.
Expiry triggers: firmware updates, fleet model changes, print-server
version changes.

## S6 — Implementation-plan substance

RT-1 Observe: forced managed queue + complete job-metadata logging.
RT-2 Detect: content rules on spooled jobs, async flagging/triage.
RT-3 Prevent: inline block-and-hold + pull-printing release, fail-closed.
RT-4 Remediate: hold-with-justification workflows, watermarking/marking,
vault custody of flagged job content, retro-scan of job archives.
Complexity ladder per IP-000: prefer the print-management capabilities the
fleet already has (CL-A configuration) before assembled DLP components
(CL-B) before custom spool filters (CL-C).

## S7 — Diagram catalog

D1 job anatomy (workstation→spool→inspection→release→paper, marking the
analog boundary); D2 release sequence with fail-closed hold; D3 MFD
secondary-function flows (scan/copy/fax); D4 block-and-bounce-back
(justification/revision ladder for held jobs); D5 flows bypassing the
managed queue (direct-IP, USB, fax) and their denial controls; D6
device-side state (storage retention, vendor channels) and the
uninspectable analog tail; D7 cumulative implementation stack.
