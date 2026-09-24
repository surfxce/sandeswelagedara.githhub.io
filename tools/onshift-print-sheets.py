#!/usr/bin/env python3
"""Printed stall booklets — the plan for when the app is down.

One booklet per society (biggest first), then organisers & logistics. Each
starts with a cover page for the stall table, then one page per exec in
alphabetical order; someone in two societies gets a page in both. A booklet
with an odd page count gets a blank page at the end, so they print
double-sided and split cleanly.

Nobody's page says "check the app": it plans for the worst case, where every
team with execs in it keeps winning. Players are held through the final, and
whoever's free covers their duty — each written as "only if <team> are still
in", so it reads right whichever way the games go.

usage: onshift-print-sheets.py <roster.json> <onshift-build-roster.py> <index.html> <out dir>
Writes <out dir>/booklets.html (all of them, in print order) and one
<out dir>/booklet-<society>.html each.
"""
import json, sys, html, datetime, re, os, collections

d = json.load(open(sys.argv[1]))
src = open(sys.argv[2]).read()
app = open(sys.argv[3]).read()
OUT = sys.argv[4]
os.makedirs(OUT, exist_ok=True)
esc = html.escape

# who ticked setup / pack-up — from the builder's source list
P = {}
for line in src.split('\n'):
    line = line.strip()
    if line.startswith('("') and line.count('"') >= 8:
        parts = eval(line.rstrip(','))
        P[parts[0]] = {'setup': parts[3], 'packup': parts[4]}

DUTY = {
  'vb': ('Volleyball referee', 'Beach volleyball courts'),
  'fb': ('Football referee', 'Field 7 infield — one of Field 1–6'),
  'fb-score': ('Football scores', 'Field 7 sideline, results desk'),
  'ck': ('Cricket', 'Field 7 — umpire, leg umpire or scorer, one game at a time'),
  'tk': ('Ticketing', 'Main entry gate — scan Humanitix QR codes'),
  'st': ('Stage', 'Performance stage — cue acts, keep it clear'),
  'cr-gate': ('Crowd & support', 'Entry gate zone'),
  'cr-lawn': ('Crowd & support', 'Stage lawn'),
  'cr-food': ('Crowd & support', 'Field 6 food row'),
  'cr-gen': ('Crowd & support', 'Generators & cords sweep'),
  'fund-pp': ('Nepal Floods fundraiser', 'Charity marquee — raffle & spin the wheel'),
  'fund-bake': ('UQ Manali Medical Project', 'Charity marquee, Field 6'),
  'logi-biz': ('Logistics — business stalls', 'Walk every business: set up, power, tables, anything missing'),
  'logi': ('Logistics', 'Everywhere — answer calls for help'),
  'play-vb': ('Playing volleyball', 'Beach volleyball courts'),
  'play-fb': ('Playing football', 'Field 7 — group stage'),
  'play-ck': ('Playing cricket', 'Field 7'),
  'perform': ('Performing', 'Performance stage'),
  'prep': ('Getting ready', "Performers' area — your act is next, be side-stage 10 min early"),
  'ck-brief': ('Cricket briefing — you run it', 'Field 7 at 6:10: umpires, scorers, captains; then set out the pitches'),
  'fb-pack': ('Football pack-up', 'Field 7, 6:00 – 6:15: balls, bibs, cones, whistles, pump to logistics'),
  'su-fb': ('Setup — football', 'Field 7, 2:30 – 3:00: mark the pitch edges, balls/bibs/whistles out, teams ready'),
  'su-vb': ('Setup — volleyball', 'Beach courts: three nets, lines, balls and ball bag, draw up'),
  'su-fund': ('Setup — charity stalls', 'Nepal Floods marquee: tables, signage, raffle and wheel, floats'),
  'su-cns': ('1:00 pm — meet at the C&S room', 'Collect the equipment and bring it down to the field'),
  'su-logi': ('1:00 pm — setup with the logistics team', 'Meet logistics on Field 6: marquees, cones, fencing, signage — whatever they need'),
  'su-flex': ('Flexible', 'Check with the committee heads for what needs to be done'),
  'su-biz': ('Setup — business stalls', 'Visit every business: missing anything? good to go by 3:00?'),
  'photo-pres': ("Presidents' photo — you're taking it", 'Stage steps at 4:55, straight after the volleyball final'),
}
def duty(id_):
    if id_.startswith('su-UQ'):
        c = id_[3:]; return (f'{c} stall setup', f'{c} marquee, Field 6 — tables, banner, sign-ups, open by 3:00')
    if id_.startswith('stall-'):
        c = id_[6:]; return (f'{c} stall', f'{c} marquee, Field 6 — visitors, sign-ups, content')
    return DUTY.get(id_, (id_, ''))

