document.addEventListener('DOMContentLoaded', () => {

  /* Scroll progres bar + senka headera */
  const progressBar = document.getElementById('scrollProgress');
  const header = document.querySelector('.site-header');

  function updateScrollUI() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = pct + '%';
    if (header) header.classList.toggle('is-scrolled', scrollTop > 8);
  }

  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });
  window.addEventListener('resize', updateScrollUI);

  /* Reveal sadržaja pri skrolovanju */
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (revealEls.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(el => el.classList.add('in-view'));
    } else {
      // Grupišemo elemente po roditelju (grid/lista) da bi se pojavljivali sa malim,
      // ali primetnim zakašnjenjem jedan za drugim (bez čekanja/JS timera — sve ide preko CSS transition-delay)
      const groups = new Map();
      revealEls.forEach(el => {
        const parent = el.parentElement;
        if (!groups.has(parent)) groups.set(parent, []);
        groups.get(parent).push(el);
      });

      revealEls.forEach(el => {
        const siblings = groups.get(el.parentElement) || [el];
        const index = siblings.indexOf(el);
        const delay = Math.min(index, 5) * 55;
        if (delay) el.style.transitionDelay = delay + 'ms';
      });

      // Pozitivan rootMargin dole = element počinje da se otkriva čim priđe dnu ekrana,
      // umesto da se čeka da upadne duboko u vidljivu oblast (osećaj kašnjenja).
      const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        });
      }, { threshold: 0, rootMargin: '0px 0px -2% 0px' });

      revealEls.forEach(el => revealObserver.observe(el));
    }
  }

  /* Mobilni meni */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Kontakt forma */
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  if (!form) return;

  const fields = Array.from(form.querySelectorAll('.field'));

  function validateField(fieldEl) {
    const input = fieldEl.querySelector('input, select, textarea');
    if (!input) return true;
    const valid = input.checkValidity();
    fieldEl.classList.toggle('invalid', !valid);
    return valid;
  }

  fields.forEach(fieldEl => {
    const input = fieldEl.querySelector('input, select, textarea');
    if (!input) return;
    input.addEventListener('blur', () => validateField(fieldEl));
    input.addEventListener('input', () => {
      if (fieldEl.classList.contains('invalid')) validateField(fieldEl);
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const allValid = fields.map(validateField).every(Boolean);
    if (!allValid) {
      statusEl.textContent = 'Molimo popunite označena polja ispravno.';
      statusEl.className = 'form-status err';
      return;
    }

    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.disabled = true;
    statusEl.textContent = 'Šaljemo...';
    statusEl.className = 'form-status';

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        statusEl.textContent = 'Hvala! Javićemo se u roku od 24h.';
        statusEl.className = 'form-status ok';
        form.reset();
        fields.forEach(f => f.classList.remove('invalid'));
      } else {
        statusEl.textContent = 'Došlo je do greške. Pokušajte ponovo ili nas kontaktirajte direktno.';
        statusEl.className = 'form-status err';
      }
    } catch (err) {
      statusEl.textContent = 'Nema veze sa serverom. Proverite internet konekciju.';
      statusEl.className = 'form-status err';
    } finally {
      submitBtn.disabled = false;
    }
  });

});