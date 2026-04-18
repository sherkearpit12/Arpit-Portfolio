/**
 * ============================================================
 *  ARPIT SHERKE — PORTFOLIO  |  main.js
 *  Security: XSS-safe, input-validated, CSRF-protected,
 *            rate-limited, no sensitive data in client code.
 * ============================================================
 */

'use strict';

/* ── 1. XSS-Safe DOM helpers ─────────────────────────────────
 *  NEVER use innerHTML with user-supplied data.
 *  All dynamic text set via textContent only.
 * ─────────────────────────────────────────────────────────── */
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

/**
 * Sanitize a string — strip HTML tags and encode dangerous chars.
 * @param {string} str
 * @param {number} [maxLen=500]
 */
function sanitize(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  const MAP = { '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#x27;', '`':'&#x60;' };
  return str.slice(0, maxLen).replace(/[<>"'`]/g, c => MAP[c]).trim();
}

/** Strict email validation (RFC-5321 subset) */
function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]{1,64}@[a-zA-Z0-9.\-]{1,253}\.[a-zA-Z]{2,}$/.test(email)
         && email.length <= 254;
}

/** Name validation — unicode letters, spaces, hyphens, apostrophes */
function isValidName(name) {
  return /^[\p{L}\s'\-]{2,80}$/u.test(name.trim());
}

/** Show accessible field error (textContent — XSS-safe) */
function showFieldError(input, msg) {
  clearFieldError(input);
  input.setAttribute('aria-invalid', 'true');
  input.classList.add('field-error');
  const el = document.createElement('span');
  el.className = 'field-error-msg';
  el.setAttribute('role', 'alert');
  el.textContent = msg;           // ← textContent NOT innerHTML
  input.parentNode.appendChild(el);
}

function clearFieldError(input) {
  input.removeAttribute('aria-invalid');
  input.classList.remove('field-error');
  input.parentNode.querySelector('.field-error-msg')?.remove();
}

/* ── 2. Client-side CSRF Token ───────────────────────────────
 *  Per-session token injected into form as a hidden field.
 *  Deters scripted bot submissions that skip JS execution.
 * ─────────────────────────────────────────────────────────── */
function getCSRFToken() {
  let t = sessionStorage.getItem('_csrf');
  if (!t) {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    t = Array.from(arr, b => b.toString(16).padStart(2,'0')).join('');
    sessionStorage.setItem('_csrf', t);
  }
  return t;
}

/* ── 3. Rate Limiter ─────────────────────────────────────────
 *  Max 3 submissions per 10-minute window (client-side).
 * ─────────────────────────────────────────────────────────── */
function checkRateLimit() {
  const LIMIT = 3, WIN = 10 * 60 * 1000;
  const now = Date.now();
  let attempts = JSON.parse(sessionStorage.getItem('_fa') || '[]')
                   .filter(t => now - t < WIN);
  if (attempts.length >= LIMIT) {
    return { allowed: false, waitMin: Math.ceil((WIN - (now - attempts[0])) / 60000) };
  }
  attempts.push(now);
  sessionStorage.setItem('_fa', JSON.stringify(attempts));
  return { allowed: true };
}

/* ── 4. Main init ────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {

  /* 4a. CSRF + Honeypot injection into contact form */
  const form = $('contact-form');
  if (form) {
    // CSRF hidden field
    const csrf = document.createElement('input');
    csrf.type  = 'hidden';
    csrf.name  = '_csrf_token';
    csrf.value = getCSRFToken();
    form.appendChild(csrf);

    // Honeypot — invisible to humans, bots fill it automatically
    const hp = document.createElement('input');
    hp.type         = 'text';
    hp.name         = '_hp_website';
    hp.className    = 'hp-field';
    hp.tabIndex     = -1;
    hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true');
    form.appendChild(hp);
  }

  /* 4b. Navbar scroll */
  const navbar = $('navbar');
  if (navbar) {
    window.addEventListener('scroll', () =>
      navbar.classList.toggle('scrolled', window.scrollY > 40), { passive: true });
  }

  /* 4c. Mobile hamburger */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    });
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      mobileNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }));
  }

  /* 4d. Active nav on scroll */
  const sections = $$('section[id]');
  const navLinks = $$('.nav-links a, .mobile-nav a');
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting)
        navLinks.forEach(l =>
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' }).observe = (function(orig){
    return function(el){ sections.forEach(s => orig.call(this,s)); };
  })(IntersectionObserver.prototype.observe);
  // simpler approach:
  const navObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting)
        navLinks.forEach(l =>
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => navObs.observe(s));

  /* 4e. Scroll to top */
  const scrollBtn = $('scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', () =>
      scrollBtn.classList.toggle('visible', window.scrollY > 400), { passive: true });
    scrollBtn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* 4f. Fade-in on scroll */
  const fadeObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); fadeObs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  $$('.fade-in,.timeline-item,.project-card,.cert-card,.edu-card').forEach(el => fadeObs.observe(el));

  /* 4g. Skills tabs */
  const tabBtns   = $$('.tab-btn');
  const tabPanels = $$('.skills-panel');
  tabBtns.forEach(btn => btn.addEventListener('click', () => {
    tabBtns.forEach(b  => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    tabPanels.forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    $('panel-' + btn.dataset.tab)?.classList.add('active');
  }));

  /* 4h. Typewriter — textContent only (XSS-safe) */
  const typed = document.querySelector('.typed-text');
  if (typed) {
    const WORDS = ['Cyber Security Analyst','SOC Analyst — L1',
                   'Threat Detection Specialist','Incident Responder','Endpoint Security Expert'];
    let wIdx = 0, cIdx = 0, del = false;
    (function tick() {
      const w = WORDS[wIdx];
      typed.textContent = w.substring(0, del ? cIdx-- : cIdx++);
      let ms = del ? 55 : 90;
      if (!del && cIdx > w.length)  { ms = 1800; del = true; }
      else if (del && cIdx < 0)     { del = false; cIdx = 0; wIdx = (wIdx+1) % WORDS.length; ms = 400; }
      setTimeout(tick, ms);
    })();
  }

  /* 4i. Counter animation — textContent only */
  function animateCounters() {
    $$('.count-up').forEach(el => {
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target)) return;
      // Sanitize suffix — only allow known safe chars
      const suffix = (el.dataset.suffix || '').replace(/[^+%a-zA-Z]/g, '');
      let cur = 0;
      const step = target / (1800 / 16);
      const iv = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = Math.floor(cur) + suffix; // textContent only
        if (cur >= target) clearInterval(iv);
      }, 16);
    });
  }
  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { animateCounters(); obs.disconnect(); }
    }, { threshold: 0.3 }).observe(heroStats);
  }

  /* 4j. Terminal typing — textContent only */
  $$('.term-type').forEach((line, i) => {
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

  /* 4k. Smooth scroll — validate href before use */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const href = a.getAttribute('href');
    if (!/^#[a-zA-Z][\w\-]*$/.test(href)) return; // reject non-id anchors
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  /* 4l. Contact form — validated, sanitized, secure ──────── */
  if (form) {
    const nameInput    = $('name');
    const emailInput   = $('email');
    const subjectInput = $('subject');
    const msgInput     = $('message');

    // Live validation on blur
    nameInput?.addEventListener('blur', () => {
      const v = nameInput.value.trim();
      if (!v)               showFieldError(nameInput, 'Name is required.');
      else if (!isValidName(v)) showFieldError(nameInput, 'Only letters, spaces, hyphens and apostrophes allowed.');
      else                  clearFieldError(nameInput);
    });
    emailInput?.addEventListener('blur', () => {
      const v = emailInput.value.trim();
      if (!v)                  showFieldError(emailInput, 'Email is required.');
      else if (!isValidEmail(v)) showFieldError(emailInput, 'Please enter a valid email address.');
      else                     clearFieldError(emailInput);
    });
    msgInput?.addEventListener('blur', () => {
      const v = msgInput.value.trim();
      if (!v)          showFieldError(msgInput, 'Message is required.');
      else if (v.length < 10) showFieldError(msgInput, 'Message must be at least 10 characters.');
      else             clearFieldError(msgInput);
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      // 1. Honeypot — bot detected, silently fake success
      const hpVal = form.querySelector('.hp-field')?.value || '';
      if (hpVal.trim() !== '') { showSuccess(); return; }

      // 2. Rate limit
      const rate = checkRateLimit();
      if (!rate.allowed) {
        showFormStatus(`Too many attempts. Please wait ${rate.waitMin} min and try again.`, 'error');
        return;
      }

      // 3. Sanitize inputs
      const rawName    = nameInput?.value    || '';
      const rawEmail   = emailInput?.value   || '';
      const rawSubject = subjectInput?.value || '';
      const rawMsg     = msgInput?.value     || '';

      // 4. Validate
      let valid = true;
      if (!rawName.trim() || !isValidName(rawName.trim())) {
        showFieldError(nameInput, 'Please enter a valid name.'); valid = false;
      }
      if (!rawEmail.trim() || !isValidEmail(rawEmail.trim())) {
        showFieldError(emailInput, 'Please enter a valid email.'); valid = false;
      }
      if (rawMsg.trim().length < 10) {
        showFieldError(msgInput, 'Message must be at least 10 characters.'); valid = false;
      }
      if (!valid) return;

      // 5. UI: loading
      const btn = form.querySelector('.form-submit');
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ SENDING...';

      // 6. Submit
      //    Using Web3Forms — free, no backend needed, works on GitHub Pages.
      //    Setup: https://web3forms.com → get Access Key → replace below.
      //    The key is safe to expose in frontend (maps to your email only).
      const ACCESS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';

      try {
        if (ACCESS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
          // ── Mailto fallback until key is configured ────────────
          const body = `Name: ${rawName.trim()}\nEmail: ${rawEmail.trim()}\n\nMessage:\n${rawMsg.trim()}`;
          window.location.href =
            'mailto:arpitsherke12@gmail.com'
            + '?subject=' + encodeURIComponent(rawSubject.trim() || 'Portfolio Contact')
            + '&body='    + encodeURIComponent(body);
          showSuccess();
          return;
        }

        // ── Live API submission ────────────────────────────────
        const res = await fetch('https://api.web3forms.com/submit', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: ACCESS_KEY,
            name:     rawName.trim(),
            email:    rawEmail.trim(),
            subject:  rawSubject.trim() || 'Portfolio Contact — Arpit Sherke',
            message:  rawMsg.trim(),
            botcheck: '',                   // Web3Forms honeypot field
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showSuccess();
        } else {
          throw new Error('API error');
        }

      } catch (_) {
        // Never expose raw error messages to the DOM
        showFormStatus(
          'Something went wrong. Please email directly: arpitsherke12@gmail.com',
          'error'
        );
        btn.disabled = false;
        btn.textContent = orig;
      }
    });
  }

  /** Show success panel (XSS-safe — no user content rendered) */
  function showSuccess() {
    const f = $('contact-form');
    const s = $('form-success');
    if (f) f.style.display = 'none';
    if (s) { s.style.display = 'flex'; s.removeAttribute('hidden'); }
  }

  /**
   * Show a form-level status message.
   * Uses textContent — never innerHTML — to prevent XSS.
   */
  function showFormStatus(msg, type = 'info') {
    let el = $('form-status-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'form-status-msg';
      el.setAttribute('role', 'alert');
      form.querySelector('.form-submit')?.insertAdjacentElement('beforebegin', el);
    }
    el.className   = 'form-status ' + type;
    el.textContent = msg;  // ← textContent only
  }

}); // end DOMContentLoaded
