/* ============================================================
   SOCIALS — the Instagram embed safety net
   ============================================================
   Instagram's embed.js swaps each blockquote.instagram-media for an
   iframe that is born height="0" and only grows once instagram.com
   posts a MEASURE message back with the measured height. When a post
   can't be embedded — the account setting off again, the post
   deleted, Instagram itself having a day — that message never
   arrives and the embed sits at 326x0: present in the DOM, holding
   grid space, completely invisible. That exact failure is what
   emptied the first socials build (it's why it was scrapped for
   screenshot cards that never got taken), so this page refuses to
   show it: after a grace period, any embed that never gained a real
   height is swapped for a tinted card that links out to the post. */

(function(){
  var MIN_HEALTHY_HEIGHT = 60;   // a mounted embed is 400px+; 0 or ~2 is dead
  /* embed.js processes at most three embeds at once, so with ten of them the
     tail starts only as earlier ones finish — poll rather than check once,
     and only the last pass is allowed to swap anything out. */
  var CHECKS_AT_MS = [4000, 9000, 15000, 22000];

  function embedHeight(fig){
    var iframe = fig.querySelector('iframe');
    if(!iframe) return 0;
    return iframe.offsetHeight || parseInt(iframe.getAttribute('height'), 10) || 0;
  }

  function swapInFallback(fig){
    if(fig.querySelector('.ig-fallback')) return;
    var a = document.createElement('a');
    a.className = 'ig-fallback';
    a.href = fig.dataset.permalink;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML =
      '<span class="ig-fallback-note">this one wouldn\u2019t embed</span>' +
      '<span class="ig-fallback-link">view it on Instagram \u2192</span>';
    fig.innerHTML = '';
    fig.appendChild(a);
  }

  function pass(isFinal){
    document.querySelectorAll('.ig-embed').forEach(function(fig){
      if(fig.dataset.igDone) return;
      if(embedHeight(fig) >= MIN_HEALTHY_HEIGHT){ fig.dataset.igDone = '1'; return; }
      if(isFinal) swapInFallback(fig);
    });
  }

  window.addEventListener('load', function(){
    CHECKS_AT_MS.forEach(function(ms, i){
      setTimeout(function(){ pass(i === CHECKS_AT_MS.length - 1); }, ms);
    });
  });
})();
