/* ============================================================
   Aurora Theme — theme.js
   Global UI behaviors: menus, drawers, reveals, slideshows, etc.
   ============================================================ */
(function () {
  'use strict';

  const AuroraTheme = {
    init() {
      this.cacheElements();
      this.bindHeader();
      this.bindMobileMenu();
      this.bindDrawers();
      this.bindSearch();
      this.initReveal();
      this.initParallax();
      this.initStaggerReveal();
      this.initMagneticButtons();
      this.initTiltCards();
      this.initMegaMenu();
      this.initSlideshow();
      this.initAccordions();
      this.bindQtySteppers();
      this.bindQuickView();
      this.bindQuickAdd();
      this.bindFacetsToggle();
      this.bindSmoothScroll();
      this.markLoaded();
      this.bindSectionReload();
    },

    /* ---------- Shopify editor section reload ---------- */
    bindSectionReload() {
      document.addEventListener('shopify:section:load', () => {
        this.initReveal();
        this.initStaggerReveal();
        this.initParallax();
        this.initSlideshow();
        this.initAccordions();
        this.bindQtySteppers();
        this.bindQuickView();
        this.bindQuickAdd();
      });
      document.addEventListener('shopify:section:select', () => {
        this.initReveal();
      });
    },

    cacheElements() {
      this.body = document.body;
      this.overlay = document.querySelector('[data-drawer-overlay]');
      this.cartDrawer = document.querySelector('[data-cart-drawer]');
      this.searchModal = document.querySelector('[data-search-modal]');
      this.mobileMenu = document.querySelector('[data-mobile-menu]');
    },

    markLoaded() {
      document.body.classList.add('theme-loaded');
    },

    /* ---------- Header / sticky ---------- */
    bindHeader() {
      const header = document.querySelector('[data-header]');
      if (!header) return;
      let lastY = window.scrollY;
      const onScroll = () => {
        const y = window.scrollY;
        if (y > 10) {
          header.classList.add('is-scrolled');
        } else {
          header.classList.remove('is-scrolled');
        }
        lastY = y;
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    },

    /* ---------- Mobile menu ---------- */
    bindMobileMenu() {
      const menu = this.mobileMenu;
      if (!menu) return;
      const openBtns = document.querySelectorAll('[data-mobile-menu-open]');
      const closeBtns = menu.querySelectorAll('[data-mobile-menu-close]');

      const open = () => {
        menu.classList.add('is-open');
        this.openOverlay();
        this.lockScroll();
        menu.focus();
      };
      const close = () => {
        menu.classList.remove('is-open');
        if (!this.anyDrawerOpen()) this.closeOverlay();
        if (!this.anyDrawerOpen()) this.unlockScroll();
      };

      openBtns.forEach((b) => b.addEventListener('click', open));
      closeBtns.forEach((b) => b.addEventListener('click', close));
      this.escToClose(menu, close);
    },

    /* ---------- Generic drawers ---------- */
    bindDrawers() {
      if (!this.overlay) return;
      this.overlay.addEventListener('click', () => this.closeAll());
    },

    openOverlay() {
      if (this.overlay) {
        this.overlay.classList.add('is-active');
        this.overlay.hidden = false;
      }
    },
    closeOverlay() {
      if (this.overlay) {
        this.overlay.classList.remove('is-active');
        setTimeout(() => { this.overlay.hidden = true; }, 300);
      }
    },

    closeAll() {
      [this.cartDrawer, this.searchModal, this.mobileMenu].forEach((d) => {
        if (d && d.classList.contains('is-open')) d.classList.remove('is-open');
      });
      this.closeOverlay();
      this.unlockScroll();
    },

    openCartDrawer() {
      const drawer = this.cartDrawer;
      if (!drawer) return;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      this.openOverlay();
      this.lockScroll();
    },

    updateCartCount() {
      fetch(window.Shopify.routes.cart_url + '.js')
        .then((r) => r.json())
        .then((cart) => {
          document.querySelectorAll('[data-cart-count]').forEach((el) => {
            el.textContent = cart.item_count;
            el.style.display = cart.item_count > 0 ? '' : 'none';
          });
          const drawer = this.cartDrawer;
          if (drawer) drawer.setAttribute('data-cart-count', cart.item_count);
        })
        .catch(() => {});
    },

    anyDrawerOpen() {
      return [this.cartDrawer, this.searchModal, this.mobileMenu].some(
        (d) => d && d.classList.contains('is-open')
      );
    },

    lockScroll() { this.body.classList.add('no-scroll'); },
    unlockScroll() { this.body.classList.remove('no-scroll'); },

    escToClose(target, closeFn) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && target && target.classList.contains('is-open')) closeFn();
      });
    },

    /* ---------- Search ---------- */
    bindSearch() {
      const modal = this.searchModal;
      if (!modal) return;
      const openBtns = document.querySelectorAll('[data-search-open]');
      const closeBtns = modal.querySelectorAll('[data-search-close]');
      const input = modal.querySelector('input[type="search"]');

      const open = () => {
        modal.classList.add('is-open');
        this.openOverlay();
        this.lockScroll();
        if (input) setTimeout(() => input.focus(), 250);
      };
      const close = () => {
        modal.classList.remove('is-open');
        if (!this.anyDrawerOpen()) this.closeOverlay();
        if (!this.anyDrawerOpen()) this.unlockScroll();
      };

      openBtns.forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(); }));
      closeBtns.forEach((b) => b.addEventListener('click', close));
      this.escToClose(modal, close);

      if (input) {
        this.initPredictiveSearch(input);
      }
    },

    initPredictiveSearch(input) {
      let timer;
      const resultsEl = document.querySelector('[data-predictive-results]');
      const termEl = document.querySelector('[data-predictive-term]');

      const fetchResults = (term) => {
        if (!term || term.length < 2) {
          if (resultsEl) resultsEl.innerHTML = '';
          return;
        }
        const url = `${window.routes.predictive_search_url}?q=${encodeURIComponent(term)}&resources[type]=product,collection,article,page&resources[limit]=4&section_id=predictive-search`;
        fetch(url)
          .then((r) => r.text())
          .then((html) => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const section = doc.querySelector('#shopify-section-predictive-search');
            if (resultsEl && section) {
              resultsEl.innerHTML = section.innerHTML;
              resultsEl.classList.remove('is-hidden');
            }
          })
          .catch(() => {});
      };

      input.addEventListener('input', (e) => {
        const term = e.target.value.trim();
        if (termEl) termEl.textContent = term;
        clearTimeout(timer);
        timer = setTimeout(() => fetchResults(term), 220);
      });

      input.closest('form')?.addEventListener('submit', () => {
        clearTimeout(timer);
      });
    },

    /* ---------- Reveal on scroll ---------- */
    initReveal() {
      if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
        return;
      }
      const reveals = document.querySelectorAll('.reveal:not(.is-visible)');
      if (!reveals.length) return;
      if (!('IntersectionObserver' in window)) {
        reveals.forEach((el) => el.classList.add('is-visible'));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      reveals.forEach((el, i) => {
        el.style.setProperty('--reveal-delay', `${(i % 4) * 80}ms`);
        io.observe(el);
      });
    },

    /* ---------- Scroll parallax ---------- */
    initParallax() {
      if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
      const items = document.querySelectorAll('[data-parallax]');
      if (!items.length) return;
      const update = () => {
        items.forEach((el) => {
          const rect = el.getBoundingClientRect();
          // Skip elements well outside the viewport
          if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
          let translateY = rect.top * -0.15;
          if (translateY > 100) translateY = 100;
          if (translateY < -100) translateY = -100;
          el.style.transform = `translateY(${translateY}px)`;
        });
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    },

    /* ---------- Stagger reveal ---------- */
    initStaggerReveal() {
      const items = document.querySelectorAll('.stagger');
      if (!items.length) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
      }
      if (!('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      items.forEach((el) => {
        if (!el.classList.contains('is-visible')) io.observe(el);
      });
    },

    /* ---------- Magnetic buttons ---------- */
    initMagneticButtons() {
      if (!window.matchMedia('(hover: hover)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const btns = document.querySelectorAll('.button--primary, .button--lg');
      if (!btns.length) return;
      btns.forEach((btn) => {
        const host = btn.parentElement;
        if (!host) return;
        host.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - (rect.left + rect.width / 2);
          const y = e.clientY - (rect.top + rect.height / 2);
          const tx = Math.max(-6, Math.min(6, x * 0.3));
          const ty = Math.max(-6, Math.min(6, y * 0.3));
          btn.style.transition = 'transform 0.15s ease';
          btn.style.transform = `translate(${tx}px, ${ty}px)`;
        });
        host.addEventListener('mouseleave', () => {
          btn.style.transition = 'transform 0.3s ease';
          btn.style.transform = 'translate(0, 0)';
        });
      });
    },

    /* ---------- Tilt cards ---------- */
    initTiltCards() {
      if (!window.matchMedia('(hover: hover)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const cards = document.querySelectorAll('.product-card');
      if (!cards.length) return;
      cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - (rect.left + rect.width / 2);
          const y = e.clientY - (rect.top + rect.height / 2);
          const rotateY = (x / (rect.width / 2)) * 3;
          const rotateX = (y / (rect.height / 2)) * -3;
          card.style.transition = 'transform 0.2s ease';
          card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => {
          card.style.transition = 'transform 0.2s ease';
          card.style.transform = 'none';
        });
      });
    },

    /* ---------- Mega Menu ---------- */
    initMegaMenu() {
      const menus = document.querySelectorAll('[data-mega-menu]');
      if (!menus.length) return;
      menus.forEach((menu) => {
        const trigger = menu.querySelector('[data-mega-trigger]');
        if (!trigger) return;
        let closeTimer;
        trigger.addEventListener('mouseenter', () => {
          clearTimeout(closeTimer);
          menu.classList.add('is-open');
        });
        trigger.addEventListener('mouseleave', () => {
          closeTimer = setTimeout(() => menu.classList.remove('is-open'), 200);
        });
        const panel = menu.querySelector('[data-mega-panel]');
        if (panel) {
          panel.addEventListener('mouseenter', () => clearTimeout(closeTimer));
          panel.addEventListener('mouseleave', () => {
            closeTimer = setTimeout(() => menu.classList.remove('is-open'), 200);
          });
        }
        trigger.addEventListener('click', (e) => {
          if (menu.classList.contains('is-open')) {
            menu.classList.remove('is-open');
          } else {
            e.preventDefault();
            menu.classList.add('is-open');
          }
        });
      });
    },

    /* ---------- Slideshow ---------- */
    initSlideshow() {
      const slideshows = document.querySelectorAll('[data-slideshow]');
      slideshows.forEach((slideshow) => {
        const track = slideshow.querySelector('[data-slideshow-track]');
        const dots = slideshow.querySelectorAll('[data-slideshow-dot]');
        const prevBtn = slideshow.querySelector('[data-slideshow-prev]');
        const nextBtn = slideshow.querySelector('[data-slideshow-next]');
        const slides = slideshow.querySelectorAll('.slideshow__slide');
        if (!track || !slides.length) return;
        let index = 0;
        let autoplay = slideshow.hasAttribute('data-autoplay');
        let interval = parseInt(slideshow.dataset.autoplay || '6000', 10);
        let timer;

        const go = (i) => {
          index = (i + slides.length) % slides.length;
          track.style.transform = `translateX(-${index * 100}%)`;
          dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
        };
        const next = () => go(index + 1);
        const prev = () => go(index - 1);

        dots.forEach((d, di) => d.addEventListener('click', () => { go(di); resetTimer(); }));
        if (nextBtn) nextBtn.addEventListener('click', () => { next(); resetTimer(); });
        if (prevBtn) prevBtn.addEventListener('click', () => { prev(); resetTimer(); });

        const startTimer = () => {
          if (!autoplay) return;
          timer = setInterval(next, interval);
        };
        const resetTimer = () => { clearInterval(timer); startTimer(); };
        startTimer();

        slideshow.addEventListener('mouseenter', () => clearInterval(timer));
        slideshow.addEventListener('mouseleave', startTimer);

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          autoplay = false;
          clearInterval(timer);
        }
      });
    },

    /* ---------- Accordions ---------- */
    initAccordions() {
      document.querySelectorAll('[data-accordion] details').forEach((detail) => {
        const summary = detail.querySelector('summary');
        if (!summary) return;
        summary.addEventListener('click', (e) => {
          e.preventDefault();
          const group = detail.closest('[data-accordion]');
          const single = group && group.hasAttribute('data-single');
          if (single) {
            group.querySelectorAll('details[open]').forEach((d) => {
              if (d !== detail) d.removeAttribute('open');
            });
          }
          if (detail.hasAttribute('open')) detail.removeAttribute('open');
          else detail.setAttribute('open', '');
        });
      });
    },

    /* ---------- Quantity steppers ---------- */
    bindQtySteppers() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-qty-step]');
        if (!btn) return;
        const input = btn.parentElement.querySelector('input[data-qty-input]');
        if (!input) return;
        const step = btn.dataset.qtyStep === 'up' ? 1 : -1;
        const min = parseInt(input.min || '1', 10);
        const current = parseInt(input.value || '1', 10);
        const next = Math.max(min, current + step);
        input.value = next;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    },

    /* ---------- Quick view ---------- */
    bindQuickView() {
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-quick-view]');
        if (!btn) return;
        e.preventDefault();
        const url = btn.getAttribute('href') || btn.dataset.url || btn.dataset.productUrl;
        if (!url) return;
        this.openQuickView(url);
      });
    },

    openQuickView(productUrl) {
      let modal = document.querySelector('[data-quick-view-modal]');
      if (!modal) {
        modal = document.createElement('div');
        modal.setAttribute('data-quick-view-modal', '');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal__dialog">
            <button class="modal__close" data-quick-view-close aria-label="Close">&times;</button>
            <div class="modal__content" data-quick-view-content><div class="spinner"></div></div>
          </div>`;
        document.body.appendChild(modal);
        modal.querySelector('[data-quick-view-close]').addEventListener('click', () => this.closeQuickView());
        modal.addEventListener('click', (e) => { if (e.target === modal) this.closeQuickView(); });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.classList.contains('is-open')) this.closeQuickView();
        });
      }
      modal.classList.add('is-open');
      this.lockScroll();
      const contentEl = modal.querySelector('[data-quick-view-content]');
      contentEl.innerHTML = '<div class="spinner"></div>';
      fetch(`${productUrl}?view=quick-view`)
        .then((r) => r.text())
        .then((html) => {
          // Extract only the product content, not the full page with cart drawer
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const productSection = doc.querySelector('.product') || doc.querySelector('[data-product-section]') || doc.querySelector('main') || doc.body;
          contentEl.innerHTML = productSection.innerHTML || html;
          this.bindProductOptions(contentEl);
        })
        .catch(() => { contentEl.innerHTML = '<p>Unable to load product.</p>'; });
    },

    closeQuickView() {
      const modal = document.querySelector('[data-quick-view-modal]');
      if (modal) modal.classList.remove('is-open');
      this.unlockScroll();
    },

    /* ---------- Product option selection ---------- */
    bindProductOptions(scope) {
      scope = scope || document;
      scope.querySelectorAll('[data-option-group]').forEach((group) => {
        const values = group.querySelectorAll('[data-option-value]');
        values.forEach((v) => {
          v.addEventListener('click', (e) => {
            e.preventDefault();
            values.forEach((x) => x.classList.remove('is-active'));
            v.classList.add('is-active');
            group.dispatchEvent(new CustomEvent('option:change', { detail: { value: v.dataset.value }, bubbles: true }));
            this.updateVariant(scope);
          });
        });
      });
      this.updateVariant(scope);
    },

    updateVariant(scope) {
      const form = scope.querySelector('[data-product-form]');
      if (!form) return;
      const idInput = form.querySelector('input[name="id"]');
      if (!idInput || !window.productVariants) return;
      const selected = Array.from(form.querySelectorAll('[data-option-group]'))
        .map((g) => {
          const active = g.querySelector('[data-option-value].is-active');
          return active ? active.dataset.value : null;
        });
      if (selected.some((s) => !s)) return;
      const variant = window.productVariants.find((v) =>
        v.options.every((opt, i) => opt === selected[i])
      );
      if (variant) {
        idInput.value = variant.id;
        const priceEl = scope.querySelector('[data-price]');
        if (priceEl && variant.price) priceEl.innerHTML = variant.price;
        const compareEl = scope.querySelector('[data-compare-price]');
        if (compareEl) compareEl.innerHTML = variant.compare_at_price || '';
        const buyBtn = scope.querySelector('[data-add-to-cart]');
        if (buyBtn) {
          if (!variant.available) buyBtn.setAttribute('disabled', '');
          else buyBtn.removeAttribute('disabled');
        }
      }
    },

    /* ---------- Quick Add to Cart ---------- */
    bindQuickAdd() {
      document.querySelectorAll('[data-quick-add]').forEach((form) => {
        if (form.dataset.bound === 'true') return;
        form.dataset.bound = 'true';
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const btn = form.querySelector('button[type="submit"]');
          if (btn) {
            btn.style.transform = 'scale(0.92)';
            setTimeout(() => { btn.style.transform = ''; }, 200);
          }
          const formData = new FormData(form);
          try {
            const res = await fetch(window.Shopify.routes.cart_add_url + '.js', {
              method: 'POST',
              body: formData,
              headers: { 'Accept': 'application/javascript' }
            });
            if (res.ok) {
              this.openCartDrawer();
              this.updateCartCount();
            }
          } catch (err) {
            console.error('Quick add error:', err);
          }
        });
      });
    },

    /* ---------- Facets mobile toggle ---------- */
    bindFacetsToggle() {
      const openBtn = document.querySelector('[data-facets-open]');
      const facets = document.querySelector('[data-facets]');
      if (!openBtn || !facets) return;
      openBtn.addEventListener('click', () => {
        facets.classList.add('is-open');
        this.openOverlay();
        this.lockScroll();
      });
      facets.querySelectorAll('[data-facets-close]').forEach((b) =>
        b.addEventListener('click', () => {
          facets.classList.remove('is-open');
          this.closeOverlay();
          this.unlockScroll();
        })
      );
    },

    /* ---------- Smooth scroll for anchors ---------- */
    bindSmoothScroll() {
      document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    },

    /* ---------- Toast ---------- */
    toast(message) {
      let el = document.querySelector('[data-toast]');
      if (!el) {
        el = document.createElement('div');
        el.setAttribute('data-toast', '');
        el.className = 'toast';
        document.body.appendChild(el);
      }
      el.textContent = message;
      el.classList.add('is-visible');
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => el.classList.remove('is-visible'), 3000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuroraTheme.init());
  } else {
    AuroraTheme.init();
  }

  window.AuroraTheme = AuroraTheme;
})();
