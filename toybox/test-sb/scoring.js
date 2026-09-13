// ============================================================
// Test SB — scoring
// Input: answers {itemId: value}, values state. Output: a result object
// the result page renders. All dimension scores are 0–100.
// ============================================================

const MIXED_SD = 1.15; // keyed-item SD above this → "context-dependent"

const mean = a => a.reduce((s, x) => s + x, 0) / a.length;
const sd = a => { const m = mean(a); return Math.sqrt(mean(a.map(x => (x - m) ** 2))); };
const pct = x => Math.round(x);

function itemsOf(moduleId) { return MODULES.find(m => m.id === moduleId).items; }

// Frequency dimension: mean of keyed items → 0–100, plus consistency flag.
function scoreFreq(moduleId, dim, answers) {
  const its = itemsOf(moduleId).filter(i => i.type === 'freq' && i.dim === dim);
  const keyed = its.filter(i => answers[i.id] !== undefined)
    .map(i => i.dir > 0 ? answers[i.id] : 4 - answers[i.id]);
  if (!keyed.length) return { score: 50, sd: 0, n: 0, mixed: false };
  const s = sd(keyed);
  return { score: pct(mean(keyed) / 4 * 100), sd: +s.toFixed(2), n: keyed.length, mixed: s > MIXED_SD && keyed.length >= 4 };
}

function strengthLabel(score) {
  const d = Math.abs(score - 50);
  if (d < 10) return 'mid-range';
  if (d < 25) return 'lean';
  return 'strong';
}

// Tally choice-type answers by option key.
function tally(moduleId, dim, answers, weightFn) {
  const its = itemsOf(moduleId).filter(i => i.dim === dim);
  const t = {};
  its.forEach(i => {
    const a = answers[i.id];
    if (a === undefined) return;
    if (Array.isArray(a)) a.forEach((k, r) => { t[k] = (t[k] || 0) + (weightFn ? weightFn(r) : 1); });
    else t[a] = (t[a] || 0) + 1;
  });
  return t;
}

// Bradley–Terry via minorisation-maximisation with a light prior so
// undefeated / winless items don't blow up.
function bradleyTerry(ids, matches, iters = 200) {
  const w = {}, games = {}, wins = {};
  ids.forEach(i => { w[i] = 1; wins[i] = 0.5; games[i] = {}; }); // 0.5 prior win vs a phantom average opponent
  matches.forEach(m => {
    wins[m.winner] += 1;
    games[m.a][m.b] = (games[m.a][m.b] || 0) + 1;
    games[m.b][m.a] = (games[m.b][m.a] || 0) + 1;
  });
  for (let it = 0; it < iters; it++) {
    const nw = {};
    ids.forEach(i => {
      let denom = 1 / (w[i] + 1); // phantom opponent of strength 1, one game
      for (const j in games[i]) denom += games[i][j] / (w[i] + w[j]);
      nw[i] = wins[i] / denom;
    });
    const s = mean(ids.map(i => nw[i]));
    ids.forEach(i => { w[i] = nw[i] / s; });
  }
  return w;
}

