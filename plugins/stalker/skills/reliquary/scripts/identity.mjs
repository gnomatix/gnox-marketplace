#!/usr/bin/env node
// reliquary — human-party identity lookup for genesis.
// Node core modules only (global fetch, Node 18+). No dependencies.
//
// Usage:
//   node identity.mjs search  --name "<name>"                 list Wikidata candidates
//   node identity.mjs resolve --qid <Qnnn> | --orcid <id>     resolve one party across registries
//                             [--mybib <slug-or-url>]          NCBI My Bibliography (SciENcv's public face)
//   node identity.mjs resolve ... --fields                     also print --field args for ledger.mjs genesis
//
// Registries, in order of what each can prove here:
//   Wikidata      hub: QID, label, ORCID (P496), Scopus (P1153), Google Scholar (P1960),
//                 ResearchGate (P2038), OpenAlex (P10283), VIAF (P214), employers (P108)
//   ORCID         public API: name + the external IDs the record holder lists (corroborates Scopus)
//   OpenAlex      public API: name, works, h-index, ORCID — second independent corroboration
//   Scopus / Google Scholar / ResearchGate
//                 no open query API; resolved as profile URLs from the IDs above, with the
//                 HTTP status recorded. A 403/302 there is a bot wall, not a negative result.
//
// The script never confirms an identity. It prints a CONFIRM block for the human party to
// affirm (or reject) before genesis. Confirmation is the party's act, recorded in the ledger.

const UA = 'reliquary-identity/0.1 (stalker plugin; +https://github.com/gnomatix/gnox-marketplace)';

function die(msg) { process.stdout.write(`IDENTITY: FAILED\n  ${msg}\n`); process.exit(1); }

function parseArgs(argv) {
  const a = { cmd: argv[0], fields: false };
  for (let i = 1; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--name') a.name = argv[++i];
    else if (t === '--qid') a.qid = argv[++i];
    else if (t === '--orcid') a.orcid = argv[++i];
    else if (t === '--fields') a.fields = true;
    else if (t === '--mybib') a.mybib = argv[++i];
    else if (t === '--limit') a.limit = Number(argv[++i]);
    else die(`unexpected argument: ${t}`);
  }
  return a;
}

async function getJSON(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, redirect: 'follow' });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.json();
}
async function status(url) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual' });
    return r.status;
  } catch (e) { return `error: ${e.message}`; }
}

const WD = 'https://www.wikidata.org/w/api.php';
const PROPS = {
  P496: 'orcid', P1153: 'scopus', P1960: 'google_scholar', P2038: 'researchgate',
  P10283: 'openalex', P214: 'viaf', P6178: 'dimensions', P6634: 'linkedin',
};

async function wdSearch(name, limit = 8) {
  const j = await getJSON(`${WD}?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&limit=${limit}&format=json`);
  return (j.search || []).map((s) => ({ qid: s.id, label: s.label, description: s.description || '', match: s.match?.text }));
}
async function wdByOrcid(orcid) {
  const j = await getJSON(`${WD}?action=query&list=search&srsearch=${encodeURIComponent(`haswbstatement:P496=${orcid}`)}&srnamespace=0&format=json`);
  return (j.query?.search || []).map((s) => s.title);
}
async function wdEntity(qid) {
  const j = await getJSON(`${WD}?action=wbgetentities&ids=${qid}&props=labels|descriptions|claims|info&languages=en&format=json`);
  const e = j.entities?.[qid];
  if (!e || e.missing !== undefined) throw new Error(`Wikidata has no entity ${qid}`);
  const ids = {};
  for (const [p, k] of Object.entries(PROPS)) {
    const v = e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value;
    if (typeof v === 'string') ids[k] = v;
  }
  const employerQids = (e.claims?.P108 || []).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);
  const instanceOf = e.claims?.P31?.[0]?.mainsnak?.datavalue?.value?.id;
  return {
    qid, revision: e.lastrevid, label: e.labels?.en?.value, description: e.descriptions?.en?.value || '',
    human: instanceOf === 'Q5', ids, employerQids,
  };
}
async function wdLabels(qids) {
  if (!qids.length) return [];
  const j = await getJSON(`${WD}?action=wbgetentities&ids=${qids.join('|')}&props=labels&languages=en&format=json`);
  return qids.map((q) => j.entities?.[q]?.labels?.en?.value || q);
}

