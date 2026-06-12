#!/usr/bin/env node
/**
 * regsource — MCP stdio server for the gnox-risk-management plugin.
 *
 * Retrieval channel for the shipped source registry (source-registry.md):
 *   SR-01 eCFR (ecfr.gov)            — keyless public API
 *   SR-02 govinfo (api.govinfo.gov)  — api.data.gov key (GOVINFO_API_KEY, DEMO_KEY fallback)
 *   SR-03 Federal Register           — keyless public API
 *
 * Ground rules inherited from the registry (binding):
 *   - Retrieval is not authority. These tools fetch and hash; applicability
 *     and edition selection remain the organization's regulatory-function
 *     judgment. Everything still passes controlled intake (validate -> hash
 *     -> RR-005 row).
 *   - Endpoints are perishable facts. A failing locator is a provenance
 *     event to record, not a condition to silently work around.
 *
 * Node.js core only (fetch, node:crypto, node:readline) — no npm dependencies.
 * MCP stdio transport is newline-delimited JSON-RPC 2.0.
 */

import { createHash } from "node:crypto";
import { createInterface } from "node:readline";

const PROTOCOL_VERSION = "2024-11-05";
const SERVER_INFO = { name: "gnox-regsource", version: "0.2.0" };
const USER_AGENT = "gnox-rm-regsource/0.2 (risk-management corpus intake)";
const HTTP_TIMEOUT_MS = 30_000;
const TEXT_CAP = 40_000; // chars returned for reading tools; pinning never relies on this

const GOVINFO_KEY = process.env.GOVINFO_API_KEY || "DEMO_KEY";

const TRUNCATION_NOTE =
  `\n\n[TRUNCATED at ${TEXT_CAP} chars for reading. Truncated text MUST NOT be ` +
  `hashed or pinned; use pin_fetch_hash on the canonical URL for RR-005 intake.]`;

async function httpGet(url, { headers = {}, binary = false } = {}) {
  const resp = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, ...headers },
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    redirect: "follow",
  });
  if (!resp.ok) {
    const err = new Error(`HTTP ${resp.status} from ${resp.url}: ${resp.statusText}`);
    err.isHttp = true;
    throw err;
  }
  const contentType = resp.headers.get("content-type") ?? "";
  if (binary) {
    return { body: Buffer.from(await resp.arrayBuffer()), contentType, finalUrl: resp.url };
  }
  return { body: await resp.text(), contentType, finalUrl: resp.url };
}

function capText(text) {
  return text.length > TEXT_CAP ? text.slice(0, TEXT_CAP) + TRUNCATION_NOTE : text;
}

async function ecfrCurrentDate() {
  const { body } = await httpGet("https://www.ecfr.gov/api/versioner/v1/titles.json");
  const dates = JSON.parse(body)
    .titles.map((t) => t.up_to_date_as_of)
    .filter(Boolean);
  return dates.sort().at(-1);
}

// ---------------------------------------------------------------- tools

async function toolEcfrFetch(args) {
  const date = args.date || (await ecfrCurrentDate());
  const params = new URLSearchParams();
  for (const k of ["part", "subpart", "section", "appendix"]) {
    if (args[k]) params.set(k, args[k]);
  }
  const qs = params.size ? `?${params}` : "";
  const url = `https://www.ecfr.gov/api/versioner/v1/full/${date}/title-${args.title}.xml${qs}`;
  const { body, finalUrl } = await httpGet(url);
  return (
    `[eCFR point-in-time text | SR-01 | date=${date} | url=${finalUrl}]\n` +
    `[Reading copy only — pin via pin_fetch_hash on this URL]\n\n` +
    capText(body)
  );
}

async function toolEcfrVersions(args) {
  const params = new URLSearchParams();
  for (const k of ["part", "section"]) {
    if (args[k]) params.set(k, args[k]);
  }
  const qs = params.size ? `?${params}` : "";
  const url = `https://www.ecfr.gov/api/versioner/v1/versions/title-${args.title}.json${qs}`;
  const { body, finalUrl } = await httpGet(url);
  const versions = (JSON.parse(body).content_versions ?? []).map((v) => ({
    identifier: v.identifier,
    name: v.name,
    amendment_date: v.amendment_date,
    issue_date: v.issue_date,
    substantive: v.substantive,
    removed: v.removed,
  }));
  return JSON.stringify(
    { source: "SR-01 eCFR versions", url: finalUrl, count: versions.length, versions: versions.slice(-200) },
    null,
    1,
  );
}

