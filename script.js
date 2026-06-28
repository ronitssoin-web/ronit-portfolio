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

// Total Viewcount — random start (64,000,000–64,500,000), +10 every 10s
(() => {
  const el = document.getElementById('viewcount');
  if (!el) return;
  let count = 64000000 + Math.floor(Math.random() * 500001);
  const render = () => el.textContent = count.toLocaleString('en-US');
  render();
  setInterval(() => { count += 10; render(); }, 10000);
})();

// Stuff I've Done — autoplay nudge for static isometric video row
(() => {
  const stack = document.getElementById('video-stack');
  if (!stack) return;

  const videos = [...stack.querySelectorAll('video')];
  const playAll = () => videos.forEach(v => { v.muted = true; v.play().catch(() => {}); });

  videos.forEach(v => {
    v.muted = true;
    v.play().catch(() => {});
    v.addEventListener('canplay',    () => v.play().catch(() => {}), { once: true });
    v.addEventListener('loadeddata', () => v.play().catch(() => {}), { once: true });
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) playAll(); });
    }, { threshold: 0.2 }).observe(stack);
  }

  const onInteract = () => {
    playAll();
    ['pointerdown', 'keydown', 'scroll'].forEach(ev => window.removeEventListener(ev, onInteract));
  };
  window.addEventListener('pointerdown', onInteract, { passive: true });
  window.addEventListener('keydown', onInteract);
  window.addEventListener('scroll', onInteract, { passive: true });

  /* ---- Sticky focus interaction (desktop) ----
     Hover any card (when none is focused) → it flattens, scales up and slides
     to centre; the others fan out to the sides and darken. State is sticky:
     once focused, hovering does nothing — only a CLICK moves focus to another
     card. Click the focused card again (or press Esc) to return to the row. */
  const deck = stack.querySelector('.video-deck');
  const cards = [...stack.querySelectorAll('.video-card')];
  const n = cards.length;
  const STEP = 231;            // resting card spacing (tuned via tune.html)
  const isDesktop = () => window.matchMedia('(min-width: 769px)').matches;
  let focused = null;

  function rowLayout() {
    cards.forEach((card, i) => {
      const x = (i - (n - 1) / 2) * STEP;
      card.style.transform = `translate(calc(-50% + ${x}px), -50%) perspective(600px) rotateY(20deg)`;
      card.style.filter = '';
      card.style.zIndex = i + 1;
      card.style.boxShadow = '';
    });
  }

  function focusLayout(f) {
    cards.forEach((card, i) => {
      const o = i - f;
      if (o === 0) {
        card.style.transform = 'translate(-50%, -50%) perspective(900px) rotateY(0deg) scale(1.18)';
        card.style.filter = 'brightness(1)';
        card.style.zIndex = 100;
        card.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.45)';
      } else {
        const dir = o < 0 ? -1 : 1;
        const d = Math.abs(o);
        const x = dir * (175 + (d - 1) * 52);
        const rot = dir < 0 ? 34 : -34;
        const scale = Math.max(0.6, 0.82 - (d - 1) * 0.07);
        const bright = Math.max(0.28, 0.6 - (d - 1) * 0.14);
        card.style.transform = `translate(calc(-50% + ${x}px), -50%) perspective(800px) rotateY(${rot}deg) scale(${scale})`;
        card.style.filter = `brightness(${bright})`;
        card.style.zIndex = 100 - d;
        card.style.boxShadow = '-8px 12px 28px rgba(0, 0, 0, 0.3)';
      }
    });
  }

  function enable() {
    deck.classList.add('js-active');
    focused === null ? rowLayout() : focusLayout(focused);
  }

  function disable() {
    deck.classList.remove('js-active');
    cards.forEach(card => {
      card.style.transform = '';
      card.style.filter = '';
      card.style.zIndex = '';
      card.style.boxShadow = '';
    });
  }

  cards.forEach((card, i) => {
    card.addEventListener('mouseenter', () => {
      if (!isDesktop() || focused !== null) return;  // sticky: hover only initiates
      focused = i;
      focusLayout(i);
    });
    card.addEventListener('click', () => {
      if (!isDesktop()) return;
      if (focused === i) { focused = null; rowLayout(); }   // click focused → back to row
      else { focused = i; focusLayout(i); }                 // click another → switch focus
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && focused !== null) {
      focused = null;
      if (isDesktop()) rowLayout();
    }
  });

  // Leaving the whole section → drop focus, back to the resting isometric row
  const section = stack.closest('.stuff-section');
  if (section) {
    section.addEventListener('mouseleave', () => {
      if (!isDesktop() || focused === null) return;
      focused = null;
      rowLayout();
    });
  }

  if (isDesktop()) enable();

  let wasDesktop = isDesktop();
  window.addEventListener('resize', () => {
    const d = isDesktop();
    if (d === wasDesktop) return;
    wasDesktop = d;
    if (d) { enable(); } else { focused = null; disable(); }
  });
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
