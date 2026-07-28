/**
 * Saros Doğal Yayla Balı — Sepet sistemi
 * Veriler yalnızca tarayıcı localStorage'da tutulur.
 * Sunucuya hiçbir veri gönderilmez.
 */
(function (window) {
    'use strict';

    var STORAGE_KEY = 'saros_sepet';
    var MAX_QTY = 20;

    /* ---------- Depolama ---------- */

    function getCart() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return [];
            var data = JSON.parse(raw);
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
            updateCartBadge();
        } catch (e) {
            console.warn('Sepet kaydedilemedi.');
        }
    }

    /* ---------- Sepet işlemleri ---------- */

    /**
     * Sepete ürün ekler.
     * @param {Object} product - { id, name, price, net?, img? }
     * @param {number} [qty=1]
     */
    function addToCart(product, qty) {
        if (!product || !product.id || !product.name) return false;
        if (typeof product.price !== 'number' || product.price < 0) return false;

        qty = parseInt(qty, 10) || 1;
        if (qty < 1) qty = 1;
        if (qty > MAX_QTY) qty = MAX_QTY;

        var cart = getCart();
        var existing = null;

        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id === product.id) {
                existing = cart[i];
                break;
            }
        }

        if (existing) {
            existing.qty = Math.min(existing.qty + qty, MAX_QTY);
        } else {
            cart.push({
                id: String(product.id),
                name: String(product.name).slice(0, 100),
                price: Number(product.price),
                net: product.net ? String(product.net).slice(0, 50) : '',
                img: product.img ? String(product.img).slice(0, 200) : 'assets/images/bal.jpg',
                qty: qty
            });
        }

        saveCart(cart);
        return true;
    }

    function removeFromCart(id) {
        var cart = getCart().filter(function (item) {
            return item.id !== id;
        });
        saveCart(cart);
    }

    function updateQty(id, qty) {
        qty = parseInt(qty, 10);
        var cart = getCart();
        var item = null;

        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id === id) {
                item = cart[i];
                break;
            }
        }

        if (!item) return;

        if (qty < 1) {
            removeFromCart(id);
            return;
        }

        item.qty = Math.min(qty, MAX_QTY);
        saveCart(cart);
    }

    function changeQty(id, delta) {
        var cart = getCart();
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].id === id) {
                updateQty(id, cart[i].qty + delta);
                return;
            }
        }
    }

    function clearCart() {
        saveCart([]);
    }

    function getCartCount() {
        var cart = getCart();
        var count = 0;
        for (var i = 0; i < cart.length; i++) {
            count += cart[i].qty;
        }
        return count;
    }

    function getCartTotal() {
        var cart = getCart();
        var total = 0;
        for (var i = 0; i < cart.length; i++) {
            total += cart[i].price * cart[i].qty;
        }
        return total;
    }

    function formatPrice(n) {
        return Number(n).toLocaleString('tr-TR') + ' ₺';
    }

    /* ---------- Rozet (opsiyonel) ---------- */

    function updateCartBadge() {
        var badges = document.querySelectorAll('[data-cart-count]');
        var count = getCartCount();
        for (var i = 0; i < badges.length; i++) {
            badges[i].textContent = count > 0 ? String(count) : '';
            badges[i].style.display = count > 0 ? '' : 'none';
        }
    }

    /* ---------- Buton dinleyicileri ---------- */

    /**
     * data-add-cart öznitelikli butonları bağlar.
     * Örnek HTML:
     * <button type="button"
     *   data-add-cart
     *   data-id="suzme-850"
     *   data-name="Süzme Çiçek Balı"
     *   data-price="500"
     *   data-net="850 g"
     *   data-img="assets/images/bal.jpg">
     *   Sepete Ekle
     * </button>
     */
    function bindAddButtons() {
        var buttons = document.querySelectorAll('[data-add-cart]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function (e) {
                e.preventDefault();
                var btn = e.currentTarget;
                var product = {
                    id: btn.getAttribute('data-id'),
                    name: btn.getAttribute('data-name'),
                    price: parseFloat(btn.getAttribute('data-price')),
                    net: btn.getAttribute('data-net') || '',
                    img: btn.getAttribute('data-img') || 'assets/images/bal.jpg'
                };

                if (addToCart(product, 1)) {
                    var original = btn.textContent;
                    btn.textContent = 'Eklendi ✓';
                    btn.disabled = true;
                    setTimeout(function () {
                        btn.textContent = original;
                        btn.disabled = false;
                    }, 1500);
                }
            });
        }
    }

    /* ---------- Genel API ---------- */

    window.SarosCart = {
        getCart: getCart,
        addToCart: addToCart,
        removeFromCart: removeFromCart,
        updateQty: updateQty,
        changeQty: changeQty,
        clearCart: clearCart,
        getCartCount: getCartCount,
        getCartTotal: getCartTotal,
        formatPrice: formatPrice,
        updateCartBadge: updateCartBadge,
        bindAddButtons: bindAddButtons
    };

    /* Sayfa yüklenince */
    document.addEventListener('DOMContentLoaded', function () {
        updateCartBadge();
        bindAddButtons();
    });

})(window);
