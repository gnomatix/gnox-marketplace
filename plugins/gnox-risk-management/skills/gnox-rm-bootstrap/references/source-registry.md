# Source Registry — Authoritative-Text Repositories (shipped catalog)

**Registry vs. register (normative vocabulary):** a **registry** is the
upstream catalog of *where authoritative sources can be obtained* — many,
global, discovery-oriented (apt `sources.list`, a package registry). A
**register** is the engagement's controlled enumeration of *what was
actually pinned* — local, frozen, normative (RR-005/RR-006, the `dpkg`
database). This file is the plugin's shipped registry; it feeds the
engagement's registers and never substitutes for them.

## Ground rules (binding)

1. **Pointers only.** The plugin ships locators, never texts. Pinned
   content is always organization-side (`corpus-control.md` storage rules).
2. **Retrieval ≠ authority.** A registry entry says where a text lives,
   not that it applies. Applicability and edition selection remain the
   organization's regulatory-function judgment; everything retrieved
   passes through the standard controlled intake (validate → hash →
   RR-005 row) regardless of channel.
3. **Entries are perishable facts** (URLs, APIs, MCP availability) —
   provenance-tier treatment: re-verify at use; never assume a locator
   from this file is current.
4. **Role separation:** `primary-source` entries are canonical
   repositories whose texts may be pinned. `discovery-aid` entries help
   *locate or research* (search engines, legal-research services, MCP
   research servers) — they NEVER feed RR-005 directly; the pin always
   comes from the canonical repository.
5. **Licensure honesty:** licensed/closed sources (ISO-class, CAP-class)
   are flagged `licensed`; they pin via `reference+hash` mode unless the
   organization's license permits internal full-text copies (legal review
   ☐). Public-domain sources may pin full-text.
6. RR-005 rows record the registry entry used: `source_registry: SR-##`
   (provenance of the pin itself).

## Entry schema

`SR-## | name | authority type | jurisdiction | content categories (→ profile
P10 types) | role | access modes (web / API / MCP) | licensure | pin mode`

## Registry — US-regulated default profile orientation

### Federal regulatory text (primary sources, public domain)

| ID | Source | Covers (P10 mapping) | Access | Licensure / pin |
|---|---|---|---|---|
| SR-01 | eCFR — ecfr.gov | Current CFR text: privacy/security rules (45 CFR), laboratory regulation (42 CFR 493), device/quality + e-records (21 CFR) → regulatory/legal texts | Web + public API | Public domain; full-text pin |
| SR-02 | govinfo.gov | Official published editions (annual CFR, U.S. Code, Federal Register) — **digitally signed PDFs**, the strongest pin anchor available | Web + public API | Public domain; full-text pin |
| SR-03 | federalregister.gov | Rules and amendments as published — the change-trigger monitoring feed for SR-01/02 pins | Web + public API | Public domain; full-text pin |

### Agency guidance (primary sources, public)

| ID | Source | Covers | Access | Licensure / pin |
|---|---|---|---|---|
| SR-04 | FDA guidance-document database (fda.gov) | Device/quality/software guidances → regulatory guidance type | Web (searchable DB) | Public; full-text pin |
| SR-05 | openFDA (open.fda.gov) | FDA datasets/endpoints (adverse events, recalls) — supporting data, rarely corpus material | Public API | Public; discovery-aid in most uses |
| SR-06 | CMS CLIA program pages + State Operations Manual appendices (cms.gov) | Laboratory accreditation/operations guidance | Web | Public; full-text pin |
| SR-07 | HHS OCR (hhs.gov/hipaa) | Privacy/security rule guidance, breach-notification materials | Web | Public; full-text pin |
| SR-08 | NIST (csrc.nist.gov) | SP 800-series, FIPS — security control frameworks and sector implementation guides | Web; bulk download | Public domain; full-text pin |

### Licensed standards bodies (primary sources, closed)

| ID | Source | Covers | Access | Licensure / pin |
|---|---|---|---|---|
| SR-09 | ISO / IEC (iso.org, national bodies) | Management-system and risk standards → quality/accreditation standard type | Purchase/subscription | **Licensed**; `reference+hash` only, unless org license permits internal copies (☐ legal review) |
| SR-10 | CAP accreditation program | Accreditation checklists | Member access | **Licensed**; `reference+hash` |
| SR-11 | CLSI | Laboratory standards | Subscription | **Licensed**; `reference+hash` |

### Discovery aids (never pinned from; locate, then pin from SR-01…08)

| ID | Source | Use | Access |
|---|---|---|---|
| SR-20 | Legal-research services (CourtListener-class, statute/reg search engines) | Locate case law, interpretive history, cross-references | Web/API; **MCP servers exist in some environments** (e.g., connector ecosystems) — availability is environment-dependent, verify at use |
| SR-21 | Vendor trust centers / documentation portals | Platform characterization inputs (RA-006 Tier-1 claims) | Web; per-vendor |
| SR-22 | MCP research servers generally (medical coding, literature, regulatory search) | Research assistance during authoring | Environment-dependent; treat outputs as unverified leads |

## Bundled retrieval channel (plugin MCP server)

The plugin ships a stdio MCP server, **`regsource`**
(`servers/regsource/server.mjs`, single-file Node.js, core modules only),
covering the keyless/public entries: SR-01 (`ecfr_fetch`,
`ecfr_versions`), SR-02 (`govinfo_search`, `govinfo_package`;
`GOVINFO_API_KEY` env var, DEMO_KEY fallback), SR-03 (`fedreg_search`),
plus the controlled-intake primitive `pin_fetch_hash` (SHA-256 over raw
bytes → RR-005 row fields; never returns content). For SR-02 pins, the
package PREMIS metadata publishes source-side SHA-256 fixity values to
cross-check the pin hash against. Ground rules above apply unchanged:
the server is a retrieval channel, not an authority channel, and its
endpoints remain perishable facts. When the server is unavailable
(offline), W5 falls back to the manual web/API access modes listed per
entry.

## Wizard/Router integration

- **W5 (Supply / Pin-by-reference):** for each P10 source type the profile
  expects, offer the matching registry entries as obtainment suggestions;
  prefer the bundled `regsource` tools where they cover the entry; record
  `source_registry:` provenance in each RR-005 row created.
- **Audit / change triggers:** SR-03-class amendment feeds are the
  monitoring channel for the reference-corpus change trigger
  (`doc-control.md`).
- **Adding a jurisdiction:** a new profile SHOULD ship with a registry
  section (or a separate `source-registry-<jurisdiction>.md`) mapping its
  P10 types to that jurisdiction's canonical repositories — same schema,
  same ground rules.