async function toolFedregSearch(args) {
  const params = new URLSearchParams({ "conditions[term]": args.term, order: "newest" });
  if (args.agency) params.set("conditions[agencies][]", args.agency);
  if (args.doc_type) params.set("conditions[type][]", args.doc_type);
  if (args.since) params.set("conditions[publication_date][gte]", args.since);
  params.set("per_page", String(Math.min(args.per_page ?? 10, 50)));
  const url = `https://www.federalregister.gov/api/v1/documents.json?${params}`;
  const { body } = await httpGet(url);
  const data = JSON.parse(body);
  const results = (data.results ?? []).map((r) => ({
    title: r.title,
    type: r.type,
    citation: r.citation,
    document_number: r.document_number,
    publication_date: r.publication_date,
    agencies: (r.agencies ?? []).map((a) => a?.name).filter(Boolean),
    html_url: r.html_url,
    pdf_url: r.pdf_url,
  }));
  return JSON.stringify(
    { source: "SR-03 Federal Register (change-trigger feed)", count: data.count, results },
    null,
    1,
  );
}

async function toolGovinfoSearch(args) {
  const payload = {
    query: args.collection ? `${args.query} collection:(${args.collection})` : args.query,
    pageSize: Math.min(args.page_size ?? 10, 50),
    offsetMark: "*",
    sorts: [{ field: "publishdate", sortOrder: "DESC" }],
  };
  const resp = await fetch("https://api.govinfo.gov/search", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json",
      "X-Api-Key": GOVINFO_KEY,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  if (!resp.ok) {
    const err = new Error(`HTTP ${resp.status} from ${resp.url}: ${resp.statusText}`);
    err.isHttp = true;
    throw err;
  }
  const data = await resp.json();
  const results = (data.results ?? []).map((r) => ({
    title: r.title,
    packageId: r.packageId,
    granuleId: r.granuleId,
    collectionCode: r.collectionCode,
    dateIssued: r.dateIssued,
    lastModified: r.lastModified,
  }));
  return JSON.stringify({ source: "SR-02 govinfo search", count: data.count, results }, null, 1);
}

async function toolGovinfoPackage(args) {
  const pid = encodeURIComponent(args.package_id);
  const url = `https://api.govinfo.gov/packages/${pid}/summary`;
  const { body } = await httpGet(url, { headers: { "X-Api-Key": GOVINFO_KEY } });
  const data = JSON.parse(body);
  const keep = [
    "title", "packageId", "collectionCode", "dateIssued", "lastModified",
    "governmentAuthor1", "download", "detailsLink",
  ];
  const slim = Object.fromEntries(keep.filter((k) => k in data).map((k) => [k, data[k]]));
  slim._note =
    "SR-02: govinfo signed PDFs are the strongest pin anchor. " +
    "Pin the 'pdfLink' under 'download' via pin_fetch_hash. " +
    "The package's PREMIS metadata (premisLink) publishes SHA-256 fixity values " +
    "for source-side cross-checking of the pin hash.";
  return JSON.stringify(slim, null, 1);
}

async function toolPinFetchHash(args) {
  if (new URL(args.url).protocol !== "https:") {
    throw new Error("pin_fetch_hash requires an https:// URL (corpus-control intake rule)");
  }
  const { body, contentType, finalUrl } = await httpGet(args.url, { binary: true });
  return JSON.stringify(
    {
      requested_url: args.url,
      final_url: finalUrl,
      sha256: createHash("sha256").update(body).digest("hex"),
      bytes: body.length,
      content_type: contentType,
      retrieved_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      hash_basis: "raw response bytes as received, no normalization",
      _note:
        "Record in RR-005 with source_registry SR-## provenance. Re-verification " +
        "must reproduce this hash from the same URL; a mismatch is a corpus-control " +
        "change event, not a retrieval error to retry past.",
    },
    null,
    1,
  );
}

const TOOLS = {
  ecfr_fetch: {
    fn: toolEcfrFetch,
    description:
      "Fetch point-in-time CFR text from eCFR (SR-01, public domain). Returns official " +
      "XML for a title, optionally filtered to part/subpart/section/appendix, at a given " +
      "date (default: latest available). Reading/quoting copy only — RR-005 pins must go " +
      "through pin_fetch_hash. Retrieval is not authority: applicability and edition " +
      "selection remain the organization's judgment.",
    schema: {
      type: "object",
      properties: {
        title: { type: "integer", description: "CFR title number, e.g. 42" },
        part: { type: "string", description: "Part number, e.g. '493'" },
        subpart: { type: "string", description: "Subpart letter, e.g. 'A'" },
        section: { type: "string", description: "Section, e.g. '493.1'" },
        appendix: { type: "string" },
        date: { type: "string", description: "YYYY-MM-DD point-in-time; default latest" },
      },
      required: ["title"],
    },
  },
  ecfr_versions: {
    fn: toolEcfrVersions,
    description:
      "Amendment history for CFR content from eCFR (SR-01). Lists dated content versions " +
      "for a title/part/section — use to select the edition to pin and to check whether a " +
      "pinned edition has been superseded (corpus change trigger).",
    schema: {
      type: "object",
      properties: {
        title: { type: "integer" },
        part: { type: "string" },
        section: { type: "string" },
      },
      required: ["title"],
    },
  },
  fedreg_search: {
    fn: toolFedregSearch,
    description:
      "Search Federal Register documents (SR-03, keyless). This is the change-trigger " +
      "monitoring feed for SR-01/SR-02 pins: rules and amendments as published. Returns " +
      "citation, dates, and pdf_url (pinnable via pin_fetch_hash).",
    schema: {
      type: "object",
      properties: {
        term: { type: "string", description: "Search term" },
        agency: { type: "string", description: "Agency slug, e.g. 'health-and-human-services-department'" },
        doc_type: { type: "string", description: "RULE | PRORULE | NOTICE | PRESDOCU" },
        since: { type: "string", description: "YYYY-MM-DD publication-date floor" },
        per_page: { type: "integer", description: "Max 50, default 10" },
      },
      required: ["term"],
    },
  },
  govinfo_search: {
    fn: toolGovinfoSearch,
    description:
      "Search govinfo (SR-02) for official published editions — annual CFR, U.S. Code, " +
      "Federal Register — whose digitally signed PDFs are the strongest pin anchor. " +
      "Optional collection filter: CFR, USCODE, FR, PLAW. Uses GOVINFO_API_KEY " +
      "(DEMO_KEY fallback is heavily rate-limited).",
    schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        collection: { type: "string", description: "e.g. CFR, USCODE, FR, PLAW" },
        page_size: { type: "integer", description: "Max 50, default 10" },
      },
      required: ["query"],
    },
  },
  govinfo_package: {
    fn: toolGovinfoPackage,
    description:
      "Get a govinfo package summary (SR-02) including download links. The signed-PDF " +
      "link is the canonical pin target for official editions; the PREMIS link publishes " +
      "source-side SHA-256 fixity values for cross-checking pins.",
    schema: {
      type: "object",
      properties: {
        package_id: { type: "string", description: "e.g. CFR-2025-title42-vol5" },
      },
      required: ["package_id"],
    },
  },
  pin_fetch_hash: {
    fn: toolPinFetchHash,
    description:
      "Controlled-intake primitive: fetch an https URL, hash raw bytes with SHA-256, and " +
      "return hash, size, content type, final URL, and UTC retrieval timestamp for the " +
      "RR-005 register row. Does NOT return content — hashing and reading are deliberately " +
      "separate so the hash always covers exactly what was retrieved.",
    schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "https:// URL of the canonical text" },
      },
      required: ["url"],
    },
  },
};

