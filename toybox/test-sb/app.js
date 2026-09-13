// ============================================================
// Test SB — app runner
// ============================================================
const LS_STATE = 'testsb_state_v1', LS_HISTORY = 'testsb_history_v1';
const TOTAL_ITEMS = MODULES.reduce((s, m) => s + m.items.length, 0);
const VALUE_MODULE = { id: 'm7', title: 'Values', short: 'Values',
  intro: 'The ACT exercise, done properly. First you\'ll sort every value into a bucket (one tap each). Then you pick your top twelve. Then those twelve go head-to-head in a short tournament to produce a leaderboard. Finally, for your top ten, you\'ll rate how consistently you\'ve actually <em>lived</em> each one in the past month — the gap between importance and lived is the part that matters.' };
const TOURNAMENT_ROUNDS = 7;

const ANCHORS = ['not once this year', 'once or twice', 'about half the time', 'most of the time', 'by default'];
const LEVEL_TPL = [
  sc => `<b>Never</b> — you never ${sc}. Not once in the past year.`,
  sc => `<b>Rarely</b> — once or twice in the year, you ${sc}.`,
  sc => `<b>Sometimes</b> — some of the time, you ${sc}. Maybe half the occasions, or a few times a month.`,
  sc => `<b>Often</b> — most of the time, you ${sc}.`,
  sc => `<b>Almost always</b> — you ${sc} by default. Exceptions are hard to think of.`,
];

let S = load() || fresh();
let dir = 'fwd';

function fresh() {
  return { stage: 'welcome', mi: 0, ii: 0, answers: {}, notes: {}, name: '',
    values: { idx: 0, buckets: {}, shortlist: [], matches: [], pending: [], lived: {}, order: shuffle(VALUES.map(v => v.id)) },
    startedAt: null };
}
function load() { try { return JSON.parse(localStorage.getItem(LS_STATE)); } catch (e) { return null; } }
function save() { try { localStorage.setItem(LS_STATE, JSON.stringify(S)); } catch (e) {} }
function history() { try { return JSON.parse(localStorage.getItem(LS_HISTORY)) || []; } catch (e) { return []; } }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = sel => document.querySelector(sel);
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 1800); }

// ------------------------------------------------------------
// routing & transitions
function go(stage, extra = {}, d = 'fwd') { Object.assign(S, { stage }, extra); dir = d; save(); render(); }

