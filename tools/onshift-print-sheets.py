#!/usr/bin/env python3
"""One printable page per exec: name at the top, times down the left, duties on the right."""
import json, sys, html, datetime

# usage: onshift-print-sheets.py <roster.json> <onshift-build-roster.py> <out.html>
d = json.load(open(sys.argv[1]))
# who ticked setup / pack-up — read from the builder's source list
src = open(sys.argv[2]).read()
P = {}
for line in src.split('\n'):
    line = line.strip()
    if line.startswith('("') and line.count('"') >= 8:
        parts = eval(line.rstrip(','))
        P[parts[0].split()[0]] = {'setup': parts[3], 'packup': parts[4]}

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
  'fund-hope': ('Hope by Hands', 'Charity marquee, Field 6'),
  'logi': ('Logistics', 'Everywhere — answer calls for help'),
  'play-vb': ('Playing volleyball', 'Beach volleyball courts — for your society'),
  'play-fb': ('Playing football', 'Field 7 — group stage, for your society'),
  'play-ck': ('Playing cricket', 'Field 7 — for your society'),
  'perform': ('Performing', 'Performance stage'),
  'prep': ('Getting ready', "Performers' area — your act is next, be side-stage 10 min early"),
  'ck-brief': ('Cricket briefing — you run it', 'Field 7 at 6:10: umpires, scorers, captains; then set out the pitches'),
  'fb-pack': ('Football pack-up', 'Field 7, 6:00 – 6:15: balls, bibs, cones, whistles, pump to logistics'),
  'su-fb': ('Setup — football', 'Field 7, 2:30 – 3:00: mark the pitch edges, balls/bibs/whistles out, teams ready'),
  'su-vb': ('Setup — volleyball', 'Beach courts: three nets, lines, balls and ball bag, draw up'),
  'su-fund': ('Setup — charity stalls', 'Charity marquee: tables, signage, raffle and wheel, floats'),
  'su-biz': ('Setup — business stalls', 'Visit every business: missing anything? good to go by 3:00?'),
  'photo-pres': ("Presidents' photo — you're taking it", 'Stage steps at 4:55, straight after the volleyball final'),
}
def duty(id_):
    if id_.startswith('su-UQ'):
        c = id_[3:]; return (f'{c} stall setup', f'{c} marquee, Field 6 — tables, banner, sign-ups, open by 3:00')
    if id_.startswith('stall-'):
        c = id_[6:]; return (f'{c} stall', f'{c} marquee, Field 6 — visitors, sign-ups, content')
    return DUTY.get(id_, (id_, ''))

people = sorted(d['people'], key=lambda p: p['n'].lower())
socOf = {p['n'].split()[0]: set(p['s']) for p in people}
times = [(f"{3 + i // 2}:{'00' if i % 2 == 0 else '30'}", f"{3 + (i + 1) // 2}:{'00' if (i + 1) % 2 == 0 else '30'}") for i in range(12)]
esc = html.escape

# the 4:55 presidents' photo (the rest of the presidents aren't on the roster)
PRES = {'Sanuka', 'Prabhas', 'Jais', 'Devansh', 'Aarya'}

# everyone on cricket tonight gets the 6:10 briefing
CK = {f for b in d['roster'][7:] for x, ps in b if x in ('ck', 'play-ck') for f in ps}