// ------------------------------------------------------------
function computeResult(state) {
  const A = state.answers;
  const R = { version: 1, computedAt: new Date().toISOString(), name: state.name || '' };

  // state check
  R.state = {};
  itemsOf('state').forEach(i => { R.state[i.dim] = A[i.id]; });

  // M1
  R.m1 = {};
  ['energy', 'attention', 'decision', 'structure'].forEach(d => {
    const s = scoreFreq('m1', d, A);
    const rig = scoreFreq('m1', d + '_rig', A);
    const poles = MODULES.find(m => m.id === 'm1').dims[d].poles;
    R.m1[d] = {
      ...s, poles,
      side: s.score >= 50 ? poles[1] : poles[0],
      strength: strengthLabel(s.score),
      rigidity: rig.score,
      rigid: rig.score >= 60 ? 'rigid' : rig.score <= 40 ? 'flexible' : 'moderate',
    };
  });

  // M2
  R.m2 = { drives: {}, coping: scoreFreq('m2', 'coping', A) };
  DRIVES.forEach(d => { R.m2.drives[d.k] = scoreFreq('m2', d.k, A); });
  R.m2.ranked = DRIVES.map(d => d.k).sort((a, b) => R.m2.drives[b].score - R.m2.drives[a].score);

  // M3
  const first = tally('m3', 'first', A, r => r === 0 ? 2 : 1);
  const firstTotal = Object.values(first).reduce((s, x) => s + x, 0) || 1;
  R.m3 = {
    first: Object.fromEntries(EMOTIONS.map(e => [e.k, pct((first[e.k] || 0) / firstTotal * 100)])),
    second: tally('m3', 'second', A),
    direction: scoreFreq('m3', 'direction', A),
    speed: scoreFreq('m3', 'speed', A),
    recovery: scoreFreq('m3', 'recovery', A),
    expression: scoreFreq('m3', 'expression', A),
  };
  R.m3.topFirst = EMOTIONS.map(e => e.k).sort((a, b) => R.m3.first[b] - R.m3.first[a]);
  const sec = Object.entries(R.m3.second).filter(([k]) => k !== 'same').sort((a, b) => b[1] - a[1]);
  R.m3.topSecond = sec.length ? sec[0][0] : 'same';

  // M4
  R.m4 = {
    timing: scoreFreq('m4', 'timing', A),
    ledger: tally('m4', 'ledger', A),
    grudge: scoreFreq('m4', 'grudge', A),
    assert: scoreFreq('m4', 'assert', A),
    repair: scoreFreq('m4', 'repair', A),
  };
  R.m4.ledgerTop = ['cashin', 'withdraw', 'letgo', 'resent'].sort((a, b) => (R.m4.ledger[b] || 0) - (R.m4.ledger[a] || 0))[0];

  // M5
  R.m5 = {
    anxiety: scoreFreq('m5', 'anxiety', A),
    avoidance: scoreFreq('m5', 'avoidance', A),
    anxStress: scoreFreq('m5', 'anx_stress', A),
    avStress: scoreFreq('m5', 'av_stress', A),
  };
  const hiA = R.m5.anxiety.score >= 55, hiV = R.m5.avoidance.score >= 55;
  R.m5.style = !hiA && !hiV ? 'Secure-leaning' : hiA && !hiV ? 'Anxious-leaning' : !hiA && hiV ? 'Avoidant-leaning' : 'Fearful-avoidant-leaning';

  // M6
  const pairs = tally('m6', 'recv', A);
  R.m6 = { give: {}, receive: {}, absence: {} };
  LANGS.forEach(l => {
    R.m6.give[l.k] = scoreFreq('m6', 'give_' + l.k, A).score;
    const abs = A[itemsOf('m6').find(i => i.dim === 'abs_' + l.k).id];
    R.m6.absence[l.k] = abs === undefined ? 50 : abs / 4 * 100;
    const pairScore = (pairs[l.k] || 0) / 5 * 100;
    R.m6.receive[l.k] = pct(0.6 * pairScore + 0.4 * R.m6.absence[l.k]);
  });
  R.m6.giveRank = LANGS.map(l => l.k).sort((a, b) => R.m6.give[b] - R.m6.give[a]);
  R.m6.recvRank = LANGS.map(l => l.k).sort((a, b) => R.m6.receive[b] - R.m6.receive[a]);
  R.m6.mismatch = R.m6.giveRank[0] !== R.m6.recvRank[0];

  // M7 values
  const V = state.values || {};
  R.m7 = { buckets: V.buckets || {}, shortlist: V.shortlist || [], leaderboard: [], lived: V.lived || {} };
  if (R.m7.shortlist.length && (V.matches || []).length) {
    const bt = bradleyTerry(R.m7.shortlist, V.matches);
    const wins = {};
    V.matches.forEach(m => { wins[m.winner] = (wins[m.winner] || 0) + 1; });
    R.m7.leaderboard = R.m7.shortlist.slice().sort((a, b) => bt[b] - bt[a] || (wins[b] || 0) - (wins[a] || 0))
      .map((id, i) => ({ id, rank: i + 1, strength: +bt[id].toFixed(2), wins: wins[id] || 0,
        lived: R.m7.lived[id], gap: R.m7.lived[id] === undefined ? null : (10 - i) - R.m7.lived[id] }));
  }

  R.signature = signature(R);
  R.archetype = archetype(R);
  R.insights = insights(R);
  return R;
}

