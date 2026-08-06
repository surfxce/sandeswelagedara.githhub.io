# Instagram screenshots

Screenshots of the Instagram posts listed in `assets/js/social.js`.

Instagram's official embed no longer works — `embed.js` builds its iframe at
`height="0"` and only resizes it once instagram.com posts the measured height
back. That message stops arriving, so every embed collapses to 2px tall. Their
oEmbed API doesn't help either: it needs a Meta app with `oembed_read` granted
through App Review, and it returns the same `embed.js` snippet that's failing.

So the cards are screenshots that link out to the real post.

## Adding one

1. Open the post and screenshot it (`Cmd+Shift+4`). A **4:5 portrait crop** fits
   the card exactly — anything else gets centre-cropped.
2. Save it here using the filename already listed in `social.js`:
   `ig-01.jpg`, `ig-02.jpg`, … `ig-10.jpg`.
3. Optionally set that post's `caption` in `social.js`. Left empty, the card
   reads "view on Instagram →".

Filenames are case-sensitive on GitHub Pages — `IG-01.JPG` will **not** match
`ig-01.jpg`.

Any file that's missing falls back to a coloured gradient, so a typo or a
not-yet-added post looks deliberate rather than broken.

## Keep them small

These load on first paint. Resize before committing:

```bash
sips -s format jpeg -s formatOptions 80 --resampleWidth 800 ~/Desktop/shot.png --out assets/social/ig-01.jpg
```