kof = lambda p: p.get('k') or p['n'].split()[0]
people = d['people']
BY = {kof(p): p for p in people}
BYNAME = {p['n'].lower(): kof(p) for p in people}
socOf = {kof(p): set(p['s']) for p in people}
NOSTALL = {kof(p): set(p.get('x', [])) for p in people}   # stalls they asked not to be on (never a cover there either)
onsite = lambda f, i: i in set(BY[f].get('a', range(12)))
T = lambda i: f"{3 + i // 2}:{'00' if i % 2 == 0 else '30'}"
span = lambda i: f'{T(i)} – {T(i + 1) if i < 11 else "9:00"}'
MARQUEE = {k: int(v) for k, v in re.findall(r"(UQ\w+): (\d+)", re.search(r"const MARQUEE = \{[^}]+\}", app).group(0))}
full = lambda f: BY[f]['n']
def tel(f):
    t = re.sub(r'\D', '', BY[f].get('t', '') or '')
    return f'{t[:4]} {t[4:7]} {t[7:]}' if len(t) == 10 else (BY[f].get('t') or '')

# ---- the worst case: every team with execs in it keeps winning --------------
# Volleyball exec teams from the app's team lists (named players), plus the
# society teams' players from the roster; they're held for the quarters, semis
# (4:00 – 4:30) and final (4:30 – 5:00). Football: NC's players through the
# semis (5:00) and final (5:30). Cricket is fixed fixtures — nothing changes.
i0 = app.index("    vb: [\n"); i1 = app.index("    fb: [", i0)
VB_TEAMS = [(m.group(2), m.group(3), re.findall(r"'([^']+)'", m.group(4)))
            for m in re.finditer(r"\{ name: ('|\")(.+?)\1,\s*(?:soc: '(\w+)',\s*)?players: \[(.*?)\] \}", app[i0:i1])]
# volleyball: all three first-round games at 3:15 (block 0), quarter-finals
# 3:35 / 3:55 (block 1), semis 3:55 / 4:15, final 4:35 (block 3)
VB_FIRST = {'UQSLA': 0, 'UQISC': 0, 'UQISS': 0, 'Solos': 0, "Ameya's team": 0, "Sargun's team": 0}
team_of = collections.defaultdict(list)       # exec -> [(sport, team)]
for name, soc, players in VB_TEAMS:
    for n in players:
        f = BYNAME.get(n.lower())
        if f: team_of[f].append(('vb', name))
for id_, ps in d['roster'][0] + d['roster'][1]:
    if id_ == 'play-vb':
        for f in ps:
            if not any(sp == 'vb' for sp, _ in team_of[f]):
                t = next((n for n, soc, _ in VB_TEAMS if soc and soc in socOf[f]), None)
                if t: team_of[f].append(('vb', t))
FB = sorted({f for b in d['roster'][:4] for id_, ps in b if id_ == 'play-fb' for f in ps})
for f in FB: team_of[f].append(('fb', next(iter(sorted(socOf[f]))) + ' football'))
HOLD = collections.defaultdict(dict)          # block -> {exec: (sport, team)}
for f, ts in team_of.items():
    for sport, team in ts:
        for i in (range(VB_FIRST.get(team, 1), 4) if sport == 'vb' else (4, 5)):
            HOLD[i].setdefault(f, (sport, team))
