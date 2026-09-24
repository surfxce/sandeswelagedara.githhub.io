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
       'PSA': 'UQPSA', 'NAATAK': 'UQNAATAK', 'PA': 'UQPA', 'ISS': 'UQISS',
       'GIDDHA': 'UQGIDDHA', 'U': 'UQU'}

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
 ("Dhyan Varboo","SLA","3,4,5,6",0,0,"","fb-head"),
 ("Heshan Chandrasekara","SLA","3,4,5,6",0,0,"",""),
 ("Sandes Welagedara","ISC","3,4,5,6,7,8",1,1,"fb,fb-score,stall-UQISC",""),
 ("Rania Gaffoor","PSA","3,4,5,6,7,8",1,1,"",""),
 ("Eshal Ali","PSA","3,4,5,6,7,8",1,1,"stage,sport",""),
 ("Tanisha Raniga","GS","3,4,5,6,7,8",1,1,"","logi,perf3"),
 ("Divita Nagrath","ISC","3,4,5,6,7,8",1,0,"crowd,ck,tk,fb,vb","media"),
 # staying until 8 to play GS's cricket games (7:00, 7:30)
 ("Rushi Kakkad","GS","4,5,6,7",0,0,"stage",""),
 ("Sanuka Ranatunga","SLA","3,4,5,6,7,8",1,1,"",""),
 # head of business stalls: supervises them 3 – 4, SLA stall only (not TELS), leaves 6:30
 ("Thanabammini Balasaravanan","SLA,TELS","3,4,5,6",0,0,"stall-UQTELS","biz-head"),
 ("Thihan Sendanayake","SLA","3,4,5,6,7,8",1,1,"",""),
 ("Deana Jayaweera","SLA","3,4",0,0,"",""),
 ("Zahra Shabbir","PSA","5,6,7",0,0,"sport",""),
 ("Krisha Rekha","ISC","3,4,5,6,7,8",1,0,"",""),
 # NAATAK is on at 5:50, so here from 5
 ("Shalet Shaju","NAATAK","5,6",0,0,"sport",""),
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
 # from the first exec form; never filled in the new one. Rostered by their
 # hours, anything but football and cricket (harder to run and score)
 ("Akash Racha","ISC,TELS","3,4,5,6",1,0,"fb,ck","tels-pres"),
 ("Afthab Shanavas","ISC","3,4",1,0,"fb,ck",""),
 ("Taruni Mithulananthan","ISC","3",1,0,"sport",""),
 ("Arzuh Shankar","ISC","3,4",1,0,"","food-head"),
 ("Vinuki Herath","SLA","3,4,5",0,0,"",""),
 ("Kaamya Dutt","ISS","3,4,5,6,7,8",0,0,"",""),
 # recent health issues: nothing physical or heavy
 ("Abhayjeet Singh","PA","4,5,6",0,0,"fund-pp,crowd,stage,sport,fb-pack",""),
 ("Sriya Sura","TELS","3,4,5",1,0,"",""),
 ("Tejashwini Sivasakthi Vishaalakshi","ISC","3,4,5,6,7,8",1,1,"fb,ck",""),
 ("Sarju Koirala","NC","3,4,5,6,7,8",0,1,"",""),
 ("Dev Dahal","NC","3,4",1,0,"fb,ck,stage",""),
 # playing football for NC (on the football sign-up), so here for the groups too
 ("Prasant Adhikari","NC","3,4,5",0,0,"",""),
 ("Dhriti Praveen","TELS","5,6,7,8",0,0,"fb,ck",""),
 ("Shreya Byru","TELS","3,6,7",1,0,"fb,ck",""),
 ("Sadisha Saparamadu","NAATAK","6,7",0,0,"fb,ck",""),
 ("Bhargavi Ganegaonkar","NAATAK","4,5,6,7,8",0,0,"fb,ck",""),
 # logistics, not a club with a stall
 ("Mathew Jimmy","U","3,4,5,6,7,8",1,1,"","logi"),
 ("Faizah Sahaimi","ISS","3,4,5",0,0,"",""),
 # can't referee, happy to help with the sports otherwise
 ("Siri Chadalavada","ISC","3,4,5,6,7,8",0,1,"vb,fb,ck",""),
 ("Powrnima Sathiamoorty","ISC","3,4,5,6",0,0,"",""),
 # head of performances and the MC; not on the exec form
 ("Kartik Karri","NC,TELS","3,4,5,6,7,8",1,1,"","perf-head"),
 # Nandos: organiser, runs logistics, head of football
 ("Thirunanthanan (Nandos) Thirumurugan","SLA","3,4,5,6,7,8",1,1,"","logi"),
]
# when each performer is on stage (block index): GS garba 4:30, UQPA bhangra
# 6:00, NAATAK 6:30 — they're off duty for that block only
PERF = {'Helly': (3,), 'Tanisha': (3,), 'Matvi': (3,), 'Roshni': (6,), 'Jasmine': (6,), 'Shalet': (5,)}

