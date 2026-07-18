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

/* ---- Instagram: official embed, picked by hand. ----
   Open a post on instagram.com → "..." → Embed → Copy Link
   (or just copy the post's URL from the address bar, either works).
   Paste as many as you like below. */
const INSTAGRAM_POST_URLS = [
  // 'https://www.instagram.com/p/DYmYpvmEyea/?img_index=1',
  // 'https://www.instagram.com/p/DYFJ7sME2Zj/?img_index=1',
  // 'https://www.instagram.com/p/DS9azQ1EzC5/?img_index=1',
  // 'https://www.instagram.com/p/DQjIjYBExJx/?img_index=1',   
  // 'https://www.instagram.com/p/DPidMwbE_ca/?img_index=5',    
  // 'https://www.instagram.com/p/DPc8Ij7k-U6/?img_index=5', 
  // 'https://www.instagram.com/p/DOpySxPkypw/?img_index=5', 
  // 'https://www.instagram.com/p/DNrgVR05qYh/?img_index=5', 
  // 'https://www.instagram.com/p/DM_5XemJOkB/?img_index=5', 
  // 'https://www.instagram.com/p/DMr8umGpsDe/?img_index=5', 
];

/* ---- LinkedIn: official embed, only where the author enabled it. ----
   Open a post on linkedin.com → "..." on the post → "Embed this post"
   (if you don't see this option, that post can't be embedded — link
   out to it instead). Copy the iframe's `src` value only, not the
   whole snippet, and paste it below. */
const LINKEDIN_EMBED_SRCS = [
  // 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7476862595333906432?collapsed=1',
  // 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7435617339305324544?collapsed=1',
  // 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7354137686804230147?collapsed=1',
  // 'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7326165434473295873?collapsed=1',
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
    <span class="tint" style="background:linear-gradient(160deg,var(--ink-3),var(--ink))"></span>
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
   RENDER: Instagram — official blockquote embeds
   ============================================================ */
function renderInstagram(track, plat){
  if(!INSTAGRAM_POST_URLS.length){
    track.append(emptyStateCard(plat.url, 'Add post URLs in social.js to show real Instagram embeds here — for now, visit the profile →'));
    return;
  }
  INSTAGRAM_POST_URLS.forEach(url => {
    const wrap = document.createElement('div');
    wrap.className = 'social-post embed';
    wrap.innerHTML = `<blockquote class="instagram-media" data-instgrm-permalink="${url}" data-instgrm-version="14" style="margin:0;"></blockquote>`;
    track.append(wrap);
  });
  // load Instagram's embed script once, or re-process if already present
  if(window.instgrm){
    window.instgrm.Embeds.process();
  } else if(!document.getElementById('ig-embed-script')){
    const s = document.createElement('script');
    s.id = 'ig-embed-script';
    s.async = true;
    s.src = 'https://www.instagram.com/embed.js';
    s.onload = () => { if(window.instgrm) window.instgrm.Embeds.process(); recalcAllTracks(); };
    document.body.appendChild(s);
  }
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
    wrap.className = 'social-post embed';
    wrap.innerHTML = `<iframe src="${src}" height="380" width="280" frameborder="0" allowfullscreen="" title="LinkedIn post"></iframe>`;
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
