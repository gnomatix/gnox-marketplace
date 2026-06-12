#!/usr/bin/env node
// mount-doom — provable unmaking ceremony
// Node core modules only. The artifact can only be unmade where it was made:
// destruction entries append to the same ledger that records creations.
//
// Usage:
//   node unmake.mjs <target-file> --ledger <ledger.jsonl> \
//     --reason "<why this artifact must be unmade>" \
//     --directed-by "<verbatim user authorization>" \
//     [--method overwrite|unlink]   (default: overwrite)
//
// Ceremony phases, each a signed-shape ledger entry:
//   intent         — target identified and hashed before any mutation
//   verified-void  — destruction complete, absence confirmed
//   aborted        — any failure; the ceremony never fails silently

import { createHash, randomBytes } from 'node:crypto';
import {
  appendFileSync, existsSync, openSync, closeSync, writeSync,
  readFileSync, statSync, unlinkSync, fsyncSync,
} from 'node:fs';
import { basename } from 'node:path';

function fail(msg, ledger, entryBase) {
  if (ledger && entryBase) {
    appendEntry(ledger, { ...entryBase, phase: 'aborted', error: msg });
  }
  console.error(`ABORTED: ${msg}`);
  console.error('FIVE IS RIGHT OUT.');
  process.exit(1);
}

function appendEntry(ledger, entry) {
  appendFileSync(ledger, JSON.stringify(entry) + '\n');
}

function parseArgs(argv) {
  const args = { method: 'overwrite' };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ledger') args.ledger = argv[++i];
    else if (a === '--reason') args.reason = argv[++i];
    else if (a === '--directed-by') args.directedBy = argv[++i];
    else if (a === '--method') args.method = argv[++i];
    else positional.push(a);
  }
  args.target = positional[0];
  return args;
}

const args = parseArgs(process.argv.slice(2));

if (!args.target || !args.ledger || !args.reason || !args.directedBy) {
  console.error('Usage: unmake.mjs <target> --ledger <ledger.jsonl> --reason "..." --directed-by "<verbatim authorization>" [--method overwrite|unlink]');
  console.error('The ceremony requires the holy pin (--directed-by): the verbatim user authorization.');
  console.error('FIVE IS RIGHT OUT.');
  process.exit(1);
}
if (!['overwrite', 'unlink'].includes(args.method)) {
  fail(`unknown method "${args.method}" — count to overwrite or unlink, no more, no less`);
}
if (!existsSync(args.target)) fail(`target does not exist: ${args.target}`);

const st = statSync(args.target);
if (!st.isFile()) fail(`target is not a regular file: ${args.target} — directories receive the ceremony one artifact at a time`);

// ---- Phase 1: INTENT — hash before any mutation -------------------------
const bytes = readFileSync(args.target);
const sha256 = createHash('sha256').update(bytes).digest('hex');
const base = {
  ceremony: 'mount-doom',
  target: args.target,
  target_basename: basename(args.target),
  size_bytes: st.size,
  sha256,
  reason: args.reason,
  directed_by: args.directedBy,
  method: args.method,
};
appendEntry(args.ledger, { ...base, phase: 'intent', timestamp: new Date().toISOString() });

// ---- Phase 2: UNMAKE ------------------------------------------------------
try {
  if (args.method === 'overwrite') {
    const fd = openSync(args.target, 'r+');
    writeSync(fd, randomBytes(st.size), 0, st.size, 0);
    fsyncSync(fd);
    closeSync(fd);
  }
  unlinkSync(args.target);
} catch (e) {
  fail(`destruction failed: ${e.message}`, args.ledger, base);
}

// ---- Phase 3: VERIFIED-VOID ----------------------------------------------
if (existsSync(args.target)) {
  fail('target still exists after unlink — the void did not verify', args.ledger, base);
}
appendEntry(args.ledger, { ...base, phase: 'verified-void', timestamp: new Date().toISOString() });

console.log(`UNMADE: ${args.target}`);
console.log(`  sha256 (at death): ${sha256}`);
console.log(`  size:              ${st.size} bytes`);
console.log(`  method:            ${args.method}`);
console.log(`  ledger:            ${args.ledger} (intent + verified-void appended)`);
console.log('This is an ex-artifact.');
