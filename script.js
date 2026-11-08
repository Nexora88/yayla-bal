/**
 * Saros Doğal Yayla Balı — ürün kataloğu ve tarayıcı sepeti.
 * Ürün bilgileri assets/products.json dosyasından okunur.
 * Sepet bu aşamada yalnızca bu tarayıcıda saklanır; çevrim içi sipariş değildir.
 */
(function (window, document) {
    'use strict';

    var STORAGE_KEY = 'saros_sepet';
    var MAX_QTY = 20;
    var PRODUCTS_URL = 'assets/products.json';
    var productsCache = null;

    function getCart() {
        try {
            var data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
            if (!Array.isArray(data)) return [];
            return data.filter(function (item) {
                return item && typeof item.id === 'string' &&
                    typeof item.name === 'string' &&
                    Number.isFinite(Number(item.price)) &&
                    Number(item.price) >= 0 &&
                    Number.isInteger(Number(item.qty)) &&
                    Number(item.qty) > 0;
            }).map(function (item) {
                return {
                    id: item.id.slice(0, 80),
                    name: item.name.slice(0, 100),
                    price: Number(item.price),
                    net: String(item.net || '').slice(0, 60),
                    img: safeImagePath(item.img),
                    qty: Math.min(Number(item.qty), MAX_QTY)
                };
            });
        } catch (error) {
            return [];
        }
    }

    function saveCart(cart) {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
            updateCartBadge();
        } catch (error) {
            console.warn('Sepet bu tarayıcıda kaydedilemedi.');
        }
    }

    function safeImagePath(path) {
        var value = String(path || '');
        return /^assets\/images\/[a-zA-Z0-9._-]+\.(png|jpe?g|webp)$/i.test(value)
            ? value : 'assets/images/bal.png';
    }

    function loadProducts() {
        if (productsCache) return Promise.resolve(productsCache);
        return window.fetch(PRODUCTS_URL, { headers: { 'Accept': 'application/json' } })
            .then(function (response) {
                if (!response.ok) throw new Error('Ürün kataloğu yüklenemedi.');
                return response.json();
            })
            .then(function (products) {
                if (!Array.isArray(products)) throw new Error('Ürün kataloğu biçimi geçersiz.');
                productsCache = products.filter(function (product) {
                    return product && typeof product.id === 'string' &&
                        typeof product.name === 'string' &&
                        typeof product.image === 'string';
                });
                return productsCache;
            });
    }

    function formatPrice(value) {
        return Number(value).toLocaleString('tr-TR') + ' ₺';
    }

    function addToCart(productId, qty) {
        return loadProducts().then(function (products) {
            var product = products.find(function (item) { return item.id === productId; });
            if (!product || product.orderable !== true || product.status !== 'in_stock' ||
                !Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
                return false;
            }
            qty = Math.max(1, Math.min(parseInt(qty, 10) || 1, MAX_QTY));
            var cart = getCart();
            var existing = cart.find(function (item) { return item.id === product.id; });
            if (existing) {
                existing.qty = Math.min(existing.qty + qty, MAX_QTY);
            } else {
                cart.push({
                    id: product.id,
                    name: product.name.slice(0, 100),
                    price: Number(product.price),
                    net: String(product.weight || '').slice(0, 60),
                    img: safeImagePath(product.image),
                    qty: qty
                });
            }
            saveCart(cart);
            return true;
        });
    }

    function removeFromCart(id) {
        saveCart(getCart().filter(function (item) { return item.id !== id; }));
    }

    function updateQty(id, qty) {
        qty = parseInt(qty, 10);
        var cart = getCart();
        var item = cart.find(function (entry) { return entry.id === id; });
        if (!item) return;
        if (qty < 1) return removeFromCart(id);
        item.qty = Math.min(qty, MAX_QTY);
        saveCart(cart);
    }

    function changeQty(id, delta) {
        var item = getCart().find(function (entry) { return entry.id === id; });
        if (item) updateQty(id, item.qty + delta);
    }

    function clearCart() { saveCart([]); }
    function getCartCount() {
        return getCart().reduce(function (total, item) { return total + item.qty; }, 0);
    }
    function getCartTotal() {
        return getCart().reduce(function (total, item) { return total + item.price * item.qty; }, 0);
    }

    function updateCartBadge() {
        var count = getCartCount();
        document.querySelectorAll('[data-cart-count]').forEach(function (badge) {
            badge.textContent = count > 0 ? String(count) : '';
        });
    }

    function createProductCard(product, compact) {
        var article = document.createElement('article');
        article.className = compact ? 'product-card' : 'product-detail-card';

        var image = document.createElement('img');
        image.src = safeImagePath(product.image);
        image.alt = product.name;
        image.loading = 'lazy';
        image.decoding = 'async';
        article.appendChild(image);

        var content = document.createElement('div');
        content.className = compact ? 'product-card-content' : 'product-info';

        var status = document.createElement('span');
        status.className = 'stock ' + (product.status === 'in_stock' ? 'stock-var' : 'stock-yakinda');
        status.textContent = product.statusLabel || 'Bilgi al';
        content.appendChild(status);

        var title = document.createElement(compact ? 'h3' : 'h2');
        title.textContent = product.name;
        content.appendChild(title);

        var meta = document.createElement('p');
        meta.className = compact ? 'product-meta' : 'product-net';
        meta.textContent = product.weight || '';
        content.appendChild(meta);

        var description = document.createElement('p');
        description.textContent = product.description || '';
        content.appendChild(description);

        if (!compact) {
            var price = document.createElement('strong');
            price.className = 'product-price';
            price.textContent = product.priceLabel || (product.price == null ? 'Fiyat için iletişim' : formatPrice(product.price));
            content.appendChild(price);
        }

        var action;
        if (product.orderable === true && product.status === 'in_stock') {
            action = document.createElement('button');
            action.type = 'button';
            action.className = 'btn';
            action.textContent = compact ? 'Ürünü İncele' : 'Sepete Ekle';
            if (!compact) {
                action.addEventListener('click', function () {
                    action.disabled = true;
                    addToCart(product.id, 1).then(function (added) {
                        action.textContent = added ? 'Sepete Eklendi ✓' : 'Şu an eklenemiyor';
                        if (!added) action.disabled = false;
                        updateCartBadge();
                        if (added) window.setTimeout(function () {
                            action.textContent = 'Sepete Ekle';
                            action.disabled = false;
                        }, 1400);
                    }).catch(function () {
                        action.textContent = 'Tekrar deneyin';
                        action.disabled = false;
                    });
                });
            } else {
                action.addEventListener('click', function () { window.location.href = 'urunler.html'; });
            }
        } else {
            action = document.createElement('a');
            action.className = 'btn btn-secondary';
            action.href = 'iletisim.html';
            action.textContent = compact ? 'Bilgi Al' : 'Stok Bilgisi Sor';
        }
        content.appendChild(action);
        article.appendChild(content);
        return article;
    }

    function renderFeatured() {
        var target = document.querySelector('[data-featured-products]');
        if (!target) return;
        loadProducts().then(function (products) {
            var featured = products.filter(function (item) { return item.featured; });
            target.replaceChildren();
            featured.forEach(function (product) { target.appendChild(createProductCard(product, true)); });
        }).catch(function () {
            /* HTML içindeki yedek içerik görünür kalır. */
        });
    }

    function renderCatalog() {
        var target = document.getElementById('product-catalog');
        if (!target) return;
        var activeCategory = 'all';
        var searchInput = document.getElementById('product-search');
        var count = document.getElementById('catalog-count');
        var allProducts = [];

        function paint() {
            var query = (searchInput.value || '').trim().toLocaleLowerCase('tr-TR');
            var filtered = allProducts.filter(function (product) {
                var matchesCategory = activeCategory === 'all' || product.category === activeCategory;
                var haystack = (product.name + ' ' + product.description + ' ' + product.category).toLocaleLowerCase('tr-TR');
                return matchesCategory && haystack.indexOf(query) !== -1;
            });
            target.replaceChildren();
            filtered.forEach(function (product) { target.appendChild(createProductCard(product, false)); });
            count.textContent = filtered.length + ' ürün gösteriliyor';
            if (!filtered.length) {
                var empty = document.createElement('p');
                empty.className = 'catalog-empty';
                empty.textContent = 'Bu aramayla eşleşen ürün bulunamadı.';
                target.appendChild(empty);
            }
        }

        loadProducts().then(function (products) {
            allProducts = products;
            paint();
        }).catch(function () {
            count.textContent = 'Ürün bilgileri şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.';
        });

        if (searchInput) searchInput.addEventListener('input', paint);
        document.querySelectorAll('[data-category]').forEach(function (button) {
            button.addEventListener('click', function () {
                activeCategory = button.getAttribute('data-category');
                document.querySelectorAll('[data-category]').forEach(function (chip) {
                    var selected = chip === button;
                    chip.classList.toggle('active', selected);
                    chip.setAttribute('aria-pressed', selected ? 'true' : 'false');
                });
                paint();
            });
        });
    }

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
        loadProducts: loadProducts
    };

    document.addEventListener('DOMContentLoaded', function () {
        updateCartBadge();
        renderFeatured();
        renderCatalog();
    });
})(window, document);
