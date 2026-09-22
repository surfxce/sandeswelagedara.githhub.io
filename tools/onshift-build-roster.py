#!/usr/bin/env python3
"""Build the Spice Road roster from the form responses.

Blocks are 30 minutes, block 0 = 3:00 pm … block 11 = 8:30 pm.
Setup (2–3) and pack-up (9–10) are handled by the app, not here.
"""
import json, collections, sys

BLOCKS = 12
HOUR_BLOCKS = {3: (0, 1), 4: (2, 3), 5: (4, 5), 6: (6, 7), 7: (8, 9), 8: (10, 11)}
SOC = {'SLA': 'UQSLA', 'ISC': 'UQISC', 'TELS': 'UQTELS', 'NC': 'UQNC', 'GS': 'UQGS',
       'PSA': 'UQPSA', 'NAATAK': 'UQNAATAK', 'PA': 'UQPA', 'TAS': 'UQTAS', 'ISS': 'UQISS',
       'GIDDHA': 'UQGIDDHA'}

# name | societies | hours on site | setup? | packup? | can't do | notes
P = [
 ("Mathisha Kovinda","SLA","3,4,5,6,7,8",1,1,"",""),
 ("Ragesh Ramanalingam","ISC","4,5,6,7,8",0,0,"",""),
 ("Prabhas Bachu","ISC","3,4,5,6,7,8",1,1,"","logi"),
 ("Shavini Kariyawasam","SLA","3,4,5,6,7,8",1,1,"",""),
 ("Sanuli Ranatunga","SLA","3,4,5,6,7,8",1,1,"","logi"),
 ("Hasini Koduru","TELS","3,4,5,6,7",1,0,"",""),
 ("Aditya Rao","SLA","5,6,7",0,0,"crowd,stage","ck-head"),
 ("Aravinth Renganathan","NC","3,4,5,6,7",0,0,"",""),
 ("Joanna Raja","ISC","3,4,5,6",1,0,"",""),
 ("Helly Parekh","GS","3,4,5,6,7,8",1,0,"","perf3"),
 ("Mekayil Saadat","PSA","3,4,5,6,7,8",1,1,"",""),
 ("Amal Asif","PSA","3,4,5,6,7,8",1,1,"sport",""),
 ("Alex John","ISC","",1,0,"",""),
 ("Kavinila Gunaseelan","ISC","4,5,6",0,0,"",""),
 ("Shane Shaji","ISC","4,5,6,7,8",1,0,"",""),
 ("Avinab Baral","NC","3,4,5,6,7,8",1,1,"",""),
 ("Raziel Bhandari","NC","3,4",1,0,"",""),
 ("Devashri Pillay","NC","3,4,5,6,7,8",1,1,"","logi"),
 ("Leron Hewapathiranage","SLA","3,4,5",0,0,"",""),
 ("Mithila Balamurugan","ISC","3,4,5,6,7,8",1,1,"",""),
 ("Diya Chandy","SLA","3,4",0,0,"ck,fb",""),
 ("Hasara Ekanayake","SLA","3,4,5,6,7,8",1,1,"","fund-head"),
 ("Tanvi Rayabarapu","TELS","3,4,5,6",1,0,"",""),
 ("Tanya Rayabarapu","TELS","3,4,5",1,0,"",""),
 ("Kartheeka Valluri","SLA","4,5,6,7,8",0,1,"",""),
 ("Dhyan Varboo","SLA","3,4,5",0,0,"","fb-head"),
 ("Heshan Chandrasekara","SLA","3,4,5,6",0,0,"",""),
 ("Sandes Welagedara","ISC","3,4,5,6,7,8",1,1,"",""),
 ("Rania Gaffoor","PSA","3,4,5,6,7,8",1,1,"",""),
 ("Eshal Ali","PSA","3,4,5,6,7,8",1,1,"stage,sport",""),
 ("Tanisha Raniga","GS","3,4,5,6,7,8",1,1,"","logi,perf3"),
 ("Divita Nagrath","ISC","3,4,5,6,7,8",1,0,"crowd,ck,tk,fb,vb","media"),
 ("Rushi Kakkad","GS","4,5,6",0,0,"stage",""),
 ("Sanuka Ranatunga","SLA","3,4,5,6,7,8",1,1,"",""),
 ("Thanabammini Balasaravanan","SLA,TELS","3,4,5,6,7,8",0,1,"","biz-head"),
 ("Thihan Sendanayake","SLA","3,4,5,6,7,8",1,1,"",""),
 ("Deana Jayaweera","SLA","3,4",0,0,"",""),
 ("Zahra Shabbir","PSA","5,6,7",0,0,"sport",""),
 ("Krisha Rekha","ISC","3,4,5,6,7,8",1,0,"",""),
 ("Shalet Shaju","NAATAK","6",0,0,"sport","perf"),
]