async function orcidPerson(orcid) {
  const j = await getJSON(`https://pub.orcid.org/v3.0/${orcid}/person`);
  const name = [j.name?.['given-names']?.value, j.name?.['family-name']?.value].filter(Boolean).join(' ');
  const ext = {};
  for (const x of j['external-identifiers']?.['external-identifier'] || []) ext[x['external-id-type']] = x['external-id-value'];
  return { name, ext };
}
async function openalexByOrcid(orcid) {
  const j = await getJSON(`https://api.openalex.org/authors/orcid:${orcid}`);
  return { id: j.id, name: j.display_name, works: j.works_count, cited_by: j.cited_by_count, h_index: j.summary_stats?.h_index, aliases: j.raw_author_names || [] };
}

// Google Scholar and ResearchGate both take a plaintext name search. Neither has an
// open API; from a headless host Scholar usually answers 302 -> accounts.google.com and
// ResearchGate 403. Record what came back; parse profiles when a 200 does arrive.
async function scholarSearch(name) {
  const url = `https://scholar.google.com/citations?view_op=search_authors&mauthors=${encodeURIComponent(name)}&hl=en`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'manual' });
    if (r.status !== 200) {
      const loc = r.headers.get('location') || '';
      return { url, status: r.status, wall: /accounts\.google\.com|sorry/.test(loc) ? `sign-in or bot wall (${loc.split('?')[0]})` : loc, profiles: [] };
    }
    const html = await r.text();
    const profiles = [];
    const re = /<a[^>]*href="\/citations\?hl=en&amp;user=([A-Za-z0-9_-]+)"[^>]*>([^<]+)<\/a>[\s\S]*?gs_ai_aff">([^<]*)/g;
    let m; while ((m = re.exec(html))) profiles.push({ user: m[1], name: m[2].trim(), affiliation: m[3].trim() });
    return { url, status: 200, profiles };
  } catch (e) { return { url, status: `error: ${e.message}`, profiles: [] }; }
}
async function researchgateSearch(name) {
  const url = `https://www.researchgate.net/search/researcher?q=${encodeURIComponent(name)}`;
  return { url, status: await status(url) };
}

// NIH / NCBI. PubMed E-utilities and NIH RePORTER are open APIs. An NIH biosketch lives in
// SciENcv inside My NCBI and is not publicly queryable; its public face is the party's
// My Bibliography URL, which they supply (--mybib) and the script checks.
async function pubmedAuthor(last, initials) {
  const term = `${last} ${initials}[Author]`;
  const j = await getJSON(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=5`);
  const r = j.esearchresult || {};
  let first = '';
  if (r.idlist?.length) {
    const s = await getJSON(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${r.idlist[0]}&retmode=json`);
    const d = s.result?.[r.idlist[0]];
    if (d) first = `${d.title} (${d.source} ${d.pubdate})`;
  }
  return { term, count: Number(r.count || 0), pmids: r.idlist || [], first };
}
async function nihReporter(last, first) {
  const r = await fetch('https://api.reporter.nih.gov/v2/projects/search', {
    method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/json' },
    body: JSON.stringify({ criteria: { pi_names: [{ last_name: last, first_name: first }] }, limit: 5, include_fields: ['ProjectNum', 'ProjectTitle', 'Organization', 'FiscalYear'] }),
  });
  if (!r.ok) throw new Error(`RePORTER HTTP ${r.status}`);
  const j = await r.json();
  return { total: j.meta?.total ?? 0, projects: (j.results || []).map((p) => `${p.project_num} FY${p.fiscal_year} ${p.project_title} — ${p.organization?.org_name || ''}`) };
}
function initials(full, last) {
  return String(full || '').replace(last, '').split(/[\s.]+/).filter(Boolean).map((w) => w[0].toUpperCase()).join('');
}

function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); }
function surname(s) { const p = String(s || '').trim().split(/\s+/); return p[p.length - 1] || ''; }

