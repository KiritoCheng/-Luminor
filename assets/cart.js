/* ============================================================
   Aurora Theme — cart.js
   Cart drawer / page AJAX interactions
   ============================================================ */
(function () {
  'use strict';

  const Cart = {
    init() {
      this.cache();
      this.bindAddButtons();
      this.bindChange();
      this.bindDrawerTriggers();
    },

    cache() {
      this.drawer = document.querySelector('[data-cart-drawer]');
      this.overlay = document.querySelector('[data-drawer-overlay]');
      this.body = document.body;
    },

    bindAddButtons() {
      document.addEventListener('submit', (e) => {
        const form = e.target.closest('[data-product-form]');
        if (!form) return;
        e.preventDefault();
        const btn = form.querySelector('[data-add-to-cart]');
        if (btn) {
          btn.setAttribute('aria-disabled', 'true');
          btn.classList.add('is-loading');
        }
        const formData = new FormData(form);
        fetch(window.routes.cart_add_url + '.js', {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.status) {
              window.AuroraTheme && AuroraTheme.toast(data.description || data.message);
              return;
            }
            this.refresh();
            if (window.AuroraTheme && window.settings && settings.cart_type === 'drawer') {
              AuroraTheme.cartDrawer && AuroraTheme.cartDrawer.classList.add('is-open');
              this.open();
            } else {
              window.location.href = window.routes.cart_url;
            }
          })
          .catch(() => {
            window.AuroraTheme && AuroraTheme.toast(window.cartStrings && window.cartStrings.error);
          })
          .finally(() => {
            if (btn) {
              btn.removeAttribute('aria-disabled');
              btn.classList.remove('is-loading');
            }
          });
      });
    },

    bindChange() {
      document.addEventListener('change', (e) => {
        const qtyInput = e.target.closest('input[data-qty-input][data-line]');
        if (!qtyInput) return;
        const line = parseInt(qtyInput.dataset.line, 10);
        const quantity = parseInt(qtyInput.value, 10);
        this.change(line, quantity, qtyInput.closest('[data-cart-item]'));
      });

      document.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('[data-remove-line]');
        if (!removeBtn) return;
        e.preventDefault();
        const line = parseInt(removeBtn.dataset.removeLine, 10);
        this.change(line, 0, removeBtn.closest('[data-cart-item]'));
      });
    },

    change(line, quantity, itemEl) {
      if (itemEl) itemEl.classList.add('is-loading');
      fetch(window.routes.cart_change_url + '.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ line, quantity })
      })
        .then((r) => r.json())
        .then(() => this.refresh())
        .catch(() => {})
        .finally(() => {
          if (itemEl) itemEl.classList.remove('is-loading');
        });
    },

    refresh() {
      return fetch(window.routes.cart_url + '?view=drawer')
        .then((r) => r.text())
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          if (this.drawer) {
            const newDrawer = doc.querySelector('[data-cart-drawer]');
            if (newDrawer) {
              const wasOpen = this.drawer.classList.contains('is-open');
              this.drawer.innerHTML = newDrawer.innerHTML;
              if (wasOpen) this.drawer.classList.add('is-open');
            }
          }
          const pageItems = document.querySelector('[data-cart-page-items]');
          if (pageItems) {
            const newPage = doc.querySelector('[data-cart-page-items]');
            if (newPage) pageItems.innerHTML = newPage.innerHTML;
            else window.location.reload();
          }
          this.updateCount(doc);
        })
        .catch(() => {});
    },

    updateCount(doc) {
      const countEl = doc.querySelector('[data-cart-count]');
      const count = countEl ? countEl.dataset.cartCount : '0';
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        el.textContent = count;
        el.setAttribute('data-count', count);
      });
    },

    bindDrawerTriggers() {
      const openBtns = document.querySelectorAll('[data-cart-drawer-open]');
      openBtns.forEach((b) => b.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      }));
      if (this.drawer) {
        this.drawer.querySelectorAll('[data-cart-drawer-close]').forEach((b) =>
          b.addEventListener('click', () => this.close())
        );
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.drawer.classList.contains('is-open')) this.close();
        });
      }
    },

    open() {
      if (!this.drawer) {
        window.location.href = window.routes.cart_url;
        return;
      }
      this.drawer.classList.add('is-open');
      if (this.overlay) this.overlay.classList.add('is-active');
      this.body.classList.add('no-scroll');
    },

    close() {
      if (this.drawer) this.drawer.classList.remove('is-open');
      if (this.overlay && !this.anyOtherOpen()) {
        this.overlay.classList.remove('is-active');
      }
      if (!this.anyOtherOpen()) this.body.classList.remove('no-scroll');
    },

    anyOtherOpen() {
      return Array.from(document.querySelectorAll('.mobile-menu.is-open, .search-modal.is-open, .modal.is-open')).length > 0;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Cart.init());
  } else {
    Cart.init();
  }

  window.AuroraCart = Cart;
})();