# society volleyball teams (from "which sport are you playing")
VB_TEAM = {'UQSLA': ["Shavini", "Diya", "Leron", "Sanuka", "Deana", "Nimnah", "Dhyan"],
           'UQISC': ["Mithila", "Sandes", "Krisha", "Sritam", "Ragesh", "Shane", "Tejashwini", "Akash", "Afthab"]}
VB_BLOCK = 0          # SLA v ISC is one of the three first-round games at 3:15
# execs on the other teams, for their first game: NC + PA and Solos play at
# 3:35, Shriyans's team (Shane) at 3:55 — he's here from 4
# NC + PA's first game is 3:35 (block 1); Solos (Matvi), UQISS (Kaamya) and
# UQSLA (Dhyan) play at 3:15; Shriyans's team (Shane) at 3:55, before he's here
VB_OTHER = {'Avinab': 1, 'Jasmine': 1, 'Aarya': 1, 'Prabhjot': 1, 'Ishan': 1, 'Sujal': 1, 'Bhumik': 1, 'Sarju': 1, 'Kartik': 1,
            'Shriyans': 1, 'Matvi': 0, 'Kaamya': 0, 'Dhyan': 0}   # Kaamya: UQISS play-in at 3:15
# execs on the football sign-up sheet (both UQNC); nobody else registered
FB_PLAYERS = ["Aravinth", "Bhumik", "Prasant"]
# the only execs playing cricket
CK_PLAYERS = ["Mathisha", "Thihan", "Rushi", "Prabhjot"]

people, avail, cant, tags, SETUP_FLAG = [], {}, {}, {}, {}
# leaving on a half hour the form can't say
LEAVES = {'Thanabammini': 7, 'Sujal': 9}     # first block they're gone: 6:30, 7:30
# back only for a game: Prabhjot (UQPA) plays cricket for the Mixed Team at 7:00 and 8:00
RETURNS = {'Prabhjot': (8, 10)}
# everyone is known by first name; two people sharing one get a surname
# initial ("Shreya B", "Shreya C"), carried to the app as "k"
_firsts = collections.Counter(r[0].split()[0] for r in P)
KEY = {r[0]: (r[0].split()[0] + ' ' + r[0].split()[-1][0]) if _firsts[r[0].split()[0]] > 1 else r[0].split()[0] for r in P}
KEY["Thirunanthanan (Nandos) Thirumurugan"] = "Nandos"     # what everyone calls him
key_of = lambda p: p.get("k") or p["n"].split()[0]
for name, socs, hours, setup, packup, cd, note in P:
    first = KEY[name]
    people.append({"n": name, "s": [SOC[s] for s in socs.split(',')], **({"k": first} if first != name.split()[0] else {})})
    bs = set()
    for h in (int(x) for x in hours.split(',') if x):
        a, b = HOUR_BLOCKS[h]; bs.add(a); bs.add(b)
    avail[first] = {b for b in bs if b < LEAVES.get(first, 99)} | set(RETURNS.get(first, ()))
    cant[first] = set(x for x in cd.split(',') if x)
    tags[first] = set(x for x in note.split(',') if x)
    SETUP_FLAG[first] = setup

