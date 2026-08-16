/* ============================================================
   SOCIALS CONFIG — this is the only part you should need to touch.
   ============================================================ */

/* ---- YouTube: genuinely live. ----
   1. Go to https://console.cloud.google.com/ → create a project (free)
      → "APIs & Services" → Library → enable "YouTube Data API v3"
      → "Credentials" → Create API key.
   2. Restrict the key: Application restrictions → "Websites" →
      add your domain (e.g. sandeswelagedara.com/*). This makes the
      key safe to leave visible in this file — it can only be used
      from your site and can only read public data.
   3. Paste the key below. Your handle is already filled in. */
const YOUTUBE_CONFIG = {
  handle: 'surfxcestudy',   // from youtube.com/@surfxcestudy
  apiKey: 'AIzaSyCQmMaL7BY9KzUB2fOHrr9L3B4a9C0B_yE',               // EDIT ME — paste your API key here
  maxResults: 6
};

/* ---- Instagram: screenshot + link out. ----
   NOT the official embed. Instagram's embed.js builds its iframe at
   height="0" and only resizes it once instagram.com posts a message
   back with the measured height. That message no longer arrives
   reliably, so every embed collapsed to 2px tall — invisible.
   Their oEmbed API doesn't fix it either: it needs a Meta app with
   `oembed_read` granted through App Review, and it just hands back
   the same embed.js snippet that's failing.

   So: take a screenshot of the post, drop it in assets/social/,
   and the card links out to the real thing.

   TO ADD A POST:
   1. Open the post, screenshot it (Cmd+Shift+4). A 4:5 portrait crop
      fits the card best — anything else gets center-cropped.
   2. Save it to assets/social/ with the filename below.
   3. Fill in `caption`. Leave it '' to fall back to "view on Instagram →".
   Missing images degrade to a coloured gradient, so a wrong filename
   looks intentional rather than broken. */
const INSTAGRAM_POSTS = [
  { url:'https://www.instagram.com/p/DYmYpvmEyea/', img:'assets/social/ig-01.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DYFJ7sME2Zj/', img:'assets/social/ig-02.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DS9azQ1EzC5/', img:'assets/social/ig-03.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DQjIjYBExJx/', img:'assets/social/ig-04.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DPidMwbE_ca/', img:'assets/social/ig-05.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DPc8Ij7k-U6/', img:'assets/social/ig-06.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DOpySxPkypw/', img:'assets/social/ig-07.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DNrgVR05qYh/', img:'assets/social/ig-08.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DM_5XemJOkB/', img:'assets/social/ig-09.jpg', caption:'' },
  { url:'https://www.instagram.com/p/DMr8umGpsDe/', img:'assets/social/ig-10.jpg', caption:'' },
];

/* gradient shown behind each card until its screenshot exists */
const IG_TINTS = [
  'linear-gradient(160deg, var(--moss), var(--fern))',
  'linear-gradient(160deg, var(--clay), var(--wheat))',
  'linear-gradient(160deg, var(--bark), var(--clay))',
  'linear-gradient(160deg, var(--fern), var(--wheat))',
  'linear-gradient(160deg, var(--wheat), var(--bark))'
];

/* ---- LinkedIn: official embed, only where the author enabled it. ----
   Open a post on linkedin.com → "..." on the post → "Embed this post"
   (if you don't see this option, that post can't be embedded — link
   out to it instead). Copy the iframe's `src` value only, not the
   whole snippet, and paste it below. */
const LINKEDIN_EMBED_SRCS = [
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7476862595333906432?collapsed=1',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7435617339305324544?collapsed=1',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7354137686804230147?collapsed=1',
  'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7326165434473295873?collapsed=1',
];

/* ============================================================
   PLATFORM SHELL
   ============================================================ */
const SOCIAL_PLATFORMS = [
  { id:'instagram', name:'Instagram', handle:'@_.s.a.n.d.e.s._', url:'https://www.instagram.com/_.s.a.n.d.e.s._/' },
  { id:'linkedin',  name:'LinkedIn',  handle:'/in/sandes-welagedara', url:'https://www.linkedin.com/in/sandes-welagedara/' },
  { id:'youtube',   name:'YouTube',   handle:'@' + YOUTUBE_CONFIG.handle, url:'https://www.youtube.com/@' + YOUTUBE_CONFIG.handle }
];

function emptyStateCard(platformUrl, message){
  const card = document.createElement('a');
  card.className = 'social-post embed empty-state';
  card.href = platformUrl;
  card.target = '_blank';
  card.rel = 'noopener';
  card.innerHTML = `
    <span class="tint" style="background:linear-gradient(160deg,var(--paper-3),var(--paper))"></span>
    <span class="cap" style="position:relative; opacity:1; background:none; padding:1rem;">${message}</span>
  `;
  return card;
}

function buildTrackShell(plat){
  const block = document.createElement('div');
  block.className = 'social-block';
  block.dataset.platform = plat.id;

  const sticky = document.createElement('div');
  sticky.className = 'social-sticky';

  const head = document.createElement('div');
  head.className = 'wrap social-head';
  head.innerHTML = `
    <p class="plat-name">${plat.name}</p>
    <a class="plat-handle" href="${plat.url}" target="_blank" rel="noopener">${plat.handle} ↗</a>
  `;

  const track = document.createElement('div');
  track.className = 'social-track';
  track.id = 'track-' + plat.id;
  track.style.paddingLeft = 'var(--pad)';
  track.style.paddingRight = 'var(--pad)';

  sticky.append(head, track);
  block.append(sticky);
  return { block, track };
}

