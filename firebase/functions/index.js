// Spice Road Experience — AI photo review.
//
// Watches spice-road/photos. When a public upload lands as "pending", the
// photo goes to Gemini with a short brief and comes back approve / reject /
// unsure. Approved → on the big screen within seconds. Rejected → kept (not
// deleted) so an organiser can overrule from the Desk. Unsure, or any error →
// stays pending for a human. Exec uploads never reach here (they arrive
// already approved).
//
// A kill switch lives at spice-road/config/aiReview (true/false), toggled
// from the Desk. The Gemini key is a Functions secret, never in the repo.

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
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });
      // Gemini 3 thinks before it answers and those tokens count against the
      // output cap, so the cap is generous and thinking is turned down. The
      // schema forces the JSON shape.
      const schema = { type: 'OBJECT', properties: { verdict: { type: 'STRING', enum: ['approve', 'reject', 'unsure'] }, reason: { type: 'STRING' } }, required: ['verdict', 'reason'] };
      const ask = async (model) => {
        const base = { model, contents: [{ role: 'user', parts: [{ inlineData: { mimeType: 'image/jpeg', data: m[1] } }, { text: BRIEF }] }] };
        const cfg = { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.1, maxOutputTokens: 2048 };
        try { return await ai.models.generateContent({ ...base, config: { ...cfg, thinkingConfig: { thinkingLevel: 'low' } } }); }
        catch (e) {
          const msg = String(e && e.message || e);
          if (/thinking/i.test(msg)) return ai.models.generateContent({ ...base, config: cfg });   // model doesn't take thinkingConfig
          throw e;
        }
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
