/**
 * TH Multi-services v3 — Main JavaScript
 * Handles: Nav, Scroll Reveal, Modals, Form Submit
 */

'use strict';

// ── Utilities ──────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

// ── Nav: Scroll behaviour + mobile toggle ──────────────────────────
(function initNav() {
  const nav = $('#mainNav');
  const toggle = $('#nav-toggle');
  const drawer = $('#nav-mobile');
  if (!nav) return;

  // Scrolled class
  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  onScroll();
  on(window, 'scroll', onScroll, { passive: true });

  // Hamburger
  if (toggle && drawer) {
    on(toggle, 'click', () => {
      const open = toggle.classList.toggle('open');
      drawer.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
    });

    // Close on link click
    $$('a', drawer).forEach(link => {
      on(link, 'click', () => {
        toggle.classList.remove('open');
        drawer.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
      });
    });
  }

  // Active link on scroll (scrollspy)
  const sections = $$('section[id], header[id]');
  const navLinks = $$('#mainNav .nav-links a, #nav-mobile a');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const active = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', active);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(s => observer.observe(s));
})();


// ── Scroll Reveal ──────────────────────────────────────────────────
(function initReveal() {
  const elements = $$('[data-reveal]');
  if (!elements.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
})();


// ── Hero Parallax ──────────────────────────────────────────────────
(function initParallax() {
  const bg = $('.hero-bg');
  if (!bg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  on(window, 'scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      bg.style.transform = `scale(1.06) translateY(${y * 0.2}px)`;
    }
  }, { passive: true });
})();


// ── Modal System ───────────────────────────────────────────────────
(function initModals() {
  const overlays = $$('.modal-overlay');
  if (!overlays.length) return;

  let prevFocus = null;

  const openModal = (id) => {
    const overlay = $(`#${id}`);
    if (!overlay) return;
    prevFocus = document.activeElement;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Play video inside modal if exists
    const video = $('video', overlay);
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    // Focus the close button
    const closeBtn = $('.modal-close', overlay);
    closeBtn && setTimeout(() => closeBtn.focus(), 50);
  };

  const closeModal = (overlay) => {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Pause video inside modal if exists
    const video = $('video', overlay);
    if (video) {
      video.pause();
    }

    prevFocus && prevFocus.focus();
  };

  const closeAllModals = () => overlays.forEach(closeModal);

  // Portfolio card clicks
  $$('[data-modal]').forEach(card => {
    on(card, 'click', () => openModal(card.dataset.modal));
    on(card, 'keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(card.dataset.modal);
      }
    });
  });

  // Close buttons
  $$('.modal-close').forEach(btn => {
    on(btn, 'click', () => closeModal(btn.closest('.modal-overlay')));
  });

  // Backdrop click
  overlays.forEach(overlay => {
    on(overlay, 'click', e => {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  // Escape key
  on(document, 'keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });

  // Modal CTA links — close before navigating
  $$('.modal-overlay .btn').forEach(btn => {
    on(btn, 'click', (e) => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) {
        e.preventDefault();
        closeModal(overlay);
        const href = btn.getAttribute('href');
        if (href && href.startsWith('#')) {
          setTimeout(() => {
            const target = $(href);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }
      }
    });
  });
})();


// ── Contact Form ───────────────────────────────────────────────────
(function initForm() {
  const form = $('#contactForm');
  const btn = $('#submitButton');
  const successEl = $('#form-success');
  const errorEl = $('#form-error');
  if (!form) return;

  const showMsg = (el, msg) => {
    el.textContent = msg;
    el.classList.add(el === successEl ? 'success' : 'error');
    el.style.display = 'block';
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  const hideMsg = (el) => {
    el.textContent = '';
    el.classList.remove('success', 'error');
    el.style.display = 'none';
  };

  on(form, 'submit', async (e) => {
    e.preventDefault();
    hideMsg(successEl);
    hideMsg(errorEl);

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg> Envoi en cours…`;

    const data = new FormData();
    data.append('access_key', '02a54534-9988-48fe-a14c-09aec185c710');
    data.append('subject',           'Nouvelle demande de devis - TH Multi-services');
    data.append('Nom_Complet',       $('#name').value.trim());
    data.append('email',             $('#email').value.trim());
    data.append('Telephone',         $('#phone').value.trim());
    data.append('Service_Souhaite',  $('#service').value);
    data.append('Adresse_Depart',    $('#adresseDepart').value.trim());
    data.append('Adresse_Arrivee',   ($('#adresseArrivee') || { value: '' }).value.trim());
    data.append('Details_du_Projet', $('#message').value.trim());

    try {
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
      const json = await res.json();

      if (json.success) {
        showMsg(successEl, '✅ Votre demande a bien été envoyée ! Nous vous répondrons sous 24h.');
        form.reset();
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Devis envoyé !`;
      } else {
        throw new Error(json.message || 'Erreur inconnue');
      }
    } catch (err) {
      console.error('[Form]', err);
      showMsg(errorEl, '❌ Une erreur est survenue. Veuillez réessayer ou nous appeler directement au (514) 863-2841.');
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Envoyer ma demande de devis`;
    }
  });
})();