/* ============================================================
   RENDER: Instagram — screenshot cards that link out
   ============================================================ */
function renderInstagram(track, plat){
  if(!INSTAGRAM_POSTS.length){
    track.append(emptyStateCard(plat.url, 'Add posts in social.js to show them here — for now, visit the profile →'));
    return;
  }
  INSTAGRAM_POSTS.forEach((post, i) => {
    const card = document.createElement('a');
    card.className = 'social-post';
    card.href = post.url;
    card.target = '_blank';
    card.rel = 'noopener';

    const tint = document.createElement('span');
    tint.className = 'tint';
    tint.style.background = IG_TINTS[i % IG_TINTS.length];
    card.append(tint);

    if(post.img){
      const img = document.createElement('img');
      img.alt = post.caption || 'Instagram post';
      // no loading="lazy" here on purpose — it defers the request, which
      // defers the 404, which leaves a broken-image icon sitting on top
      // of the gradient until you scroll to it. Resolve it up front.
      SW.loadFirstWorkingImage(img, [post.img], () => {});
      card.append(img);
    }

    const cap = document.createElement('span');
    cap.className = 'cap';
    cap.textContent = post.caption || 'view on Instagram →';
    card.append(cap);

    track.append(card);
  });
  recalcAllTracks();
}

/* ============================================================
   RENDER: LinkedIn — official iframe embeds
   ============================================================ */
function renderLinkedIn(track, plat){
  if(!LINKEDIN_EMBED_SRCS.length){
    track.append(emptyStateCard(plat.url, 'Add "Embed this post" src URLs in social.js to show real LinkedIn embeds here — for now, visit the profile →'));
    return;
  }
  LINKEDIN_EMBED_SRCS.forEach(src => {
    const wrap = document.createElement('div');
    wrap.className = 'social-post embed embed-li';
    // 504x626 is LinkedIn's own embed size; CSS scales it down on short/narrow viewports.
    wrap.innerHTML = `<iframe src="${src}" height="626" width="504" frameborder="0" allowfullscreen="" title="LinkedIn post" loading="lazy"></iframe>`;
    track.append(wrap);
  });
}

/* ============================================================
   RENDER: YouTube — live via Data API v3
   ============================================================ */
async function renderYouTube(track, plat){
  if(!YOUTUBE_CONFIG.apiKey){
    track.append(emptyStateCard(plat.url, 'Add a YouTube API key in social.js to pull real videos here — for now, visit the channel →'));
    return;
  }
  try{
    const key = YOUTUBE_CONFIG.apiKey;
    const chRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${YOUTUBE_CONFIG.handle}&key=${key}`);
    const chData = await chRes.json();
    const uploadsPlaylist = chData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if(!uploadsPlaylist) throw new Error('channel not found');

    const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${YOUTUBE_CONFIG.maxResults}&playlistId=${uploadsPlaylist}&key=${key}`);
    const vidData = await vidRes.json();
    const items = vidData.items || [];
    if(!items.length) throw new Error('no videos');

    items.forEach(item => {
      const videoId = item.snippet.resourceId.videoId;
      const wrap = document.createElement('div');
      wrap.className = 'social-post embed';
      wrap.innerHTML = `<iframe width="280" height="380" src="https://www.youtube.com/embed/${videoId}" title="${item.snippet.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      track.append(wrap);
    });
    recalcAllTracks();
  } catch(err){
    track.innerHTML = '';
    track.append(emptyStateCard(plat.url, 'Couldn\u2019t load videos (check the API key/handle in social.js) — visit the channel →'));
  }
}

/* ============================================================
   BOOT
   ============================================================ */
function renderSocials(){
  const root = document.getElementById('socialRoot');
  if(!root) return;

  SOCIAL_PLATFORMS.forEach(plat => {
    const { block, track } = buildTrackShell(plat);
    root.append(block);
    if(plat.id === 'instagram') renderInstagram(track, plat);
    if(plat.id === 'linkedin') renderLinkedIn(track, plat);
    if(plat.id === 'youtube') renderYouTube(track, plat);
  });

  initScrollJack();
  // embeds (esp. Instagram) can resize after their scripts finish — recalc shortly after
  setTimeout(recalcAllTracks, 1200);
  setTimeout(recalcAllTracks, 2500);
}

let scrollJackUpdate = null;
function initScrollJack(){
  const blocks = Array.from(document.querySelectorAll('.social-block'));
  if(!blocks.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isNarrow = window.matchMedia('(max-width:640px)').matches;
  if(reduceMotion || isNarrow) return; // CSS fallback handles horizontal swipe-scroll instead

  let ticking = false;
  function update(){
    blocks.forEach(block => {
      const track = block.querySelector('.social-track');
      const rect = block.getBoundingClientRect();
      const scrollable = block.offsetHeight - window.innerHeight;
      if(scrollable <= 0) return;
      const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
      const maxTranslate = Math.max(0, track.scrollWidth - track.clientWidth);
      track.style.transform = `translateX(-${progress * maxTranslate}px)`;
    });
    ticking = false;
  }
  scrollJackUpdate = update;
  window.addEventListener('scroll', () => {
    if(!ticking){ requestAnimationFrame(update); ticking = true; }
  }, { passive:true });
  window.addEventListener('resize', update);
  update();
}
function recalcAllTracks(){ if(scrollJackUpdate) scrollJackUpdate(); }

document.addEventListener('DOMContentLoaded', renderSocials);
