/**
 * TH Multi-services v3 — Main JavaScript
 * Handles: Nav, Scroll Reveal, Modals, Photo Upload, Form Submit
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


// ── Upload Zone ────────────────────────────────────────────────────
(function initUpload() {
  const zone = $('#upload-zone');
  const input = $('#photos');
  const container = $('#preview-container');
  if (!zone || !input || !container) return;

  let selectedFiles = [];

  // Click on zone triggers input
  on(zone, 'click', (e) => {
    if (e.target !== input) input.click();
  });
  on(zone, 'keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
  });

  // Drag & drop
  on(zone, 'dragover', e => { e.preventDefault(); zone.style.borderColor = 'rgba(26,109,255,0.6)'; });
  on(zone, 'dragleave', () => { zone.style.borderColor = ''; });
  on(zone, 'drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    handleFiles(e.dataTransfer.files);
  });

  on(input, 'change', (e) => handleFiles(e.target.files));

  const handleFiles = (files) => {
    const arr = [...files].filter(f => f.type.startsWith('image/'));
    const remaining = 5 - selectedFiles.length;
    if (arr.length > remaining) {
      alert(`Maximum 5 photos. Vous pouvez encore en ajouter ${remaining}.`);
      return;
    }
    arr.forEach(file => {
      if (selectedFiles.length >= 5) return;
      selectedFiles.push(file);
      addPreview(file);
    });
  };

  const addPreview = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const badge = document.createElement('div');
      badge.className = 'preview-badge';
      badge.setAttribute('role', 'listitem');

      const thumb = document.createElement('img');
      thumb.src = e.target.result;
      thumb.className = 'preview-thumb';
      thumb.alt = file.name;

      const name = document.createElement('span');
      name.className = 'preview-name';
      name.textContent = file.name;

      const rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'preview-remove';
      rm.innerHTML = '&times;';
      rm.setAttribute('aria-label', `Retirer ${file.name}`);
      on(rm, 'click', () => {
        selectedFiles = selectedFiles.filter(f => f !== file);
        badge.remove();
      });

      badge.append(thumb, name, rm);
      container.appendChild(badge);
    };
    reader.readAsDataURL(file);
  };

  // Expose selectedFiles for form submission
  window._getUploadedFiles = () => selectedFiles;
  window._resetUpload = () => {
    selectedFiles = [];
    container.innerHTML = '';
    input.value = '';
  };
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

    btn.disabled = true;
    btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg> Envoi en cours…`;

    const data = new FormData();
    data.append('access_key', '51e3ae7f-27d3-47ba-97da-d88e71d4d4ee');
    data.append('Nom Complet',       $('#name').value.trim());
    data.append('email',             $('#email').value.trim());
    data.append('Téléphone',         $('#phone').value.trim());
    data.append('Service Souhaité',  $('#service').value);
    data.append('Adresse Départ',    $('#adresseDepart').value.trim());
    data.append('Adresse Arrivée',   ($('#adresseArrivee') || { value: '' }).value.trim());
    data.append('Détails du Projet', $('#message').value.trim());

    const files = window._getUploadedFiles ? window._getUploadedFiles() : [];
    files.forEach(f => data.append('attachment[]', f, f.name));

    try {
      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
      const json = await res.json();

      if (json.success) {
        showMsg(successEl, '✅ Votre demande a bien été envoyée ! Nous vous répondrons sous 24h.');
        form.reset();
        if (window._resetUpload) window._resetUpload();
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