// ------------------------------------------------------------
// Signature: the most extreme, consistent dimensions.
function signature(R) {
  const c = [];
  const push = (label, score, mixed, fmt) => { if (!mixed) c.push({ label, extremity: Math.abs(score - 50), text: fmt }); };
  Object.entries(R.m1).forEach(([d, v]) => push(d, v.score, v.mixed, `${v.side} (${v.strength}, ${v.rigid})`));
  DRIVES.forEach(d => push(d.k, R.m2.drives[d.k].score, R.m2.drives[d.k].mixed, `${R.m2.drives[d.k].score >= 50 ? 'High' : 'Low'} ${d.label.toLowerCase()}`));
  push('timing', R.m4.timing.score, R.m4.timing.mixed, R.m4.timing.score >= 50 ? 'Keeps a ledger' : 'Addresses things immediately');
  push('grudge', R.m4.grudge.score, R.m4.grudge.mixed, R.m4.grudge.score >= 50 ? 'Long grudge half-life' : 'Forgives readily');
  push('anxiety', R.m5.anxiety.score, R.m5.anxiety.mixed, R.m5.anxiety.score >= 50 ? 'High attachment anxiety' : 'Low attachment anxiety');
  push('avoidance', R.m5.avoidance.score, R.m5.avoidance.mixed, R.m5.avoidance.score >= 50 ? 'High attachment avoidance' : 'Low attachment avoidance');
  push('direction', R.m3.direction.score, R.m3.direction.mixed, R.m3.direction.score >= 50 ? 'Emotion goes outward' : 'Emotion goes inward');
  push('recovery', R.m3.recovery.score, R.m3.recovery.mixed, R.m3.recovery.score >= 50 ? 'Slow to recover' : 'Quick to recover');
  return c.sort((a, b) => b.extremity - a.extremity).slice(0, 5).filter(x => x.extremity >= 15);
}

const EMO_ADJ = { anger: 'Fiery', sadness: 'Tender', fear: 'Watchful', shame: 'Searching', numb: 'Still', solve: 'Steady' };
const DRIVE_NOUN = { security: 'Sentinel', competence: 'Architect', autonomy: 'Sovereign', connection: 'Anchor', stimulation: 'Explorer', meaning: 'Compass' };
const LEDGER_TAIL = { cashin: 'who keeps score', withdraw: 'who quietly withdraws', letgo: 'who lets it go', resent: 'who carries it quietly' };

function archetype(R) {
  const adj = EMO_ADJ[R.m3.topFirst[0]] || 'Steady';
  const noun = DRIVE_NOUN[R.m2.ranked[0]] || 'Compass';
  const tail = R.m4.timing.score >= 50 ? LEDGER_TAIL[R.m4.ledgerTop] : 'who says it straight away';
  return { name: `The ${adj} ${noun}`, tail, basis: [
    `“${adj}” — your most common first reaction is ${EMOTIONS.find(e => e.k === R.m3.topFirst[0]).label.toLowerCase()}`,
    `“${noun}” — your strongest drive is ${DRIVES.find(d => d.k === R.m2.ranked[0]).label.toLowerCase()}`,
    `“${tail}” — from your conflict timing (${R.m4.timing.score}) and ledger pattern`,
  ]};
}

