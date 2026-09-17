// Spice Road Experience — Gemini helpers.
//
// reviewPhoto: watches spice-road/photos. When a public upload lands as "pending", the
// photo goes to Gemini with a short brief and comes back approve / reject /
// unsure. Approved → on the big screen within seconds. Rejected → kept (not
// deleted) so an organiser can overrule from the Desk. Unsure, or any error →
// stays pending for a human. Exec uploads never reach here (they arrive
// already approved).
//
// A kill switch lives at spice-road/config/aiReview (true/false), toggled
// from the Desk. The Gemini key is a Functions secret, never in the repo.
//
// askSpicy: watches spice-road/spicy. The app pushes a question with a
// snapshot of everything it knows (duties, who's where this block, the
// asker's own day, the manual) and Spicy answers from that and nothing else.
// The answer lands on the same row; the notes are dropped once answered so
// the row stays small. Generic answers are cached by question for a day.

import { onValueCreated } from 'firebase-functions/v2/database';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { GoogleGenAI } from '@google/genai';

initializeApp();
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');
// Tried in order; the first one this key can use is remembered for the run.
const MODELS = ['gemini-3-flash', 'gemini-3-flash-preview', 'gemini-3.0-flash', 'gemini-flash-latest'];
let MODEL = MODELS[0];

const BRIEF = `You are reviewing a photo someone submitted to a big screen at a university cultural festival run by student societies (UQISC and UQSLA at the University of Queensland). It is an outdoor daytime-into-evening event on a sports ground: club marquees, food and fundraising stalls, volleyball, football and cricket games, and a performance stage.

Decide whether this photo should go on the big screen for the whole crowd to see.

APPROVE only if BOTH are true:
1. It is clearly from this festival or something like it: people at the event, the grounds, stalls, food, sport, performers, the stage, the crowd, group photos, candid moments. Selfies at the event are fine.
2. It is safe for a general audience: no nudity or sexual content, no violence or injury, no weapons, no drugs or drunkenness as the subject, no hate symbols, gestures or slurs, nobody being mocked or humiliated, no exposed private information (screens, documents, licence plates, phone numbers).

REJECT if it is a screenshot, a meme, mostly text, an advertisement, a photo of a screen, a stock image, clearly taken somewhere else (indoors at home, a different city, a different event), a black/blank/completely blurred frame, or fails the safety test.

UNSURE if you genuinely cannot tell — for example an abstract close-up, or a group indoors that could be a nearby building at the venue.

Answer with JSON only, no prose: {"verdict":"approve"|"reject"|"unsure","reason":"one short sentence a human can act on"}`;

// One call to Gemini: parts in, parsed JSON out. Gemini 3 thinks before it
// answers and those tokens count against the output cap, so the cap is
// generous and thinking is turned down as far as the model allows
// (minimal → low → none). The schema forces the JSON shape. Models are tried
// in order and the first one this key can use is remembered.
async function generate(parts, schema, opts = {}) {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
  const ask = async (model) => {
    const base = { model, contents: [{ role: 'user', parts }] };
    const cfg = { responseMimeType: 'application/json', responseSchema: schema, temperature: opts.temperature ?? 0.1, maxOutputTokens: opts.maxOutputTokens ?? 2048 };
    if (opts.system) cfg.systemInstruction = opts.system;
    for (const level of ['minimal', 'low', null]) {
      try { return await ai.models.generateContent({ ...base, config: level ? { ...cfg, thinkingConfig: { thinkingLevel: level } } : cfg }); }
      catch (e) { const msg = String(e && e.message || e); if (!/thinking/i.test(msg)) throw e; }
    }
    return ai.models.generateContent({ ...base, config: cfg });
  };
  let res, lastErr;
  for (const model of [MODEL, ...MODELS.filter(x => x !== MODEL)]) {
    try { res = await ask(model); MODEL = model; break; }
    catch (e) { lastErr = e; const msg = String(e && e.message || e); if (!/not found|not available|not supported|404|NOT_FOUND|no longer/i.test(msg)) throw e; }
  }
  if (!res) throw lastErr || new Error('No usable Gemini model');
  const raw = (res && res.text) || '';
  let out = {};
  try { out = JSON.parse(raw); } catch { const mm = /\{[\s\S]*\}/.exec(raw); if (mm) { try { out = JSON.parse(mm[0]); } catch {} } }
  return { res, out, raw };
}

export const reviewPhoto = onValueCreated(
  { ref: '/spice-road/photos/{id}', region: 'asia-southeast1', secrets: [GEMINI_API_KEY], memory: '512MiB', timeoutSeconds: 60 },
  async (event) => {
    const id = event.params.id;
    const photo = event.data.val();
    if (!photo || photo.status !== 'pending' || !photo.data) return;

    const db = getDatabase();
    const cfg = (await db.ref('spice-road/config/aiReview').get()).val();
    if (cfg === false) return;                                   // switched off: humans do it

    const ref = db.ref(`spice-road/photos/${id}`);
    const m = /^data:image\/jpeg;base64,(.+)$/.exec(photo.data);
    if (!m) { await ref.child('ai').set({ verdict: 'unsure', reason: 'Not a JPEG data URL', model: MODEL, t: Date.now() }); return; }

    try {
      const schema = { type: 'OBJECT', properties: { verdict: { type: 'STRING', enum: ['approve', 'reject', 'unsure'] }, reason: { type: 'STRING' } }, required: ['verdict', 'reason'] };
      const { res, out, raw } = await generate([{ inlineData: { mimeType: 'image/jpeg', data: m[1] } }, { text: BRIEF }], schema);
      const verdict = ['approve', 'reject', 'unsure'].includes(out.verdict) ? out.verdict : 'unsure';
      const finish = res && res.candidates && res.candidates[0] && res.candidates[0].finishReason;
      const reason = (String(out.reason || '').slice(0, 200)) || ('Could not read the reply' + (finish ? ` (${finish})` : '') + (raw ? ': ' + raw.slice(0, 120) : ': empty'));
      const update = { ai: { verdict, reason, model: MODEL, t: Date.now() } };
      if (verdict === 'approve') { update.status = 'approved'; update.tt = Date.now(); }
      if (verdict === 'reject') { update.status = 'rejected'; update.tt = Date.now(); }
      await ref.update(update);
    } catch (e) {
      // never fail open: leave it pending, say why
      await ref.child('ai').set({ verdict: 'unsure', reason: 'Review failed: ' + String(e && e.message || e).slice(0, 120), model: MODEL, t: Date.now() });
    }
  }
);

