const EMAIL = document.getElementById('email-text').textContent.trim();
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// Flash the "c" key-hint into a tick (no toast)
const copyKey = document.getElementById('copy-key');
let keyTimer;
function flashTick() {
  if (!copyKey) return;
  copyKey.textContent = '✓';
  copyKey.classList.add('copied');
  clearTimeout(keyTimer);
  keyTimer = setTimeout(() => { copyKey.textContent = 'c'; copyKey.classList.remove('copied'); }, 1500);
}

function copyEmail() {
  navigator.clipboard.writeText(EMAIL).then(flashTick, () => {});
}

// Press "c" anywhere (outside inputs) to copy email
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.altKey) {
    copyEmail();
  }
});

// In-chat Copy button — brief "Copied" label instead of a toast
const copyBtn = document.getElementById('copy-email');
let btnTimer;
copyBtn.addEventListener('click', () => {
  copyEmail();
  copyBtn.textContent = 'Copied';
  clearTimeout(btnTimer);
  btnTimer = setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
});

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

  // filename → [description, link] for the hover caption
  const DESC = {
    'aston-martin': ['Zero Drag YT Channel', 'https://www.youtube.com/watch?v=Toq2fSVXyLQ'],
    'biden': ['Kalshi Markets', 'https://youtu.be/Mx1pi0CwKko?list=PLCBout5SgRtWBFIKwedO0wl4QlwMuyAFY'],
    'bitcoin': ['Soch by Mohak Mangal', 'https://youtu.be/Q4c_NLY_LFs?list=PLnfMWh6m4WxeRkxMNyc17RKkCMkcMmrv6'],
    'daryaaft': ['Daryaaft Music Video', 'https://www.youtube.com/watch?v=sodPJHTtCLM'],
    'denial': ['Denial Music Video', 'https://www.youtube.com/watch?v=nYPqMF4mR1o'],
    'dunki': ['Skillbee', 'https://www.youtube.com/shorts/juk49QN6SjI?feature=share'],
    'ferrari': ['Zero Drag YT Channel', 'https://www.youtube.com/watch?v=3ZJax7CMBBo&t=25s'],
    'flemingo': ['Corporate MoGraph Video', 'https://youtu.be/_F5vPv8n_mk'],
    'iltejah': ['Iltejah Music Video', 'https://www.youtube.com/watch?v=UkdgBBE29jA'],
    'kcc-sikkim': ['UN Documentary', 'https://www.youtube.com/watch?v=yLfU3B9Pkkc&t=96s'],
    'lightning-tts': ['TTS Model Launch', 'https://x.com/smallest_AI/status/1922532241348985031?s=20'],
    'lightning-v3': ['TTS Model Launch', 'https://youtu.be/7Li7EADuvFs'],
    'map-animation': ['Map Animation', 'https://youtu.be/wYGZGAGNvOA'],
    'nigeria': ['Faultline YT Channel', 'https://www.youtube.com/watch?v=puOu1BRZ3ZQ&t=163s'],
    'patanjali': ['Soch by Mohak Mangal', 'https://youtu.be/2dWM4tag0_E?list=PLnfMWh6m4WxeRkxMNyc17RKkCMkcMmrv6'],
    'proposal': ['Smallest.ai Ad Film', 'https://x.com/kamath_sutra/status/2056741834840486245?s=20'],
    'pulse-stt': ['Smallest.ai Launch Video (unreleased)', 'https://youtu.be/AGawIWpWaZE'],
    'rehab': ['Smallest.ai Ad Film (unreleased)', 'https://youtu.be/JG7Rpfmmf0g'],
    'sex': ['Smallest.ai Ad Film (unreleased)', 'https://youtu.be/ilDBFoTWxZU'],
    'tenstorrent': ['Partnership Launch Film', 'https://x.com/smallest_AI/status/2052732202253684859?s=20'],
    'therapy': ['Smallest.ai Ad Film (unreleased)', 'https://youtu.be/IbU61017uTc'],
    'voice-agents': ['Voice Agents Launch Video', 'https://youtu.be/G70SlkNsRxk'],
    // biz-breakdowns: no description provided
  };

  function makeCard(file, kw) {
    const card = document.createElement('a');
    card.className = 'video-card';
    card.dataset.kw = kw;
    card.dataset.file = file;
    const meta = DESC[file];
    if (meta) { card.href = meta[1]; card.target = '_blank'; card.rel = 'noopener'; }
    const v = document.createElement('video');
    v.src = 'videos/' + file + '.mp4';
    // lazy: don't fetch until the clip is near the viewport (see updatePlayback)
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    card.appendChild(v);
    return card;
  }

  // Build the set, then a clone of it, for a seamless translateX loop
  deck.innerHTML = '';
  VIDEOS.forEach(([f, kw]) => deck.appendChild(makeCard(f, kw)));
  VIDEOS.forEach(([f, kw]) => {
    const c = makeCard(f, kw);
    c.setAttribute('aria-hidden', 'true');
    deck.appendChild(c);
  });
  const cards = [...deck.querySelectorAll('.video-card')];

  // Shift the marquee by exactly one set's width (handles the overlap margins)
  deck.style.setProperty('--vc-shift', deck.children[VIDEOS.length].offsetLeft + 'px');

  /* ---- Desktop hover focus ----
     Center the clip under the cursor, scale it up 20%, dim the rest, light its
     keyword and show its caption. The target is picked by the cursor's layout
     slot (offsetLeft) — unaffected by transforms — so the centered card never
     slides out from under the cursor and causes oscillation. */
  const caption = document.getElementById('video-caption');
  const track = stack.querySelector('.video-track');
  const isDesktop = () => window.matchMedia('(min-width: 769px)').matches;
  let active = null;
  let baseLeft = null; // deck's frozen screen-left at hover start — a stable slot anchor

  function clearActive() {
    if (!active) return;
    active.classList.remove('focused');
    active.style.transform = '';
    active.style.zIndex = '';
    const kwEl = kws[active.dataset.kw];
    if (kwEl) kwEl.classList.remove('active');
    active = null;
  }

  function deactivate() {
    clearActive();
    if (track) track.style.transform = '';
    if (caption) caption.classList.remove('show');
    stack.classList.remove('show-arrows');
    baseLeft = null;
  }

  function activate(card) {
    if (card === active) return;
    clearActive();
    active = card;
    // slide the whole row so this clip sits at viewport centre (others move in tandem)
    const V = window.innerWidth / 2 - baseLeft - card.offsetLeft - card.offsetWidth / 2;
    if (track) track.style.transform = `translateX(${V}px)`;
    card.style.transform = 'perspective(900px) rotateY(0deg) scale(1.2)';
    card.style.zIndex = '50';
    card.classList.add('focused');
    stack.classList.add('show-arrows');
    const kwEl = kws[card.dataset.kw];
    if (kwEl) kwEl.classList.add('active');
    if (caption) {
      const meta = DESC[card.dataset.file];
      if (meta) { caption.textContent = meta[0]; caption.classList.add('show'); }
      else { caption.classList.remove('show'); caption.textContent = ''; }
    }
  }

  stack.addEventListener('mousemove', (e) => {
    if (!isDesktop()) return;
    // capture the anchor once the marquee has paused; keep it fixed for the
    // whole hover so the cursor→clip mapping doesn't drift as the row slides
    if (baseLeft === null) baseLeft = deck.getBoundingClientRect().left;
    const x = e.clientX - baseLeft;
    let target = null;
    for (const card of cards) {
      if (x >= card.offsetLeft && x < card.offsetLeft + card.offsetWidth) target = card;
    }
    if (target) activate(target);
  });

  // Keep the focus alive across the whole zone (clip + caption below it), so
  // moving down to the description doesn't collapse the hover state.
  const zone = stack.closest('.video-zone') || stack;
  zone.addEventListener('mouseleave', () => { if (isDesktop()) deactivate(); });

  // Plain prev/next arrows (visible only while focused) — step the focused clip
  const prevBtn = stack.querySelector('.video-arrow.prev');
  const nextBtn = stack.querySelector('.video-arrow.next');
  function step(delta) {
    if (!active) return;
    const i = cards.indexOf(active);
    activate(cards[(i + delta + cards.length) % cards.length]);
  }
  [prevBtn, nextBtn].forEach((btn, i) => {
    if (!btn) return;
    btn.addEventListener('click', (e) => { e.preventDefault(); step(i === 0 ? -1 : 1); });
    btn.addEventListener('mousemove', (e) => e.stopPropagation()); // don't re-target while on an arrow
  });

  // Play only the videos currently on-screen (rect-based: the marquee moves
  // cards via transform, which IntersectionObserver doesn't track reliably).
  const vids = [...deck.querySelectorAll('video')];
  function updatePlayback() {
    const vw = window.innerWidth, vh = window.innerHeight;
    vids.forEach(v => {
      const r = v.getBoundingClientRect();
      // generous horizontal look-ahead so clips load/start just before they appear
      const onScreen = r.right > -400 && r.left < vw + 400 && r.bottom > -200 && r.top < vh + 200;
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
  const sync = () => { btn.setAttribute('aria-checked', root.classList.contains('light') ? 'true' : 'false'); };
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

// Vercel Web Analytics (static-site integration — no npm/React needed)
(function() {
  if (typeof window === 'undefined') return;

  window.va = window.va || function() {
    (window.vaq = window.vaq || []).push(arguments);
  };

  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  document.head.appendChild(script);
})();
