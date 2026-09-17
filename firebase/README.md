# Spice Road — Cloud Functions

`reviewPhoto` reviews public photo uploads with Gemini. See the comment at the top of `functions/index.js`.

Deploy (from this folder):

    npm i -g firebase-tools
    firebase login
    firebase functions:secrets:set GEMINI_API_KEY      # paste the key at the hidden prompt
    npm --prefix functions install
    firebase deploy --only functions

Turn it on/off from the app: Desk → "AI review".

Database rules live in `database.rules.json` here. Publish them with:

    firebase deploy --only database


## Spicy

`askSpicy` answers execs' questions inside the app (Settings → Spicy). The app
sends each question with a snapshot of what it already knows — every duty, who's
on what this block and next, the asker's own day, the manual — so there's no
document to keep up to date. Gemini answers from those notes only, names a
person to go to when there is one, and says when it doesn't know (the app then
pushes "Message Sandes"). Phone numbers never leave the phone. Generic answers
are cached for a day under `spicy-cache`; `spicy-usage/<date>` counts calls and
the function stops answering after 800 in a day (`SPICY_DAILY_CAP`). Organisers
see every question on the Desk.

`spicy` rows also carry `show` — an id from the app's list of pointable
things (buttons, tabs, settings rows). The app turns it into a **Show me**
button that spotlights the control the same way the welcome tour does.

## Profile pictures

`spice-road/pfp/<first>` holds each exec's photo as a small JPEG data URL,
added from their own phone on the welcome slide or under Settings → Your
photo (squared and shrunk to 128 px before upload). Anyone can write any
name — same honour system as the rest. `tools/onshift-pfp.mjs` is the bulk
alternative: it bakes a folder of photos into the encrypted roster instead.
