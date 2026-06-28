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

// Contact form — opens the visitor's mail client with the message prefilled
document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const name = form.name.value.trim();
  const message = form.message.value.trim();
  const subject = encodeURIComponent('hi from ' + name);
  const body = encodeURIComponent(message);
  window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
  form.reset();
  showToast('opening your mail app…');
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
