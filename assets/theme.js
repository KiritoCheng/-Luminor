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
      this.bindCartDrawerClose();
      this.bindSearch();
      this.initReveal();
      this.initParallax();
      this.initStaggerReveal();
      this.initTiltCards();
      this.initMagneticButtons();
      this.initCountUp();
      this.initMegaMenu();
      this.initSlideshow();
      this.initAccordions();
      this.bindQtySteppers();
      this.bindQuickView();
      this.bindQuickAdd();
      this.bindFacetsToggle();
      this.bindSmoothScroll();
      this.initHeaderScroll();
      this.initScrollProgress();
      this.markLoaded();
      this.bindSectionReload();
    },

    /* ---------- Shopify editor section reload ---------- */
    bindSectionReload() {
      document.addEventListener('shopify:section:load', () => {
        this.initReveal();
      this.initStaggerReveal();
      this.initMagneticButtons();
      this.initCountUp();
        this.initParallax();
        this.initSlideshow();
        this.initAccordions();
        this.bindQtySteppers();
        this.bindQuickView();
        this.bindQuickAdd();
        this.bindCartDrawerClose();
        this.initHeaderScroll();
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

      if (!document.body.dataset.cartDrawerOpenBound) {
        document.body.dataset.cartDrawerOpenBound = 'true';
        document.addEventListener('click', (e) => {
          const btn = e.target.closest('[data-cart-drawer-open]');
          if (!btn) return;
          e.preventDefault();
          this.openCartDrawer();
        });
      }
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

    closeCartDrawer() {
      const drawer = this.cartDrawer;
      if (!drawer) return;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      if (!this.anyDrawerOpen()) this.closeOverlay();
      if (!this.anyDrawerOpen()) this.unlockScroll();
    },

    bindCartDrawerClose(scope) {
      scope = scope || document;
      const closeBtns = scope.querySelectorAll('[data-cart-drawer-close]');
      closeBtns.forEach((btn) => {
        if (btn.dataset.boundClose === 'true') return;
        btn.dataset.boundClose = 'true';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.closeCartDrawer();
        });
      });
    },

    refreshCartDrawer() {
      const drawer = this.cartDrawer;
      if (!drawer) return;
      const body = drawer.querySelector('[data-cart-drawer-body]');
      // Inject skeleton placeholder while fetching
      if (body) body.innerHTML = this.cartSkeletonHTML();
      const cartUrl = (window.Shopify && window.Shopify.routes && window.Shopify.routes.cart_url)
        ? window.Shopify.routes.cart_url + '?view=drawer'
        : '/cart?view=drawer';
      return fetch(cartUrl)
        .then((r) => r.text())
        .then((html) => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const freshDrawer = doc.querySelector('[data-cart-drawer]');
          if (freshDrawer) {
            drawer.innerHTML = freshDrawer.innerHTML;
            this.bindCartDrawerClose(drawer);
          }
        })
        .catch(() => {});
    },

    /* ---------- Cart drawer skeleton HTML (loading placeholder) ---------- */
    cartSkeletonHTML() {
      const item = `
        <div class="cart-skeleton__item">
          <span class="skeleton skeleton--img"></span>
          <span>
            <span class="skeleton skeleton--title"></span>
            <span class="skeleton skeleton--text"></span>
            <span class="skeleton skeleton--text-sm"></span>
          </span>
          <span class="skeleton skeleton--price"></span>
        </div>`;
      return `<div class="cart-skeleton" role="status" aria-busy="true">${item.repeat(3)}<span class="skeleton skeleton--btn"></span></div>`;
    },

    /* ---------- Search modal skeleton HTML (loading placeholder) ---------- */
    searchSkeletonHTML() {
      const item = `
        <div class="search-skeleton__item">
          <span class="skeleton skeleton--img"></span>
          <span>
            <span class="skeleton skeleton--title"></span>
            <span class="skeleton skeleton--text-sm"></span>
          </span>
        </div>`;
      return `<div class="search-skeleton" role="status" aria-busy="true">${item.repeat(3)}</div>`;
    },

    updateCartCount() {
      const cartUrl = (window.Shopify && window.Shopify.routes && window.Shopify.routes.cart_url)
        ? window.Shopify.routes.cart_url + '.js'
        : '/cart.js';
      fetch(cartUrl)
        .then((r) => r.json())
        .then((cart) => {
          document.querySelectorAll('[data-cart-count]').forEach((el) => {
            if (el.hasAttribute('data-cart-drawer')) return;
            el.textContent = cart.item_count;
            el.style.display = cart.item_count > 0 ? '' : 'none';
          });
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
        // Inject skeleton while fetching predictive results
        if (resultsEl) resultsEl.innerHTML = this.searchSkeletonHTML();
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
        // Skip buy buttons on product page (add to cart + dynamic checkout): magnetic translate misaligns full-width CTA row
        if (btn.closest('.product__buy-buttons')) return;
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

    /* ---------- Count up (stats counters) ---------- */
    initCountUp() {
      const nums = document.querySelectorAll('[data-count]');
      if (!nums.length) return;
      const renderFinal = (el) => {
        const target = parseFloat(el.dataset.count) || 0;
        const decimals = (String(el.dataset.count).split('.')[1] || '').length;
        el.textContent = (el.dataset.prefix || '') + target.toFixed(decimals) + (el.dataset.suffix || '');
      };
      if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
        nums.forEach(renderFinal);
        return;
      }
      if (!('IntersectionObserver' in window)) {
        nums.forEach(renderFinal);
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            if (el.dataset.counted === 'true') return;
            el.dataset.counted = 'true';
            io.unobserve(el);
            const target = parseFloat(el.dataset.count) || 0;
            const decimals = (String(el.dataset.count).split('.')[1] || '').length;
            const prefix = el.dataset.prefix || '';
            const suffix = el.dataset.suffix || '';
            const duration = 1400;
            const start = performance.now();
            const step = (now) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
              el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
              if (t < 1) requestAnimationFrame(step);
              else el.textContent = prefix + target.toFixed(decimals) + suffix;
            };
            requestAnimationFrame(step);
          });
        },
        { threshold: 0.4 }
      );
      nums.forEach((el) => io.observe(el));
    },

    /* ---------- Mega Menu ---------- */
    initMegaMenu() {
      const items = document.querySelectorAll('.header__nav-item--mega');
      if (!items.length) return;
      let closeTimer = null;

      const updateScrim = () => {
        const anyOpen = Array.from(items).some((it) => it.classList.contains('is-open'));
        document.body.classList.toggle('is-mega-open', anyOpen);
      };

      const closeAll = (except) => {
        items.forEach((it) => { if (it !== except) it.classList.remove('is-open'); });
        updateScrim();
      };
      items.forEach((item) => {
        const trigger = item.querySelector('[data-mega-trigger]');
        const panel = item.querySelector('[data-header-dropdown]');
        if (!trigger) return;
        item.addEventListener('mouseenter', () => {
          clearTimeout(closeTimer);
          closeAll(item);
          item.classList.add('is-open');
          updateScrim();
        });
        item.addEventListener('mouseleave', () => {
          closeTimer = setTimeout(() => {
            item.classList.remove('is-open');
            updateScrim();
          }, 200);
        });
        if (panel) {
          panel.addEventListener('mouseenter', () => clearTimeout(closeTimer));
          panel.addEventListener('mouseleave', () => {
            closeTimer = setTimeout(() => {
              item.classList.remove('is-open');
              updateScrim();
            }, 200);
          });
        }
        trigger.addEventListener('click', () => {
          const wasOpen = item.classList.contains('is-open');
          closeAll(null);
          if (!wasOpen) {
            item.classList.add('is-open');
          }
          updateScrim();
        });
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.header__nav-item--mega')) {
          closeAll(null);
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll(null);
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
            <button class="modal__close" data-quick-view-close aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
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
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          // New template wraps output in .modal__content-inner; fall back to .product / main / body
          const inner = doc.querySelector('.modal__content-inner')
                     || doc.querySelector('.product')
                     || doc.querySelector('[data-product-section]')
                     || doc.querySelector('main');
          contentEl.innerHTML = inner ? inner.innerHTML : (doc.body.innerHTML || html);
          // Initialise interactivity within the injected fragment
          this._initQuickViewFragment(contentEl);
        })
        .catch(() => {
          contentEl.innerHTML = '<p style="padding:48px;text-align:center;color:var(--color-text-muted);">Unable to load product.</p>';
        });
    },

    /**
     * Initialise all interactive bits inside a freshly-injected quick-view fragment:
     *   - variant option swatches (pill selection + live option label update)
     *   - quantity stepper +/- buttons & min/max clamp
     *   - form submit → add to cart via JSON API (opens cart drawer on success)
     */
    _initQuickViewFragment(root) {
      if (!root) return;
      const form = root.querySelector('[data-quick-view-form]');
      const idInput = root.querySelector('[data-quick-view-variant-id]');
      const addBtn = root.querySelector('[data-add-to-cart]');
      const priceWrap = root.querySelector('[data-quick-view-price]');

      // ---- Option swatches ----
      const optionGroups = root.querySelectorAll('[data-option-group]');
      optionGroups.forEach((group) => {
        const values = group.querySelectorAll('[data-option-value]');
        const selectedLabel = group.querySelector('[data-option-selected]');
        values.forEach((btn) => {
          btn.addEventListener('click', () => {
            values.forEach((v) => v.classList.remove('is-active'));
            btn.classList.add('is-active');
            if (selectedLabel) selectedLabel.textContent = btn.dataset.value;
          });
        });
      });

      // ---- Quantity stepper ----
      const qtyInput = root.querySelector('[data-qty-input]');
      const dec = root.querySelector('[data-qty-dec]');
      const inc = root.querySelector('[data-qty-inc]');
      if (qtyInput && dec && inc) {
        const clamp = () => {
          let v = parseInt(qtyInput.value || '1', 10);
          if (Number.isNaN(v) || v < 1) v = 1;
          const max = parseInt(qtyInput.max || '9999', 10);
          if (v > max) v = max;
          qtyInput.value = String(v);
          dec.disabled = v <= 1;
          inc.disabled = v >= max;
        };
        dec.addEventListener('click', () => { qtyInput.stepDown(); clamp(); });
        inc.addEventListener('click', () => { qtyInput.stepUp(); clamp(); });
        qtyInput.addEventListener('change', clamp);
        qtyInput.addEventListener('input', () => {
          // Re-evaluate disable state live (don't overwrite user's typing)
          const v = parseInt(qtyInput.value || '1', 10);
          dec.disabled = v <= 1;
          inc.disabled = v >= parseInt(qtyInput.max || '9999', 10);
        });
        clamp();
      }

      // ---- Form submit: AJAX add-to-cart, open cart drawer ----
      if (form && addBtn) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const id = idInput ? idInput.value : form.querySelector('[name="id"]')?.value;
          const qty = qtyInput?.value || form.querySelector('[name="quantity"]')?.value || '1';
          if (!id) return;

          addBtn.classList.add('is-loading');
          addBtn.disabled = true;

          try {
            const res = await fetch('/cart/add.js', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ id, quantity: parseInt(qty, 10) || 1 })
            });
            const data = await res.json();
            if (!res.ok || data.status) {
              // Shopify returns { status, description, message } on error
              const msg = (data && (data.description || data.message)) || 'Unable to add item.';
              if (window.AuroraTheme) AuroraTheme.toast(msg); else alert(msg);
              return;
            }
            // Success → refresh cart drawer count + open drawer
            if (typeof this.refreshCartDrawer === 'function') await this.refreshCartDrawer();
            if (typeof this.updateCartCount === 'function') await this.updateCartCount();
            // Open cart drawer — try multiple detection strategies
            let drawerOpened = false;
            const drawerEl = document.querySelector('[data-cart-drawer]');
            if (drawerEl) {
              if (typeof drawerEl.open === 'function') { try { drawerEl.open(); drawerOpened = true; } catch(_) {} }
              if (!drawerOpened) { try { drawerEl.classList.add('is-open'); drawerOpened = true; } catch(_) {} }
            }
            if (!drawerOpened && window.CartDrawer && typeof window.CartDrawer.open === 'function') {
              try { window.CartDrawer.open(); drawerOpened = true; } catch(_) {}
            }
            if (!drawerOpened) {
              document.querySelectorAll('.drawer, .cart-drawer, [data-drawer]').forEach((el) => {
                el.classList.add('is-open');
              });
            }
            // Close quick view immediately (don't wait for cart drawer to open)
            this.closeQuickView(true);
          } catch (err) {
            if (window.AuroraTheme) AuroraTheme.toast('Unable to add item.');
          } finally {
            addBtn.classList.remove('is-loading');
            addBtn.disabled = false;
          }
        });
      }
    },

    closeQuickView(silent) {
      const modal = document.querySelector('[data-quick-view-modal]');
      if (!modal) return;
      // Double safeguard: clear inline states + remove is-open (no transition cancel)
      modal.classList.remove('is-open');
      // If stuck-open due to interrupted transition, force hide after exit animation
      const forceHide = () => {
        const m = document.querySelector('[data-quick-view-modal]');
        if (m && !m.classList.contains('is-open')) {
          m.style.removeProperty('display');
          // Force the scroll lock to be released regardless
        }
      };
      setTimeout(forceHide, 260);
      try { this.unlockScroll(); } catch(_) {}
      if (silent !== true) {
        // Re-enable trigger button focus (accessibility)
      }
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
      if (document.body.dataset.quickAddBound === 'true') return;
      document.body.dataset.quickAddBound = 'true';

      document.addEventListener('submit', async (e) => {
        const form = e.target.closest('[data-quick-add]');
        if (!form) return;
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          btn.style.transform = 'scale(0.92)';
          setTimeout(() => { btn.style.transform = ''; }, 200);
        }

        const formData = new FormData(form);
        const addUrl = (window.Shopify && window.Shopify.routes && window.Shopify.routes.cart_add_url)
          ? window.Shopify.routes.cart_add_url + '.js'
          : '/cart/add.js';

        try {
          const res = await fetch(addUrl, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/javascript' }
          });
          if (res.ok) {
            await this.refreshCartDrawer();
            this.openCartDrawer();
            this.updateCartCount();
          }
        } catch (err) {
          console.error('Quick add error:', err);
        }
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

    /* ---------- Header scroll contraction (Apple-style) ---------- */
    initHeaderScroll() {
      const wrappers = document.querySelectorAll('.header-wrapper');
      if (!wrappers.length) return;
      let lastY = window.scrollY || window.pageYOffset || 0;
      let ticking = false;

      const apply = (y) => {
        const scrolled = y > 10;
        wrappers.forEach((w) => {
          if (scrolled) w.classList.add('is-scrolled');
          else w.classList.remove('is-scrolled');
        });
        ticking = false;
      };

      apply(lastY);

      window.addEventListener('scroll', () => {
        const y = window.scrollY || window.pageYOffset || 0;
        if (!ticking) {
          window.requestAnimationFrame(() => apply(y));
          ticking = true;
        }
      }, { passive: true });
    },

    /* ---------- Scroll progress bar (top reading indicator) ---------- */
    initScrollProgress() {
      const bar = document.querySelector('.scroll-progress');
      if (!bar) return;
      let ticking = false;
      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(1, Math.max(0, (window.scrollY || window.pageYOffset || 0) / max)) : 0;
        bar.style.transform = `scaleX(${ratio})`;
        ticking = false;
      };
      const onScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      update();
    },
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