ROUND = {0: 'first round', 1: 'quarter-final', 2: 'semi-final', 3: 'final', 4: 'semi-final', 5: 'final'}
NEVER_MOVE = ('perform', 'prep', 'photo-pres', 'ck', 'ck-brief')
# no gap to fill if they go: logistics float, and crowd & support is the
# spare pool anyway
UNCOVERED = ('logi', 'logi-biz', 'free', 'cr-gate', 'cr-lawn', 'cr-food', 'cr-gen')

cond, cover = {}, {}                           # (exec, block) -> details
WORST = []
for i in range(12):
    rows = {id_: list(ps) for id_, ps in d['roster'][i]}
    where = {f: id_ for id_, ps in rows.items() for f in ps}
    vac = []
    for f, (sport, team) in sorted(HOLD[i].items()):
        if not onsite(f, i): continue
        cur = where.get(f, 'free')
        if cur.startswith('play-') or cur in NEVER_MOVE: continue
        if cur in rows: rows[cur].remove(f)
        rows.setdefault('play-' + sport, []).append(f); where[f] = 'play-' + sport
        cond[(f, i)] = (sport, team, cur)
        if cur not in UNCOVERED: vac.append((cur, f, sport, team))
    busy = set(where)
    pool = sorted(g for g in BY if onsite(g, i) and g not in busy)
    for cur, f, sport, team in vac:
        club = cur[6:] if cur.startswith('stall-') else None
        fits = lambda g: not club or (club in socOf[g] and club not in NOSTALL.get(g, ()))
        g = next((g for g in pool if fits(g)), None)
        if g: pool.remove(g)
        else:
            for z, zs in sorted(((z, zs) for z, zs in rows.items() if z.startswith('cr-') and len(zs) > 1), key=lambda x: (-len(x[1]), x[0])):
                g = next((g for g in sorted(zs) if fits(g) and (g, i) not in cover), None)
                if g: zs.remove(g); break
        if g:
            rows.setdefault(cur, []).append(g); cover[(g, i)] = (cur, f, sport, team)
    WORST.append(rows)

# ---- moments -----------------------------------------------------------------
PRES = {'Sanuka', 'Prabhas', 'Jais', 'Devansh', 'Aarya', 'Bhumik', 'Akash'}
# the 6:10 briefing is for whoever umpires or scores the games (6:00 – 8:30);
# not the players, and not the 8:30 pack-down crew
CK = {f for b in d['roster'][6:11] for x, ps in b if x == 'ck' for f in ps}
QR_URL = 'https://sandeswelagedara.com/toybox/on-shift/'
LOGI_ORDER = ['Nandos', 'Archita', 'Mathew', 'Sanuli', 'Devashri', 'Tanisha', 'Prabhas']
SPORT = {'vb': 'volleyball', 'fb': 'football'}
# team photos at each club's marquee (same as MOMENTS in the app): club, block, time, photographer
PHOTOS = [('UQPA', 2, '4:05', 'Joanna'), ('UQISS', 2, '4:20', 'Joanna'), ('UQGS', 4, '5:10', 'Divita'), ('UQPSA', 4, '5:15', 'Divita'),
          ('UQTELS', 4, '5:20', 'Divita'), ('UQSLA', 5, '5:40', 'Krisha'), ('UQISC', 7, '6:35', None), ('UQNAATAK', 7, '6:45', 'Shane'), ('UQNC', 7, '6:50', 'Shane')]

