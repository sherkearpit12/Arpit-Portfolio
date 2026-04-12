// =============================================
//  ARPIT SHERKE — PORTFOLIO JAVASCRIPT
// =============================================

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar scroll effect ──────────────────
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });

  // ── Mobile hamburger ──────────────────────
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
  });
  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
    });
  });

  // ── Active nav highlight on scroll ───────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav a');
  const observerNav = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        navLinks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => observerNav.observe(s));

  // ── Scroll to top ────────────────────────
  const scrollBtn = document.getElementById('scroll-top');
  window.addEventListener('scroll', () => {
    scrollBtn?.classList.toggle('visible', window.scrollY > 400);
  });
  scrollBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ── Generic fade-in on scroll ─────────────
  const fadeEls = document.querySelectorAll('.fade-in, .timeline-item, .project-card, .cert-card');
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        fadeObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  fadeEls.forEach(el => fadeObserver.observe(el));

  // ── Skills tabs ───────────────────────────
  const tabBtns  = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.skills-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + btn.dataset.tab)?.classList.add('active');
    });
  });

  // ── Typewriter for hero subtitle ─────────
  const typed = document.querySelector('.typed-text');
  const words = [
    'Cyber Security Analyst',
    'SOC Analyst — L1',
    'Threat Detection Specialist',
    'Incident Responder',
    'Endpoint Security Expert'
  ];
  let wIdx = 0, cIdx = 0, deleting = false;
  function type() {
    const word = words[wIdx];
    typed.textContent = deleting ? word.substring(0, cIdx--) : word.substring(0, cIdx++);
    let speed = deleting ? 55 : 90;
    if (!deleting && cIdx === word.length + 1) {
      speed = 1800;
      deleting = true;
    } else if (deleting && cIdx === 0) {
      deleting = false;
      wIdx = (wIdx + 1) % words.length;
      speed = 400;
    }
    setTimeout(type, speed);
  }
  if (typed) type();

  // ── Counter animation ──────────────────────
  function animateCounters() {
    document.querySelectorAll('.count-up').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      const duration = 1800;
      const step = target / (duration / 16);
      let current = 0;
      const interval = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current) + (el.dataset.suffix || '');
        if (current >= target) clearInterval(interval);
      }, 16);
    });
  }
  const heroObserver = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { animateCounters(); heroObserver.disconnect(); }
  }, { threshold: 0.3 });
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) heroObserver.observe(heroStats);

  // ── Contact form ──────────────────────────
  const form = document.getElementById('contact-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('.form-submit');
    btn.textContent = 'SENDING...';
    btn.style.opacity = '0.7';
    setTimeout(() => {
      form.style.display = 'none';
      document.getElementById('form-success').style.display = 'block';
    }, 1200);
  });

  // ── Smooth scroll for anchor links ────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ── Terminal typing effect ────────────────
  const termLines = document.querySelectorAll('.term-type');
  termLines.forEach((line, i) => {
    const text = line.textContent;
    line.textContent = '';
    setTimeout(() => {
      let ci = 0;
      const iv = setInterval(() => {
        line.textContent += text[ci++];
        if (ci >= text.length) clearInterval(iv);
      }, 45);
    }, i * 600 + 400);
  });

});