# society volleyball teams (from "which sport are you playing")
VB_TEAM = {'UQSLA': ["Shavini", "Diya", "Leron", "Sanuka", "Deana"],
           'UQISC': ["Mithila", "Sandes", "Krisha", "Divita", "Ragesh", "Shane"]}
VB_BLOCK = 1          # round 1 at 3:30
FB_PLAYERS = ["Aravinth", "Mekayil", "Dhyan", "Raziel"]     # no football team list yet
CK_PLAYERS = ["Mathisha", "Thihan", "Rushi"]                # cricket team lists pending

people, avail, cant, tags = [], {}, {}, {}
for name, socs, hours, setup, packup, cd, note in P:
    first = name.split()[0]
    people.append({"n": name, "s": [SOC[s] for s in socs.split(',')]})
    bs = set()
    for h in (int(x) for x in hours.split(',') if x):
        a, b = HOUR_BLOCKS[h]; bs.add(a); bs.add(b)
    avail[first] = bs
    cant[first] = set(x for x in cd.split(',') if x)
    tags[first] = set(x for x in note.split(',') if x)

byfirst = {p["n"].split()[0]: p for p in people}
socs_present = sorted({s for p in people for s in p["s"]})

def can(first, duty):
    c = cant[first]
    if duty in c: return False
    if duty in ('vb', 'fb', 'ck') and 'sport' in c: return False
    if duty.startswith('cr-') and 'crowd' in c: return False
    if duty == 'st' and 'stage' in c: return False
    if duty.startswith('stall-'): return duty[6:] in byfirst[first]["s"]
    return True

# ---- fixed assignments -------------------------------------------------
fixed = collections.defaultdict(dict)     # block -> {first: duty}
for f in [k for k, t in tags.items() if 'logi' in t]:
    for i in range(BLOCKS):
        if i in avail[f]: fixed[i][f] = 'logi'
# performances: Helly and Tanisha are in the 4:30 GS act; Shalet in NAATAK's
for f in [k for k, t in tags.items() if 'perf3' in t]:
    fixed[3].pop(f, None); fixed[3][f] = 'photo-pres'
for f in [k for k, t in tags.items() if 'perf' in t and 'perf3' not in tags[k]]:
    for i in (6, 7):
        if i in avail[f]: fixed[i][f] = 'photo-pres'
# volleyball round 1
for soc, squad in VB_TEAM.items():
    # four on court is the minimum team; the rest of the squad stays on duty
    for f in [x for x in squad if VB_BLOCK in avail.get(x, ()) and x not in fixed[VB_BLOCK]][:4]:
        fixed[VB_BLOCK][f] = 'play-vb'
# football players are out for the whole tournament (no team list to split by round)
for f in FB_PLAYERS:
    for i in range(0, 6):
        if i in avail.get(f, ()) and f not in fixed[i]: fixed[i][f] = 'play-fb'
for f in CK_PLAYERS:
    for i in (7, 8, 9, 10):
        if i in avail.get(f, ()) and f not in fixed[i]: fixed[i][f] = 'play-ck'