byfirst = {key_of(p): p for p in people}
NO_STALL = {'UQU'}
socs_present = sorted({s for p in people for s in p["s"]} - NO_STALL)
SOC_SIZE = collections.Counter(s for p in people if avail[key_of(p)] for s in p["s"])

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
PREF = {'Aditya': 'ck', 'Humza': 'ck', 'Hasara': 'fund-pp',
        'Divita': 'stall-UQISC', 'Sandes': 'vb', 'Helly': 'st', 'Amal': 'st', 'Sritam': 'vb',
        # presidents and VPs who asked to be based at their stall still get it
        # first, just broken up; Swornim (rolled ankle) and Tanvi on the gate
        'Aarya': 'stall-UQPA', 'Shreya C': 'stall-UQNC', 'Bhumik': 'stall-UQNC', 'Akash': 'stall-UQTELS',
        'Swornim': 'tk', 'Tanvi': 'tk', 'Sanupa': 'vb', 'Heshan': 'vb'}
# how many half hours on a stall across the day: 1.5 hours, or 2.5 for the
# people based at their stall
STALL_CAP = {'Aarya': 5, 'Shreya C': 5, 'Akash': 4, 'Bhumik': 4}
CROWD_CAP = 3
# never on the same duty together
NOT_WITH = {frozenset(x) for x in (('Sandes', 'Rishi'), ('Sandes', 'Siri'), ('Sita', 'Siri'))}
fam = lambda d: 'stall' if d.startswith('stall-') else 'crowd' if d.startswith('cr-') else d
# a head is pinned to their own duty while it's running, before anything else
PIN = {'Aditya': ('ck', (6, 7)), 'Hasara': ('fund-pp', (6, 10))}

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
CK_TEAM = {'Prabhjot': (8, 10)}   # plays for the Mixed Team, not his society
for f in CK_PLAYERS:
    for i in CK_TEAM.get(f) or next((g for sc, g in CK_GAMES.items() if sc in byfirst[f]["s"]), ()):
        if i in avail.get(f, ()) and f not in fixed[i]: fixed[i][f] = 'play-ck'
# Sandes refs the volleyball final and gives out the prizes, then takes the
# presidents' photo at 4:55 (it's on his day as a moment)
fixed[3]['Sandes'] = 'vb'
# Sritam and Heshan asked to referee volleyball: an hour each (Sandes and
# Sritam play for ISC at 3:15, so their refereeing is later)
fixed[2]['Sritam'] = 'vb'
fixed[3]['Sritam'] = 'vb'
# the MC: Div from 4:30 while Kartik's playing volleyball (3:35 – 4:50), then
# Kartik for the rest of the night. Performances start 4:30 at the earliest.
fixed[3]['Divita'] = 'st'
# acts run 4:30 – 5:05 and 5:40 – 6:10, then the raffle and winners at 8:30
for i in (4, 5, 6, 11): fixed[i]['Kartik'] = 'st'
# Thanabammini supervises the business stalls for the first hour
for i in (0, 1): fixed[i]['Thanabammini'] = 'logi-biz'
# Heshan: the third volleyball ref at 3:00, and on volleyball again at 4:00
fixed[0]['Heshan'] = 'vb'
fixed[2]['Heshan'] = 'vb'
# Devansh briefs the cricket crew at 6:10, before the first game at 6:30
fixed[6]['Devansh'] = 'ck-brief'
# …and he's on cricket for the first two games; after that it's self-run
for i in (7, 8): fixed[i]['Devansh'] = 'ck'
# Aarya (PA president) asked to umpire one game: match 2 at 7:00, with Devansh there
fixed[8]['Aarya'] = 'ck'
# Shreya B on the TELS stall the moment it's set up (3:00), and off it 3:30
# and 7:30 – 8:00
fixed[0]['Shreya B'] = 'stall-UQTELS'
AVOID = {('Shreya B', 1, 'stall-UQTELS'), ('Shreya B', 9, 'stall-UQTELS'),
         ('Raziel', 2, 'vb'), ('Akash', 3, 'vb'),
         # Sandes's page-by-page notes: something other than the stall / crowd here
         ('Shreya C', 1, 'stall'), ('Roshni', 9, 'stall'), ('Aarya', 10, 'stall'), ('Akash', 6, 'stall'),
         ('Hasini', 3, 'crowd'), ('Hasini', 8, 'crowd')}
