/* Progressive enhancement: all three photos remain visible without JavaScript. */
(() => {
  const gallery = document.querySelector('.cake-gallery');
  if (!gallery) return;
  const slides = [...gallery.querySelectorAll('.cake-slide')];
  const controls = gallery.querySelector('.cake-gallery-controls');
  const status = gallery.querySelector('[data-gallery-status]');
  let current = 0;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
    });
    status.textContent = `${current + 1} / ${slides.length}`;
  }

  gallery.classList.add('is-enhanced');
  controls.hidden = false;
  gallery.querySelector('[data-gallery-prev]').addEventListener('click', () => show(current - 1));
  gallery.querySelector('[data-gallery-next]').addEventListener('click', () => show(current + 1));
  gallery.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  show(0);
})();
