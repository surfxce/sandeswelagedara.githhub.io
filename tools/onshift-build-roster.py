#!/usr/bin/env python3
"""Build the Spice Road roster from the form responses.

Blocks are 30 minutes, block 0 = 3:00 pm … block 11 = 8:30 pm.
Setup (2–3) and pack-up (9–10) are handled by the app, not here.
"""
import json, collections, sys

BLOCKS = 12
import os as _os
REST = int(_os.environ.get('REST', '4'))   # people kept free each block
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
 # staying until 8 to play GS's cricket games (7:00, 7:30)
 ("Rushi Kakkad","GS","4,5,6,7",0,0,"stage",""),
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
 ("Mehulpreet Kaur","ISS","3,4,5,6,7,8",1,1,"",""),
 ("Sanupa Wijethunge","SLA","3,4,5,6,7,8",1,1,"","class early afternoon"),
 ("Jia Patel","GS","3",1,0,"sport",""),
 ("Hargun Kaur","PA","3,4,5,6,7",1,0,"sport",""),
 ("Rishi Veeramachaneni","ISC","3,4,5,6,7,8",0,1,"",""),
 ("Roshni Bhatia","PA","4,5,6,7",0,0,"",""),
 ("Thar Suthes","SLA","5,6,7",0,0,"",""),
 ("Aarya Sharma","PA","3,4,5,6,7,8",0,1,"fb","pa-pres"),
 ("Prabhjot Singh","PA","3,4,5",1,0,"",""),
 ("Ishan Pal","PA","3,4,5,6,7,8",0,0,"",""),
 ("Pritisha Sihota","PA","3,4,5",1,0,"",""),
 ("Sujal Raiyani","PA","3,4,5,6,7",1,0,"",""),
 # rolled ankle: nothing that means walking or running
 ("Swornim Khatiwada","NC","3,8",1,1,"stage,sport,crowd",""),
 ("Bhumik Sarma","NC","3,4,5,6,7,8",1,1,"","nc-pres"),
 ("Shreya Chhetri","NC","3,4,5,6,7,8",1,1,"","nc-vp"),
 ("Shriyans Bista","NC","3,4,5,6,7,8",1,1,"ck",""),
 ("Christopher Malik","PA","6,7",0,0,"",""),
]
# when each performer is on stage (block index): GS garba 4:30, UQPA bhangra
# 6:00, NAATAK 6:30 — they're off duty for that block only
PERF = {'Helly': (3,), 'Tanisha': (3,), 'Matvi': (3,), 'Roshni': (6,), 'Jasmine': (6,), 'Shalet': (7,)}

# society volleyball teams (from "which sport are you playing")
VB_TEAM = {'UQSLA': ["Shavini", "Diya", "Leron", "Sanuka", "Deana", "Nimnah"],
           'UQISC': ["Mithila", "Sandes", "Krisha", "Sritam", "Ragesh", "Shane"]}
VB_BLOCK = 1          # round 1 at 3:30
# execs on the other teams, for their first game: NC + PA and Solos play at
# 3:35, Shriyans's team (Shane) at 3:55 — he's here from 4
VB_OTHER = {'Avinab': 1, 'Jasmine': 1, 'Aarya': 1, 'Prabhjot': 1, 'Ishan': 1, 'Sujal': 1, 'Bhumik': 1,
            'Shriyans': 1, 'Matvi': 1, 'Shane': 2}
# execs on the football sign-up sheet (both UQNC); nobody else registered
FB_PLAYERS = ["Aravinth", "Bhumik"]
# the only execs playing cricket
CK_PLAYERS = ["Mathisha", "Thihan", "Rushi"]

people, avail, cant, tags, SETUP_FLAG = [], {}, {}, {}, {}
for name, socs, hours, setup, packup, cd, note in P:
    first = name.split()[0]
    people.append({"n": name, "s": [SOC[s] for s in socs.split(',')]})
    bs = set()
    for h in (int(x) for x in hours.split(',') if x):
        a, b = HOUR_BLOCKS[h]; bs.add(a); bs.add(b)
    avail[first] = bs
    cant[first] = set(x for x in cd.split(',') if x)
    tags[first] = set(x for x in note.split(',') if x)
    SETUP_FLAG[first] = setup