def exec_page(p, soc):
    f = kof(p); rows = []
    su = next(((sid, ps) for sid, ps in d.get('setup', []) if f in ps), None)
    if su: rows.append(('1:00 – 3:00' if su[0] in ('su-cns', 'su-logi') else '2:00 – 3:00', duty(su[0]), [x for x in su[1] if x != f], 'hands'))
    else: rows.append(('2:00 – 3:00', ('Setup', 'Not on your form — come if you can'), [], 'off'))
    if su or onsite(f, 0):
        rows.append(('2:45', ('All execs: performance stage', "Sandes runs through the app, then MJ's speech at 2:50 · then back to setup"), [], 'moment'))
    for i in range(12):
        t = span(i)
        if not onsite(f, i): rows.append((t, ('Not on site', ''), [], 'off')); continue
        base = next(((id_, ps) for id_, ps in d['roster'][i] if f in ps), None)
        if (f, i) in cond:
            sport, team, cur = cond[(f, i)]
            back = 'a break' if cur == 'free' else duty(cur)[0]
            if sport == 'vb' and i == VB_FIRST.get(team, 1):   # everyone plays their first game
                rows.append((t, (f'Playing {SPORT[sport]} — {team}, first game', f'If you\'re not needed on court: {back}'), [], 'play'))
            else:
                rnd = 'final or bronze match (4:35)' if sport == 'vb' and i == 3 else ROUND[i]
                rows.append((t, (f'Playing {SPORT[sport]} — if {team} are still in', f'{rnd.capitalize()} · if they\'re out: {back}'), [], 'play'))
        elif (f, i) in cover:
            cur, who, sport, team = cover[(f, i)]
            nm, wh = duty(cur)
            rows.append((t, (f'Cover for {full(who)} (playing {SPORT[sport]}): {nm}', f'{wh} · only if {team} are still in — otherwise, a break'), [], 'covering'))
        elif base:
            id_, ps = base; mates = [x for x in ps if x != f]
            if id_.startswith('play-'): mates = [x for x in mates if socOf[x] & socOf[f]]
            rows.append((t, duty(id_), mates, 'play' if id_.startswith('play-') or id_ == 'perform' else 'duty'))
        else:
            rows.append((t, ('Break', 'Your time off — enjoy the festival. If anything is short, logistics will find you.'), [], 'free'))
        if i == 3 and f == 'Sandes':
            rows.append(('4:55', ("Presidents' photo — you're taking it", 'Stage steps, straight after the final and the prizes · five minutes'), [], 'moment'))
        if i == 3 and f in PRES:
            rows.append(('4:55', ("Presidents' photo", 'Stage steps, straight after the volleyball final · 5 minutes, then back to your spot'), [], 'moment'))
        cur = rows[-1][1][0]
        backto = 'your break' if cur == 'Break' else cur.split(' — ')[0] if cur.startswith('Playing') else cur
        shots = [(c, at) for c, b, at, by in PHOTOS if b == i and by == f]
        if shots:
            rows.append((shots[0][1], ('Take team photos: ' + ', '.join(f'{c} {at}' for c, at in shots),
                                       f'At each club\'s marquee, Field 6 · 5 minutes each, then back to {backto}'), [], 'moment'))
        for c, b, at, by in PHOTOS:
            if b == i and c in p['s']:
                rows.append((at, (f'{c} team photo', f'{c} marquee, Field 6 · {by + " takes it" if by else "grab anyone nearby to take it"} · 5 minutes, then back to {backto}'), [], 'moment'))
        if i == 6 and f in CK and f != 'Devansh':
            rows.append(('6:10', ('Cricket briefing with Devansh', 'Field 7, by the pitches · set-up and run-through, first game 6:30'), [], 'moment'))
    rows.append(('9:00 – 10:00', ('Pack-up — all hands', 'Strike marquees, bag rubbish, return gear'), [], 'hands' if P.get(p['n'], {}).get('packup') else 'off'))
    trs = []
    for t, (name, where), mates, kind in rows:
        withs = f' · <em class="w">with {esc(", ".join(mates))}</em>' if mates else ''
        sub = f'<span>{esc(where)}{withs}</span>' if where else (f'<span>{withs[3:]}</span>' if withs else '')
        trs.append(f'<tr class="{kind}"><td class="t">{esc(t)}</td><td class="d"><b>{esc(name)}</b>{sub}</td></tr>')
    also = [s for s in p['s'] if s != soc]
    socs = soc + (f' · also in {", ".join(also)}' if also else '')
    return f'''<section class="page">
  <header><div class="eb">Spice Road Experience · Friday 25 September · UQ Athletics Centre</div>
    <h1>{esc(p["n"])}</h1><div class="soc">{esc(socs)}</div></header>
  <table><thead><tr><th>Time</th><th>Duty</th></tr></thead><tbody>{"".join(trs)}</tbody></table>
  {footer()}
</section>'''

