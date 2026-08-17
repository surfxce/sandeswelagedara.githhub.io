/* ============================================================
   PHOTOS — this is the only part you should need to touch.
   ============================================================

   Drop files in assets/photos/ and list them below. Paths are relative
   to the photos page, so they start with "../".

     src  path to the image
     cap  caption shown on hover, and under the image in the lightbox

   Any file that isn't there yet falls back to a tinted placeholder tile,
   so a half-filled list still looks deliberate rather than broken.
   Filenames are case-sensitive on GitHub Pages — "IMG_01.JPG" will NOT
   match "img-01.jpg".

   Keep them small; these all load on first paint:
     sips -s format jpeg -s formatOptions 80 --resampleWidth 1400 \
       ~/Desktop/shot.jpg --out assets/photos/01.jpg
*/
const PHOTOS = [
  // { src:'../assets/photos/01.jpg', cap:'Brisbane, 2026' },
  // { src:'../assets/photos/02.jpg', cap:'' },
];

/* aspect ratios + tints cycled through the placeholder tiles, so an empty
   grid still reads as a photo wall rather than a stack of identical boxes */
const PLACEHOLDER_SHAPES = ['4/5', '1/1', '3/4', '4/5', '1/1', '5/4', '3/4', '1/1', '4/5'];
const PLACEHOLDER_TINTS = [
  'linear-gradient(160deg, var(--moss), var(--fern))',
  'linear-gradient(160deg, var(--clay), var(--wheat))',
  'linear-gradient(160deg, var(--bark), var(--clay))',
  'linear-gradient(160deg, var(--fern), var(--wheat))',
  'linear-gradient(160deg, var(--wheat), var(--bark))'
];

/* ============================================================
   RENDER
   ============================================================ */
let openIndex = -1;

function buildGrid(){
  const grid = document.getElementById('photoGrid');
  const empty = document.getElementById('photoEmpty');
  if(!grid) return;

  if(!PHOTOS.length){
    if(empty) empty.style.display = '';
    // a ghost wall, so the page has shape before there are any photos
    PLACEHOLDER_SHAPES.forEach((ar, i) => {
      const tile = document.createElement('div');
      tile.className = 'photo-tile';
      tile.style.cursor = 'default';
      tile.innerHTML = `<div class="photo-fallback" style="--ar:${ar}; background:${PLACEHOLDER_TINTS[i % PLACEHOLDER_TINTS.length]}; opacity:.5"></div>`;
      grid.append(tile);
    });
    return;
  }

  if(empty) empty.style.display = 'none';
  PHOTOS.forEach((photo, i) => {
    const tile = document.createElement('div');
    tile.className = 'photo-tile';
    tile.innerHTML = `<div class="photo-fallback" style="--ar:${PLACEHOLDER_SHAPES[i % PLACEHOLDER_SHAPES.length]}; background:${PLACEHOLDER_TINTS[i % PLACEHOLDER_TINTS.length]}"></div>`;

    const img = document.createElement('img');
    img.alt = photo.cap || '';
    SW.loadFirstWorkingImage(img, [photo.src], () => {});
    // once it loads, the placeholder underneath is redundant
    img.addEventListener('sw-loaded', () => {
      const fb = tile.querySelector('.photo-fallback');
      if(fb) fb.remove();
    });
    tile.append(img);

    if(photo.cap){
      const cap = document.createElement('span');
      cap.className = 'cap';
      cap.textContent = photo.cap;
      tile.append(cap);
    }

    tile.addEventListener('click', () => openLightbox(i));
    grid.append(tile);
  });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
function openLightbox(i){
  if(!PHOTOS.length) return;
  openIndex = (i + PHOTOS.length) % PHOTOS.length;
  const photo = PHOTOS[openIndex];

  const box = document.getElementById('lightbox');
  const img = document.getElementById('lbImg');
  const fb  = document.getElementById('lbFallback');
  const cap = document.getElementById('lbCap');

  fb.style.display = 'block';
  fb.style.background = PLACEHOLDER_TINTS[openIndex % PLACEHOLDER_TINTS.length];
  img.style.display = 'none';
  img.onload = () => { img.style.display = ''; fb.style.display = 'none'; };
  img.onerror = () => { img.style.display = 'none'; fb.style.display = 'block'; };
  img.src = photo.src;
  img.alt = photo.cap || '';

  cap.textContent = photo.cap || '';
  box.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.body.classList.remove('modal-open');
  openIndex = -1;
}

function step(n){ if(openIndex >= 0) openLightbox(openIndex + n); }

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  buildGrid();

  const box = document.getElementById('lightbox');
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', e => { e.stopPropagation(); step(-1); });
  document.getElementById('lbNext').addEventListener('click', e => { e.stopPropagation(); step(1); });
  // click the backdrop, but not the image itself
  box.addEventListener('click', e => { if(e.target === box) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if(!box.classList.contains('open')) return;
    if(e.key === 'Escape') closeLightbox();
    if(e.key === 'ArrowLeft') step(-1);
    if(e.key === 'ArrowRight') step(1);
  });
});