let renderToken = 0;
function render() {
  const app = $('#app');
  const old = app.querySelector('.stage');
  const token = ++renderToken;
  const paint = () => {
    if (token !== renderToken) return;
    app.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'stage ' + (dir === 'back' ? 'back-in' : 'in');
    el.innerHTML = VIEWS[S.stage]();
    app.appendChild(el);
    afterRender(el);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  if (old && !matchMedia('(prefers-reduced-motion: reduce)').matches) { old.classList.add('out'); setTimeout(paint, 170); } else paint();
  updateChrome();
}

function progress() {
  let done = 0;
  for (let i = 0; i < S.mi; i++) done += MODULES[i].items.length;
  done += S.ii;
  const V = S.values;
  const vTotal = VALUES.length + 12 + TOURNAMENT_ROUNDS * 6 + 10;
  let vDone = 0;
  if (S.stage === 'values-shortlist') vDone = VALUES.length;
  if (S.stage === 'values-tournament') vDone = VALUES.length + 12 + V.matches.length;
  if (S.stage === 'values-gap') vDone = VALUES.length + 12 + TOURNAMENT_ROUNDS * 6 + Object.keys(V.lived).length;
  if (S.stage === 'values-bucket') vDone = V.idx;
  if (S.stage === 'results') return 1;
  if (S.stage.startsWith('values')) return (TOTAL_ITEMS + vDone) / (TOTAL_ITEMS + vTotal);
  if (S.stage === 'items' || S.stage === 'intro') return done / (TOTAL_ITEMS + vTotal);
  return 0;
}
function updateChrome() {
  $('#bar i').style.width = (progress() * 100) + '%';
  const tr = $('#topright');
  if (S.stage === 'items' || S.stage === 'intro') tr.innerHTML = `<span class="chip">${esc(MODULES[S.mi].short)}</span>`;
  else if (S.stage.startsWith('values')) tr.innerHTML = `<span class="chip">Values</span>`;
  else if (S.stage === 'results') tr.innerHTML = `<span class="chip teal">Results</span>`;
  else tr.innerHTML = '';
}

// ------------------------------------------------------------
const VIEWS = {
  welcome() {
    const h = history();
    const resumable = S.startedAt && S.stage !== 'welcome';
    const started = S.startedAt;
    return `<div class="card hero reveal">
      <div class="eyebrow">Test SB</div>
      <h1>Sandes'<b>Battery</b></h1>
      <div class="swatches">${['#F1EFE9','#E8E2D5','#DBC5B8','#B6C9D1','#A6AA95','#C3891B','#C2664A','#5C6343','#3C5D6A'].map((c,i)=>`<i style="background:${c};animation-delay:${i*60}ms"></i>`).join('')}</div>
      <p class="lead">One test, eight modules, no letters. Every question asks about what you actually <em>do</em> and how <em>often</em> — so the result is a profile of scores, not a label that changes with your mood. About 40 minutes. Progress saves automatically.</p>
      <div class="modules">
        ${MODULES.slice(1).concat([VALUE_MODULE]).map((m, i) => `<div class="mod ${started && (i + 1 < S.mi || S.stage.startsWith('values') && i < MODULES.length - 1 || S.stage === 'results') ? 'done' : ''}" style="animation-delay:${200 + i * 60}ms"><b>${esc(m.title)}</b><span>${m.items ? m.items.length + ' items' : VALUES.length + ' values'}</span></div>`).join('')}
      </div>
      <div class="btns" style="margin-top:30px">
        ${started ? `<button class="btn" id="resume">Resume</button><button class="btn ghost" id="restart">Start over</button>` : `<input class="name" id="name" placeholder="Your name (optional)" value="${esc(S.name)}"><button class="btn" id="start">Begin</button>`}
        ${h.length ? `<button class="btn ghost" id="lastres">Last result</button>` : ''}
        <button class="btn ghost" id="compare">Compare two results</button>
      </div>
      <p class="stateline">Tip: on any question, swipe or drag the card sideways to add a note about a specific time or a nuance. Notes are included in the export at the end.</p>
    </div>`;
  },

  intro() {
    const m = MODULES[S.mi];
    return `<div class="card intro reveal">
      <div class="eyebrow">${S.mi === 0 ? 'Warm-up' : `Module ${S.mi} of ${MODULES.length}`} <span class="n">· ${m.items.length} items</span></div>
      <h2>${esc(m.title)}</h2>
      <p>${m.intro}</p>
      ${m.window ? `<div class="count">Time window: ${esc(m.window)}</div>` : ''}
      <div class="btns"><button class="btn" id="begin">Start</button>${S.mi > 0 ? '<button class="btn ghost" id="back">Back</button>' : ''}</div>
    </div>`;
  },

  items() {
    const m = MODULES[S.mi], it = m.items[S.ii];
    const n = MODULES.slice(0, S.mi).reduce((s, x) => s + x.items.length, 0) + S.ii + 1;
    const note = S.notes[it.id] || '';
    let body = '';
    const a = S.answers[it.id];
    if (it.type === 'freq') body = `<div class="opts row">${FREQ.map((l, i) => `<button class="opt ${a === i ? 'sel' : ''}" data-v="${i}" data-ex="${i}"><span class="k">${i + 1}</span>${l}<small>${ANCHORS[i]}</small></button>`).join('')}</div>
      ${it.ex ? `<div class="ex" id="ex" data-default="Picture it: you ${esc(it.ex)}.">Picture it: you ${esc(it.ex)}.</div>` : ''}`;
    else if (it.type === 'absence') body = `<div class="opts">${ABSENCE_LABELS.map((l, i) => `<button class="opt ${a === i ? 'sel' : ''}" data-v="${i}"><span class="k">${i + 1}</span>${l}</button>`).join('')}</div>`;
    else if (it.type === 'scale') body = `<div class="scale">${Array.from({ length: 11 }, (_, i) => `<button class="opt ${a === i ? 'sel' : ''}" data-v="${i}">${i}</button>`).join('')}</div><div class="scale-labels"><span>${esc(it.lo)}</span><span>${esc(it.hi)}</span></div>`;
    else if (it.type === 'pick2') body = `<div class="opts">${it.options.map((o, i) => `<button class="opt ${a && a[0] === o.k ? 'first' : a && a[1] === o.k ? 'sel' : ''}" data-k="${o.k}" data-ex="${esc(o.ex || '')}"><span class="k">${i + 1}</span><span class="ol">${o.label}<small>${esc(o.ex || '')}</small></span>${a && a[0] === o.k ? ' <span class="tag">FIRST</span>' : a && a[1] === o.k ? ' <span class="tag">SECOND</span>' : ''}</button>`).join('')}</div>`;
    else if (it.type === 'pick1') body = `<div class="opts">${it.options.map((o, i) => `<button class="opt ${a === o.k ? 'sel' : ''}" data-k="${o.k}"><span class="k">${i + 1}</span><span class="ol">${o.label}<small>${esc(o.ex || '')}</small></span></button>`).join('')}</div>`;
    else if (it.type === 'choice') body = `<div class="opts">${it.opts.map((o, i) => `<button class="opt ${a === o.k ? 'sel' : ''}" data-k="${o.k}"><span class="k">${String.fromCharCode(65 + i)}</span>${o.text}</button>`).join('')}</div>`;
    const sub = it.type === 'pick2' ? 'Pick your <strong>first</strong> reaction, then your <strong>second</strong>. Tap the first again to unselect it.' : it.type === 'absence' ? 'How quickly would you notice, and how much would it matter?' : '';
    return `<div class="card q ${note ? 'has-note' : ''}" id="qcard">
      <div class="eyebrow">${esc(m.short)} <span class="n">${n} / ${TOTAL_ITEMS}</span></div>
      ${m.window && it.type === 'freq' ? `<div class="window">${esc(m.window)}</div>` : ''}
      <div class="qtext">${it.text}</div>
      ${sub ? `<p style="margin:-16px 0 20px;color:var(--muted);font-size:15px">${sub}</p>` : ''}
      ${body}
      <div class="note ${note ? 'open' : ''}" id="note"><label>Note · a specific time, or a nuance</label><textarea id="notetxt" placeholder="e.g. Only true with my family — with friends I'd say the opposite.">${esc(note)}</textarea></div>
      <div class="hint"><span class="swipe"><i></i> swipe or drag to add a note <span style="opacity:.6">· keys 1–5 · N</span></span><span><button class="link" id="back">← back</button>${a !== undefined ? ' · <button class="link" id="next">next →</button>' : ''}</span></div>
    </div>`;
  },

  'values-intro'() {
    return `<div class="card intro reveal">
      <div class="eyebrow">Module 7 of 7 <span class="n">· ${VALUES.length} values</span></div>
      <h2>Values</h2><p>${VALUE_MODULE.intro}</p>
      <div class="btns"><button class="btn" id="begin">Start</button><button class="btn ghost" id="back">Back</button></div></div>`;
  },

  'values-bucket'() {
    const V = S.values, id = V.order[V.idx], v = VALUES.find(x => x.id === id);
    const cur = V.buckets[id];
    return `<div class="card q vcard" id="qcard">
      <div class="eyebrow" style="justify-content:center">Sort <span class="n">${V.idx + 1} / ${VALUES.length}</span></div>
      <h2>${esc(v.name)}</h2><p>${esc(v.def)}</p>
      <div class="opts buckets">
        <button class="opt b0 ${cur === 0 ? 'sel' : ''}" data-v="0"><span class="k">1</span>Very important</button>
        <button class="opt b1 ${cur === 1 ? 'sel' : ''}" data-v="1"><span class="k">2</span>Somewhat</button>
        <button class="opt b2 ${cur === 2 ? 'sel' : ''}" data-v="2"><span class="k">3</span>Not really</button>
      </div>
      <div class="hint" style="justify-content:center"><button class="link" id="back">← back</button></div></div>`;
  },

  'values-shortlist'() {
    const V = S.values;
    const very = VALUES.filter(v => V.buckets[v.id] === 0), some = VALUES.filter(v => V.buckets[v.id] === 1);
    const n = V.shortlist.length, need = Math.min(12, very.length + some.length);
    const chip = v => `<button class="vchip ${V.shortlist.includes(v.id) ? 'on' : n >= need ? 'dim' : ''}" data-id="${v.id}" title="${esc(v.def)}">${esc(v.name)}</button>`;
    return `<div class="card reveal">
      <div class="eyebrow">Shortlist <span class="n">${n} / ${need} chosen</span></div>
      <h2 style="font-size:32px;font-weight:300">Pick your top ${need}.</h2>
      <p style="color:var(--muted)">These go head-to-head next. Hover for definitions.</p>
      <h3 style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--olive);margin-top:22px">Very important · ${very.length}</h3>
      <div class="chips">${very.map(chip).join('')}</div>
      ${very.length < 12 ? `<h3 style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--olive);margin-top:22px">Somewhat · fill the remaining slots</h3><div class="chips">${some.map(chip).join('')}</div>` : ''}
      <div class="btns"><button class="btn" id="begin" ${n < need ? 'disabled' : ''}>Start the tournament</button><button class="btn ghost" id="back">Back</button></div></div>`;
  },

  'values-tournament'() {
    const V = S.values;
    if (!V.pending.length) V.pending = nextRoundPairs(V.shortlist, V.matches);
    const [a, b] = V.pending[0];
    const va = VALUES.find(v => v.id === a), vb = VALUES.find(v => v.id === b);
    const total = TOURNAMENT_ROUNDS * Math.floor(V.shortlist.length / 2);
    return `<div class="card" id="qcard">
      <div class="eyebrow">Tournament <span class="n">${V.matches.length + 1} / ${total}</span></div>
      <div class="qtext">If you could only fully live one of these, which would you keep?</div>
      <div class="vs">
        <button class="opt" data-w="${a}" data-l="${b}"><b>${esc(va.name)}</b><span>${esc(va.def)}</span></button>
        <div class="or">or</div>
        <button class="opt" data-w="${b}" data-l="${a}"><b>${esc(vb.name)}</b><span>${esc(vb.def)}</span></button>
      </div>
      <div class="hint"><span>Keys: 1 = left, 2 = right</span><button class="link" id="back">← undo</button></div></div>`;
  },

  'values-gap'() {
    const R = computeResult(S);
    const top = R.m7.leaderboard.slice(0, 10);
    return `<div class="card reveal">
      <div class="eyebrow">Lived vs. held</div>
      <h2 style="font-size:32px;font-weight:300">Your top ten. In the <em style="color:var(--terra);font-style:normal">past month</em>, how consistently have you actually lived each one?</h2>
      <p style="color:var(--muted)">0 = not at all, 10 = completely. Be honest — the gap is the point.</p>
      <div style="margin-top:10px">${top.map(v => { const val = VALUES.find(x => x.id === v.id); const cur = S.values.lived[v.id];
        return `<div class="gaprow"><div class="rk">${v.rank}</div><div><b>${esc(val.name)}</b> <span style="color:var(--muted);font-size:14px">— ${esc(val.def)}</span>
          <div class="scale" data-id="${v.id}">${Array.from({ length: 11 }, (_, i) => `<button class="opt ${cur === i ? 'sel' : ''}" data-v="${i}">${i}</button>`).join('')}</div></div></div>`; }).join('')}</div>
      <div class="btns"><button class="btn" id="finish" ${top.every(v => S.values.lived[v.id] !== undefined) ? '' : 'disabled'}>See my results</button><button class="btn ghost" id="back">Back</button></div></div>`;
  },

  results() { return renderResults(S.result || (S.result = computeResult(S))); },
  compare() { return renderCompare(); },
};

// ------------------------------------------------------------
function afterRender(el) {
  const on = (sel, fn) => { const n = el.querySelector(sel); if (n) n.addEventListener('click', fn); };
  on('#start', () => { S.name = ($('#name') || {}).value || ''; S.startedAt = new Date().toISOString(); go('intro', { mi: 0, ii: 0 }); });
  on('#resume', () => { dir = 'fwd'; render(); });
  on('#restart', () => { if (confirm('Start over? Your in-progress answers will be cleared (past results are kept).')) { S = fresh(); save(); render(); } });
  on('#lastres', () => { const h = history(); S.result = h[h.length - 1]; go('results'); });
  on('#compare', () => go('compare'));

  if (S.stage === 'intro') { on('#begin', () => go('items', { ii: 0 })); on('#back', () => { S.mi--; S.ii = MODULES[S.mi].items.length - 1; go('items', {}, 'back'); }); }
  if (S.stage === 'items') bindItem(el);
  if (S.stage === 'values-intro') { on('#begin', () => go('values-bucket')); on('#back', () => { S.mi = MODULES.length - 1; S.ii = MODULES[S.mi].items.length - 1; go('items', {}, 'back'); }); }
  if (S.stage === 'values-bucket') {
    el.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => { flash(b); S.values.buckets[S.values.order[S.values.idx]] = +b.dataset.v; advanceValue(); }));
    on('#back', () => { if (S.values.idx > 0) { S.values.idx--; go('values-bucket', {}, 'back'); } else go('values-intro', {}, 'back'); });
    bindSwipe(el, null);
  }
  if (S.stage === 'values-shortlist') {
    el.querySelectorAll('.vchip').forEach(c => c.addEventListener('click', () => { const id = c.dataset.id, L = S.values.shortlist; const i = L.indexOf(id); if (i >= 0) L.splice(i, 1); else L.push(id); save(); dir = 'fwd'; renderInPlace(); }));
    on('#begin', () => { S.values.matches = []; S.values.pending = []; go('values-tournament'); });
    on('#back', () => { S.values.idx = VALUES.length - 1; go('values-bucket', {}, 'back'); });
  }
  if (S.stage === 'values-tournament') {
    el.querySelectorAll('.vs .opt').forEach(b => b.addEventListener('click', () => { flash(b); setTimeout(() => {
      const V = S.values; V.pending.shift(); V.matches.push({ a: b.dataset.w, b: b.dataset.l, winner: b.dataset.w });
      const total = TOURNAMENT_ROUNDS * Math.floor(V.shortlist.length / 2);
      if (V.matches.length >= total) go('values-gap'); else go('values-tournament');
    }, 160); }));
    on('#back', () => { const V = S.values; if (V.matches.length) { const m = V.matches.pop(); V.pending.unshift([m.a, m.b]); go('values-tournament', {}, 'back'); } else go('values-shortlist', {}, 'back'); });
  }
  if (S.stage === 'values-gap') {
    el.querySelectorAll('.scale').forEach(sc => sc.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
      S.values.lived[sc.dataset.id] = +b.dataset.v; save();
      sc.querySelectorAll('.opt').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
      const top = computeResult(S).m7.leaderboard.slice(0, 10);
      $('#finish').disabled = !top.every(v => S.values.lived[v.id] !== undefined);
    })));
    on('#finish', () => { S.result = computeResult(S); const h = history(); h.push(S.result); try { localStorage.setItem(LS_HISTORY, JSON.stringify(h)); } catch (e) {} go('results'); });
    on('#back', () => { const V = S.values; const m = V.matches.pop(); V.pending.unshift([m.a, m.b]); go('values-tournament', {}, 'back'); });
  }
  if (S.stage === 'results') bindResults(el);
  if (S.stage === 'compare') bindCompare(el);
}

function renderInPlace() { const app = $('#app'); const el = app.querySelector('.stage'); el.innerHTML = VIEWS[S.stage](); el.className = 'stage noanim'; afterRender(el); updateChrome(); }
function flash(b) { b.classList.add('sel', 'pulse'); }

function advanceValue() {
  save();
  if (S.values.idx < VALUES.length - 1) { S.values.idx++; go('values-bucket'); }
  else go('values-shortlist');
}

// ---- item binding ----
function bindItem(el) {
  const m = MODULES[S.mi], it = m.items[S.ii];
  const next = () => setTimeout(() => {
    if (S.ii < m.items.length - 1) go('items', { ii: S.ii + 1 });
    else if (S.mi < MODULES.length - 1) go('intro', { mi: S.mi + 1, ii: 0 });
    else go('values-intro');
  }, 190);
  const set = v => { S.answers[it.id] = v; save(); };
  const opts = el.querySelectorAll('.opt');
  opts.forEach(b => b.addEventListener('click', () => {
    if (it.type === 'pick2') {
      const k = b.dataset.k, a = S.answers[it.id];
      if (!a) { set([k]); renderInPlace(); return; }
      if (a.length === 1) {
        if (a[0] === k) { delete S.answers[it.id]; save(); renderInPlace(); return; } // unselect first
        set([a[0], k]); flash(b); next(); return;
      }
      // both chosen (user came back): tap first → clear all; tap second → drop it; tap other → replace second
      if (a[0] === k) { delete S.answers[it.id]; save(); renderInPlace(); return; }
      if (a[1] === k) { set([a[0]]); renderInPlace(); return; }
      set([a[0], k]); renderInPlace(); return;
    }
    opts.forEach(x => x.classList.remove('sel'));
    flash(b);
    set(b.dataset.v !== undefined ? +b.dataset.v : b.dataset.k);
    next();
  }));
  el.querySelector('#back').addEventListener('click', () => {
    if (S.ii > 0) go('items', { ii: S.ii - 1 }, 'back');
    else go('intro', {}, 'back');
  });
  const nx = el.querySelector('#next'); if (nx) nx.addEventListener('click', () => next());
  const ex = el.querySelector('#ex');
  if (ex && it.ex) {
    const show = i => { ex.innerHTML = LEVEL_TPL[i](esc(it.ex)); ex.classList.add('hot'); };
    const reset = () => { ex.textContent = ex.dataset.default; ex.classList.remove('hot'); };
    opts.forEach(b => { b.addEventListener('mouseenter', () => show(+b.dataset.ex)); b.addEventListener('focus', () => show(+b.dataset.ex)); b.addEventListener('mouseleave', reset); b.addEventListener('blur', reset); });
  }
  const ta = el.querySelector('#notetxt');
  ta.addEventListener('input', () => { S.notes[it.id] = ta.value; save(); el.querySelector('#qcard').classList.toggle('has-note', !!ta.value.trim()); });
  bindSwipe(el, () => { const n = el.querySelector('#note'); n.classList.toggle('open'); if (n.classList.contains('open')) setTimeout(() => ta.focus(), 200); });
}

// swipe / drag on the card → toggle note drawer (or bucket shortcut on values)
function bindSwipe(el, onSwipe) {
  const card = el.querySelector('#qcard'); if (!card) return;
  let x0 = null, y0 = null, dx = 0, active = false;
  card.addEventListener('pointerdown', e => { if (e.target.closest('button,textarea')) return; x0 = e.clientX; y0 = e.clientY; dx = 0; active = true; card.setPointerCapture(e.pointerId); });
  card.addEventListener('pointermove', e => { if (!active) return; dx = e.clientX - x0; if (Math.abs(e.clientY - y0) > 40 && Math.abs(dx) < 20) { active = false; card.style.transform = ''; return; } card.classList.add('dragging'); card.style.transform = `translateX(${dx * 0.35}px) rotate(${dx * 0.01}deg)`; });
  const end = () => { if (!active) return; active = false; card.classList.remove('dragging'); card.style.transform = ''; if (Math.abs(dx) > 70 && onSwipe) onSwipe(dx); };
  card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
}

// keyboard
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
  const el = $('#app .stage'); if (!el) return;
  if (e.key === 'Backspace' || e.key === 'ArrowLeft') { const b = el.querySelector('#back'); if (b) { e.preventDefault(); b.click(); } return; }
  if (e.key === 'Enter' || e.key === 'ArrowRight') { const b = el.querySelector('#begin,#next,#start,#resume,#finish'); if (b && !b.disabled) { e.preventDefault(); b.click(); } return; }
  if (e.key === 'n' && S.stage === 'items') { const n = el.querySelector('#note'); if (n) { n.classList.toggle('open'); if (n.classList.contains('open')) el.querySelector('#notetxt').focus(); } return; }
  const opts = [...el.querySelectorAll('.opts .opt, .scale .opt, .vs .opt')].filter(o => !o.closest('.gaprow'));
  if (!opts.length) return;
  let idx = -1;
  if (/^[0-9]$/.test(e.key)) idx = el.querySelector('.scale') && !el.querySelector('.vs') ? +e.key : +e.key - 1;
  else if (/^[a-dA-D]$/.test(e.key) && el.querySelector('.opt .k')) idx = e.key.toUpperCase().charCodeAt(0) - 65;
  if (idx >= 0 && idx < opts.length) opts[idx].click();
});

// ------------------------------------------------------------
// RESULTS
const langLabel = k => LANGS.find(l => l.k === k).label;
const emoLabel = k => k === 'same' ? 'the same feeling' : EMOTIONS.find(e => e.k === k).label;
const driveLabel = k => DRIVES.find(d => d.k === k).label;
const valName = id => (VALUES.find(v => v.id === id) || { name: id }).name;
const flagHtml = s => s.mixed ? ` <span class="flag">context-dependent</span>` : '';

function bipolar(v, label) {
  return `<div class="bp"><div class="lbl"><span>${esc(v.poles[0])}</span><b>${esc(label)}</b><span>${esc(v.poles[1])}</span></div>
    <div class="track"><div class="dot" data-left="${v.score}%"></div></div>
    <div class="meta"><span class="chip ${v.strength === 'strong' ? 'teal' : v.strength === 'lean' ? 'sage' : ''}">${esc(v.side)} · ${v.strength}</span><span class="chip ${v.rigid === 'rigid' ? 'terra' : v.rigid === 'flexible' ? 'mustard' : ''}">${v.rigid} (${v.rigidity})</span>${v.mixed ? '<span class="chip">context-dependent</span>' : ''}</div></div>`;
}
function axis(score, lo, hi, label, s) {
  return `<div class="bp"><div class="lbl"><span>${esc(lo)}</span><b>${esc(label)}</b><span>${esc(hi)}</span></div><div class="track"><div class="dot" data-left="${score}%"></div></div>${s && s.mixed ? '<div class="meta"><span class="chip">context-dependent</span></div>' : ''}</div>`;
}
function ubar(label, score, cls = '', extra = '') {
  return `<div class="ub ${cls}"><div class="lbl"><span style="color:var(--ink);font-family:var(--body)">${label}</span><span>${score}${extra}</span></div><div class="track"><div class="fill" data-w="${score}%"></div></div></div>`;
}

function renderResults(R) {
  const stateLine = R.state && R.state.stress !== undefined ? `<div class="stateline">Taken ${new Date(R.computedAt).toLocaleDateString()} · state check: stress ${R.state.stress}/10, sleep ${R.state.sleep}/10, mood ${R.state.mood}/10${R.name ? ' · ' + esc(R.name) : ''}</div>` : '';
  const h = history();
  const prev = h.length >= 2 && R === h[h.length - 1] ? h[h.length - 2] : null;
  return `<div class="res">
    <div class="card arch reveal">
      <div class="eyebrow">Your archetype</div>
      <h1>The <b>${esc(R.archetype.name.replace('The ', ''))}</b></h1>
      <div class="tail">${esc(R.archetype.tail)}</div>
      <ul>${R.archetype.basis.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      <h3>Signature — your most extreme, consistent traits</h3>
      <div class="sig">${R.signature.length ? R.signature.map(s => `<span class="chip">${esc(s.text)}</span>`).join('') : '<span class="chip">Mostly mid-range — you flex a lot depending on context</span>'}</div>
      ${stateLine}
    </div>

    <div class="card" style="animation-delay:120ms"><h2>Insights</h2><p class="sub">Rule-based readings that cross modules. Treat them as hypotheses to check against your own experience.</p>
      <div class="ins">${R.insights.map(i => `<div><b>${esc(i.t)}</b><p>${esc(i.b)}</p></div>`).join('')}</div></div>

    <div class="card" style="animation-delay:180ms"><h2>Temperament</h2><p class="sub">Where you sit on each spectrum, how strongly, and whether you can flex to the other side when needed.</p>
      ${['energy', 'attention', 'decision', 'structure'].map(d => bipolar(R.m1[d], d)).join('')}</div>

    <div class="card" style="animation-delay:240ms"><h2>Motivation & fear</h2><p class="sub">Six drives, scored independently. Each drive's shadow is the fear next to it.</p>
      ${R.m2.ranked.map((k, i) => ubar(`${driveLabel(k)} <span style="color:var(--muted);font-size:13px">· fears ${DRIVES.find(d => d.k === k).fear}</span>`, R.m2.drives[k].score, ['teal', 'olive', 'mustard', 'sage', 'sky', 'terra'][i], R.m2.drives[k].mixed ? ' ⚠' : '')).join('')}
      <h3>When anxious, you go towards…</h3>${axis(R.m2.coping.score, 'Certainty & reassurance', 'Stimulation & distraction', '', R.m2.coping)}</div>

    <div class="card" style="animation-delay:300ms"><h2>Emotional default</h2><p class="sub">First reaction across eight bad-news scenarios (first pick weighted double), then the feeling underneath.</p>
      ${R.m3.topFirst.map((k, i) => ubar(emoLabel(k), R.m3.first[k], ['terra', 'teal', 'mustard', 'olive', 'sage', 'sky'][i], '%')).join('')}
      <p style="margin-top:14px">Ten minutes later, the feeling underneath is most often <b>${esc(emoLabel(R.m3.topSecond))}</b>.</p>
      ${axis(R.m3.direction.score, 'Turns inward (self-blame)', 'Turns outward (blame, act)', 'Direction', R.m3.direction)}
      ${axis(R.m3.speed.score, 'Slow burn', '0 to 60', 'Speed', R.m3.speed)}
      ${axis(R.m3.recovery.score, 'Recovers fast', 'Stays with you', 'Recovery', R.m3.recovery)}
      ${axis(R.m3.expression.score, 'Hides it', 'Shows it', 'Expression', R.m3.expression)}</div>

    <div class="card" style="animation-delay:360ms"><h2>Conflict, grievance & repair</h2>
      ${axis(R.m4.timing.score, 'Says it immediately', 'Keeps a ledger', 'Timing', R.m4.timing)}
      <h3>What happens to things you bank</h3>
      ${['cashin', 'withdraw', 'letgo', 'resent'].map(k => ubar({ cashin: 'Cash it in later (comes out in an argument)', withdraw: 'Quietly withdraw', letgo: 'Genuinely let it go', resent: 'Stay friendly, keep count' }[k], Math.round((R.m4.ledger[k] || 0) / 6 * 100), k === R.m4.ledgerTop ? 'terra' : 'sage', '%')).join('')}
      ${axis(R.m4.grudge.score, 'Forgives readily', 'Long grudge half-life', 'Grudges', R.m4.grudge)}
      ${axis(R.m4.assert.score, 'Avoids confrontation', 'Confronts comfortably', 'Assertiveness', R.m4.assert)}
      ${axis(R.m4.repair.score, 'Waits it out', 'Reaches out first', 'Repair', R.m4.repair)}</div>

    ${R.bounds ? `<div class="card" style="animation-delay:390ms"><h2>Boundaries</h2><p class="sub"><span class="flag">${esc(R.bounds.read.t)}</span> ${esc(R.bounds.read.b)}</p>
      ${axis(R.bounds.setting.score, 'Goes along', 'States the limit', 'Setting', R.bounds.setting)}
      ${axis(R.bounds.holding.score, 'Folds when pushed', 'Holds when pushed', 'Holding', R.bounds.holding)}
      ${axis(R.bounds.cost.score, 'Costs you nothing', 'Shorting yourself', 'Cost', R.bounds.cost)}
      <h3>When you give way, it's usually because…</h3>
      ${['fine', 'ease', 'fear', 'owed'].map(k => ubar({ fine: 'It genuinely didn\'t matter', ease: 'Pushing back wasn\'t worth the effort', fear: 'Worry about how they\'d see you', owed: 'A sense of owing it / no right to refuse' }[k], Math.round((R.bounds.why[k] || 0) / 6 * 100), k === R.bounds.whyTop ? 'terra' : 'sage', '%')).join('')}</div>` : ''}

    <div class="card" style="animation-delay:420ms"><h2>Attachment & closeness</h2><p class="sub">Two axes, not four boxes. The label is only a shorthand for where you sit.</p>
      ${ubar('Anxiety (worry about being left; need for reassurance)' + flagHtml(R.m5.anxiety), R.m5.anxiety.score, 'terra')}
      ${ubar('Avoidance (discomfort with closeness and depending)' + flagHtml(R.m5.avoidance), R.m5.avoidance.score, 'teal')}
      <div class="quad">${['Secure-leaning', 'Anxious-leaning', 'Avoidant-leaning', 'Fearful-avoidant-leaning'].map(s => `<div class="${R.m5.style === s ? 'on' : ''}">${s}</div>`).join('')}</div>
      <p style="color:var(--muted);font-size:15px;margin:8px 0 0">Under stress: anxiety-type responses ${R.m5.anxStress.score}/100, avoidance-type responses ${R.m5.avStress.score}/100. ${R.m5.anxStress.score > R.m5.avStress.score + 15 ? 'You move towards people when stressed.' : R.m5.avStress.score > R.m5.anxStress.score + 15 ? 'You move away from people when stressed.' : 'You do a bit of both when stressed.'}</p></div>

    <div class="card" style="animation-delay:480ms"><h2>Love languages, split</h2>
      ${R.m6.mismatch ? `<p class="sub"><span class="flag">mismatch</span> You give <b>${esc(langLabel(R.m6.giveRank[0]).toLowerCase())}</b> most, but <b>${esc(langLabel(R.m6.recvRank[0]).toLowerCase())}</b> is what lands for you.</p>` : `<p class="sub">Your top language is the same both ways: <b>${esc(langLabel(R.m6.giveRank[0]).toLowerCase())}</b>.</p>`}
      <div class="two"><div><h3>Expressive — what you give</h3>${R.m6.giveRank.map((k, i) => ubar(langLabel(k), R.m6.give[k], i === 0 ? 'terra' : 'sage')).join('')}</div>
      <div><h3>Receptive — what lands</h3>${R.m6.recvRank.map((k, i) => ubar(langLabel(k), R.m6.receive[k], i === 0 ? 'teal' : 'sky')).join('')}</div></div></div>

    <div class="card" style="animation-delay:540ms"><h2>Values</h2><p class="sub">Leaderboard from the tournament. The number on the right is how consistently you said you've <em>lived</em> it this past month; red marks the biggest gaps.</p>
      <div class="lb">${R.m7.leaderboard.map(v => `<div><span class="rk">${v.rank}</span><span>${esc(valName(v.id))}</span><span class="lived ${v.lived !== undefined && v.gap >= 4 ? 'gap' : ''}">${v.lived !== undefined ? 'lived ' + v.lived + '/10' : ''}</span></div>`).join('')}</div>
      <p style="color:var(--muted);font-size:14px;margin-top:14px">Also "very important" but outside the top 12: ${VALUES.filter(v => R.m7.buckets[v.id] === 0 && !R.m7.shortlist.includes(v.id)).map(v => esc(v.name)).join(', ') || 'none'}.</p></div>

    ${prev ? `<div class="card" style="animation-delay:600ms"><h2>Retest — what moved since last time</h2><p class="sub">Previous: ${new Date(prev.computedAt).toLocaleDateString()} (stress ${prev.state.stress}, sleep ${prev.state.sleep}, mood ${prev.state.mood}). Changes of 15+ points listed.</p>${retestDiff(prev, R)}</div>` : ''}

    <div class="card" style="animation-delay:660ms"><h2>Take it further</h2><p class="sub">Export your full answers — including your notes — as a structured prompt to paste into an LLM for a deeper, more nuanced read.</p>
      <div class="btns"><button class="btn" id="copyprompt">Copy LLM prompt</button><button class="btn teal" id="dljson">Download result (.json)</button><button class="btn ghost" id="showprompt">Preview prompt</button><button class="btn ghost" id="retake">Retake</button><button class="btn ghost" id="home">Home</button></div>
      <div id="promptbox" style="margin-top:18px" hidden><pre class="prompt" id="prompttxt"></pre></div>
      <p class="stateline">For a stable read, retake in ~3 weeks — the retest section will show what actually moved and whether your state check explains it.</p></div>
  </div>`;
}

function retestDiff(P, R) {
  const rows = [];
  const cmp = (label, a, b) => { if (a === undefined || b === undefined) return; const d = b - a; if (Math.abs(d) >= 15) rows.push(`<tr><td>${label}</td><td class="n">${a}</td><td>${b}</td><td style="color:${d > 0 ? 'var(--teal)' : 'var(--terra)'}">${d > 0 ? '+' : ''}${d}</td></tr>`); };
  ['energy', 'attention', 'decision', 'structure'].forEach(d => cmp('Temperament · ' + d, P.m1[d].score, R.m1[d].score));
  DRIVES.forEach(d => cmp('Drive · ' + d.label, P.m2.drives[d.k].score, R.m2.drives[d.k].score));
  ['direction', 'speed', 'recovery', 'expression'].forEach(d => cmp('Emotion · ' + d, P.m3[d].score, R.m3[d].score));
  ['timing', 'grudge', 'assert', 'repair'].forEach(d => cmp('Conflict · ' + d, P.m4[d].score, R.m4[d].score));
  cmp('Attachment anxiety', P.m5.anxiety.score, R.m5.anxiety.score); cmp('Attachment avoidance', P.m5.avoidance.score, R.m5.avoidance.score);
  if (P.bounds && R.bounds) ['setting', 'holding', 'cost'].forEach(d => cmp('Boundaries · ' + d, P.bounds[d].score, R.bounds[d].score));
  return rows.length ? `<table class="tbl"><tr><th>Dimension</th><th>Then</th><th>Now</th><th>Δ</th></tr>${rows.join('')}</table>` : '<p>Nothing moved by 15 points or more — a stable profile.</p>';
}

function bindResults(el) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.querySelectorAll('.dot').forEach(d => { d.style.left = d.dataset.left; });
    el.querySelectorAll('.fill').forEach(f => { f.style.width = f.dataset.w; });
  }));
  const R = S.result;
  const on = (sel, fn) => { const n = el.querySelector(sel); if (n) n.addEventListener('click', fn); };
  on('#copyprompt', async () => { const p = buildPrompt(R, S); try { await navigator.clipboard.writeText(p); toast('Prompt copied to clipboard'); } catch (e) { $('#promptbox').hidden = false; $('#prompttxt').textContent = p; toast('Select and copy from the preview'); } });
  on('#showprompt', () => { const b = $('#promptbox'); b.hidden = !b.hidden; $('#prompttxt').textContent = buildPrompt(R, S); });
  on('#dljson', () => { const blob = new Blob([JSON.stringify({ result: R, answers: S.answers, notes: S.notes }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `test-sb-${(R.name || 'result').replace(/\W+/g, '-').toLowerCase()}-${R.computedAt.slice(0, 10)}.json`; a.click(); });
  on('#retake', () => { if (confirm('Start a fresh run? This result is saved in history.')) { const name = S.name; S = fresh(); S.name = name; save(); render(); } });
  on('#home', () => go('welcome'));
}

// ------------------------------------------------------------
// LLM prompt export
function answerLabel(it, a) {
  if (a === undefined) return '(unanswered)';
  if (it.type === 'freq') return FREQ[a];
  if (it.type === 'absence') return ABSENCE_LABELS[a];
  if (it.type === 'scale') return `${a}/10`;
  if (it.type === 'pick2') return `first: ${emoLabel(a[0])}${a[1] ? '; second: ' + emoLabel(a[1]) : ''}`;
  if (it.type === 'pick1') return emoLabel(a);
  if (it.type === 'choice') return (it.opts.find(o => o.k === a) || {}).text || a;
  return String(a);
}
const strip = s => String(s).replace(/<[^>]+>/g, '');

function buildPrompt(R, St) {
  const L = [];
  L.push(`# Test SB: Sandes' Battery — self-report results${R.name ? ' for ' + R.name : ''}`);
  L.push(`Taken ${R.computedAt.slice(0, 10)}. State at time of taking: stress ${R.state.stress}/10, sleep ${R.state.sleep}/10, mood ${R.state.mood}/10.`);
  L.push('');
  L.push('## About this instrument');
  L.push('A self-designed, non-clinical personality battery. Eight modules; every scored item is a concrete behaviour rated by frequency over the past year (Never/Rarely/Sometimes/Often/Almost always), or a forced-choice scenario. Scores are 0–100. "context-dependent" means the person\'s answers on that dimension disagreed with each other (high spread), which usually means the behaviour depends on situation. Rigidity = inability to act against one\'s preference when needed.');
  L.push('');
  L.push('## Headline');
  L.push(`Archetype (generated handle): ${R.archetype.name}, ${R.archetype.tail}.`);
  L.push('Signature (most extreme, consistent traits): ' + (R.signature.map(s => s.text).join('; ') || 'mostly mid-range'));
  L.push('');
  L.push('## Scores');
  L.push('### Temperament (0 = left pole, 100 = right pole)');
  Object.entries(R.m1).forEach(([d, v]) => L.push(`- ${d}: ${v.score} (${v.poles[0]} ↔ ${v.poles[1]}) — ${v.side}, ${v.strength}; rigidity ${v.rigidity} (${v.rigid})${v.mixed ? '; context-dependent' : ''}`));
  L.push('### Drives (0–100 each, independent)');
  R.m2.ranked.forEach(k => L.push(`- ${driveLabel(k)}: ${R.m2.drives[k].score}${R.m2.drives[k].mixed ? ' (context-dependent)' : ''}`));
  L.push(`- Anxiety-coping axis: ${R.m2.coping.score} (0 = seeks certainty/reassurance, 100 = seeks stimulation/distraction)`);
  L.push('### Emotional default');
  L.push('- First reaction share across 8 scenarios: ' + R.m3.topFirst.map(k => `${emoLabel(k)} ${R.m3.first[k]}%`).join(', '));
  L.push(`- Feeling underneath ten minutes later (most common): ${emoLabel(R.m3.topSecond)}`);
  L.push(`- Direction ${R.m3.direction.score} (0 inward/self-blame, 100 outward); speed ${R.m3.speed.score} (100 = instant); recovery ${R.m3.recovery.score} (100 = slow); expression ${R.m3.expression.score} (100 = shows it)`);
  L.push('### Conflict, grievance & repair');
  L.push(`- Timing ${R.m4.timing.score} (0 = says it immediately, 100 = keeps a ledger)`);
  L.push('- What happens to banked grievances (count of 6 scenarios): ' + ['cashin', 'withdraw', 'letgo', 'resent'].map(k => `${k} ${R.m4.ledger[k] || 0}`).join(', '));
  L.push(`- Grudge half-life ${R.m4.grudge.score}; assertiveness ${R.m4.assert.score}; repair initiation ${R.m4.repair.score}`);
  if (R.bounds) {
    L.push('### Boundaries');
    L.push(`- Setting ${R.bounds.setting.score} (0 = goes along, 100 = states the limit); holding ${R.bounds.holding.score} (0 = folds when pushed, 100 = holds); cost ${R.bounds.cost.score} (0 = giving way costs nothing, 100 = consistently shorting themselves)`);
    L.push('- Why they gave way (count of 6 scenarios): ' + ['fine', 'ease', 'fear', 'owed'].map(k => `${k} ${R.bounds.why[k] || 0}`).join(', ') + ' (fine = genuinely didn\'t matter; ease = not worth the effort; fear = worry about how they\'d be seen; owed = felt they had no right to refuse)');
    L.push(`- Read: ${R.bounds.read.t} — ${R.bounds.read.b}`);
  }
  L.push('### Attachment');
  L.push(`- Anxiety ${R.m5.anxiety.score}, avoidance ${R.m5.avoidance.score} → ${R.m5.style}. Under stress: anxious-type ${R.m5.anxStress.score}, avoidant-type ${R.m5.avStress.score}.`);
  L.push('### Love languages (split)');
  L.push('- Expressive (gives): ' + R.m6.giveRank.map(k => `${langLabel(k)} ${R.m6.give[k]}`).join(', '));
  L.push('- Receptive (lands): ' + R.m6.recvRank.map(k => `${langLabel(k)} ${R.m6.receive[k]}`).join(', '));
  L.push(`- Mismatch: ${R.m6.mismatch ? 'yes' : 'no'}`);
  L.push('### Values leaderboard (tournament-ranked; lived = self-rated consistency past month, 0–10)');
  R.m7.leaderboard.forEach(v => L.push(`${v.rank}. ${valName(v.id)}${v.lived !== undefined ? ` — lived ${v.lived}/10` : ''}`));
  L.push('Other values marked "very important": ' + (VALUES.filter(v => R.m7.buckets[v.id] === 0 && !R.m7.shortlist.includes(v.id)).map(v => v.name).join(', ') || 'none'));
  L.push('');
  L.push('## Rule-based insights the test generated');
  R.insights.forEach(i => L.push(`- ${i.t}: ${i.b}`));
  L.push('');
  L.push('## Item-level answers (with notes)');
  MODULES.forEach(m => {
    L.push(`### ${m.title}${m.window ? ' — ' + m.window : ''}`);
    m.items.forEach(it => {
      const note = (St.notes || {})[it.id];
      L.push(`- [${it.id}] ${strip(it.text)} → ${answerLabel(it, St.answers[it.id])}${note ? `\n    NOTE: ${note.trim().replace(/\n/g, ' ')}` : ''}`);
    });
  });
  L.push('');
  L.push('## What I\'d like from you');
  L.push('Read this as a self-report with all the usual limits. Then: (1) describe the person you see, in plain language, without leaning on the archetype label; (2) point out contradictions or tensions between modules, and between scores and notes; (3) say what the notes add that the scores miss; (4) suggest three specific questions I should ask myself to test whether this profile is accurate; (5) tell me what the biggest values gap suggests I should do differently this month. Be direct; don\'t flatter.');
  return L.join('\n');
}

// ------------------------------------------------------------
// COMPARE
let CMP = { a: null, b: null };
function renderCompare() {
  const h = history();
  const pick = (side) => `<select id="sel${side}" class="name" style="max-width:none"><option value="">— choose —</option>${h.map((r, i) => `<option value="h${i}">${esc(r.name || 'Unnamed')} · ${r.computedAt.slice(0, 10)}</option>`).join('')}</select>
    <label class="btn ghost sm" style="display:inline-block;margin-top:8px">Load .json<input type="file" accept=".json" id="file${side}" hidden></label>`;
  return `<div class="card reveal"><div class="eyebrow">Compare</div><h2 style="font-size:32px;font-weight:300">Two profiles, side by side.</h2>
    <p style="color:var(--muted)">Pick from past results on this device, or load a result file someone exported.</p>
    <div class="two" style="margin-top:14px"><div><h3 style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--olive)">A</h3>${pick('A')}<div id="nameA" class="stateline"></div></div><div><h3 style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--olive)">B</h3>${pick('B')}<div id="nameB" class="stateline"></div></div></div>
    <div id="cmpout" style="margin-top:22px"></div>
    <div class="btns"><button class="btn ghost" id="home">Home</button></div></div>`;
}
function bindCompare(el) {
  const h = history();
  const setSide = (side, r) => { CMP[side.toLowerCase()] = r; $('#name' + side).textContent = r ? `${r.name || 'Unnamed'} — ${r.archetype.name}` : ''; drawCompare(); };
  ['A', 'B'].forEach(side => {
    el.querySelector('#sel' + side).addEventListener('change', e => { const v = e.target.value; setSide(side, v ? h[+v.slice(1)] : null); });
    el.querySelector('#file' + side).addEventListener('change', e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { const j = JSON.parse(t); setSide(side, j.result || j); } catch (err) { toast('Not a valid result file'); } }); });
  });
  el.querySelector('#home').addEventListener('click', () => go('welcome'));
}
function drawCompare() {
  const out = $('#cmpout'); const { a, b } = CMP;
  if (!a || !b) { out.innerHTML = ''; return; }
  const row = (label, va, vb) => `<tr><td>${label}</td><td>${va}</td><td>${vb}</td></tr>`;
  const rows = [];
  ['energy', 'attention', 'decision', 'structure'].forEach(d => rows.push(row('Temperament · ' + d, `${a.m1[d].side} (${a.m1[d].score}, ${a.m1[d].rigid})`, `${b.m1[d].side} (${b.m1[d].score}, ${b.m1[d].rigid})`)));
  rows.push(row('Top drives', a.m2.ranked.slice(0, 2).map(driveLabel).join(', '), b.m2.ranked.slice(0, 2).map(driveLabel).join(', ')));
  rows.push(row('First reaction', emoLabel(a.m3.topFirst[0]) + ' → ' + emoLabel(a.m3.topSecond), emoLabel(b.m3.topFirst[0]) + ' → ' + emoLabel(b.m3.topSecond)));
  rows.push(row('Emotion direction', a.m3.direction.score >= 50 ? 'outward' : 'inward', b.m3.direction.score >= 50 ? 'outward' : 'inward'));
  rows.push(row('Conflict timing', a.m4.timing.score >= 50 ? `ledger (${a.m4.timing.score}) · ${a.m4.ledgerTop}` : `immediate (${a.m4.timing.score})`, b.m4.timing.score >= 50 ? `ledger (${b.m4.timing.score}) · ${b.m4.ledgerTop}` : `immediate (${b.m4.timing.score})`));
  rows.push(row('Repair initiation', a.m4.repair.score, b.m4.repair.score));
  const bnd = x => x.bounds ? `${x.bounds.read.t} (set ${x.bounds.setting.score} / hold ${x.bounds.holding.score} / cost ${x.bounds.cost.score})` : '—';
  rows.push(row('Boundaries', bnd(a), bnd(b)));
  rows.push(row('Attachment', `${a.m5.style} (anx ${a.m5.anxiety.score} / av ${a.m5.avoidance.score})`, `${b.m5.style} (anx ${b.m5.anxiety.score} / av ${b.m5.avoidance.score})`));
  rows.push(row('Gives', a.m6.giveRank.slice(0, 2).map(langLabel).join(', '), b.m6.giveRank.slice(0, 2).map(langLabel).join(', ')));
  rows.push(row('Needs', a.m6.recvRank.slice(0, 2).map(langLabel).join(', '), b.m6.recvRank.slice(0, 2).map(langLabel).join(', ')));
  const fit = (x, y) => y.m6.recvRank.slice(0, 2).includes(x.m6.giveRank[0]) ? 'yes' : x.m6.giveRank.slice(0, 2).some(k => y.m6.recvRank.slice(0, 3).includes(k)) ? 'partly' : 'no';
  rows.push(row('Does A\'s giving match B\'s needs?', fit(a, b), ''));
  rows.push(row('Does B\'s giving match A\'s needs?', '', fit(b, a)));
  const topA = a.m7.leaderboard.slice(0, 10).map(v => v.id), topB = b.m7.leaderboard.slice(0, 10).map(v => v.id);
  rows.push(row('Values in both top tens', topA.filter(v => topB.includes(v)).map(valName).join(', ') || 'none', ''));
  rows.push(row('Top 5 values', topA.slice(0, 5).map(valName).join(', '), topB.slice(0, 5).map(valName).join(', ')));
  out.innerHTML = `<table class="tbl"><tr><th></th><th>${esc(a.name || 'A')}</th><th>${esc(b.name || 'B')}</th></tr>${rows.join('')}</table>`;
}

// ------------------------------------------------------------
render();