def footer():
    return f'''<footer><div class="ft"><b>If the app is working, it's the live version. If it's down, this sheet is the plan.</b>
    Lines saying "if … are still in" depend on how that team's games go.
    <span>Emergency: 000 first, then logistics · Printed {datetime.date.today():%a %d %b}</span></div>
    <div class="qrbox"><div class="qr" data-u="{QR_URL}"></div><small>Live roster</small></div></footer>'''

def hours(p):
    a = sorted(p.get('a', []))
    if not a: return 'setup' if P.get(p['n'], {}).get('setup') else ('pack-up' if P.get(p['n'], {}).get('packup') else '—')
    runs, s0 = [], a[0]
    for x, y in zip(a, a[1:] + [None]):
        if y != x + 1: runs.append(f'{T(s0)}–{T(x + 1) if x < 11 else "9:00"}'); s0 = y
    extra = [w for w, k in (('setup', 'setup'), ('pack-up', 'packup')) if P.get(p['n'], {}).get(k)]
    return ', '.join(runs) + (f' · {" & ".join(extra)}' if extra else '')

ROUTES = '''<svg class="routes" viewBox="0 0 800 1130" fill="none" stroke="#C9A77A" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round" aria-hidden="true">
  <path d="M-20 980 C 140 900, 260 1040, 430 950 S 700 830, 830 900"/>
  <path d="M-20 230 C 130 300, 250 180, 400 250 S 640 330, 830 200"/>
</svg>'''

def cover_page(soc, members, title=None, sub=None):
    big = title or soc
    grid = ''
    if soc.startswith('UQ') and not title:
        cells = []
        for i in range(12):
            base = next((ps for id_, ps in d['roster'][i] if id_ == 'stall-' + soc), [])
            away = {f for f in base if (f, i) in cond}
            names = ', '.join(esc(f) + ('*' if f in away else '') for f in base) or '<i>nobody rostered</i>'
            cells.append(f'<tr><td class="t">{span(i)}</td><td>{names}</td></tr>')
        grid = f'''<h3>Who's on the stall</h3><table class="grid">{"".join(cells)}</table>
      <p class="note">* might be away playing — whoever covers them has it on their page.</p>'''
    idx = ''.join(f'<li><b>{esc(p["n"])}</b><span>{esc(hours(p))}</span></li>' for p in members)
    logi = ''.join(f'<li><b>{esc(full(f))}</b><span>{esc(tel(f))}</span></li>' for f in LOGI_ORDER if f in BY)
    where = f'Marquee {MARQUEE[soc]} · Field 6' if soc in MARQUEE else (sub or '')
    return f'''<section class="page cover">{ROUTES}
  <div class="qrbig"><div class="qr" data-u="{QR_URL}"></div><small>Live roster — scan when there's signal</small></div>
  <div class="cv-top"><div class="eb">UQSLA × UQISC · Friday 25 September · UQ Athletics Centre</div>
    <div class="kick">Spice Road Experience</div>
    <h1 class="cv">{esc(big)}</h1>
    <div class="cv-sub">Stall booklet · {esc(where)} · {len(members)} exec{"s" if len(members) != 1 else ""}</div></div>
  <div class="cv-cols">
    <div>{grid or '<h3>How this booklet works</h3><p class="lead">One page per person, their whole day: setup, every half hour, pack-up. Green is playing, amber is covering for someone who might still be playing.</p>'}</div>
    <div class="side">
      <div class="box"><h3>If the app is down</h3><p>Follow these pages — every exec has their whole day. Need a swap or more hands? Find logistics. Anything medical: <b>000</b> first.</p></div>
      <div class="box"><h3>Logistics</h3><ul class="logi">{logi}</ul></div>
    </div>
  </div>
  <div class="cv-idx"><h3>In this booklet</h3><ul class="idx">{idx}</ul></div>
</section>'''

BLANK = '<section class="page blank"></section>'

