const EMAIL = document.getElementById('email-text').textContent.trim();
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function copyEmail() {
  navigator.clipboard.writeText(EMAIL).then(
    () => showToast(EMAIL + ' copied to clipboard'),
    () => showToast('couldn\'t copy — email is ' + EMAIL)
  );
}

// Press "c" anywhere (outside inputs) to copy email
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    copyEmail();
  }
});

document.getElementById('copy-email').addEventListener('click', copyEmail);

// Contact form — submits via Web3Forms. Until a real access key is set below,
// it falls back to opening the visitor's mail client so the form still works.
// Get a free key at https://web3forms.com (enter your email, they send you a UUID).
const WEB3FORMS_ACCESS_KEY = 'e902eecd-92b5-42ab-88af-fcf3cc28900e';

document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const message = form.message.value.trim();

  // Fallback: no key yet → open the visitor's mail app with everything prefilled
  if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === 'YOUR_ACCESS_KEY_HERE') {
    const subject = encodeURIComponent('hi from ' + name);
    const body = encodeURIComponent(message + '\n\n— ' + name + (email ? ' (' + email + ')' : ''));
    window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
    form.reset();
    showToast('opening your mail app…');
    return;
  }

  showToast('sending…');
  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: 'New message from your portfolio',
      from_name: name,
      name,
      email,
      message,
    }),
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.success) { form.reset(); showToast('sent! i\'ll get back to you soon'); }
      else { showToast('that didn\'t send — try emailing me directly'); }
    })
    .catch(() => showToast('network hiccup — try emailing me directly'));
});

// Live UTC clock in the footer
const clock = document.getElementById('utc-clock');
function tick() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  clock.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
}
tick();
setInterval(tick, 1000);

// Total Viewcount — odometer reels. Random start (64,000,000–64,500,000),
// casino-style roll-up on load, then +10–45 every 5s. Each digit's motion blur
// is driven by its LIVE speed (more blur the faster it moves), via a per-reel
// SVG vertical-blur filter whose stdDeviation is updated each frame.
(() => {
  const host = document.getElementById('viewcount');
  if (!host) return;

  let value = 64000000 + Math.floor(Math.random() * 500001);
  const reels = [];

  const SVGNS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(SVGNS, 'svg');
  defs.setAttribute('width', '0');
  defs.setAttribute('height', '0');
  defs.style.position = 'absolute';
  document.body.appendChild(defs);

  const BLUR_K = 6;    // px of blur per (px/ms) of speed
  const BLUR_MAX = 9;

  // Build a reel (0–9 twice, for seamless carry) + its own blur filter
  host.innerHTML = '';
  let idx = 0;
  for (const ch of value.toLocaleString('en-US')) {
    if (ch === ',') {
      const c = document.createElement('span');
      c.className = 'vc-comma';
      c.textContent = ',';
      host.appendChild(c);
    } else {
      const reel = document.createElement('span');
      reel.className = 'vc-reel';
      const strip = document.createElement('span');
      strip.className = 'vc-strip';
      for (let k = 0; k < 20; k++) {
        const cell = document.createElement('span');
        cell.className = 'vc-cell';
        cell.textContent = k % 10;
        strip.appendChild(cell);
      }
      reel.appendChild(strip);
      host.appendChild(reel);

      const blurId = 'vc-blur-' + idx++;
      const filter = document.createElementNS(SVGNS, 'filter');
      filter.id = blurId;
      filter.setAttribute('x', '-50%');
      filter.setAttribute('y', '-100%');
      filter.setAttribute('width', '200%');
      filter.setAttribute('height', '300%');
      const fe = document.createElementNS(SVGNS, 'feGaussianBlur');
      fe.setAttribute('stdDeviation', '0 0');
      filter.appendChild(fe);
      defs.appendChild(filter);

      reels.push({ strip, cur: 0, target: +ch, t: null, raf: 0, blurId, fe });
    }
  }

  // Live translateY of a strip in px (reads the interpolated transform)
  function currentY(strip) {
    const tr = getComputedStyle(strip).transform;
    if (!tr || tr === 'none') return 0;
    const m = tr.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    return parseFloat(m[1].split(',')[5]) || 0;
  }

  // Update blur each frame from the reel's live speed, for `ms`, then clear
  function blurDuring(reel, ms) {
    cancelAnimationFrame(reel.raf);
    reel.strip.style.filter = `url(#${reel.blurId})`;
    let last = currentY(reel.strip);
    let lastT = performance.now();
    const start = lastT;
    const step = (now) => {
      const y = currentY(reel.strip);
      const dt = now - lastT;
      const speed = dt > 0 ? Math.abs(y - last) / dt : 0; // px per ms
      reel.fe.setAttribute('stdDeviation', '0 ' + Math.min(BLUR_MAX, speed * BLUR_K).toFixed(2));
      last = y;
      lastT = now;
      if (now - start < ms) {
        reel.raf = requestAnimationFrame(step);
      } else {
        reel.fe.setAttribute('stdDeviation', '0 0');
        reel.strip.style.filter = '';
      }
    };
    reel.raf = requestAnimationFrame(step);
  }

  // Roll a reel forward to digit d (down through a carry when wrapping)
  function roll(reel, d) {
    if (d === reel.cur) return;
    const wrap = d < reel.cur;
    reel.strip.style.transform = `translateY(-${wrap ? d + 10 : d}em)`;
    reel.cur = d;
    blurDuring(reel, 950);
    clearTimeout(reel.t);
    reel.t = setTimeout(() => {
      if (wrap) {
        // snap from the 2nd cycle back to the 1st without animating
        reel.strip.style.transition = 'none';
        reel.strip.style.transform = `translateY(-${d}em)`;
        void reel.strip.offsetHeight; // reflow
        reel.strip.style.transition = '';
      }
    }, 950);
  }

  function show() {
    let i = 0;
    for (const ch of value.toLocaleString('en-US')) {
      if (ch === ',') continue;
      const reel = reels[i++];
      if (reel) roll(reel, +ch);
    }
  }

  // Casino-style load: from 00,000,000 up to the value, left→right stagger
  requestAnimationFrame(() => {
    reels.forEach((reel, i) => {
      reel.strip.style.transition = 'transform 1.2s cubic-bezier(.2, .75, .2, 1)';
      reel.strip.style.transitionDelay = (i * 0.06) + 's';
      reel.strip.style.transform = `translateY(-${reel.target}em)`;
      reel.cur = reel.target;
      if (reel.target > 0) blurDuring(reel, 1300 + i * 60);
      setTimeout(() => {
        reel.strip.style.transition = '';
        reel.strip.style.transitionDelay = '';
      }, 1350 + i * 60);
    });
  });

  // Randomized increments (+10–45) every 5s
  setInterval(() => {
    value += 10 + Math.floor(Math.random() * 36);
    show();
  }, 5000);
})();

