// ── CARRITO DE COMPRAS ──
// Acumula productos y envía todo por WhatsApp de una vez

let carrito = []; // [{ id, name, price, size, color, qty, imageUrl }]

function carritoAgregar(id) {
    const item = inventoryData.find(i => i.id === id);
    if (!item || item.stock <= 0) return;

    const existente = carrito.find(c => c.id === id);
    if (existente) {
        existente.qty = Math.min(existente.qty + 1, item.stock);
    } else {
        carrito.push({ id, name: item.name, price: item.price, size: item.size || '', color: item.color || '', qty: 1, imageUrl: item.imageUrl });
    }
    renderCarrito();
    showToast(`🛒 "${item.name}" agregado al carrito`);
}

function carritoQuitar(id) {
    const idx = carrito.findIndex(c => c.id === id);
    if (idx === -1) return;
    if (carrito[idx].qty > 1) { carrito[idx].qty--; }
    else { carrito.splice(idx, 1); }
    renderCarrito();
}

function carritoVaciar() {
    carrito = [];
    renderCarrito();
    document.getElementById('cartModal').style.display = 'none';
}

function renderCarrito() {
    const badge  = document.getElementById('cartBadge');
    const total  = carrito.reduce((s, c) => s + c.qty, 0);
    badge.textContent = total;
    badge.style.display = total > 0 ? 'flex' : 'none';

    const body       = document.getElementById('cartBody');
    const totalPrice = carrito.reduce((s, c) => s + c.price * c.qty, 0);

    if (carrito.length === 0) {
        body.innerHTML = `<div class="cart-empty"><div style="font-size:2.5rem;margin-bottom:10px;">🛒</div><p>Tu carrito está vacío</p></div>`;
        document.getElementById('cartFooter').style.display = 'none';
        return;
    }

    body.innerHTML = carrito.map(c => `
        <div class="cart-item">
            <img src="${cloudinaryUrl(c.imageUrl, 80, 80) || c.imageUrl}"
                 onerror="this.src='https://via.placeholder.com/80x80?text=?'"
                 class="cart-item-img" alt="${c.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${c.name}</div>
                <div class="cart-item-meta">${c.size ? 'Talla: ' + c.size : ''}${c.color ? (c.size ? ' · ' : '') + 'Color: ' + c.color : ''}</div>
                <div class="cart-item-price">$${c.price} c/u</div>
            </div>
            <div class="cart-item-controls">
                <button class="cart-qty-btn" onclick="carritoQuitar('${c.id}')">−</button>
                <span class="cart-qty">${c.qty}</span>
                <button class="cart-qty-btn" onclick="carritoAgregar('${c.id}')">+</button>
            </div>
        </div>
    `).join('');

    document.getElementById('cartTotal').textContent = `$${totalPrice.toLocaleString()}`;
    document.getElementById('cartFooter').style.display = 'block';
}

function carritoEnviarWhatsApp() {
    if (carrito.length === 0) return;

    const lineas = carrito.map(c => {
        const detalles = [c.size ? `Talla: ${c.size}` : '', c.color ? `Color: ${c.color}` : ''].filter(Boolean).join(', ');
        return `• ${c.name}${detalles ? ' (' + detalles + ')' : ''} × ${c.qty} = $${(c.price * c.qty).toLocaleString()}`;
    });

    const total = carrito.reduce((s, c) => s + c.price * c.qty, 0);
    const msg   = `Hola! Me gustaría hacer el siguiente pedido en Capital Urbano:\n\n${lineas.join('\n')}\n\n*Total: $${total.toLocaleString()}*\n\n¿Está disponible?`;

    window.open(`https://wa.me/${miNumeroWhatsApp}?text=${encodeURIComponent(msg)}`, '_blank');
}

function abrirCarrito() {
    renderCarrito();
    document.getElementById('cartModal').style.display = 'flex';
}
