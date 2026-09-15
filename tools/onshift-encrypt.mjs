#!/usr/bin/env node
// Encrypts the On Shift roster so the repo only holds ciphertext, then
// writes the matching key into the page.
//
//   node tools/onshift-encrypt.mjs "/path/to/roster.json"
//
// Writes toybox/on-shift/roster.enc and updates ROSTER_KEY in
// toybox/on-shift/index.html. The key is kept at ~/.config/onshift/key so
// re-running with a changed roster reuses it.
//
// What this does and doesn't do: the names are never in the repo in plain
// text, never in the HTML, and never rendered until someone types a name
// and society — so they don't show up in git grep, view-source, or search
// engines. The key is in the page, so anyone who reads the script can
// decrypt. That's the chosen trade-off: zero friction for execs on the day.
//
// roster.json shape:
//   { "people": [ { "n": "Full Name", "s": ["UQISC"], "role": "President" }, … ],
//     "roster": [ [ ["vb", ["First", "First", …]], … ],  ← one array per block
//                 … ] }

import { webcrypto as crypto } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(here, '..', 'toybox', 'on-shift');
const OUT = join(DIR, 'roster.enc');
const PAGE = join(DIR, 'index.html');
const KEY_FILE = join(homedir(), '.config', 'onshift', 'key');

const src = process.argv[2];
if (!src) { console.error('usage: node tools/onshift-encrypt.mjs <roster.json>'); process.exit(1); }
if (resolve(src).startsWith(resolve(here, '..'))) {
  console.error('refusing: roster.json is inside the repo. Keep the plaintext outside it.'); process.exit(1);
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const unb64u = (s) => new Uint8Array(Buffer.from(s, 'base64url'));

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
writeFileSync(OUT, JSON.stringify({ v: 3, iv: b64u(iv), ct: b64u(ct) }) + '\n');

const page = readFileSync(PAGE, 'utf8');
const re = /const ROSTER_KEY = '[A-Za-z0-9_-]*';/;
if (!re.test(page)) { console.error('could not find ROSTER_KEY in index.html'); process.exit(1); }
writeFileSync(PAGE, page.replace(re, `const ROSTER_KEY = '${keyStr}';`));

console.log(`wrote roster.enc (${data.people.length} people, ${data.roster.length} blocks) and set ROSTER_KEY in index.html`);
