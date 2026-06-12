# regsource — bundled MCP server

Stdio MCP server giving the gnox-rm-bootstrap skill direct retrieval access
to the public-domain primary sources in the shipped source registry
(`references/source-registry.md`): SR-01 eCFR, SR-02 govinfo, SR-03
Federal Register.

Single-file Node.js (ES module), core modules only (`fetch`, `node:crypto`,
`node:readline`) — no npm dependencies, no install step. Node is the one
runtime every Claude Code host already provides, so the server adds zero
environmental assumptions.

## Tools

| Tool | Registry entry | Purpose |
|---|---|---|
| `ecfr_fetch` | SR-01 | Point-in-time CFR text (title/part/section/date) — reading copy |
| `ecfr_versions` | SR-01 | Amendment history; edition selection and supersession checks |
| `fedreg_search` | SR-03 | Change-trigger monitoring feed for existing pins |
| `govinfo_search` | SR-02 | Locate official published editions (signed PDFs) |
| `govinfo_package` | SR-02 | Package summary with pinnable download links + PREMIS fixity link |
| `pin_fetch_hash` | intake | Fetch URL, SHA-256 over raw bytes → RR-005 row fields |

Tool names surface as `mcp__plugin_gnox-risk-management_regsource__<tool>`.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `GOVINFO_API_KEY` | No | Free key from api.data.gov. Without it the server falls back to `DEMO_KEY`, which is heavily rate-limited; eCFR and Federal Register tools are keyless and unaffected. Sent as `X-Api-Key` header, never in query strings. |

## Design constraints (inherited from registry ground rules)

- **Retrieval ≠ authority.** Tools fetch and hash; they never decide
  applicability or edition. Everything retrieved still passes controlled
  intake (validate → hash → RR-005 row).
- **Reading and pinning are separate.** `ecfr_fetch` may truncate long
  text for reading; `pin_fetch_hash` never returns content and hashes raw
  bytes as received, so the recorded hash always covers exactly what was
  retrieved and is reproducible with `curl -s <url> | sha256sum`.
- **Source-published fixity cross-check.** For SR-02, govinfo package
  PREMIS metadata publishes SHA-256 fixity values; a pin hash can be
  cross-checked against the source's own published digest
  (`curl -s <pdf-url> | sha256sum`, then exact-match the digest in the
  package's `premis` endpoint output).
- **Endpoints are perishable facts.** An HTTP failure is surfaced with a
  reminder to re-verify the SR-## locator, not silently retried around.
- **https only** for `pin_fetch_hash` (corpus-control intake rule).

## Verification

```sh
node --check servers/regsource/server.mjs

printf '%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | node servers/regsource/server.mjs
```

After installing the plugin, `/mcp` should list `regsource` with six tools.