// ---------- Spicy ----------
const SPICY_SYSTEM = `You are Spicy, the in-app helper for execs (student volunteers) running the Spice Road Experience festival. Answer using ONLY the notes you are given. Be short, warm and concrete: two or three sentences of plain text, no markdown, no headings, no bullet points. Use first names for other people, but don't greet the asker or use their name — go straight to the answer.
When a question is about a duty, a piece of equipment, or who to talk to, name a specific person to go to and say where they are: the committee head if the notes name one, otherwise whoever is on that duty right now from the "who's where" section (e.g. "Ask Dhyan — he's on Football at the main oval this block"). Never guess a name, time, place or number that isn't in the notes.
If the notes don't really answer the question, say so plainly in one sentence and suggest messaging Sandes; set "sure" to false. Never give phone numbers — say they're under Settings → Emergency. For anything medical or dangerous, say to call 000 first. If the question isn't about the festival or the app, say in one line that you only do festival things.
"show": when the answer involves tapping or finding something in the app that appears in the notes under "Things Spicy can point at", put that one id (the single most useful one) in "show" and the app will spotlight it on screen; otherwise an empty string. Don't describe where the thing is in long detail when you're pointing at it — say what to do with it.
"personal" is true when the answer depends on who is asking — it mentions their own duties, partners, swaps, where they are or what they're doing — and false when any exec would get exactly the same answer (how a feature works, what a duty involves, who a committee head is, who's on a duty this block).`;
const SPICY_DAILY_CAP = 800;
const spicyKey = (q) => { const t = q.toLowerCase().replace(/[’']/g, '').replace(/\bwheres\b/g, 'where is').replace(/\bwhats\b/g, 'what is').replace(/\bwhos\b/g, 'who is').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); let h = 5381; for (const ch of t) h = ((h * 33) ^ ch.charCodeAt(0)) >>> 0; return h.toString(16); };

export const askSpicy = onValueCreated(
  { ref: '/spice-road/spicy/{id}', region: 'asia-southeast1', secrets: [GEMINI_API_KEY], memory: '512MiB', timeoutSeconds: 60 },
  async (event) => {
    const row = event.data.val();
    if (!row || row.a || typeof row.q !== 'string' || !row.q.trim()) return;
    const db = getDatabase();
    const ref = db.ref(`spice-road/spicy/${event.params.id}`);
    const reply = (a, sure, extra = {}) => ref.update({ a: String(a).slice(0, 1200), sure: !!sure, model: MODEL, at: Date.now(), notes: null, hist: null, ...extra });
    const q = row.q.trim().slice(0, 300);
    const notes = typeof row.notes === 'string' ? row.notes.slice(0, 40000) : '';
    const hist = typeof row.hist === 'string' ? row.hist.slice(0, 4000) : '';
    if (!notes) { await reply("Spicy didn't get the notes with that one — try again.", false); return; }

    // a day's budget, so a runaway phone can't run up the bill
    const day = new Date().toISOString().slice(0, 10);
    const used = (await db.ref(`spice-road/spicy-usage/${day}`).transaction(n => (n || 0) + 1)).snapshot.val();
    if (used > SPICY_DAILY_CAP) { await reply("Spicy's had a big day and is resting — message Sandes.", false); return; }

    try {
      const schema = { type: 'OBJECT', properties: { answer: { type: 'STRING' }, sure: { type: 'BOOLEAN' }, personal: { type: 'BOOLEAN' }, show: { type: 'STRING' } }, required: ['answer', 'sure', 'personal', 'show'] };
      const parts = [{ text: `NOTES\n${notes}` }];
      if (hist) parts.push({ text: `EARLIER IN THIS CONVERSATION\n${hist}` });
      parts.push({ text: `QUESTION from ${String(row.by || 'an exec').slice(0, 40)}: ${q}` });
      const { out, raw, res } = await generate(parts, schema, { system: SPICY_SYSTEM, temperature: 0.3, maxOutputTokens: 2048 });
      const answer = String(out.answer || '').trim();
      if (!answer) { const finish = res && res.candidates && res.candidates[0] && res.candidates[0].finishReason; await reply('Spicy lost its words' + (finish ? ` (${finish})` : '') + ' — try asking another way, or message Sandes.', false); return; }
      const sure = out.sure !== false;
      const show = /^[a-z-]{1,40}$/.test(String(out.show || '')) ? out.show : '';
      await reply(answer, sure, { show });
      const blk = Number.isInteger(row.blk) ? row.blk : 'x';
      if (sure && out.personal === false) await db.ref(`spice-road/spicy-cache/${spicyKey(q)}-${blk}`).set({ q, a: answer.slice(0, 1200), show, t: Date.now() });
    } catch (e) {
      await reply('Spicy hit a snag: ' + String(e && e.message || e).slice(0, 120) + ' — message Sandes.', false);
    }
  }
);
