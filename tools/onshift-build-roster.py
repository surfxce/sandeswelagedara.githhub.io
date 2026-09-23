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
 ("Alex John","ISC","",1,0,"sport",""),
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
 ("Shalet Shaju","NAATAK","6",0,0,"sport",""),
 ("Humza Bhagat","PSA","3,4,5,6,7,8",1,0,"",""),
 ("Alexis Han","ISS","3,4,5",0,0,"",""),
 ("Nimnah Unantenna","SLA","4,5,6,7,8",0,1,"",""),
 ("Jasmine Hanzra","PA","3,4,5,6",0,0,"",""),
 ("Gayashi Rathnayaka","SLA","3,4",1,0,"",""),
 ("Khaleeda Irsya Khairoul Haniff","ISS","3,4",1,0,"crowd",""),
 ("Ginni Shukla","PA","3,4,5,6,7",0,0,"",""),
 ("Matvi Jani","GS","3,4,5,6,7,8",1,0,"",""),
 ("Sritam Vytla","ISC","3,4,5,6,7",0,0,"","vb-head"),
 ("Archita Sahu","SLA","3,4,5,6,7,8",1,1,"","logi"),
 ("Sita Das","ISC","3,4",1,0,"sport",""),
 ("Swadha Sharma","ISC","",0,1,"",""),
 ("Jais Khehra","GIDDHA","3,4",1,0,"sport",""),
 ("Simar Bhambra","GIDDHA","5,6",0,0,"",""),
 ("Devansh Pandya","GS","3,4,5,6,7,8",1,1,"",""),
]
# when each performer is on stage (block index): GS garba 4:30, UQPA bhangra
# 6:00, NAATAK 6:30 — they're off duty for that block only
PERF = {'Helly': (3,), 'Tanisha': (3,), 'Matvi': (3,), 'Jasmine': (6,), 'Shalet': (7,)}

# society volleyball teams (from "which sport are you playing")
VB_TEAM = {'UQSLA': ["Shavini", "Diya", "Leron", "Sanuka", "Deana", "Nimnah"],
           'UQISC': ["Mithila", "Sandes", "Krisha", "Sritam", "Ragesh", "Shane"]}
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
    if duty in ('vb', 'fb', 'ck', 'fb-score') and 'sport' in c: return False
    if duty == 'fb-score' and 'fb' in c: return False
    if duty.startswith('cr-') and 'crowd' in c: return False
    if duty == 'st' and 'stage' in c: return False
    if duty.startswith('stall-'): return duty[6:] in byfirst[first]["s"]
    return True

# heads stay on their own thing
PREF = {'Dhyan': 'fb', 'Aditya': 'ck', 'Humza': 'ck', 'Hasara': 'fund-pp', 'Thanabammini': 'cr-food',
        'Divita': 'stall-UQISC', 'Sandes': 'vb', 'Helly': 'st', 'Amal': 'st', 'Sritam': 'vb'}
# a head is pinned to their own duty while it's running, before anything else
PIN = {'Aditya': ('ck', (7, 8, 9)), 'Dhyan': ('fb', (4, 5)), 'Hasara': ('fund-pp', (6, 7, 10, 11))}

# ---- fixed assignments -------------------------------------------------
fixed = collections.defaultdict(dict)     # block -> {first: duty}
for f in [k for k, t in tags.items() if 'logi' in t]:
    for i in range(BLOCKS):
        if i in avail[f]: fixed[i][f] = 'logi'
for f, blocks in PERF.items():
    for i in blocks:
        if i in avail.get(f, ()): fixed[i].pop(f, None); fixed[i][f] = 'perform'
        # the half hour before is theirs to get changed and warm up
        if i - 1 in avail.get(f, ()) and i - 1 >= 0: fixed[i - 1].pop(f, None); fixed[i - 1][f] = 'prep'
