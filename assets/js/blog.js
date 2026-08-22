/* ============================================================
   BLOG POSTS — this is the only part you should need to touch.
   ============================================================

   Add a post by adding an object here. Newest first; nothing sorts
   them for you.

     title    the headline
     tag      short category label, shown above the title in caps
     excerpt  a sentence or two — this is all the card shows
     date     free text, e.g. 'March 2026'
     href     where the post lives. Omit it (or leave '') and the card
              renders greyed out as a "coming soon" placeholder.

   There's no post-rendering machinery here yet — no markdown, no
   per-post pages. When you write the first real one, the simplest
   path is a plain HTML file in blog/ (copy this page's shell) and
   point `href` at it.
*/
const POSTS = [
  { tag:'Study', title:'How I study',
    excerpt:'The workflow I actually use — AI-generated long answer questions, geometric mean scoring, and a loose leaf binder. Plus everything I’ve tried and dropped.',
    date:'August 2026', href:'how-i-study/' },

  { tag:'Beyond15', title:'Why it all runs on device',
    excerpt:'On-premise isn’t a constraint I worked around — it was the point. What that decision costs, and what it buys.',
    date:'Coming soon', href:'' },

  { tag:'Clubs', title:'What running events teaches you that a degree doesn’t',
    excerpt:'Run-sheets, sponsorships, and the specific panic of a venue changing its mind two days out.',
    date:'Coming soon', href:'' },
];

/* ============================================================
   RENDER
   ============================================================ */
function buildBlog(){
  const grid = document.getElementById('blogGrid');
  if(!grid) return;

  if(!POSTS.length){
    grid.innerHTML = '<p class="section-note">Nothing here yet.</p>';
    return;
  }

  POSTS.forEach(post => {
    const live = !!post.href;
    // a card with nowhere to go shouldn't be a link
    const el = document.createElement(live ? 'a' : 'div');
    el.className = 'blog-card' + (live ? '' : ' soon');
    if(live) el.href = post.href;

    el.innerHTML = `
      <p class="blog-tag" style="color:var(--clay)">${post.tag}</p>
      <h3 class="blog-title">${post.title}</h3>
      <p class="blog-excerpt">${post.excerpt}</p>
      <p class="blog-meta">${post.date}${live ? ' · read →' : ''}</p>`;

    grid.append(el);
  });

  SW.observeReveal(grid);
}

document.addEventListener('DOMContentLoaded', buildBlog);