avoid = lambda f, i, d: (f, i, d) in AVOID or (f, i, fam(d)) in AVOID
clash = lambda f, ppl: any(frozenset((f, m)) in NOT_WITH for m in ppl)
STALL_WANT = {'UQSLA': 5, 'UQISC': 5, 'UQPA': 3}
STALL_MIN = {'UQPA': 3}      # PA's president plays volleyball: at least three on their stall
# people Sandes wants out and about even if their stall goes quiet
MOVE_ABOUT = {'Dhriti'}
for f, (duty, blocks) in PIN.items():
    for i in blocks:
        if i in avail.get(f, ()) and f not in fixed[i] and can(f, duty): fixed[i][f] = duty

# ---- what each block needs (min, want) ---------------------------------
def needs(i):
    """(minimum, nice-to-have) per duty. Stalls come first — they're locked to
    a society, so they're the hardest to fill."""
    n = {}
    # two on every society stall, where the society has two execs to give
    # the big two can spare five (two on the stall, the rest on content and
    # sign-ups); everyone else two
    # a club with fewer than four here this half hour needs only one on its
    # stall, so the same two aren't stuck on it all night; PA wants three while
    # their president's playing volleyball (3:30 – 5:00)
    for s in socs_present:
        # who's actually free to take a turn: here, not logistics, not already
        # fixed on something else (playing, performing, pinned) this half hour
        here = sum(1 for f in avail if i in avail[f] and s in byfirst[f]["s"] and 'logi' not in tags[f]
                   and fixed[i].get(f, 'stall-' + s).startswith('stall-') and ('stall-' + s) not in cant[f])
        mn = STALL_MIN.get(s, 2) if s != 'UQPA' or 1 <= i <= 3 else 2
        n['stall-' + s] = (1, 1) if here < 2 else (1, 2) if here < 4 else (mn, max(mn, STALL_WANT.get(s, 2)))
    # football, per the committee's run sheet: a ref per game and two on the
    # score document — 6 for the groups (3:00 – 4:40), 2 for the semis
    # (4:50), 1 for the final (5:30) — then three pack up the gear at 6:00
    if i <= 3:  n['fb'] = (6, 6)
    elif i == 4: n['fb'] = (2, 2)
    elif i == 5: n['fb'] = (1, 1)
    if i <= 5:  n['fb-score'] = (2, 2)
    if i == 6:  n['fb-pack'] = (3, 3)
    # a ref on every bracket court: three courts 3:35 – 4:15, then two
    # three courts for the 3:15 first round and the 3:35 quarter-finals, two at
    # 3:55, then one bracket game at a time (the third court goes social)
    if i in (0, 1): n['vb'] = (3, 3)
    elif i in (2, 3): n['vb'] = (2, 2)
    # cricket, per its run sheet: four people (bowler's-end umpire, square-leg
    # umpire, scorer, helper) from the 6:10 set-up and brief; the crew changes
    # at 7:30; four again for the 8:30 result and pack-down
    if 6 <= i <= 11: n['ck'] = (4, 4)
    n['tk'] = (2, 2) if i <= 3 else (1, 2)
    # stage crew only while acts are on (4:30 – 6:10) and for the 8:30 raffle/winners
    if 3 <= i <= 6: n['st'] = (2, 2)
    elif i == 11: n['st'] = (1, 1)
    n['cr-gate'] = (1, 1); n['cr-food'] = (1, 2)
    n['cr-lawn'] = (1, 1)
    n['fund-pp'] = (1, 1)
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

# three of Sandes's pairs only meet if we place them by hand: a shared duty
# at 7:00 / 7:30, with breaks moved so nobody runs past 2.5 hours
for f, i, dty in (('Divita', 9, 'fund-pp'), ('Sanuka', 9, 'fund-pp'),
                  ('Devansh', 9, 'fund-pp'), ('Shreya B', 9, 'fund-pp'),
                  ('Bhumik', 8, 'ck')):
    fixed[i][f] = dty
BREAK['Devansh'] = {3, 5, 10}
BREAK['Bhumik'] = {5, 10}