# volleyball round 1
for soc, squad in VB_TEAM.items():
    # four on court is the minimum team; the rest of the squad stays on duty
    for f in [x for x in squad if VB_BLOCK in avail.get(x, ()) and x not in fixed[VB_BLOCK]][:4]:
        fixed[VB_BLOCK][f] = 'play-vb'
# football players: the group stage only (3:00 – 4:40). Whoever wins through
# to the semis and final is held by the app on the day, from the bracket.
for f in FB_PLAYERS:
    for i in range(0, 4):
        if i in avail.get(f, ()) and f not in fixed[i]: fixed[i][f] = 'play-fb'
for f in CK_PLAYERS:
    for i in (7, 8):
        if i in avail.get(f, ()) and f not in fixed[i]: fixed[i][f] = 'play-ck'
# presidents' photo at 3:15, before volleyball starts — Sandes takes it, so
# he's off everything else that block
fixed[0]['Sandes'] = 'photo-pres'
# Devansh briefs the cricket crew at 6:20, before the first games at 6:40
fixed[6]['Devansh'] = 'ck-brief'
for f, (duty, blocks) in PIN.items():
    for i in blocks:
        if i in avail.get(f, ()) and f not in fixed[i] and can(f, duty): fixed[i][f] = duty

# ---- what each block needs (min, want) ---------------------------------
def needs(i):
    """(minimum, nice-to-have) per duty. Stalls come first — they're locked to
    a society, so they're the hardest to fill."""
    n = {}
    for s in socs_present: n['stall-' + s] = (1, 2)      # two on every society stall
    # football, per the committee: eight people the whole time it runs (3:00 –
    # 6:00) — six refs (in the semis and final the spares run the lines and
    # keep the pitch clear) and two on the score sheet
    if i <= 5:  n['fb'] = (6, 6); n['fb-score'] = (2, 2)
    if i <= 3:  n['vb'] = (2, 2)                 # a ref on each of the two bracket courts
    if 7 <= i <= 11: n['ck'] = (4, 4)   # umpire, leg umpire, scorer + spare, per the cricket committee
    n['tk'] = (2, 2) if i <= 3 else (1, 2)
    n['st'] = (2, 2) if (i <= 3 or i in (6, 7)) else (1, 1)
    n['cr-gate'] = (1, 1); n['cr-food'] = (1, 2)
    n['cr-lawn'] = (1, 1)
    n['fund-pp'] = (1, 1)
    if i >= 6: n['fund-bake'] = (1, 1); n['fund-hope'] = (1, 1)
    return n

