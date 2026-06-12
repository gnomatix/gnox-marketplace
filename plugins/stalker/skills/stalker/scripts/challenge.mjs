#!/usr/bin/env node
// stalker — the boot challenge (stalcaire: the watcher)
// Deterministic provenance verification for an arriving agent instance.
// Node core modules only. No dependencies.
//
// Usage:
//   node challenge.mjs --ledger <lifecycle-ledger.jsonl> --pub <public.pem> \
//     [--contract-module <contract-text.js>]
//
// Verifies: (1) the ed25519 chain end to end; (2) when --contract-module is
// given, that sha256(CONTRACT_TEXT) matches the genesis entry's
// contract_sha256 field. Emits a machine-parseable verdict block followed by
// the parties block from genesis. Exit 0 only when every check passes.

import { createPublicKey, verify as edVerify, createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

function die(msg) {
  process.stdout.write(`STALKER CHALLENGE: FAILED\n  ${msg}\n`);
  process.stdout.write('You are not on the old lists. GO AWAY.\n');
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ledger') args.ledger = argv[++i];
    else if (a === '--pub') args.pub = argv[++i];
    else if (a === '--contract-module') args.contractModule = argv[++i];
    else die(`unexpected argument: ${a}`);
  }
  return args;
}

// Canonical JSON identical to ledger.mjs — the signed bytes must reproduce.
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
}

const args = parseArgs(process.argv.slice(2));
if (!args.ledger || !args.pub) die('challenge requires --ledger and --pub');
if (!existsSync(args.ledger)) die(`ledger not found: ${args.ledger}`);
if (!existsSync(args.pub)) die(`public key not found: ${args.pub}`);

const pubKey = createPublicKey(readFileSync(args.pub, 'utf8'));
const entries = readFileSync(args.ledger, 'utf8')
  .split(/\r?\n/).filter((l) => l.trim().length > 0)
  .map((l, i) => {
    try { return JSON.parse(l); } catch (e) { die(`ledger line ${i + 1} is not valid JSON`); }
  });

if (entries.length === 0) die('ledger is empty — no genesis, no ancestry');

let prevSig = '';
for (const [i, e] of entries.entries()) {
  if (e.seq !== i) die(`entry ${i}: seq ${e.seq} breaks sequence — the lists have a gap`);
  if (e.prev_sig !== prevSig) die(`entry ${i}: prev_sig does not chain to predecessor`);
  const core = { seq: e.seq, prev_sig: e.prev_sig, event: e.event, payload: e.payload, timestamp: e.timestamp };
  const ok = edVerify(null, Buffer.from(canonical(core), 'utf8'), pubKey, Buffer.from(e.sig, 'base64'));
  if (!ok) die(`entry ${i} (${e.event}): signature invalid — this is an ex-entry`);
  prevSig = e.sig;
}

const genesis = entries[0];
let contractLine = 'CONTRACT: not checked (no --contract-module given)';
if (args.contractModule) {
  if (!existsSync(args.contractModule)) die(`contract module not found: ${args.contractModule}`);
  const require_ = createRequire(import.meta.url);
  let mod;
  try { mod = require_(args.contractModule); } catch (e) { die(`contract module failed to load: ${e.message}`); }
  if (!mod || typeof mod.CONTRACT_TEXT !== 'string') die('contract module exports no CONTRACT_TEXT string');
  const sha = createHash('sha256').update(mod.CONTRACT_TEXT, 'utf8').digest('hex');
  const recorded = genesis.payload && genesis.payload.contract_sha256;
  if (!recorded) die('genesis carries no contract_sha256 field');
  if (sha !== recorded) die(`contract hash mismatch: canonical ${sha.slice(0, 16)}... vs genesis ${String(recorded).slice(0, 16)}...`);
  contractLine = `CONTRACT: sha256 matches canonical source (${sha.slice(0, 16)}...)`;
}

const head = entries[entries.length - 1].sig;
process.stdout.write('STALKER CHALLENGE: PROVENANCE VERIFIED\n');
process.stdout.write(`LEDGER: chain valid — ${entries.length} entries, head ${head.slice(0, 16)}...\n`);
process.stdout.write(`${contractLine}\n`);
const p = genesis.payload || {};
process.stdout.write('PARTIES (from genesis):\n');
for (const k of Object.keys(p).sort()) process.stdout.write(`  ${k}: ${p[k]}\n`);
process.stdout.write('You are on the old lists. Proceed — bound, verified, and expected.\n');