roster = []
last = {}          # first -> duty last block, to keep runs of two
counts = collections.Counter()
run = collections.Counter()                          # consecutive blocks on duty
sameRun = collections.defaultdict(dict)              # consecutive blocks on the SAME duty
doneDuty = collections.defaultdict(collections.Counter)   # times on each duty today
famDone = collections.defaultdict(collections.Counter)    # …on each kind (all stalls, all crowd zones)
famRun = collections.defaultdict(lambda: (None, 0))       # (kind, consecutive blocks) as of last block
for i in range(BLOCKS):
    slots = collections.defaultdict(list)
    for f, d in fixed[i].items(): slots[d].append(f)
    placed = set(fixed[i])
    pool = sorted([f for f in avail if i in avail[f] and f not in placed and i not in BREAK.get(f, ())],
                  key=lambda f: (counts[f], f))
    # four people kept free every block — a buffer for covering winning
    # teams, emergencies, a breather. It's whoever has gone longest without a
    # break (an hour on duty at least), so it rotates through everyone.
    CK_STAY = i in (7, 9, 11)           # cricket crews of an hour: 6:00, 7:00, 8:00
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
                # variety: half an hour on something, then something else (cricket
                # crews do an hour); a cap on stall and crowd time across the day.
                # If that leaves a minimum unfilled, a second half hour is allowed.
                base = [f for f in pool if can(f, duty) and not avoid(f, i, duty) and not clash(f, slots[duty])
                        and (sameRun[f].get('ck', 0) < 2 if duty == 'ck' else famRun[f][1] < 2 or famRun[f][0] != fam(duty))]
                capped = lambda f: (fam(duty) == 'stall' and famDone[f]['stall'] >= STALL_CAP.get(f, 3)) or (fam(duty) == 'crowd' and famDone[f]['crowd'] >= CROWD_CAP)
                nxt = lambda f: fam(fixed[i + 1].get(f, '')) if i + 1 < BLOCKS else None
                elig = [f for f in base if (duty == 'ck' or (famRun[f][0] != fam(duty) and nxt(f) != fam(duty))) and not capped(f)]
                if not elig and level == 0: elig = [f for f in base if not capped(f)] or base
                # essentials first — a match with no ref or a gate with nobody
                # on it is worse than a quiet stage — then hardest-to-fill
                tier = 0 if duty in ('vb', 'fb', 'ck', 'tk', 'fb-score', 'fund-pp') or duty.startswith('stall-') or (duty == 'st' and (i <= 3 or i in (6, 7))) else 1
                if elig: open_.append((tier, len(elig), duty, elig))
            if not open_: break
            open_.sort()
            _, _, duty, elig = open_[0]
            # variety: two blocks on a thing is plenty, then something else;
            # three blocks on the trot at all, then a break
            ok = [f for f in elig if run[f] < 3]
            if not ok or duty == 'ck': ok = elig
            # cricket only: finish your hour before moving, so someone one block
            # into it is the first pick to stay. Everything else changes every
            # 30 minutes where it can.
            # pair within a society where we can: someone who shares a club
            # with whoever's already on this duty goes first
            mates = slots[duty]
            ok.sort(key=lambda f: ((not sameRun[f].get('ck') if CK_STAY else (bool(sameRun[f].get('ck')) or i + 1 not in avail[f])) if duty == 'ck' else famRun[f][0] == fam(duty),
                                   # with someone from your own team wherever we can
                                   bool(mates) and not any(set(byfirst[f]["s"]) & set(byfirst[m]["s"]) for m in mates),
                                   PREF.get(f) != duty,
                                   famDone[f][fam(duty)], doneDuty[f].get(duty, 0), counts[f], run[f], f))
            f = ok[0]; pool.remove(f); slots[duty].append(f); placed.add(f)
    # everyone still standing goes on crowd & support — the festival wants
    # every hand (the four resting are already out of the pool).
    CROWD = [d for d in ('cr-gate', 'cr-food', 'cr-lawn', 'cr-gen') if d in n or d == 'cr-gen']
    for f in sorted(pool, key=lambda f: (counts[f], f)):
        fresh = lambda d: famRun[f][0] != fam(d) and not avoid(f, i, d) and not clash(f, slots[d])
        opts = [d for d in CROWD if can(f, d) and fresh(d) and famDone[f]['crowd'] < CROWD_CAP]
        # otherwise an extra pair of hands somewhere they haven't just been:
        # their own stall, the gate, the charity marquee, the stage while it's on
        if not opts:
            opts = [d for d in n if d.startswith('stall-') and can(f, d) and fresh(d) and famDone[f]['stall'] < STALL_CAP.get(f, 3)
                    and len(slots[d]) <= n[d][1]]
            opts += [d for d in ('tk', 'fund-pp', 'st') if d in n and can(f, d) and fresh(d) and len(slots[d]) < n[d][1] + 1]
        if not opts: continue      # a break
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
        if d: doneDuty[f][d] += 1; famDone[f][fam(d)] += 1
        famRun[f] = (fam(d), famRun[f][1] + 1 if famRun[f][0] == fam(d) else 1) if d else (None, 0)
    last = {x: d for d, xs in slots.items() for x in xs}
    roster.append(sorted(([d, sorted(xs)] for d, xs in slots.items() if xs), key=lambda r: r[0]))