roster = []
last = {}          # first -> duty last block, to keep runs of two
counts = collections.Counter()
run = collections.Counter()                          # consecutive blocks on duty
sameRun = collections.defaultdict(dict)              # consecutive blocks on the SAME duty
doneDuty = collections.defaultdict(collections.Counter)   # times on each duty today
for i in range(BLOCKS):
    slots = collections.defaultdict(list)
    for f, d in fixed[i].items(): slots[d].append(f)
    placed = set(fixed[i])
    pool = sorted([f for f in avail if i in avail[f] and f not in placed],
                  key=lambda f: (counts[f], f))
    # four people kept free every block — a buffer for covering winning
    # teams, emergencies, a breather. It's whoever has gone longest without a
    # break (an hour on duty at least), so it rotates through everyone.
    resting = set(sorted([f for f in pool if run[f] >= 2], key=lambda f: (-run[f], -counts[f], f))[:4])
    pool = [f for f in pool if f not in resting]
    n = needs(i)
    for level in (0, 1):                      # minimums first, then the nice-to-haves
        while True:
            # fill the hardest duty first — the one with fewest people who could
            # do it — otherwise the stalls hoover up everyone the sports need
            open_ = []
            for duty, (mn, wn) in n.items():
                target = mn if level == 0 else wn
                if len(slots[duty]) >= target: continue
                elig = [f for f in pool if can(f, duty)]
                # essentials first — a match with no ref or a gate with nobody
                # on it is worse than a quiet stage — then hardest-to-fill
                tier = 0 if duty in ('vb', 'fb', 'ck', 'tk', 'fb-score', 'fund-pp') or duty.startswith('stall-') or (duty == 'st' and (i <= 3 or i in (6, 7))) else 1
                if elig: open_.append((tier, len(elig), duty, elig))
            if not open_: break
            open_.sort()
            _, _, duty, elig = open_[0]
            # variety: two blocks on a thing is plenty, then something else;
            # three blocks on the trot at all, then a break
            ok = [f for f in elig if sameRun[f].get(duty, 0) < 2 and run[f] < 3]
            if not ok: ok = [f for f in elig if run[f] < 3]
            if not ok: ok = elig
            # cricket only: finish your hour before moving, so someone one block
            # into it is the first pick to stay. Everything else changes every
            # 30 minutes where it can.
            # pair within a society where we can: someone who shares a club
            # with whoever's already on this duty goes first
            mates = slots[duty]
            ok.sort(key=lambda f: ((sameRun[f].get(duty, 0) != 1) if duty == 'ck' else sameRun[f].get(duty, 0) > 0,
                                   PREF.get(f) != duty,
                                   bool(mates) and not any(byfirst[f]["s"][k] in byfirst[m]["s"] for m in mates for k in range(len(byfirst[f]["s"]))),
                                   doneDuty[f].get(duty, 0), counts[f], run[f], f))
            f = ok[0]; pool.remove(f); slots[duty].append(f); placed.add(f)
    # everyone still standing goes on crowd & support — the festival wants
    # every hand (the four resting are already out of the pool).
    CROWD = [d for d in ('cr-gate', 'cr-food', 'cr-lawn', 'cr-gen') if d in n or d == 'cr-gen']
    for f in sorted(pool, key=lambda f: (counts[f], f)):
        opts = [d for d in CROWD if can(f, d)]
        if not opts:     # can't do crowd: a third pair of hands on their own stall
            opts = [d for d in n if d.startswith('stall-') and can(f, d)]
        if not opts: continue
        mate = lambda d: any(set(byfirst[f]["s"]) & set(byfirst[m]["s"]) for m in slots[d])
        opts.sort(key=lambda d: (not (mate(d) and len(slots[d]) < 4), len(slots[d]), sameRun[f].get(d, 0), doneDuty[f].get(d, 0), d))
        slots[opts[0]].append(f); placed.add(f)
    pool = [f for f in pool if f not in placed]
    onduty = {x for xs in slots.values() for x in xs}
    for x in onduty: counts[x] += 1; run[x] += 1
    for f in avail:
        if f not in onduty: run[f] = 0
    mine = {x: d for d, xs in slots.items() for x in xs}
    for f in avail:
        d = mine.get(f)
        sameRun[f] = {d: sameRun[f].get(d, 0) + 1} if d else {}
        if d: doneDuty[f][d] += 1
    last = {x: d for d, xs in slots.items() for x in xs}
    roster.append(sorted(([d, sorted(xs)] for d, xs in slots.items() if xs), key=lambda r: r[0]))

for p in people:
    p["a"] = sorted(avail[p["n"].split()[0]])
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
longest = {}
for f in avail:
    row = ['' ] * BLOCKS
    for i, b in enumerate(roster):
        for d, xs in b:
            if f in xs: row[i] = d
    best = cur = 0
    for k, x in enumerate(row):
        cur = cur + 1 if (x and k and x == row[k-1]) else (1 if x else 0)
        best = max(best, cur)
    longest[f] = best
print("\nLONGEST STRETCH ON ONE DUTY (logistics excluded — they float all day)")
for f, b in sorted(longest.items(), key=lambda kv: -kv[1])[:8]:
    if 'logi' in tags[f]: continue
    print(f"  {f:<14} {b} blocks in a row")
print("\nPER PERSON (blocks on duty out of the ones they're here)")
for f in sorted(avail):
    print(f"  {f:<14} {counts[f]:2d} on / {len(avail[f]):2d} here")