// ------------------------------------------------------- JSON-RPC loop

function reply(id, result, error) {
  const out = { jsonrpc: "2.0", id };
  if (error !== undefined) out.error = error;
  else out.result = result;
  process.stdout.write(JSON.stringify(out) + "\n");
}

async function handle(msg) {
  const { method, id } = msg;

  if (method === "initialize") {
    reply(id, {
      protocolVersion: msg.params?.protocolVersion ?? PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: SERVER_INFO,
    });
  } else if (method === "ping") {
    reply(id, {});
  } else if (method === "tools/list") {
    reply(id, {
      tools: Object.entries(TOOLS).map(([name, t]) => ({
        name,
        description: t.description,
        inputSchema: t.schema,
      })),
    });
  } else if (method === "tools/call") {
    const name = msg.params?.name;
    const tool = TOOLS[name];
    if (!tool) {
      reply(id, undefined, { code: -32602, message: `Unknown tool: ${name}` });
      return;
    }
    try {
      const text = await tool.fn(msg.params?.arguments ?? {});
      reply(id, { content: [{ type: "text", text }] });
    } catch (e) {
      const text = e.isHttp
        ? `${e.message}. Registry locators are perishable facts — re-verify the SR-## entry before retrying.`
        : `${e.name}: ${e.message}`;
      reply(id, { content: [{ type: "text", text }], isError: true });
    }
  } else if (id !== undefined && id !== null) {
    reply(id, undefined, { code: -32601, message: `Method not found: ${method}` });
  }
  // notifications (no id) other than the above are ignored
}

const rl = createInterface({ input: process.stdin, terminal: false });
let queue = Promise.resolve();
rl.on("line", (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return;
  }
  // serialize handling so responses keep request order on stdout
  queue = queue.then(() => handle(msg));
});
