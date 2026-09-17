#!/usr/bin/env node
// Puts exec profile pictures into the roster, then re-encrypts it.
//
//   node tools/onshift-pfp.mjs ["/path/to/Silk Rd App"]
//
// Looks in <dir>/pics/ for images named by first name (Dhyan.jpg, Sanuka.png,
// sanuli.HEIC — case doesn't matter), squares and shrinks each one to 128 px
// with macOS's built-in `sips`, and writes it into <dir>/roster.json as a
// JPEG data URL on that person's `pic`. Then runs onshift-encrypt.mjs so the
// pictures ride inside roster.enc like the names do — nothing lands in the
// repo in the clear. Execs without a picture get initials in the app.
//
// Re-run whenever a photo is added or replaced. A person whose file is
// removed keeps their old picture until you delete `pic` from roster.json.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = resolve(process.argv[2] || join(process.env.HOME, 'Downloads', 'Silk Rd App'));
const rosterPath = join(dir, 'roster.json');
const picsDir = join(dir, 'pics');
if (!existsSync(rosterPath)) { console.error(`no roster.json in ${dir}`); process.exit(1); }
if (!existsSync(picsDir)) { console.error(`no pics folder at ${picsDir} — make it and drop in First.jpg files`); process.exit(1); }

const roster = JSON.parse(readFileSync(rosterPath, 'utf8'));
const byFirst = Object.fromEntries(roster.people.map(p => [p.n.split(' ')[0].toLowerCase(), p]));
const SIZE = 128;
const tmp = mkdtempSync(join(tmpdir(), 'pfp-'));

const files = readdirSync(picsDir).filter(f => /\.(jpe?g|png|heic|webp|gif|tiff?)$/i.test(f));
let done = 0;
for (const f of files) {
  const first = basename(f, extname(f)).trim().toLowerCase();
  const person = byFirst[first];
  if (!person) { console.warn(`skip ${f}: no exec whose first name is "${first}"`); continue; }
  const src = join(picsDir, f), out = join(tmp, first + '.jpg');
  try {
    // scale so the short side is SIZE, then crop the middle to a square
    const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', src], { encoding: 'utf8' });
    const w = Number(/pixelWidth: (\d+)/.exec(dims)[1]), h = Number(/pixelHeight: (\d+)/.exec(dims)[1]);
    const k = SIZE / Math.min(w, h);
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '72', '-z', String(Math.round(h * k)), String(Math.round(w * k)), '-c', String(SIZE), String(SIZE), src, '--out', out], { stdio: 'ignore' });
    person.pic = 'data:image/jpeg;base64,' + readFileSync(out).toString('base64');
    console.log(`${person.n}: ${Math.round(person.pic.length / 1024)} KB`);
    done++;
  } catch (e) { console.warn(`skip ${f}: ${e.message}`); }
}
rmSync(tmp, { recursive: true, force: true });
writeFileSync(rosterPath, JSON.stringify(roster, null, 2) + '\n');
console.log(`${done} picture${done === 1 ? '' : 's'} in roster.json (${roster.people.filter(p => p.pic).length} of ${roster.people.length} execs have one)`);
execFileSync('node', [join(here, 'onshift-encrypt.mjs'), rosterPath], { stdio: 'inherit' });
