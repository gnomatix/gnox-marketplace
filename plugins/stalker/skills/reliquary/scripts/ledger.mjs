#!/usr/bin/env node
// reliquary — ed25519-signed lifecycle ledger (deterministic core)
// Node core modules only (node:crypto, node:fs). No dependencies.
//
// The ledger is append-only. Each entry signs over a canonical JSON of
// {seq, prev_sig, event, payload, timestamp}, chaining to its predecessor
// via prev_sig. A break anywhere — altered entry, deleted entry, reordered
// entry — fails verification, because every entry's signature covers the
// signature before it.
//
// Subcommands:
//   keygen   --key <priv.pem> --pub <pub.pem>
//   genesis  --ledger <l.jsonl> --key <priv.pem> [--field k=v ...]
//   append   --ledger <l.jsonl> --key <priv.pem> --event <name> [--field k=v ...]
//   verify   --ledger <l.jsonl> --pub <pub.pem>
//
// The signing key NEVER appears in the ledger. The ledger is public-verifiable
// with the public key alone.

import {
  generateKeyPairSync, sign as edSign, verify as edVerify,
  createPrivateKey, createPublicKey, createHash,
} from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';

function die(msg) { process.stderr.write(`reliquary-ledger: ${msg}\n`); process.exit(1); }

function parseArgs(argv) {
  const args = { field: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ledger') args.ledger = argv[++i];
    else if (a === '--key') args.key = argv[++i];
    else if (a === '--pub') args.pub = argv[++i];
    else if (a === '--event') args.event = argv[++i];
    else if (a === '--field') {
      const kv = argv[++i] || '';
      const eq = kv.indexOf('=');
      if (eq < 0) die(`malformed --field "${kv}" (expected k=v)`);
      args.field[kv.slice(0, eq)] = kv.slice(eq + 1);
    } else if (!args.cmd) args.cmd = a;
    else die(`unexpected argument: ${a}`);
  }
  return args;
}

// Deterministic canonical JSON: object keys sorted recursively. The signed
// bytes must be reproducible by any verifier, so key order cannot vary.
function canonical(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  const keys = Object.keys(value).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
}

function signCore(core, privPem) {
  const keyObj = createPrivateKey(privPem);
  // ed25519 takes null algorithm; it hashes internally.
  return edSign(null, Buffer.from(canonical(core), 'utf8'), keyObj).toString('base64');
}

function verifyCore(core, sigB64, pubPem) {
  const keyObj = createPublicKey(pubPem);
  return edVerify(null, Buffer.from(canonical(core), 'utf8'), keyObj, Buffer.from(sigB64, 'base64'));
}

function nowIso() {
  // Caller environments that forbid argless Date can pass RELIQUARY_TS.
  return process.env.RELIQUARY_TS || new Date().toISOString();
}

function readLedger(path) {
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, 'utf8');
  return raw.split(/\r?\n/).filter((l) => l.trim().length > 0).map((l, i) => {
    try { return JSON.parse(l); } catch (e) { die(`ledger line ${i + 1} is not valid JSON: ${e.message}`); }
  });
}

const args = parseArgs(process.argv.slice(2));

switch (args.cmd) {
  case 'keygen': {
    if (!args.key || !args.pub) die('keygen requires --key <priv.pem> --pub <pub.pem>');
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    writeFileSync(args.key, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
    writeFileSync(args.pub, publicKey.export({ type: 'spki', format: 'pem' }));
    process.stdout.write(`keypair written: ${args.key} (0600), ${args.pub}\n`);
    break;
  }
  case 'genesis':
  case 'append': {
    if (!args.ledger || !args.key) die(`${args.cmd} requires --ledger and --key`);
    const priv = readFileSync(args.key, 'utf8');
    const entries = readLedger(args.ledger);
    if (args.cmd === 'genesis' && entries.length > 0) die('genesis refused: ledger already has entries');
    if (args.cmd === 'append' && entries.length === 0) die('append refused: no genesis entry — run genesis first');
    const seq = entries.length;
    const prevSig = seq === 0 ? '' : entries[seq - 1].sig;
    const event = args.cmd === 'genesis' ? (args.event || 'genesis') : args.event;
    if (!event) die('append requires --event <name>');
    const core = { seq, prev_sig: prevSig, event, payload: args.field, timestamp: nowIso() };
    const sig = signCore(core, priv);
    const entry = { ...core, sig };
    appendFileSync(args.ledger, JSON.stringify(entry) + '\n');
    process.stdout.write(`${event} appended at seq ${seq}; sig ${sig.slice(0, 16)}...\n`);
    break;
  }
  case 'verify': {
    if (!args.ledger || !args.pub) die('verify requires --ledger and --pub');
    const pub = readFileSync(args.pub, 'utf8');
    const entries = readLedger(args.ledger);
    if (entries.length === 0) die('verify: empty ledger');
    let prevSig = '';
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.seq !== i) die(`FAIL: entry ${i} has seq ${e.seq} (expected ${i}) — reordered or missing entry`);
      if (e.prev_sig !== prevSig) die(`FAIL: entry ${i} prev_sig does not match predecessor — chain broken`);
      const core = { seq: e.seq, prev_sig: e.prev_sig, event: e.event, payload: e.payload, timestamp: e.timestamp };
      if (!verifyCore(core, e.sig, pub)) die(`FAIL: entry ${i} (${e.event}) signature invalid — content altered`);
      prevSig = e.sig;
    }
    const headHash = createHash('sha256').update(entries[entries.length - 1].sig).digest('hex');
    process.stdout.write(`LEDGER VALID: ${entries.length} entries, chain intact, head ${headHash.slice(0, 16)}...\n`);
    break;
  }
  default:
    die('usage: ledger.mjs <keygen|genesis|append|verify> [opts]');
}
