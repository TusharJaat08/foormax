// ============================================
// FOORMAX — Main JavaScript (Optimized)
// Lightweight interactions, no heavy 3D libs
// ============================================

// ─── LAZY-LOAD SPLINE VIEWER ───────────────────────────
// Only inject the Spline viewer once the hero section is near the viewport
// This prevents the heavy 3D scene from blocking initial page load
function initLazySpline() {
  const container = document.querySelector('.hero-3d-bg');
  if (!container) return;

  // Check if device is low-end or mobile — skip Spline entirely for performance
  const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent) 
                   || window.innerWidth < 768;

  if (isLowEnd) {
    // Show a static gradient fallback instead of heavy 3D
    container.style.background = 'linear-gradient(135deg, #020810 0%, #0a2848 40%, #1a3050 70%, #0a0a1a 100%)';
    container.innerHTML = '';
    return;
  }

  // For mobile, still load Spline but with a slight delay to let page render first
  const delay = isMobile ? 3000 : 500;

  setTimeout(() => {
    // Dynamically load the Spline viewer script
    if (!customElements.get('spline-viewer')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://unpkg.com/@splinetool/viewer@1.9.54/build/spline-viewer.js';
      document.head.appendChild(script);
    }

    // Create spline-viewer element dynamically
    const viewer = document.createElement('spline-viewer');
    viewer.setAttribute('url', 'https://prod.spline.design/g12bPwWr-X5iGn8D/scene.splinecode');
    viewer.setAttribute('loading', 'lazy');
    container.innerHTML = '';
    container.appendChild(viewer);
  }, delay);
}

// ─── SCROLL FADE-IN ANIMATIONS ─────────────────────────
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop observing once visible — saves CPU
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px',
    }
  );

  document.querySelectorAll('.fade-in').forEach((el) => {
    observer.observe(el);
  });
}

// ─── LIVE CLOCK (India Time) ───────────────────────────
function initClock() {
  const clockEl = document.getElementById('clock-india');
  if (!clockEl) return;

  function updateClock() {
    const now = new Date();
    const indiaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const hours = String(indiaTime.getHours()).padStart(2, '0');
    const minutes = String(indiaTime.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${hours}:${minutes}`;
  }

  updateClock();
  setInterval(updateClock, 30000);
}

// ─── NAVBAR SCROLL EFFECT (throttled) ──────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 100) {
          navbar.style.mixBlendMode = 'normal';
          navbar.style.background = 'rgba(0, 0, 0, 0.85)';
          navbar.style.backdropFilter = 'blur(12px)';
          navbar.style.webkitBackdropFilter = 'blur(12px)';
        } else {
          navbar.style.mixBlendMode = 'difference';
          navbar.style.background = 'transparent';
          navbar.style.backdropFilter = 'none';
          navbar.style.webkitBackdropFilter = 'none';
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// ─── SMOOTH NAV SCROLL ─────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ─── CONTACT FORM ──────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('form-name').value;
    const email = document.getElementById('form-email').value;
    const phone = document.getElementById('form-phone').value;
    const message = document.getElementById('form-message').value;

    console.log('Form submitted:', { name, email, phone, message });

    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = '[✓ SENT]';
    btn.style.background = '#c0ff00';
    btn.style.color = '#000';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.color = '';
      btn.disabled = false;
      form.reset();
    }, 3000);
  });
}

// ─── INIT ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initLazySpline();
  initScrollAnimations();
  initClock();
  initNavbar();
  initSmoothScroll();
  initContactForm();
});
