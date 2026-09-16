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

