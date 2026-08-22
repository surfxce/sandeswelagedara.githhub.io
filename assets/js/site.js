/* ============================================================
   SHARED SITE UTILITIES — loaded on every page
   ============================================================ */
window.SW = window.SW || {};

/* ---------- nav: solid-on-scroll + mobile menu ---------- */
SW.initNav = function(opts){
  opts = opts || {};
  const nav = document.getElementById('mainNav');
  if(!nav) return;

  function updateSolid(){ nav.classList.toggle('solid', window.scrollY > 40); }
  window.addEventListener('scroll', updateSolid, { passive:true });
  updateSolid();

  const burgerBtn = document.getElementById('burgerBtn');
  const navMobile = document.getElementById('navMobile');
  const navMobileClose = document.getElementById('navMobileClose');
  if(burgerBtn && navMobile){
    const open = () => { navMobile.classList.add('open'); burgerBtn.setAttribute('aria-expanded','true'); };
    const close = () => { navMobile.classList.remove('open'); burgerBtn.setAttribute('aria-expanded','false'); };
    burgerBtn.addEventListener('click', open);
    if(navMobileClose) navMobileClose.addEventListener('click', close);
    navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  }

  // highlight the nav link matching the current page
  const current = opts.page;
  if(current){
    document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
      a.classList.toggle('active', a.dataset.nav === current);
    });
  }
};

/* ---------- scroll reveal ----------
   threshold is 0, NOT a fraction. A fractional threshold silently fails on any
   element taller than viewport/threshold: the ratio can never reach the trigger,
   isIntersecting never goes true, .in-view is never added, and the element stays
   at opacity:0 forever. The blog post did exactly this — a 7431px article
   against an 837px viewport tops out at 0.113, under the old 0.12 threshold, so
   the whole post rendered invisible.
   threshold:0 fires the moment any pixel intersects, which is safe at any size;
   the negative bottom rootMargin is what delays it until the element is properly
   on screen, doing the job the fraction was there for. */
SW.observeReveal = function(root){
  const scope = root || document;
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
  scope.querySelectorAll('.reveal:not(.in-view)').forEach(el => revealObserver.observe(el));
};

/* ---------- robust image loader ----------
   Tries each candidate path in order; falls back gracefully if none load.
   Solves the classic "wrong extension / wrong folder / case-sensitive host" problem. */
SW.loadFirstWorkingImage = function(imgEl, candidates, onAllFailed){
  let i = 0;
  function tryNext(){
    if(i >= candidates.length){
      imgEl.style.display = 'none';
      if(onAllFailed) onAllFailed();
      return;
    }
    imgEl.onerror = () => { i++; tryNext(); };
    imgEl.onload = () => { imgEl.style.display = ''; imgEl.dispatchEvent(new Event('sw-loaded')); };
    imgEl.src = candidates[i];
  }
  tryNext();
};

document.addEventListener('DOMContentLoaded', () => { SW.observeReveal(); });