// ------------------------------------------------------------
// Cross-module insight rules. Each returns a string or null.
function insights(R) {
  const out = [];
  const emoLabel = k => EMOTIONS.find(e => e.k === k).label.toLowerCase();
  const langLabel = k => LANGS.find(l => l.k === k).label.toLowerCase();
  const valName = id => (VALUES.find(v => v.id === id) || {}).name;

  const anger = R.m3.topFirst[0] === 'anger';
  const ledger = R.m4.timing.score >= 60;

  if (ledger && R.m5.anxiety.score >= 60 && anger)
    out.push({ t: 'Pressure cooker', b: 'You bank grievances, you worry about the relationship, and your first reaction is anger. That combination usually means pressure builds silently and comes out bigger than the trigger. The lever is timing, not temper: raising small things early keeps the ledger short.' });
  if (ledger && R.m4.ledgerTop === 'resent')
    out.push({ t: 'Quiet resentment', b: 'When you bank something, it mostly stays banked — you keep being friendly while keeping count. That protects the relationship in the short term and erodes it in the long term, because the other person never gets the chance to fix it.' });
  if (ledger && R.m4.ledgerTop === 'withdraw' && R.m5.avoidance.score >= 55)
    out.push({ t: 'Distance as protest', b: 'Your ledger cashes out as withdrawal rather than confrontation, and your attachment avoidance is high. People may experience you as cooling off without knowing why. Naming the thing once is usually less costly than the slow fade.' });
  if (ledger && R.m4.assert.score <= 40)
    out.push({ t: 'The ledger comes from avoidance, not preference', b: 'You bank things and you find confrontation hard. That suggests the ledger isn\'t a strategy — it\'s what happens when raising it feels unsafe. Working on assertiveness would shrink the ledger without changing your values.' });
  if (anger && ['sadness', 'fear', 'shame'].includes(R.m3.topSecond))
    out.push({ t: 'Anger as cover', b: `Your first reaction is anger, but ten minutes later it's usually ${emoLabel(R.m3.topSecond)}. Anger is doing protective work for a softer feeling. People only see the armour; naming the second feeling tends to get you what you actually need.` });
  if (R.m6.mismatch)
    out.push({ t: 'Give ≠ receive', b: `You express care mostly through ${langLabel(R.m6.giveRank[0])}, but what lands for you is ${langLabel(R.m6.recvRank[0])}. Partners and friends will naturally mirror what you give — so you may be giving the very thing you don't need back, and not asking for the thing you do.` });
  const sec = R.m2.drives.security.score, stim = R.m2.drives.stimulation.score;
  if (sec >= 60 && stim >= 60)
    out.push({ t: 'Both exits from anxiety', b: `Security and stimulation are both high for you — this is the Enneagram 6/7 blur made visible. Both are ways of managing anxiety: one by locking things down, one by moving towards the next thing. Your coping axis (${R.m2.coping.score}/100 towards stimulation) shows which exit you take more often.` });
  else if (sec >= 60 && R.m2.coping.score <= 40)
    out.push({ t: 'Certainty seeker', b: 'Your top pull is security, and when anxious you go towards plans, research, and reassurance. That works until the thing can\'t be known in advance — which is where the anxiety spikes hardest.' });
  else if (stim >= 60 && R.m2.coping.score >= 60)
    out.push({ t: 'Escape by novelty', b: 'Your top pull is stimulation, and when anxious you reach for distraction and the next thing. It genuinely relieves the feeling — and it also means the feeling rarely gets processed.' });
  if (R.m2.drives.competence.score >= 60 && R.m1.decision.score <= 40 && R.m1.decision.rigid === 'rigid')
    out.push({ t: 'Rational, or over-pragmatic?', b: 'High competence drive, strongly logic-based decisions, and low flexibility on that dimension. Being rational is a strength; being unable to switch to a people-first mode when the situation calls for it is what reads as "overly pragmatic" to others.' });
  if (R.m3.recovery.score >= 60 && R.m4.grudge.score >= 60)
    out.push({ t: 'Things stick', b: 'You recover slowly from upsets and you hold grudges. Both point the same way: experiences don\'t fully close for you. Deliberate closure — saying it, writing it, or an explicit decision to be done — matters more for you than for most.' });
  if (R.m5.anxiety.score >= 60 && R.m2.drives.connection.score >= 60)
    out.push({ t: 'A consistent picture', b: 'High attachment anxiety and a high connection drive line up. This isn\'t two separate things — the drive to be wanted and the fear of not being wanted are the same engine seen from two sides.' });
  const mixed = [];
  Object.entries(R.m1).forEach(([d, v]) => { if (v.mixed) mixed.push(d); });
  ['timing', 'grudge', 'assert', 'repair'].forEach(d => { if (R.m4[d].mixed) mixed.push(d); });
  if (R.m5.anxiety.mixed) mixed.push('attachment anxiety');
  if (R.m5.avoidance.mixed) mixed.push('attachment avoidance');
  if (mixed.length)
    out.push({ t: 'Context-dependent dimensions', b: `Your answers disagreed with each other on: ${mixed.join(', ')}. That's not noise — it usually means the behaviour depends on who you're with or what's at stake. A type test would have forced a side; here it's reported honestly.` });
  if (R.m7.leaderboard.length) {
    const gaps = R.m7.leaderboard.slice(0, 5).filter(v => v.lived !== undefined && v.lived <= 4);
    if (gaps.length)
      out.push({ t: 'Values out of alignment', b: `In your top five values, you rated your lived consistency at 4/10 or below for: ${gaps.map(g => valName(g.id)).join(', ')}. In ACT terms this is the gap that matters most — not what you believe, but where your behaviour and your stated values have drifted apart.` });
    else
      out.push({ t: 'Values roughly in alignment', b: 'Your top five values are all ones you rate yourself as living fairly consistently. The biggest gaps are further down the list — worth a look, but not urgent.' });
  }
  return out;
}

// ------------------------------------------------------------
// Tournament pairing: Swiss-style, pairs values with similar records,
// avoiding repeats where possible.
function nextRoundPairs(ids, matches) {
  const wins = {}, played = {};
  ids.forEach(i => { wins[i] = 0; played[i] = new Set(); });
  matches.forEach(m => { wins[m.winner]++; played[m.a].add(m.b); played[m.b].add(m.a); });
  const order = ids.slice().sort((a, b) => wins[b] - wins[a] || Math.random() - 0.5);
  const pairs = [], used = new Set();
  for (const a of order) {
    if (used.has(a)) continue;
    let b = order.find(x => x !== a && !used.has(x) && !played[a].has(x));
    if (!b) b = order.find(x => x !== a && !used.has(x));
    if (!b) break;
    used.add(a); used.add(b);
    pairs.push([a, b]);
  }
  return pairs;
}