// Stuff I've Done — auto-scrolling marquee. Pauses on hover (CSS), and hovering
// a clip turns its matching keyword black. Only on-screen videos play (perf).
(() => {
  const stack = document.getElementById('video-stack');
  const deck = stack && stack.querySelector('.video-deck');
  if (!deck) return;

  // [filename, keyword] — keyword matches data-kw in the sublist
  const VIDEOS = [
    ['voice-agents', 'launch'],
    ['proposal', 'adfilms'],
    ['daryaaft', 'music'],
    ['aston-martin', 'youtube'],
    ['flemingo', 'motion'],
    ['nigeria', 'map'],
    ['therapy', 'adfilms'],
    ['denial', 'music'],
    ['lightning-tts', 'launch'],
    ['bitcoin', 'youtube'],
    ['biz-breakdowns', 'motion'],
    ['map-animation', 'map'],
    ['rehab', 'adfilms'],
    ['pulse-stt', 'launch'],
    ['iltejah', 'music'],
    ['ferrari', 'youtube'],
    ['biden', 'motion'],
    ['kcc-sikkim', 'map'],
    ['tenstorrent', 'launch'],
    ['dunki', 'youtube'],
    ['sex', 'adfilms'],
    ['lightning-v3', 'launch'],
    ['patanjali', 'youtube'],
  ];

  const kws = {};
  document.querySelectorAll('.stuff-sublist .kw').forEach(el => { kws[el.dataset.kw] = el; });

  function makeCard(file, kw) {
    const card = document.createElement('div');
    card.className = 'video-card';
    const v = document.createElement('video');
    v.src = 'videos/' + file + '.mp4';
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    card.appendChild(v);
    const kwEl = kws[kw];
    if (kwEl) {
      card.addEventListener('mouseenter', () => kwEl.classList.add('active'));
      card.addEventListener('mouseleave', () => kwEl.classList.remove('active'));
    }
    return card;
  }

  // Build the set, then a clone of it, for a seamless translateX(-50%) loop
  deck.innerHTML = '';
  VIDEOS.forEach(([f, kw]) => deck.appendChild(makeCard(f, kw)));
  VIDEOS.forEach(([f, kw]) => {
    const c = makeCard(f, kw);
    c.setAttribute('aria-hidden', 'true');
    deck.appendChild(c);
  });

  // Shift the marquee by exactly one set's width (handles the overlap margins)
  const setStart = deck.children[VIDEOS.length].offsetLeft;
  deck.style.setProperty('--vc-shift', setStart + 'px');

  // Play only the videos currently on-screen (rect-based: the marquee moves
  // cards via transform, which IntersectionObserver doesn't track reliably).
  const vids = [...deck.querySelectorAll('video')];
  function updatePlayback() {
    const vw = window.innerWidth, vh = window.innerHeight;
    vids.forEach(v => {
      const r = v.getBoundingClientRect();
      const onScreen = r.right > -60 && r.left < vw + 60 && r.bottom > 0 && r.top < vh;
      if (onScreen) { if (v.paused) v.play().catch(() => {}); }
      else if (!v.paused) v.pause();
    });
  }
  updatePlayback();
  setInterval(updatePlayback, 250);
})();

// Reveal sections on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

// Carousel arrow buttons (mobile) — scroll their target row left/right
document.querySelectorAll('.carousel-nav').forEach((nav) => {
  const target = document.querySelector(nav.dataset.target);
  if (!target) return;
  nav.querySelectorAll('.carousel-arrow').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.classList.contains('next') ? 1 : -1;
      target.scrollBy({ left: dir * target.clientWidth * 0.8, behavior: 'smooth' });
    });
  });
});

// Theme toggle — dark is default; button switches to light and persists
(() => {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const sync = () => { btn.textContent = root.classList.contains('light') ? 'Dark mode' : 'Light mode'; };
  sync();
  btn.addEventListener('click', () => {
    const light = !root.classList.contains('light');
    root.classList.toggle('light', light);
    try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
    sync();
  });
})();

// Vercel Speed Insights
(function() {
  if (typeof window === 'undefined') return;
  
  window.si = window.si || function() {
    (window.siq = window.siq || []).push(arguments);
  };
  
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/speed-insights/script.js';
  document.head.appendChild(script);
})();
