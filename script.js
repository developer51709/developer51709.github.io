// ----------------------------------
// Scroll listener
// ----------------------------------
window.addEventListener("scroll", () => {
  handleScroll();
  updateGlowOnScroll();
  updateGradientDirection();
});

// ----------------------------------
// Smooth scroll
// ----------------------------------
function scrollToSection(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: "smooth" });
}

// ----------------------------------
// Theme toggle
// ----------------------------------
const toggle = document.getElementById("themeToggle");
const body = document.body;

if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
  toggle.textContent = "☀️";
}

toggle.addEventListener("click", () => {
  body.classList.toggle("dark");
  toggle.textContent = body.classList.contains("dark") ? "☀️" : "🌙";
  localStorage.setItem("theme", body.classList.contains("dark") ? "dark" : "light");
});

// ----------------------------------
// Mobile nav
// ----------------------------------
const hamburger = document.getElementById("hamburgerBtn");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("show");
});

// ----------------------------------
// Bottom nav
// ----------------------------------
document.querySelectorAll(".bottom-item").forEach(btn => {
  btn.addEventListener("click", () => {
    scrollToSection(btn.dataset.target);
  });
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("show");
  });
});

// ----------------------------------
// 3D tilt
// ----------------------------------
document.querySelectorAll(".tilt").forEach(card => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / rect.height) * -10;
    const rotateY = ((x - rect.width / 2) / rect.width) * 10;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateX(0deg) rotateY(0deg)";
  });
});

// ----------------------------------
// Parallax + scroll reactive
// ----------------------------------
const panels = document.querySelectorAll(".parallax-panel");
const reactive = document.querySelectorAll(".scroll-reactive");

function handleScroll() {
  const height = window.innerHeight;

  panels.forEach(panel => {
    const rect = panel.getBoundingClientRect();
    panel.style.transform = `translateY(${rect.top * -0.05}px)`;
  });

  reactive.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < height * 0.85) {
      el.style.opacity = 1;
      el.style.transform = "translateY(0)";
    }
  });
}

window.addEventListener("load", handleScroll);

// ----------------------------------
// Ripple effect for dropdown menu
// ----------------------------------
navLinks.addEventListener("click", (e) => {
  const rect = navLinks.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.classList.add("ripple");

  ripple.style.left = `${e.clientX - rect.left}px`;
  ripple.style.top = `${e.clientY - rect.top}px`;

  navLinks.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
});

// ----------------------------------
// Parallax glow movement
// ----------------------------------
document.querySelectorAll(".glass").forEach(glass => {
  glass.addEventListener("mousemove", e => {
    const rect = glass.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    glass.style.setProperty("--glow-x", `${x}%`);
    glass.style.setProperty("--glow-y", `${y}%`);
  });

  glass.addEventListener("mouseleave", () => {
    glass.style.setProperty("--glow-x", `50%`);
    glass.style.setProperty("--glow-y", `50%`);
  });
});

// ----------------------------------
// Scroll-activated glow
// ----------------------------------
function updateGlowOnScroll() {
  document.querySelectorAll(".glass").forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      el.classList.add("glow-active");
    }
  });
}

window.addEventListener("load", updateGlowOnScroll);

// ----------------------------------
// Scroll-direction reactive background gradient
// ----------------------------------
let lastScroll = 0;
let targetAngle = 120;
let currentAngle = 120;

function animateGradient() {
  currentAngle += (targetAngle - currentAngle) * 0.08;
  document.documentElement.style.setProperty("--bg-angle", `${currentAngle}deg`);
  requestAnimationFrame(animateGradient);
}

animateGradient();

function updateGradientDirection() {
  const current = window.scrollY;

  if (current > lastScroll) {
    targetAngle = 160; // scrolling down
  } else {
    targetAngle = 80; // scrolling up
  }

  lastScroll = current;
};