pages = []
for p in people:
    first = p['n'].split()[0]
    avail = set(p.get('a', range(12)))
    rows = []
    flags = P.get(first, {'setup': 0, 'packup': 0})
    su = next(((sid, ps) for sid, ps in d.get('setup', []) if first in ps), None)
    if su: rows.append(('2:00 – 3:00', duty(su[0]), [x for x in su[1] if x != first], 'hands'))
    else: rows.append(('2:00 – 3:00', ('Setup', 'Not on your form — come if you can'), [], 'off'))
    for i in range(12):
        t = f'{times[i][0]} – {times[i][1]}'
        if i not in avail:
            rows.append((t, ('Not on site', ''), [], 'off')); continue
        got = None
        for id_, ppl in d['roster'][i]:
            if first in ppl:
                mates = [x for x in ppl if x != first]
                if id_.startswith('play-'): mates = [x for x in mates if socOf.get(x, set()) & socOf[first]]
                got = (duty(id_), mates, 'play' if id_.startswith('play-') or id_ == 'perform' else 'duty'); break
        if got: rows.append((t, got[0], got[1], got[2]))
        else: rows.append((t, ('Free — check the app', 'A job can still land here on the day'), [], 'free'))
        # moments get their own row, so they can't be missed
        if i == 3 and first in PRES:
            rows.append(('4:55', ("Presidents' photo", 'Stage steps, straight after the volleyball final · 5 minutes, then back to your spot'), [], 'moment'))
        if i == 6 and first in CK and first != 'Devansh':
            rows.append(('6:10', ('Cricket briefing with Devansh', 'Field 7, by the pitches · set-up and run-through, first game 6:30'), [], 'moment'))
    rows.append(('9:00 – 10:00', ('Pack-up — all hands', 'Strike marquees, bag rubbish, return gear'), [], 'hands' if flags['packup'] else 'off'))

    trs = []
    for t, (name, where), mates, kind in rows:
        # where and who on one line, so a full day fits on one page
        withs = f' · <em class="w">with {esc(", ".join(mates))}</em>' if mates else ''
        sub = f'<span>{esc(where)}{withs}</span>' if where else (f'<span>{withs[3:]}</span>' if withs else '')
        trs.append(f'<tr class="{kind}"><td class="t">{esc(t)}</td><td class="d"><b>{esc(name)}</b>{sub}</td></tr>')
    socs = ' · '.join(s for s in p['s'])
    pages.append(f'''<section class="page">
  <header><div class="eb">Spice Road Experience · Friday 25 September · UQ Athletics Centre</div>
    <h1>{esc(p["n"])}</h1><div class="soc">{esc(socs)}</div></header>
  <table><thead><tr><th>Time</th><th>Duty</th></tr></thead><tbody>{"".join(trs)}</tbody></table>
  <footer><b>The app is the live roster.</b> Swaps, sports results and cover change it on the day — if this sheet and the app disagree, the app wins.
    <span>sandeswelagedara.com/toybox/on-shift · Emergency: 000 first, then an organiser · Printed {datetime.date.today():%a %d %b}</span></footer>
</section>''')

doc = f'''<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+SC:wght@600;700&family=Atkinson+Hyperlegible+Next:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
  @page {{ size: A4; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; }}
  body {{ font-family: "Atkinson Hyperlegible Next", system-ui, sans-serif; color: #2B1A14; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
  .page {{ width: 210mm; height: 297mm; padding: 14mm 16mm 12mm; page-break-after: always; display: flex; flex-direction: column; }}
  header {{ border-bottom: 3px solid #6E2418; padding-bottom: 4mm; margin-bottom: 4mm; }}
  .eb {{ font-size: 9.5pt; letter-spacing: .08em; text-transform: uppercase; color: #8C5A2B; font-weight: 700; }}
  h1 {{ font-family: "Cormorant SC", serif; font-weight: 700; font-size: 36pt; line-height: 1; color: #6E2418; margin-top: 2mm; }}
  .soc {{ font-weight: 700; font-size: 11pt; color: #6B5347; margin-top: 1.5mm; letter-spacing: .04em; }}
  table {{ width: 100%; border-collapse: collapse; }}
  th {{ text-align: left; font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: #8C7B6E; padding: 0 0 2mm; }}
  th:first-child {{ width: 31mm; }}
  td {{ border-top: 1px solid #DACBB2; padding: 1.7mm 0; vertical-align: top; }}
  td.t {{ font-weight: 800; font-size: 10.5pt; font-variant-numeric: tabular-nums; color: #2B1A14; white-space: nowrap; padding-right: 4mm; }}
  td.d b {{ display: block; font-size: 11.5pt; }}
  td.d span {{ display: block; font-size: 9pt; color: #6B5347; margin-top: .4mm; }}
  td.d em.w {{ font-style: normal; color: #8C5A2B; font-weight: 700; }}
  tr.duty td.d b {{ color: #2B1A14; }}
  tr.play td {{ background: #EAF3EE; }} tr.play td.d b {{ color: #2E7D5B; }}
  tr.hands td {{ background: #F3EEE3; }}
  tr.moment td {{ background: #F7ECF1; padding-top: 1.1mm; padding-bottom: 1.1mm; }} tr.moment td.t {{ padding-left: 2mm; color: #8A3B62; }} tr.moment td.d b {{ color: #8A3B62; }}
  tr.free td.d b {{ color: #5F6E7A; }}
  tr.off td {{ color: #B9ADA2; }} tr.off td.t, tr.off td.d b {{ color: #B9ADA2; font-weight: 500; }}
  tr.off td.d span {{ display: none; }}
  tr.play td:first-child, tr.hands td:first-child {{ padding-left: 2mm; }}
  footer {{ margin-top: auto; border-top: 1px solid #DACBB2; padding-top: 3mm; font-size: 9pt; color: #6B5347; line-height: 1.4; }}
  footer span {{ display: block; margin-top: 1mm; color: #8C7B6E; }}
</style></head><body>{"".join(pages)}</body></html>'''
open(sys.argv[3], 'w').write(doc)
print(len(pages), 'pages')