# ---- booklets: societies biggest first, then organisers & logistics ---------
size = collections.Counter(s for p in people for s in p['s'] if p.get('a') or P.get(p['n'], {}).get('setup') or P.get(p['n'], {}).get('packup'))
socs = [s for s, _ in size.most_common() if s != 'UQU']
logi_people = sorted({f for b in d['roster'] for id_, ps in b if id_ == 'logi' for f in ps} | {kof(p) for p in people if 'UQU' in p['s']},
                     key=lambda f: LOGI_ORDER.index(f) if f in LOGI_ORDER else 99)
booklets = []
for s in socs:
    members = sorted([p for p in people if s in p['s']], key=lambda p: p['n'].lower())
    pages = [cover_page(s, members)] + [exec_page(p, s) for p in members]
    if len(pages) % 2: pages.append(BLANK)
    booklets.append((s, pages))
members = [BY[f] for f in logi_people]
pages = [cover_page('Logistics', members, 'Organisers & logistics', 'Floating all day')] + [exec_page(p, 'Logistics') for p in members]
if len(pages) % 2: pages.append(BLANK)
booklets.append(('Logistics', pages))

CSS = '''
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Atkinson Hyperlegible Next", system-ui, sans-serif; color: #2B1A14; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .page { position: relative; width: 210mm; height: 297mm; padding: 14mm 16mm 12mm; page-break-after: always; display: flex; flex-direction: column; overflow: hidden; }
  header { border-bottom: 3px solid #6E2418; padding-bottom: 4mm; margin-bottom: 4mm; }
  .eb { font-size: 9.5pt; letter-spacing: .08em; text-transform: uppercase; color: #8C5A2B; font-weight: 700; }
  h1 { font-family: "Cormorant SC", serif; font-weight: 700; font-size: 36pt; line-height: 1; color: #6E2418; margin-top: 2mm; }
  .soc { font-weight: 700; font-size: 11pt; color: #6B5347; margin-top: 1.5mm; letter-spacing: .04em; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: #8C7B6E; padding: 0 0 2mm; }
  th:first-child { width: 31mm; }
  td { border-top: 1px solid #DACBB2; padding: 1.15mm 0; vertical-align: top; }
  td.t { font-weight: 800; font-size: 10.5pt; font-variant-numeric: tabular-nums; color: #2B1A14; white-space: nowrap; padding-right: 4mm; }
  td.d b { display: block; font-size: 11.5pt; }
  td.d span { display: block; font-size: 9pt; color: #6B5347; margin-top: .4mm; }
  td.d em.w { font-style: normal; color: #8C5A2B; font-weight: 700; }
  tr.play td { background: #EAF3EE; } tr.play td.d b { color: #2E7D5B; }
  tr.covering td { background: #FDF3E6; } tr.covering td.d b { color: #9A5A12; }
  tr.hands td { background: #F3EEE3; }
  tr.moment td { background: #F7ECF1; padding-top: .6mm; padding-bottom: .6mm; font-size: 9.5pt; } tr.moment td.d b { display: inline; font-size: 10pt; } tr.moment td.d span { display: inline; margin-left: 2mm; font-size: 8.5pt; } tr.moment td.t { padding-left: 2mm; color: #8A3B62; } tr.moment td.d b { color: #8A3B62; }
  tr.free td.d b { color: #5F6E7A; }
  tr.off td { color: #B9ADA2; } tr.off td.t, tr.off td.d b { color: #B9ADA2; font-weight: 500; }
  tr.off td.d span { display: none; }
  tr.off td { padding-top: .7mm; padding-bottom: .7mm; }
  tr.play td:first-child, tr.hands td:first-child, tr.covering td:first-child { padding-left: 2mm; }
  footer { margin-top: auto; border-top: 1px solid #DACBB2; padding-top: 3mm; font-size: 9pt; color: #6B5347; line-height: 1.4; display: flex; gap: 6mm; align-items: flex-end; }
  footer .ft { flex: 1; }
  footer span { display: block; margin-top: 1mm; color: #8C7B6E; }
  .qrbox { flex: 0 0 22mm; text-align: center; }
  .qrbox .qr svg, .qrbig .qr svg { width: 100%; height: auto; display: block; }
  .qrbox small, .qrbig small { display: block; font-size: 7pt; color: #8C7B6E; margin-top: .6mm; }
  /* cover: mostly white, the thumbnail's type and trade routes in pale ink */
  .page.cover { padding: 18mm 16mm 14mm; border-top: 9mm solid #6E2418; }
  .cover .routes { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .55; }
  .cv-top, .cv-cols { position: relative; }
  .cv-top .kick, .cv-top h1.cv { padding-right: 42mm; }
  .kick { font-family: "Cormorant SC", serif; font-weight: 700; font-size: 20pt; letter-spacing: .12em; color: #B07A3A; margin-top: 6mm; }
  h1.cv { font-size: 70pt; line-height: .9; margin-top: 1mm; }
  .cv-sub { font-weight: 800; font-size: 13pt; color: #6B5347; margin-top: 4mm; padding-bottom: 6mm; border-bottom: 3px solid #6E2418; }
  .cv-cols { display: grid; grid-template-columns: 1fr 62mm; gap: 8mm; margin-top: 6mm; }
  .cover h3 { font-size: 9pt; letter-spacing: .12em; text-transform: uppercase; color: #8C5A2B; margin: 0 0 2mm; }
  .cover h3 + table, .cover table + h3, .cover .note + h3 { margin-top: 0; }
  .cover .grid td, .cover .idx td { border-top: 1px solid #E8DCC8; padding: 1.1mm 0; font-size: 9.5pt; }
  .cover .grid td.t { width: 26mm; font-size: 9.5pt; }
  .cv-idx { position: relative; margin-top: 2mm; }
  .cover ul.idx { list-style: none; padding: 0; column-count: 2; column-gap: 8mm; }
  .cover ul.idx li { break-inside: avoid; display: flex; justify-content: space-between; gap: 2mm; border-top: 1px solid #E8DCC8; padding: 1mm 0; font-size: 9pt; }
  .cover ul.idx li span { color: #6B5347; font-size: 8pt; text-align: right; }
  .cover p.lead { font-size: 10pt; line-height: 1.5; color: #4A3A32; }
  .cover .note { font-size: 8pt; color: #8C7B6E; margin: 1.5mm 0 3mm; }
  .cover .grid { margin-bottom: 0; }
  .side .box { border: 1.5px solid #DACBB2; border-radius: 3mm; padding: 4mm; margin-bottom: 5mm; background: #fff; }
  .side .box p { font-size: 9.5pt; line-height: 1.45; }
  .logi { list-style: none; padding: 0; }
  .logi li { display: flex; justify-content: space-between; gap: 2mm; font-size: 9.5pt; padding: 1.1mm 0; border-top: 1px solid #F0E6D6; }
  .logi li:first-child { border-top: 0; }
  .logi li span { font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }
  .qrbig { position: absolute; top: 30mm; right: 16mm; width: 36mm; text-align: center; background: #fff; padding: 2mm; z-index: 1; }
  .blank { page-break-after: always; }
'''
QR_JS = '''<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script>
  document.querySelectorAll('.qr').forEach(el => { const q = qrcode(0, 'M'); q.addData(el.dataset.u); q.make();
    el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); });
  window.__qrDone = document.querySelectorAll('.qr svg').length;
</script>'''
def doc(pages):
    return f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+SC:wght@600;700&family=Atkinson+Hyperlegible+Next:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>{CSS}</style></head><body>{"".join(pages)}{QR_JS}</body></html>'''

allpages = [pg for _, pgs in booklets for pg in pgs]
open(os.path.join(OUT, 'booklets.html'), 'w').write(doc(allpages))
for s, pgs in booklets:
    open(os.path.join(OUT, f'booklet-{s}.html'), 'w').write(doc(pgs))
print(f'{len(allpages)} pages in {len(booklets)} booklets:', ', '.join(f'{s} {len(p)}' for s, p in booklets))
print(f'worst case: {len(cond)} held blocks, {len(cover)} covers')
