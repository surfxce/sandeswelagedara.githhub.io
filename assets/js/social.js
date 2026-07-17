/* ============================================================
   SOCIALS DATA
   EDIT ME: swap placeholder posts for real ones. Each post can take
   a `src` (real image path) — falls back to a gradient tile if missing.
   Set the real profile URLs for LinkedIn / YouTube below.
   ============================================================ */
const SOCIAL_PLATFORMS = [
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@_.s.a.n.d.e.s._',
    url: 'https://instagram.com/_.s.a.n.d.e.s._',
    posts: [
      { src:'assets/social/insta-1.jpg', cap:'Kyoto', color:'linear-gradient(160deg,var(--coral),var(--gold))' },
      { src:'assets/social/insta-2.jpg', cap:'Osaka', color:'linear-gradient(160deg,var(--violet),var(--pink))' },
      { src:'assets/social/insta-3.jpg', cap:'Tokyo', color:'linear-gradient(160deg,var(--teal),var(--violet))' },
      { src:'assets/social/insta-4.jpg', cap:'Benny', color:'linear-gradient(160deg,var(--gold),var(--pink))' },
      { src:'assets/social/insta-5.jpg', cap:'Miyajima', color:'linear-gradient(160deg,var(--pink),var(--violet))' },
      { src:'assets/social/insta-6.jpg', cap:'Brisbane', color:'linear-gradient(160deg,var(--coral),var(--violet))' }
    ]
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'EDIT ME — add your LinkedIn URL',
    url: '#', /* EDIT ME */
    posts: [
      { src:'assets/social/li-1.jpg', cap:'Beyond15 launch', color:'linear-gradient(160deg,var(--violet),var(--teal))' },
      { src:'assets/social/li-2.jpg', cap:'Hackathon', color:'linear-gradient(160deg,var(--coral),var(--gold))' },
      { src:'assets/social/li-3.jpg', cap:'UQLIT socials', color:'linear-gradient(160deg,var(--pink),var(--gold))' },
      { src:'assets/social/li-4.jpg', cap:'Graduation', color:'linear-gradient(160deg,var(--teal),var(--coral))' }
    ]
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: 'EDIT ME — add your YouTube URL',
    url: '#', /* EDIT ME */
    posts: [
      { src:'assets/social/yt-1.jpg', cap:'Beyond15 demo', color:'linear-gradient(160deg,var(--gold),var(--violet))' },
      { src:'assets/social/yt-2.jpg', cap:'Dev log 01', color:'linear-gradient(160deg,var(--coral),var(--teal))' },
      { src:'assets/social/yt-3.jpg', cap:'Dev log 02', color:'linear-gradient(160deg,var(--violet),var(--pink))' }
    ]
  }
];

function renderSocials(){
  const root = document.getElementById('socialRoot');
  if(!root) return;

  SOCIAL_PLATFORMS.forEach(plat => {
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
    track.style.paddingLeft = 'var(--pad)';
    track.style.paddingRight = 'var(--pad)';

    plat.posts.forEach(post => {
      const card = document.createElement('a');
      card.className = 'social-post';
      card.href = plat.url;
      card.target = '_blank';
      card.rel = 'noopener';
      card.innerHTML = `
        <span class="tint" style="background:${post.color}"></span>
        <img alt="${post.cap}" loading="lazy">
        <span class="cap">${post.cap}</span>
      `;
      const img = card.querySelector('img');
      SW.loadFirstWorkingImage(img, [post.src]);
      track.append(card);
    });

    sticky.append(head, track);
    block.append(sticky);
    root.append(block);
  });

  initScrollJack();
}

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
  window.addEventListener('scroll', () => {
    if(!ticking){ requestAnimationFrame(update); ticking = true; }
  }, { passive:true });
  window.addEventListener('resize', update);
  update();
}

document.addEventListener('DOMContentLoaded', renderSocials);