byfirst = {p["n"].split()[0]: p for p in people}
socs_present = sorted({s for p in people for s in p["s"]})
SOC_SIZE = collections.Counter(s for p in people if avail[p["n"].split()[0]] for s in p["s"])

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
PIN = {'Aditya': ('ck', (6, 7, 8)), 'Dhyan': ('fb', (4, 5)), 'Hasara': ('fund-pp', (6, 7, 10, 11)),
       # Aarya (PA president) wants to be at his stall: there most of the night,
       # apart from volleyball (3:30), his cricket game (7:00) and a break at 5:30
       'Aarya': ('stall-UQPA', (0, 2, 3, 4, 6, 7, 9, 10, 11)),
       # NC's president and VP asked to put their stall first, so they're based
       # there, but each gets at least three blocks out and about to be seen;
       # Swornim (rolled ankle) holds the stall whenever he's here
       'Shreya': ('stall-UQNC', (0, 1, 2, 4, 5, 7, 8, 10, 11)),
       'Bhumik': ('stall-UQNC', (4, 6, 7, 9)),
       'Swornim': ('stall-UQNC', (0, 1, 10, 11))}

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
for f, i in VB_OTHER.items():
    if i in avail.get(f, ()) and f not in fixed[i]: fixed[i][f] = 'play-vb'
# football players: the group stage only (3:00 – 4:40). Whoever wins through
# to the semis and final is held by the app on the day, from the bracket.
for f in FB_PLAYERS:
    for i in range(0, 4):
        if i in avail.get(f, ()) and f not in fixed[i]: fixed[i][f] = 'play-fb'
# cricket, one game at a time (the committee's poster): SLA 6:30 & 7:30,
# ISC 6:30 & 8:00, GS 7:00 & 7:30, Mixed 7:00 & 8:00
CK_GAMES = {'UQSLA': (7, 9), 'UQISC': (7, 10), 'UQGS': (8, 9)}
for f in CK_PLAYERS:
    for i in next((g for sc, g in CK_GAMES.items() if sc in byfirst[f]["s"]), ()):
        if i in avail.get(f, ()) and f not in fixed[i]: fixed[i][f] = 'play-ck'
# presidents' photo at 4:55, straight after the volleyball final and before
# Jais leaves at 5 — Sandes takes it, so he's off everything else that block
fixed[3]['Sandes'] = 'photo-pres'
# Devansh briefs the cricket crew at 6:10, before the first game at 6:30
fixed[6]['Devansh'] = 'ck-brief'
# …and he's on cricket for the first two games; after that it's self-run
for i in (7, 8): fixed[i]['Devansh'] = 'ck'
# Aarya (PA president) asked to umpire one game: match 2 at 7:00, with Devansh there
fixed[8]['Aarya'] = 'ck'
for f, (duty, blocks) in PIN.items():
    for i in blocks:
        if i in avail.get(f, ()) and f not in fixed[i] and can(f, duty): fixed[i][f] = duty

# ---- what each block needs (min, want) ---------------------------------
def needs(i):
    """(minimum, nice-to-have) per duty. Stalls come first — they're locked to
    a society, so they're the hardest to fill."""
    n = {}
    # two on every society stall, where the society has two execs to give
    for s in socs_present: n['stall-' + s] = (2, 2) if SOC_SIZE[s] >= 2 else (1, 1)
    # football, per the committee's run sheet: a ref per game and two on the
    # score document — 6 for the groups (3:00 – 4:40), 2 for the semis
    # (4:50), 1 for the final (5:30) — then three pack up the gear at 6:00
    if i <= 3:  n['fb'] = (6, 6)
    elif i == 4: n['fb'] = (2, 2)
    elif i == 5: n['fb'] = (1, 1)
    if i <= 5:  n['fb-score'] = (2, 2)
    if i == 6:  n['fb-pack'] = (3, 3)
    # a ref on every bracket court: three courts 3:35 – 4:15, then two
    if i in (1, 2): n['vb'] = (3, 3)
    elif i in (0, 3): n['vb'] = (2, 2)
    # cricket, per its run sheet: four people (bowler's-end umpire, square-leg
    # umpire, scorer, helper) from the 6:10 set-up and brief; the crew changes
    # at 7:30; four again for the 8:30 result and pack-down
    if 6 <= i <= 11: n['ck'] = (4, 4)
    n['tk'] = (2, 2) if i <= 3 else (1, 2)
    n['st'] = (2, 2) if (i <= 3 or i in (6, 7)) else (1, 1)
    n['cr-gate'] = (1, 1); n['cr-food'] = (1, 2)
    n['cr-lawn'] = (1, 1)
    n['fund-pp'] = (1, 1)
    if i >= 6: n['fund-bake'] = (1, 1); n['fund-hope'] = (1, 1)
    return n