# ---- pairs Sandes wants on something together at least once -------------
# After the day's built: for each pair not yet together, find a block where
# both are here and move one onto the other's duty — only someone on crowd &
# support or a spare on a busy stall, so nobody loses a break and nothing
# essential goes short.
PAIRS = [('Divita', 'Sanuka'), ('Akash', 'Dhriti'), ('Devansh', 'Shreya B'), ('Thihan', 'Sanupa'),
         ('Deana', 'Diya'), ('Dhyan', 'Kavinila'), ('Mathisha', 'Nimnah'), ('Thar', 'Nandos'),
         ('Krisha', 'Mithila'), ('Sita', 'Afthab'), ('Tejashwini', 'Afthab'), ('Bhumik', 'Shreya C'),
         ('Bhumik', 'Aarya'), ('Aravinth', 'Tejashwini'), ('Devashri', 'Thihan'), ('Hargun', 'Kartik'),
         ('Pritisha', 'Aarya')]
def _rows(i): return {d: ps for d, ps in roster[i]}
def _duty(f, i): return next((d for d, ps in roster[i] if f in ps), None)
def _together(a, b): return any(a in ps and b in ps and not d.startswith('play-') for bl in roster for d, ps in bl)
def _movable(f, i):
    d = _duty(f, i)
    if d is None or f in fixed[i]: return False
    return d.startswith('cr-') or (d.startswith('stall-') and len(_rows(i)[d]) > 2)
def _can_join(f, d):
    if d in ('play-vb', 'play-fb', 'play-ck', 'perform', 'prep', 'photo-pres', 'ck-brief'): return False
    return d == 'logi' or can(f, d)
PAIRED, UNPAIRED = [], []
for a, b in PAIRS:
    if a not in avail or b not in avail: UNPAIRED.append((a, b, 'not on the roster')); continue
    if _together(a, b): PAIRED.append((a, b, None)); continue
    done = None
    for i in sorted(avail[a] & avail[b]):
        da, db = _duty(a, i), _duty(b, i)
        for mover, other, dest in ((a, b, db), (b, a, da)):
            nb = {fam(_duty(mover, j) or '') for j in (i - 1, i + 1) if 0 <= j < BLOCKS}
            if dest and _movable(mover, i) and _can_join(mover, dest) and fam(dest) not in nb and not clash(mover, _rows(i).get(dest, [])):
                src = _duty(mover, i)
                for bl in roster[i]:
                    if bl[0] == src: bl[1].remove(mover)
                    if bl[0] == dest: bl[1].append(mover); bl[1].sort()
                roster[i] = [bl for bl in roster[i] if bl[1]]
                done = i; break
        if done is not None: break
    (PAIRED if done is not None else UNPAIRED).append((a, b, done) if done is not None else (a, b, 'no block where one can join the other'))

# ---- setup, 2:00 – 3:00: everyone who's there gets a job ---------------
# Football (6, 2:30 – 3:00) and volleyball (4) go to whoever refs those first
# blocks; the charity stalls get 5, the business stalls 3 (checking they have
# power, tables and everything they need); everyone else sets up their own
# society's marquee. Logistics float.
BIZ_SUB = ['Thanabammini', 'Devansh', 'Divita', 'Thihan', 'Jia', 'Ishan', 'Amal', 'Alex', 'Swadha']
at_setup = [key_of(p) for p in people if SETUP_FLAG[key_of(p)]]
first_on = lambda f, ids: any(f in ps for b in roster[:2] for d, ps in b if d in ids)
setup, taken = collections.defaultdict(list), set()
# 1:00 pm at the C&S room: collect the equipment and bring it down
for f in ['Nandos', 'Prabhas', 'Mathew', 'Devansh']:
    if f in avail: setup['su-cns'].append(f); taken.add(f)
