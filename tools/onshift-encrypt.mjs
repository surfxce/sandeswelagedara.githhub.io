#!/usr/bin/env node
// Encrypts the On Shift roster so the public repo only ever holds ciphertext.
//
//   node tools/onshift-encrypt.mjs "/path/to/roster.json"
//
// Writes toybox/on-shift/roster.enc and prints the exec passcode (and a
// keyed link that skips typing it). The passcode lives at
// ~/.config/onshift/passcode — outside the repo — and is made up on first
// run; re-running with a changed roster reuses it, so what you've already
// sent execs keeps working. To pick your own, write it to that file first.
//
// The AES key is derived from the passcode with PBKDF2 (600k rounds, SHA-256,
// random salt stored alongside the ciphertext). The passcode is four words
// from a 128-word list (~28 bits): plenty for a one-day roster of names,
// not for anything you'd actually call secret.
//
// roster.json shape:
//   { "people": [ { "n": "Full Name", "s": ["UQISC"] }, … ],
//     "roster": [ [ ["vb", ["First", "First", …]], … ],  ← one array per block
//                 … ] }

import { webcrypto as crypto } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '..', 'toybox', 'on-shift', 'roster.enc');
const PASS_FILE = join(homedir(), '.config', 'onshift', 'passcode');
const SITE = 'https://sandeswelagedara.com/toybox/on-shift/';
const ROUNDS = 600000;

const WORDS = ('saffron cumin cardamom clove pepper ginger turmeric nutmeg cinnamon anise fennel mustard sesame tamarind jasmine sandal ' +
  'lantern caravan dhow monsoon bazaar harbour compass silk cotton indigo copper amber ivory pearl coral jade ' +
  'lahore delhi kandy goa cochin malacca muscat kabul samarkand kashgar kathmandu colombo jaffna madras surat basra ' +
  'mango lychee guava papaya jackfruit coconut tamarind lime pomelo date fig pistachio almond cashew walnut raisin ' +
  'tabla sitar veena flute drum conch bell gong lute harp oud sarod ' +
  'tiger peacock elephant camel heron falcon cobra monkey parrot deer crane ibis ' +
  'river delta oasis dune canyon summit valley island reef lagoon strait cape').split(/\s+/).filter((w, i, a) => a.indexOf(w) === i);

const src = process.argv[2];
if (!src) { console.error('usage: node tools/onshift-encrypt.mjs <roster.json>'); process.exit(1); }
if (resolve(src).startsWith(resolve(here, '..'))) {
  console.error('refusing: roster.json is inside the repo. Keep the plaintext outside it.'); process.exit(1);
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const norm = (s) => s.toLowerCase().trim().split(/[\s-]+/).join(' ');

// passcode: reuse if present, else make one
let pass;
if (existsSync(PASS_FILE)) pass = norm(readFileSync(PASS_FILE, 'utf8'));
else {
  const pick = () => WORDS[crypto.getRandomValues(new Uint32Array(1))[0] % WORDS.length];
  pass = [pick(), pick(), pick(), pick()].join(' ');
  mkdirSync(dirname(PASS_FILE), { recursive: true });
  writeFileSync(PASS_FILE, pass + '\n', { mode: 0o600 });
  console.log('new passcode written to', PASS_FILE);
}

const data = JSON.parse(readFileSync(src, 'utf8'));
if (!Array.isArray(data.people) || !Array.isArray(data.roster)) { console.error('roster.json needs "people" and "roster" arrays'); process.exit(1); }

const salt = crypto.getRandomValues(new Uint8Array(16));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ROUNDS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt']);
const raw = await crypto.subtle.exportKey('raw', key);

const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)));

writeFileSync(OUT, JSON.stringify({ v: 2, kdf: 'pbkdf2', rounds: ROUNDS, salt: b64u(salt), iv: b64u(iv), ct: b64u(ct) }) + '\n');
console.log(`wrote ${OUT} (${data.people.length} people, ${data.roster.length} blocks)`);
console.log('\nexec passcode (give this out):\n\n  ' + pass + '\n');
console.log('or a link that skips typing it:\n\n  ' + SITE + '#k=' + b64u(raw) + '\n');
