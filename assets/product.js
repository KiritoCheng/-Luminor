/* ============================================================
   Aurora Theme — product.js
   Product page interactions: gallery, variants, quantity
   ============================================================ */
(function () {
  'use strict';

  const Product = {
    init() {
      this.cache();
      if (!this.section) return;
      this.bindGallery();
      this.bindOptions();
      this.bindQty();
      this.loadVariants();
      this.bindSubmit();
    },

    cache() {
      this.section = document.querySelector('[data-product-section]');
      this.form = this.section && this.section.querySelector('[data-product-form]');
      this.gallery = this.section && this.section.querySelector('[data-product-gallery]');
    },

    /* ---------- Gallery ---------- */
    bindGallery() {
      if (!this.gallery) return;
      const thumbs = this.gallery.querySelectorAll('[data-product-thumb]');
      const main = this.gallery.querySelector('[data-product-main]');
      if (!thumbs.length || !main) return;
      thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const url = thumb.dataset.mainUrl;
          thumbs.forEach((t) => t.classList.remove('is-active'));
          thumb.classList.add('is-active');
          const img = main.querySelector('img');
          if (img && url) {
            img.style.opacity = '0';
            setTimeout(() => {
              img.src = url;
              img.srcset = '';
              img.style.opacity = '1';
            }, 200);
          }
        });
      });

      // swipe on mobile
      let startX = 0;
      main.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
      main.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) < 40) return;
        const active = this.gallery.querySelector('[data-product-thumb].is-active');
        let idx = Array.from(thumbs).indexOf(active);
        idx = dx < 0 ? Math.min(idx + 1, thumbs.length - 1) : Math.max(idx - 1, 0);
        thumbs[idx].click();
      }, { passive: true });
    },

    /* ---------- Options ---------- */
    bindOptions() {
      if (!this.form) return;
      this.form.querySelectorAll('[data-option-group]').forEach((group) => {
        const values = group.querySelectorAll('[data-option-value]');
        values.forEach((v) => {
          v.addEventListener('click', (e) => {
            e.preventDefault();
            values.forEach((x) => x.classList.remove('is-active'));
            v.classList.add('is-active');
            group.dispatchEvent(new CustomEvent('option:change', { detail: { value: v.dataset.value }, bubbles: true }));
            this.updateVariant();
          });
        });
      });
      // auto-select first of each
      this.form.querySelectorAll('[data-option-group]').forEach((group) => {
        if (!group.querySelector('[data-option-value].is-active')) {
          const first = group.querySelector('[data-option-value]');
          if (first) first.click();
        }
      });
    },

    loadVariants() {
      const script = this.section.querySelector('[data-product-variants]');
      if (script) {
        try {
          window.productVariants = JSON.parse(script.textContent);
        } catch (err) {
          window.productVariants = null;
        }
      }
    },

    updateVariant() {
      const form = this.form;
      if (!form) return;
      const idInput = form.querySelector('input[name="id"]');
      if (!idInput || !window.productVariants) return;
      const selected = Array.from(form.querySelectorAll('[data-option-group]')).map((g) => {
        const active = g.querySelector('[data-option-value].is-active');
        return active ? active.dataset.value : null;
      });
      if (selected.some((s) => !s)) return;
      const variant = window.productVariants.find((v) =>
        v.options.every((opt, i) => opt === selected[i])
      );
      if (!variant) return;
      idInput.value = variant.id;

      const priceEl = this.section.querySelector('[data-price]');
      if (priceEl && variant.price_formatted) priceEl.innerHTML = variant.price_formatted;
      const compareEl = this.section.querySelector('[data-compare-price]');
      if (compareEl) {
        compareEl.innerHTML = variant.compare_at_price_formatted || '';
        const wrapper = compareEl.closest('.price');
        if (wrapper) wrapper.classList.toggle('price--on-sale', !!variant.compare_at_price_formatted);
      }
      const buyBtn = this.section.querySelector('[data-add-to-cart]');
      if (buyBtn) {
        if (!variant.available) {
          buyBtn.setAttribute('disabled', '');
          buyBtn.textContent = buyBtn.dataset.soldOut || 'Sold out';
        } else {
          buyBtn.removeAttribute('disabled');
          buyBtn.textContent = buyBtn.dataset.available || 'Add to bag';
        }
      }
      // update URL
      if (variant.available && history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        history.replaceState(null, '', url.toString());
      }
      // swap image if variant has image
      if (variant.featured_image && this.gallery) {
        const thumb = this.gallery.querySelector(`[data-product-thumb][data-image-id="${variant.featured_image.id}"]`);
        if (thumb) thumb.click();
      }
    },

    bindQty() {
      const input = this.form && this.form.querySelector('[data-qty-input]');
      if (!input) return;
      input.addEventListener('change', () => {
        const min = parseInt(input.min || '1', 10);
        if (parseInt(input.value, 10) < min) input.value = min;
      });
    },

    bindSubmit() {
      // actual submit handled by cart.js; here we just validate
      if (!this.form) return;
      this.form.addEventListener('submit', (e) => {
        const idInput = this.form.querySelector('input[name="id"]');
        if (!idInput || !idInput.value) {
          e.preventDefault();
          window.AuroraTheme && AuroraTheme.toast('Please select options');
        }
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Product.init());
  } else {
    Product.init();
  }

  window.AuroraProduct = Product;
})();
