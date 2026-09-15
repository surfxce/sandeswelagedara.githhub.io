#!/usr/bin/env node
// Encrypts the On Shift roster so the public repo only ever holds ciphertext.
//
//   node tools/onshift-encrypt.mjs "/path/to/roster.json"
//
// Writes toybox/on-shift/roster.enc and prints the one link to share with
// execs. The key lives at ~/.config/onshift/key (outside the repo) and is
// created on first run; re-running with a changed roster reuses it, so the
// link you already sent out keeps working.
//
// roster.json shape:
//   { "people": [ { "n": "Full Name", "s": ["UQISC"] }, … ],
//     "roster": [ [ ["vb", ["First", "First"]], … ],  ← one array per block
//                 … ] }

import { webcrypto as crypto } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..', 'toybox', 'on-shift', 'roster.enc');
const KEY_FILE = join(homedir(), '.config', 'onshift', 'key');
const SITE = 'https://sandeswelagedara.com/toybox/on-shift/';

const src = process.argv[2];
if (!src) { console.error('usage: node tools/onshift-encrypt.mjs <roster.json>'); process.exit(1); }
if (resolve(src).startsWith(resolve(here, '..'))) {
  console.error('refusing: roster.json is inside the repo. Keep the plaintext outside it.'); process.exit(1);
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const unb64u = (s) => new Uint8Array(Buffer.from(s, 'base64url'));

// key: reuse if present, else make one
let keyStr;
if (existsSync(KEY_FILE)) keyStr = readFileSync(KEY_FILE, 'utf8').trim();
else {
  keyStr = b64u(crypto.getRandomValues(new Uint8Array(32)));
  mkdirSync(dirname(KEY_FILE), { recursive: true });
  writeFileSync(KEY_FILE, keyStr + '\n', { mode: 0o600 });
  console.log('new key written to', KEY_FILE);
}

const data = JSON.parse(readFileSync(src, 'utf8'));
if (!Array.isArray(data.people) || !Array.isArray(data.roster)) { console.error('roster.json needs "people" and "roster" arrays'); process.exit(1); }

const key = await crypto.subtle.importKey('raw', unb64u(keyStr), 'AES-GCM', false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)));

writeFileSync(OUT, JSON.stringify({ v: 1, iv: b64u(iv), ct: b64u(ct) }) + '\n');
console.log(`wrote ${OUT} (${data.people.length} people, ${data.roster.length} blocks)`);
console.log('\nshare this link with execs:\n\n  ' + SITE + '#k=' + keyStr + '\n');