async function resolve(args) {
  let qid = args.qid;
  if (!qid && args.orcid) {
    const hits = await wdByOrcid(args.orcid);
    if (hits.length !== 1) die(`Wikidata has ${hits.length} entities with ORCID ${args.orcid}${hits.length ? ': ' + hits.join(', ') : ''}`);
    qid = hits[0];
  }
  if (!qid) die('resolve needs --qid or --orcid');

  const wd = await wdEntity(qid);
  const orcid = args.orcid || wd.ids.orcid;
  const out = { wikidata: wd, checks: [] };
  const say = (ok, what) => out.checks.push(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'} ${what}`);

  say(wd.human, `wikidata ${qid} is instance of human (P31=Q5)`);
  if (args.orcid && wd.ids.orcid) say(wd.ids.orcid === args.orcid, `wikidata ORCID ${wd.ids.orcid} matches requested ${args.orcid}`);
  out.employers = await wdLabels(wd.employerQids.slice(0, 5));

  if (orcid) {
    try {
      out.orcid = await orcidPerson(orcid);
      say(norm(surname(out.orcid.name)) === norm(surname(wd.label)), `ORCID record name "${out.orcid.name}" shares surname with Wikidata label "${wd.label}"`);
      const sc = out.orcid.ext['Scopus Author ID'];
      if (sc && wd.ids.scopus) say(sc === wd.ids.scopus, `Scopus ID in ORCID record (${sc}) matches Wikidata P1153 (${wd.ids.scopus})`);
      else if (sc && !wd.ids.scopus) { wd.ids.scopus = sc; say(null, `Scopus ID ${sc} taken from ORCID record (absent on Wikidata)`); }
    } catch (e) { say(false, `ORCID public API: ${e.message}`); }
    try {
      out.openalex = await openalexByOrcid(orcid);
      say(norm(surname(out.openalex.name)) === norm(surname(wd.label)), `OpenAlex author "${out.openalex.name}" (${out.openalex.works} works, h=${out.openalex.h_index}) shares surname with Wikidata label`);
    } catch (e) { say(false, `OpenAlex: ${e.message}`); }
  } else say(false, 'no ORCID on Wikidata and none given — the strongest cross-check is unavailable');

  // Profile URLs for registries without an open query API: record reachability only.
  out.profiles = {};
  const urls = {
    orcid: orcid && `https://orcid.org/${orcid}`,
    scopus: wd.ids.scopus && `https://www.scopus.com/authid/detail.uri?authorId=${wd.ids.scopus}`,
    google_scholar: wd.ids.google_scholar && `https://scholar.google.com/citations?user=${wd.ids.google_scholar}`,
    researchgate: wd.ids.researchgate && `https://www.researchgate.net/profile/${wd.ids.researchgate}`,
  };
  for (const [k, u] of Object.entries(urls)) {
    if (!u) continue;
    const st = await status(u);
    out.profiles[k] = `${u} (HTTP ${st}${st === 403 || st === 302 || st === 307 ? ', bot wall or redirect; not a negative' : ''})`;
  }
  // Name searches where no identifier was found: the registries answer plaintext names.
  const nm = wd.label;
  if (!wd.ids.google_scholar) {
    const s = await scholarSearch(nm);
    if (s.profiles.length) {
      out.profiles.google_scholar = s.profiles.map((p) => `${p.user} — ${p.name}${p.affiliation ? ', ' + p.affiliation : ''}`).join(' | ');
      say(null, `Google Scholar name search returned ${s.profiles.length} profile(s); the party picks theirs`);
    } else out.profiles.google_scholar = `name search ${s.url} -> HTTP ${s.status}${s.wall ? ', ' + s.wall : ''}; open it in a browser`;
  }
  if (!wd.ids.researchgate) {
    const s = await researchgateSearch(nm);
    out.profiles.researchgate = `name search ${s.url} -> HTTP ${s.status}${s.status === 403 ? ', bot wall' : ''}; open it in a browser`;
  }

  // NIH / NCBI: PubMed author record, RePORTER PI record, My Bibliography (SciENcv's public face).
  const last = surname(nm), fullForInitials = nm, ini = initials(nm, last);
  try {
    out.pubmed = await pubmedAuthor(last, ini);
    say(out.pubmed.count > 0 ? null : false, `PubMed "${out.pubmed.term}": ${out.pubmed.count} record(s)${out.pubmed.first ? '; latest: ' + out.pubmed.first : ''}`);
  } catch (e) { say(false, `PubMed E-utilities: ${e.message}`); }
  try {
    const firstName = fullForInitials.split(/\s+/)[0];
    out.reporter = await nihReporter(last, firstName);
    say(null, `NIH RePORTER PI "${last}, ${firstName}": ${out.reporter.total} project(s)${out.reporter.projects.length ? ' — ' + out.reporter.projects.join(' | ') : ''}`);
  } catch (e) { say(false, `NIH RePORTER: ${e.message}`); }
  if (args.mybib) {
    const u = /^https?:/.test(args.mybib) ? args.mybib : `https://www.ncbi.nlm.nih.gov/myncbi/${args.mybib}/bibliography/public/`;
    const st = await status(u);
    out.profiles.ncbi_mybibliography = `${u} (HTTP ${st})`;
    say(st === 200, `My Bibliography public page answers 200 (NIH biosketch itself is SciENcv-private; this URL is its public face, supplied by the party)`);
    if (st === 200) wd.ids.ncbi_mybibliography = args.mybib;
  } else out.profiles.ncbi_mybibliography = 'not given; pass --mybib <slug-or-url> from My NCBI (the NIH biosketch in SciENcv is not public)';
  return out;
}

function printResolved(r, wantFields) {
  const wd = r.wikidata;
  process.stdout.write(`IDENTITY: RESOLVED (not yet confirmed)\n`);
  process.stdout.write(`  wikidata: ${wd.qid} rev ${wd.revision} — ${wd.label}${wd.description ? ', ' + wd.description : ''}\n`);
  if (r.employers.length) process.stdout.write(`  employers (P108): ${r.employers.join('; ')}\n`);
  for (const [k, v] of Object.entries(wd.ids)) process.stdout.write(`  ${k}: ${v}\n`);
  if (r.orcid) process.stdout.write(`  orcid record: ${r.orcid.name}${Object.keys(r.orcid.ext).length ? ' — ' + Object.entries(r.orcid.ext).map(([a, b]) => `${a}=${b}`).join(', ') : ''}\n`);
  if (r.pubmed) process.stdout.write(`  pubmed: ${r.pubmed.count} record(s) for ${r.pubmed.term}${r.pubmed.pmids.length ? ', PMIDs ' + r.pubmed.pmids.join(' ') : ''}\n`);
  if (r.reporter) process.stdout.write(`  nih reporter: ${r.reporter.total} project(s) as PI\n`);
  if (r.openalex) process.stdout.write(`  openalex: ${r.openalex.id} — ${r.openalex.name}, ${r.openalex.works} works, cited ${r.openalex.cited_by}, h ${r.openalex.h_index}\n`);
  process.stdout.write('CHECKS:\n');
  for (const c of r.checks) process.stdout.write(`  ${c}\n`);
  process.stdout.write('PROFILES:\n');
  for (const [k, v] of Object.entries(r.profiles)) process.stdout.write(`  ${k}: ${v}\n`);
  const fails = r.checks.filter((c) => c.startsWith('FAIL')).length;
  process.stdout.write(`CONFIRM: ${fails ? `${fails} check(s) failed — do not seal this identity without the party resolving them` : 'all checks pass'}. The human party must affirm this is them before genesis; the script cannot.\n`);
  if (wantFields) {
    const f = [
      `human_name=${wd.label}`, `human_wikidata=${wd.qid}`,
      wd.ids.orcid && `human_orcid=${wd.ids.orcid}`,
      wd.ids.scopus && `human_scopus=${wd.ids.scopus}`,
      wd.ids.google_scholar && `human_google_scholar=${wd.ids.google_scholar}`,
      wd.ids.researchgate && `human_researchgate=${wd.ids.researchgate}`,
      wd.ids.ncbi_mybibliography && `human_ncbi_mybibliography=${wd.ids.ncbi_mybibliography}`,
      r.pubmed && `human_pubmed_author=${r.pubmed.term} (${r.pubmed.count})`,
      r.openalex && `human_openalex=${r.openalex.id.replace('https://openalex.org/', '')}`,
      `identity_source=wikidata:${wd.qid}@${wd.revision}`,
      `identity_checked=${new Date().toISOString()}`,
    ].filter(Boolean);
    process.stdout.write('GENESIS FIELDS (pass each as --field to ledger.mjs genesis, after confirmation):\n');
    for (const x of f) process.stdout.write(`  --field ${x}\n`);
  }
}

const args = parseArgs(process.argv.slice(2));
try {
  if (args.cmd === 'search') {
    if (!args.name) die('search needs --name');
    const c = await wdSearch(args.name, args.limit || 8);
    if (!c.length) die(`Wikidata has no entity matching "${args.name}"`);
    process.stdout.write(`IDENTITY: ${c.length} candidate(s) for "${args.name}"\n`);
    for (const x of c) process.stdout.write(`  ${x.qid}  ${x.label}${x.description ? ' — ' + x.description : ''}${x.match && x.match !== x.label ? ` (matched alias "${x.match}")` : ''}\n`);
    process.stdout.write('Next: node identity.mjs resolve --qid <Qnnn> --fields\n');
  } else if (args.cmd === 'resolve') {
    printResolved(await resolve(args), args.fields);
  } else die('usage: identity.mjs <search|resolve> [opts]');
} catch (e) { die(e.message); }
