// ============================================================
// DEVICE DETECTION
// ============================================================

const isTouch = window.matchMedia('(pointer: coarse)').matches;
const isMobile = window.innerWidth < 768;

// ============================================================
// CANVAS BACKGROUND — Aurora / Particle mesh
// ============================================================

const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let W, H, particles = [], time = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

resize();
window.addEventListener('resize', resize);

const PARTICLE_COUNT = isMobile ? 35 : 80;
const COLORS = [
  'rgba(167,139,250,',
  'rgba(96,165,250,',
  'rgba(244,114,182,',
];

class Particle {
  constructor() { this.reset(true); }

  reset(init = false) {
    this.x = Math.random() * W;
    this.y = init ? Math.random() * H : H + 20;
    this.size = Math.random() * 1.5 + 0.3;
    this.speed = Math.random() * 0.4 + 0.1;
    this.vx = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.6 + 0.1;
    this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.pulse = Math.random() * Math.PI * 2;
    this.pulseSpeed = Math.random() * 0.02 + 0.005;
  }

  update() {
    this.y -= this.speed;
    this.x += this.vx;
    this.pulse += this.pulseSpeed;
    if (this.y < -10) this.reset();
  }

  draw() {
    const o = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color + o + ')';
    ctx.fill();
  }
}

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particles.push(new Particle());
}

// Aurora blobs
const BLOBS = [
  { x: 0.2, y: 0.3, r: 0.35, color: 'rgba(167,139,250,', speed: 0.0003 },
  { x: 0.75, y: 0.6, r: 0.3, color: 'rgba(96,165,250,', speed: 0.0004 },
  { x: 0.5, y: 0.8, r: 0.25, color: 'rgba(244,114,182,', speed: 0.0005 },
];

function drawAurora() {
  BLOBS.forEach((b, i) => {
    const cx = (b.x + Math.sin(time * b.speed + i * 2) * 0.08) * W;
    const cy = (b.y + Math.cos(time * b.speed * 1.3 + i) * 0.06) * H;
    const r = b.r * Math.min(W, H);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, b.color + '0.06)');
    grad.addColorStop(0.5, b.color + '0.03)');
    grad.addColorStop(1, b.color + '0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });
}

// Grid lines
function drawGrid() {
  const step = 80;
  ctx.strokeStyle = 'rgba(167,139,250,0.04)';
  ctx.lineWidth = 1;

  for (let x = 0; x < W; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  time++;

  drawGrid();
  drawAurora();
  particles.forEach(p => { p.update(); p.draw(); });

  requestAnimationFrame(animate);
}

animate();

// ============================================================
// CURSOR
// ============================================================

const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursorTrail');
let mx = 0, my = 0;
let tx = 0, ty = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

function animateTrail() {
  tx += (mx - tx) * 0.12;
  ty += (my - ty) * 0.12;
  trail.style.left = tx + 'px';
  trail.style.top = ty + 'px';
  requestAnimationFrame(animateTrail);
}
animateTrail();

if (!isTouch) {
  document.querySelectorAll('a, button, .project-card, .contact-card, .skill-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ============================================================
// NAVBAR SCROLL
// ============================================================

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});

// ============================================================
// MOBILE MENU
// ============================================================

const hamburger = document.getElementById('hamburger');
const mobileOverlay = document.getElementById('mobileOverlay');

hamburger.addEventListener('click', () => {
  const open = mobileOverlay.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileOverlay.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ============================================================
// SMOOTH SCROLL
// ============================================================

function scrollTo(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ============================================================
// SCROLL REVEAL
// ============================================================

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, parseInt(delay));
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
  revealObserver.observe(el);
});

// ============================================================
// PROFILE CARD 3D TILT (desktop only)
// ============================================================

if (!isTouch) {
  const profileCard = document.getElementById('profileCard');
  if (profileCard) {
    profileCard.addEventListener('mousemove', e => {
      const rect = profileCard.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / (rect.height / 2)) * -8;
      const ry = ((e.clientX - cx) / (rect.width / 2)) * 8;
      profileCard.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    });

    profileCard.addEventListener('mouseleave', () => {
      profileCard.style.transform = 'rotateX(0) rotateY(0) scale(1)';
    });
  }
}

// ============================================================
// MAGNETIC BUTTONS (desktop only)
// ============================================================

if (!isTouch) {
  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.3;
      const dy = (e.clientY - cy) * 0.3;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ============================================================
// COUNT-UP ANIMATION
// ============================================================

function animateCount(el) {
  const target = parseInt(el.dataset.count);
  const duration = 1500;
  const start = performance.now();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }

  requestAnimationFrame(step);
}

const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.stat-num').forEach(animateCount);
      statObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsEl = document.querySelector('.hero-stats');
if (statsEl) statObserver.observe(statsEl);

// ============================================================
// TITLE GLITCH EFFECT (Subtle)
// ============================================================

function initGlitch() {
  const heroName = document.getElementById('heroName');
  if (!heroName) return;

  const chars = 'NyxenNYXEN!@#$%nx';
  const original = 'Nyxen';

  function glitch() {
    let iterations = 0;
    const interval = setInterval(() => {
      heroName.textContent = original
        .split('')
        .map((char, i) => {
          if (i < iterations) return original[i];
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iterations >= original.length) {
        clearInterval(interval);
        heroName.textContent = original;
      }
      iterations += 0.4;
    }, 40);
  }

  setTimeout(glitch, 800);
  setInterval(() => { if (Math.random() > 0.6) glitch(); }, 8000);
}

// ============================================================
// HERO CONTENT ENTRANCE
// ============================================================

window.addEventListener('DOMContentLoaded', () => {
  initGlitch();
  setTimeout(() => {
    document.querySelectorAll('.hero .reveal-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 120);
    });
  }, 100);
});
