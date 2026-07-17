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

/* ---------- scroll reveal ---------- */
SW.observeReveal = function(root){
  const scope = root || document;
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
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