# ---- one staggered break each --------------------------------------------
# Everyone here three hours or more gets 30-minute breaks so no stretch runs
# past 2.5 hours. They're staggered: each break goes within half an hour of
# where it should fall in that person's day, on whichever of those blocks has
# the fewest breaks so far, and never where they're already fixed (playing,
# performing, pinned…).
BREAK = {}
load = collections.Counter()
for f in sorted(avail, key=lambda f: (-len(avail[f]), f)):
    L = len(avail[f])
    if 'logi' in tags[f] or L < 6: continue
    # as many breaks as it takes to keep every stretch to 2.5 hours: one for
    # up to 5 hours on site, two for a full 3 – 9
    k = next(b for b in range(1, 4) if -(-(L - b) // (b + 1)) <= 5)
    lo = min(avail[f]); BREAK[f] = set()
    for j in range(k):
        target = lo + L * (j + 1) / (k + 1) - 0.5
        opts = [i for i in range(2, 12) if i in avail[f] and f not in fixed[i] and i not in BREAK[f]]
        if not opts: break
        b = min(opts, key=lambda i: (max(0.0, abs(i - target) - 1), load[i], abs(i - target), i))
        BREAK[f].add(b); load[b] += 1

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
    pool = sorted([f for f in avail if i in avail[f] and f not in placed and i not in BREAK.get(f, ())],
                  key=lambda f: (counts[f], f))
    # four people kept free every block — a buffer for covering winning
    # teams, emergencies, a breather. It's whoever has gone longest without a
    # break (an hour on duty at least), so it rotates through everyone.
    CK_STAY = i in (7, 8, 10, 11)       # cricket crews: 6:00 – 7:30, then 7:30 – 9:00
    # REST people kept free every block (4 by default), longest-working first
    cands = sorted([f for f in pool if run[f] >= 2 and not (CK_STAY and sameRun[f].get('ck'))],
                   key=lambda f: (-run[f], -counts[f], f))
    # the planned breaks already count towards the free buffer
    resting = set(cands[:max(0, REST - load[i])])
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
                elig = [f for f in pool if can(f, duty) and (duty == 'ck' or sameRun[f].get(duty, 0) < 2)]
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
            if not ok or duty == 'ck': ok = elig
            # cricket only: finish your hour before moving, so someone one block
            # into it is the first pick to stay. Everything else changes every
            # 30 minutes where it can.
            # pair within a society where we can: someone who shares a club
            # with whoever's already on this duty goes first
            mates = slots[duty]
            ok.sort(key=lambda f: ((not sameRun[f].get('ck') if CK_STAY else i == 9 and (bool(sameRun[f].get('ck')) or not {10, 11} <= avail[f])) if duty == 'ck' else sameRun[f].get(duty, 0) > 0,
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
            opts = [d for d in n if d.startswith('stall-') and can(f, d) and sameRun[f].get(d, 0) < 2]
        # a different zone from last block where there's one
        opts = [d for d in opts if not sameRun[f].get(d)] or opts
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

# ---- setup, 2:00 – 3:00: everyone who's there gets a job ---------------
# Football (6, 2:30 – 3:00) and volleyball (4) go to whoever refs those first
# blocks; the charity stalls get 5, the business stalls 3 (checking they have
# power, tables and everything they need); everyone else sets up their own
# society's marquee. Logistics float.
BIZ_SUB = ['Thanabammini', 'Devansh', 'Divita', 'Thihan', 'Jia', 'Ishan', 'Amal', 'Alex', 'Swadha']
at_setup = [p["n"].split()[0] for p in people if SETUP_FLAG[p["n"].split()[0]]]
first_on = lambda f, ids: any(f in ps for b in roster[:2] for d, ps in b if d in ids)
setup, taken = collections.defaultdict(list), set()
for f in at_setup:
    if 'logi' in tags[f]: setup['logi'].append(f); taken.add(f)
def fill(duty, k, key, ok=lambda f: True):
    for f in sorted([f for f in at_setup if f not in taken and ok(f)], key=key)[:k]:
        setup[duty].append(f); taken.add(f)
# people who asked to be at their own stall (and the fundraising head) keep to it
own = lambda f: f in PIN and PIN[f][0].startswith('stall-')
mobile = lambda f: 'sport' not in cant[f] and 'crowd' not in cant[f] and not own(f) and PREF.get(f) != 'fund-pp'
fill('su-fund', 5, lambda f: (PREF.get(f) != 'fund-pp', not first_on(f, ('fund-pp', 'fund-bake', 'fund-hope')), f), lambda f: not own(f))
fill('su-fb', 6, lambda f: (not first_on(f, ('fb', 'fb-score')), f), mobile)
fill('su-vb', 4, lambda f: (not first_on(f, ('vb',)), f), mobile)
fill('su-biz', 3, lambda f: (f not in BIZ_SUB, f), lambda f: not own(f))
for f in at_setup:
    if f not in taken: setup['su-' + byfirst[f]["s"][0]].append(f)

# phone numbers live beside the roster file, never in the repo
import os
phones_path = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), 'phones.json')
phones = json.load(open(phones_path)) if os.path.exists(phones_path) else {}
for p in people:
    p["a"] = sorted(avail[p["n"].split()[0]])
    if p["n"].split()[0] in phones: p["t"] = phones[p["n"].split()[0]]
out = {"people": people, "roster": roster, "setup": sorted([d, sorted(xs)] for d, xs in setup.items() if xs)}
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