# Tanisha helps set up the GS marquee
setup['su-UQGS'].append('Tanisha'); taken.add('Tanisha')
for f in at_setup:
    if f not in taken and 'logi' in tags[f]: setup['logi'].append(f); taken.add(f)
# five people at setup, picked at random (same five every rebuild), start at
# 1:00 with the logistics team
import random as _random
_pool = sorted(f for f in at_setup if f not in taken and f != 'Sandes' and 'logi' not in tags[f] and 'crowd' not in cant[f] and 'sport' not in cant[f])
for f in _random.Random('spice-road-1pm').sample(_pool, min(5, len(_pool))):
    setup['su-logi'].append(f); taken.add(f)
def fill(duty, k, key, ok=lambda f: True):
    for f in sorted([f for f in at_setup if f not in taken and ok(f)], key=key)[:k]:
        setup[duty].append(f); taken.add(f)
# people who asked to be at their own stall (and the fundraising head) keep to it
own = lambda f: f in PIN and PIN[f][0].startswith('stall-')
mobile = lambda f: 'sport' not in cant[f] and 'crowd' not in cant[f] and not own(f) and PREF.get(f) != 'fund-pp'
fill('su-fund', 3, lambda f: (PREF.get(f) != 'fund-pp', not first_on(f, ('fund-pp', 'fund-bake', 'fund-hope')), f), lambda f: not own(f))
fill('su-fb', 6, lambda f: (not first_on(f, ('fb', 'fb-score')), f), mobile)
fill('su-vb', 4, lambda f: (not first_on(f, ('vb',)), f), mobile)
fill('su-biz', 3, lambda f: (f not in BIZ_SUB, f), lambda f: not own(f))
# at most three on any club's marquee (presidents and people based at their
# stall first); anyone over goes flexible — the committee heads will use them
MARQUEE_MAX = 3
first_pick = lambda f: (not (('pres' in ' '.join(tags[f])) or (f in PIN and PIN[f][0].startswith('stall-'))), f)
for c in sorted({byfirst[f]["s"][0] for f in at_setup if f not in taken}):
    club = sorted([f for f in at_setup if f not in taken and byfirst[f]["s"][0] == c], key=first_pick)
    room = MARQUEE_MAX - len(setup['su-' + c])
    for f in club[:max(0, room)]: setup['su-' + c].append(f); taken.add(f)
    for f in club[max(0, room):]: setup['su-flex'].append(f); taken.add(f)

# phone numbers live beside the roster file, never in the repo
import os
phones_path = os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), 'phones.json')
phones = json.load(open(phones_path)) if os.path.exists(phones_path) else {}
PACKUP = {r[0]: r[4] for r in P}
for p in people:
    p["a"] = sorted(avail[key_of(p)])
    if PACKUP.get(p["n"]): p["u"] = 1
    nostall = sorted(x[6:] for x in cant[key_of(p)] if x.startswith('stall-'))
    if nostall: p["x"] = nostall
    if key_of(p) in phones: p["t"] = phones[key_of(p)]
# numbers for contacts who aren't execs (anyone in phones.json not on the roster)
contacts = {k: v for k, v in phones.items() if k not in avail}
out = {"people": people, "roster": roster, "contacts": contacts, "setup": sorted([d, sorted(xs)] for d, xs in setup.items() if xs)}
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
print("\nPAIRS")
for a, b, i in PAIRED: print(f"  {a} + {b}: {'already together' if i is None else 'together at block ' + str(i)}")
for a, b, why in UNPAIRED: print(f"  {a} + {b}: NOT PAIRED — {why}")
print("\nLONGEST STRETCH ON ONE DUTY (logistics excluded — they float all day)")
for f, b in sorted(longest.items(), key=lambda kv: -kv[1])[:8]:
    if 'logi' in tags[f]: continue
    print(f"  {f:<14} {b} blocks in a row")
print("\nPER PERSON (blocks on duty out of the ones they're here)")
for f in sorted(avail):
    print(f"  {f:<14} {counts[f]:2d} on / {len(avail[f]):2d} here")
