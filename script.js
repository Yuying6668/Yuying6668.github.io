/* Journey map: draw the route and zoom as chapters scroll into view */
(function () {
  const map = document.getElementById('map');
  if (!map) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = [...document.querySelectorAll('.chapter')];
  const legend = [...document.querySelectorAll('.map-legend li')];
  const cities = [...map.querySelectorAll('.city')];
  const routes = [...map.querySelectorAll('.route')];

  // viewBox per step: [x, y, w, h]  (map is 800 x 560)
  const VIEWS = {
    0: [0, 0, 800, 560],
    1: [560, 250, 280, 196],
    2: [540, 230, 320, 224],
    3: [0, 0, 800, 560],
    4: [-50, 140, 320, 224]
  };
  let current = [...VIEWS[0]], anim;

  // Keep city dots and labels the same on-screen size at any zoom level
  const marks = cities.map(g => {
    const dot = g.querySelector('.c-dot'), pulse = g.querySelector('.c-pulse'), text = g.querySelector('text');
    const cx = +dot.getAttribute('cx'), cy = +dot.getAttribute('cy');
    return { dot, pulse, text, cx, cy, dx: +text.getAttribute('x') - cx, dy: +text.getAttribute('y') - cy };
  });
  function rescale() {
    const k = current[2] / (map.clientWidth || 600);   // svg units per screen px
    marks.forEach(m => {
      m.dot.setAttribute('r', 5.5 * k);
      m.pulse.setAttribute('r', 6 * k);
      m.text.setAttribute('font-size', 13 * k);
      m.text.setAttribute('x', m.cx + m.dx * k);
      m.text.setAttribute('y', m.cy + m.dy * k);
      m.text.style.strokeWidth = 4 * k;
    });
  }
  window.addEventListener('resize', rescale);

  function zoomTo(target) {
    cancelAnimationFrame(anim);
    if (reduce) { current = [...target]; map.setAttribute('viewBox', current.join(' ')); rescale(); return; }
    const from = [...current], t0 = performance.now(), dur = 1100;
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    (function frame(now) {
      const k = ease(Math.min(1, (now - t0) / dur));
      current = from.map((v, i) => v + (target[i] - v) * k);
      map.setAttribute('viewBox', current.join(' '));
      rescale();
      if (k < 1) anim = requestAnimationFrame(frame);
    })(t0);
  }

  rescale();
  let active = 0;
  function setStep(step) {
    if (step === active) return;
    active = step;
    chapters.forEach(c => c.classList.toggle('active', +c.dataset.step === step));
    legend.forEach(l => {
      const s = +l.dataset.step;
      l.classList.toggle('active', s === step);
      l.classList.toggle('visited', s <= step);
    });
    cities.forEach(c => {
      const s = +c.dataset.step;
      c.classList.toggle('active', s === step);
      c.classList.toggle('visited', s < step);
    });
    routes.forEach(r => r.classList.toggle('drawn', +r.dataset.seg < step));
    zoomTo(VIEWS[step] || VIEWS[0]);
  }

  // Activate the chapter that crosses the middle of the viewport
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) setStep(+e.target.dataset.step); });
  }, { rootMargin: '-45% 0px -50% 0px' });
  chapters.forEach(c => io.observe(c));

  // Click legend or city to jump to chapter
  const jump = step => document.querySelector(`.chapter[data-step="${step}"]`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  legend.forEach(l => l.addEventListener('click', () => jump(l.dataset.step)));
  cities.forEach(c => c.addEventListener('click', () => jump(c.dataset.step)));
})();

/* Reveal-on-scroll + active nav link */
(function () {
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12 });
    items.forEach(el => io.observe(el));
  } else items.forEach(el => el.classList.add('in'));

  const links = [...document.querySelectorAll('.topnav a[href^="#"]')];
  const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const nio = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-40% 0px -55% 0px' });
  secs.forEach(s => nio.observe(s));
})();