# ---- what each block needs (min, want) ---------------------------------
def needs(i):
    """(minimum, nice-to-have) per duty. Stalls come first — they're locked to
    a society, so they're the hardest to fill."""
    n = {}
    for s in socs_present: n['stall-' + s] = (1, 2 if s in ('UQSLA', 'UQISC') else 1)
    if i <= 5:  n['fb'] = (3, 5)                 # six pitches; three refs is the floor
    if i <= 3:  n['vb'] = (1, 2)
    if 7 <= i <= 10: n['ck'] = (2, 2)
    n['tk'] = (2, 2) if i <= 3 else (1, 2)
    n['st'] = (2, 2) if (i <= 3 or i in (6, 7)) else (1, 1)
    n['cr-gate'] = (1, 1); n['cr-food'] = (1, 2)
    if i >= 6: n['cr-lawn'] = (1, 1)
    n['fund-pp'] = (1, 1)
    if i >= 6: n['fund-bake'] = (1, 1); n['fund-hope'] = (1, 1)
    return n

# heads stay near their thing when they can
PREF = {'Dhyan': 'fb', 'Aditya': 'ck', 'Hasara': 'fund-pp', 'Thanabammini': 'cr-food',
        'Divita': 'stall-UQISC', 'Mathisha': 'ck', 'Thihan': 'ck', 'Sandes': 'vb'}

roster = []
last = {}          # first -> duty last block, to keep runs of two
counts = collections.Counter()
run = collections.Counter()   # consecutive blocks on duty
for i in range(BLOCKS):
    slots = collections.defaultdict(list)
    for f, d in fixed[i].items(): slots[d].append(f)
    placed = set(fixed[i])
    pool = sorted([f for f in avail if i in avail[f] and f not in placed],
                  key=lambda f: (counts[f], f))
    n = needs(i)
    for level in (0, 1):                      # minimums first, then the nice-to-haves
        for duty, (mn, wn) in n.items():
            target = mn if level == 0 else wn
            while len(slots[duty]) < target:
                # same person as last block first, then a head, then anyone
                cands = [f for f in pool if can(f, duty) and (level == 0 or run[f] < 4)]
                if not cands: cands = [f for f in pool if can(f, duty)]
                if not cands: break
                # keep someone on the same thing for a second block, respect the
                # heads' own areas, then whoever's done least and rested most
                cands.sort(key=lambda f: (run[f] >= 4, last.get(f) != duty, PREF.get(f) != duty, counts[f], run[f], f))
                f = cands[0]; pool.remove(f); slots[duty].append(f); placed.add(f)
    onduty = {x for xs in slots.values() for x in xs}
    for x in onduty: counts[x] += 1; run[x] += 1
    for f in avail:
        if f not in onduty: run[f] = 0
    last = {x: d for d, xs in slots.items() for x in xs}
    roster.append(sorted(([d, sorted(xs)] for d, xs in slots.items() if xs), key=lambda r: r[0]))

out = {"people": people, "roster": roster}
json.dump(out, open(sys.argv[1], 'w'), indent=2)

# ---- report ------------------------------------------------------------
times = [f"{3 + i // 2}:{'00' if i % 2 == 0 else '30'}" for i in range(BLOCKS)]
print("BLOCK COVERAGE")
for i in range(BLOCKS):
    on = sum(len(x[1]) for x in roster[i])
    free = sum(1 for f in avail if i in avail[f]) - on
    gaps = [d for d, (mn, _) in needs(i).items() if len([r for r in roster[i] if r[0] == d] or [[None, []]][0:1]) == 0 and mn > 0]
    filled = {d: len(p) for d, p in roster[i]}
    short = [f"{d} {filled.get(d,0)}/{mn}" for d, (mn, _) in needs(i).items() if filled.get(d, 0) < mn]
    print(f"  {times[i]:>5}  on duty {on:2d}  free {free:2d}   {'SHORT: ' + ', '.join(short) if short else 'all minimums met'}")
print("\nPER PERSON (blocks on duty out of the ones they're here)")
for f in sorted(avail):
    print(f"  {f:<14} {counts[f]:2d} on / {len(avail[f]):2d} here")
