// ── ESTADO GLOBAL ──
let inventoryData  = [];
let filtroActivo   = 'Todos';
let busquedaActiva = '';
let vistaCategoria = null; // null = vista home, string = vista "ver más" de una cat
const miNumeroWhatsApp = "529601366344";

// ── FIRESTORE ──
db.collection("productos").onSnapshot(snap => {
    inventoryData = [];
    snap.forEach(doc => inventoryData.push({ id: doc.id, ...doc.data() }));
    document.getElementById('loadingScreen').style.display = 'none';
    renderCatDrawer();
    renderDashboard();
    renderVista();
});

// ── DASHBOARD ADMIN ──
function renderDashboard() {
    const el = document.getElementById('dashboardPanel');
    if (!el) return;
    const total    = inventoryData.length;
    const agotados = inventoryData.filter(i => i.stock === 0).length;
    const valorTotal = inventoryData.reduce((s, i) => s + (i.price * i.stock), 0);
    const counts = {};
    inventoryData.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });
    const topCat = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    el.innerHTML = `
        <div class="dash-grid">
            <div class="dash-card"><div class="dash-label">Total productos</div><div class="dash-value">${total}</div></div>
            <div class="dash-card ${agotados > 0 ? 'dash-danger' : ''}"><div class="dash-label">Agotados</div><div class="dash-value">${agotados}</div></div>
            <div class="dash-card"><div class="dash-label">Valor inventario</div><div class="dash-value">$${valorTotal.toLocaleString()}</div></div>
            ${topCat ? `<div class="dash-card"><div class="dash-label">Categoría top</div><div class="dash-value" style="font-size:1rem;">${topCat[0]} (${topCat[1]})</div></div>` : ''}
        </div>`;
}

// ── DECIDE QUÉ VISTA MOSTRAR ──
function renderVista() {
    if (busquedaActiva) {
        renderBusqueda();
    } else if (vistaCategoria) {
        renderCategoriaCompleta(vistaCategoria);
    } else {
        renderHome();
    }
}

// ── VISTA HOME — secciones por categoría con scroll horizontal ──
function renderHome() {
    const contenedor = document.getElementById('catalogGrid');
    const empty      = document.getElementById('emptyState');
    const count      = document.getElementById('catalogCount');

    if (inventoryData.length === 0) {
        contenedor.innerHTML = '';
        empty.style.display = 'block';
        count.textContent   = '';
        return;
    }
    empty.style.display = 'none';
    count.textContent   = '';

    // Agrupar por categoría
    const grupos = {};
    inventoryData.forEach(item => {
        if (!grupos[item.category]) grupos[item.category] = [];
        grupos[item.category].push(item);
    });

    // Orden: primero las que tienen más productos
    const cats = Object.keys(grupos).sort((a, b) => grupos[b].length - grupos[a].length);

    contenedor.innerHTML = cats.map(cat => {
        const items    = grupos[cat];
        const hayMas   = items.length > 4;
        const tarjetas = items.slice(0, 8).map(item => renderTarjetaCompacta(item)).join('');

        return `
        <div class="cat-section">
            <div class="cat-section-header">
                <h2 class="cat-section-title">${cat}</h2>
                <div class="cat-section-right">
                    <span class="cat-section-count">${items.length} producto${items.length !== 1 ? 's' : ''}</span>
                    ${hayMas ? `<button class="btn-ver-mas" onclick="verCategoria('${cat}')">Ver todos →</button>` : ''}
                </div>
            </div>
            <div class="scroll-row" id="scroll-${cat.replace(/\s/g,'_')}">
                ${tarjetas}
            </div>
        </div>`;
    }).join('');
}

// ── TARJETA COMPACTA (para scroll horizontal) ──
function renderTarjetaCompacta(item) {
    const ok     = item.stock > 0;
    const imgUrl = cloudinaryUrl(item.imageUrl, 300, 300) || item.imageUrl;
    return `
    <div class="product-card-compact ${ok ? '' : 'agotado'}" onclick="openProductDetail('${item.id}')">
        <div class="compact-img-wrap">
            ${!ok ? '<div class="badge-agotado-compact">AGOTADO</div>' : ''}
            <img src="${imgUrl}" alt="${item.name}" class="img-loading"
                 onload="this.classList.remove('img-loading')"
                 onerror="this.src='https://via.placeholder.com/200x200?text=?';this.classList.remove('img-loading')">
        </div>
        <div class="compact-info">
            <div class="compact-name">${item.name}</div>
            ${item.size  ? `<div class="compact-meta">Talla: ${item.size}</div>`  : ''}
            ${item.color ? `<div class="compact-meta">Color: ${item.color}</div>` : ''}
            <div class="compact-price">$${item.price}</div>
            <button class="compact-cart-btn ${ok ? '' : 'disabled'}"
                    onclick="event.stopPropagation(); ${ok ? `carritoAgregar('${item.id}')` : ''}"
                    ${ok ? '' : 'disabled'}>
                ${ok ? '+ Agregar' : 'Agotado'}
            </button>
        </div>
    </div>`;
}

// ── TARJETA COMPLETA (para vista de categoría) ──
function renderTarjetaCompleta(item) {
    const ok     = item.stock > 0;
    const imgUrl = cloudinaryUrl(item.imageUrl, 400, 400) || item.imageUrl;
    const msjWa  = encodeURIComponent(`Hola, me interesa el producto "${item.name}"${item.size ? ' (Talla: ' + item.size + ')' : ''} ¿Sigue disponible?`);
    return `
    <div class="product-card ${ok ? '' : 'agotado'}" onclick="openProductDetail('${item.id}')">
        <div class="product-image-container">
            ${!ok ? '<div class="badge-agotado">AGOTADO</div>' : ''}
            <img src="${imgUrl}" alt="${item.name}" class="img-loading"
                 onload="this.classList.remove('img-loading')"
                 onerror="this.src='https://via.placeholder.com/250x250?text=?';this.classList.remove('img-loading')">
        </div>
        <div class="product-info">
            <div>
                <h3 class="product-title">${item.name}</h3>
                <p class="product-meta">${item.category}${item.size ? ' · Talla: ' + item.size : ''}${item.color ? ' · ' + item.color : ''}</p>
                ${item.description ? `<p class="product-desc">${item.description}</p>` : ''}
                <div class="product-price">$${item.price}</div>
                <div><span class="stock-badge">Stock: ${item.stock}</span></div>
            </div>
            <div>
                <button class="btn btn-cart ${ok ? '' : 'disabled'}" style="width:100%;margin-top:8px;"
                        onclick="event.stopPropagation(); ${ok ? `carritoAgregar('${item.id}')` : ''}"
                        ${ok ? '' : 'disabled'}>
                    🛒 ${ok ? 'Agregar al carrito' : 'Agotado'}
                </button>
                <a href="https://wa.me/${miNumeroWhatsApp}?text=${msjWa}" target="_blank"
                   style="text-decoration:none;" onclick="event.stopPropagation()">
                    <button class="btn btn-wa" ${ok ? '' : 'disabled'}>${ok ? '💬 Me interesa' : 'Agotado'}</button>
                </a>
                <div class="admin-controls admin-only" onclick="event.stopPropagation()">
                    <button class="btn-sold-card" onclick="reduceStock('${item.id}',${item.stock})" ${ok ? '' : 'disabled'}>Vendido (-1)</button>
                    <button class="btn-delete-card" onclick="confirmDeleteProduct('${item.id}','${item.name.replace(/'/g,"\\'")}')">Borrar</button>
                    <button class="btn-edit-card" onclick="openEditModal('${item.id}')">✏️ Editar</button>
                    <button class="btn-share-card" onclick="compartirProducto('${item.id}','${item.name.replace(/'/g,"\\'")}')">🔗 Compartir</button>
                </div>
            </div>
        </div>
    </div>`;
}

// ── VER TODOS de una categoría ──
function verCategoria(cat) {
    vistaCategoria = cat;
    busquedaActiva = '';
    document.getElementById('searchInput').value = '';
    renderVista();
    renderBreadcrumb(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverHome() {
    vistaCategoria = null;
    busquedaActiva = '';
    filtroActivo   = 'Todos';
    document.getElementById('searchInput').value = '';
    renderBreadcrumb(null);
    renderVista();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderBreadcrumb(cat) {
    const bc = document.getElementById('breadcrumb');
    if (!cat) { bc.style.display = 'none'; return; }
    bc.style.display = 'flex';
    bc.innerHTML = `
        <button class="bc-home" onclick="volverHome()">🏠 Inicio</button>
        <span class="bc-sep">›</span>
        <span class="bc-current">${cat}</span>`;
}

function renderCategoriaCompleta(cat) {
    const contenedor = document.getElementById('catalogGrid');
    const empty      = document.getElementById('emptyState');
    const count      = document.getElementById('catalogCount');
    let data = inventoryData.filter(i => i.category === cat);

    // Aplicar ordenamiento si hay uno seleccionado
    const sortVal = document.getElementById('sortSelect') ? document.getElementById('sortSelect').value : 'default';
    data = aplicarSort(data, sortVal);

    if (data.length === 0) {
        contenedor.innerHTML = ''; empty.style.display = 'block'; count.textContent = ''; return;
    }
    empty.style.display = 'none';
    count.textContent   = `${data.length} producto${data.length !== 1 ? 's' : ''} en ${cat}`;
    contenedor.innerHTML = `<div class="products-grid">${data.map(renderTarjetaCompleta).join('')}</div>`;
}

// ── BÚSQUEDA ──
function filterData() {
    busquedaActiva = document.getElementById('searchInput').value.toLowerCase().trim();
    vistaCategoria = null;
    renderBreadcrumb(null);
    renderVista();
}

function renderBusqueda() {
    const contenedor = document.getElementById('catalogGrid');
    const empty      = document.getElementById('emptyState');
    const count      = document.getElementById('catalogCount');

    const data = inventoryData.filter(i =>
        i.name.toLowerCase().includes(busquedaActiva) ||
        i.category.toLowerCase().includes(busquedaActiva) ||
        (i.color && i.color.toLowerCase().includes(busquedaActiva)) ||
        (i.size  && i.size.toLowerCase().includes(busquedaActiva)) ||
        (i.description && i.description.toLowerCase().includes(busquedaActiva))
    );

    if (data.length === 0) {
        contenedor.innerHTML = `<div class="search-no-results"><p>No se encontraron productos para "<strong>${busquedaActiva}</strong>"</p><button class="btn-ver-mas" onclick="volverHome()">← Ver todos los productos</button></div>`;
        empty.style.display = 'none';
        count.textContent   = '';
        return;
    }
    empty.style.display = 'none';
    count.textContent   = `${data.length} resultado${data.length !== 1 ? 's' : ''} para "${busquedaActiva}"`;
    contenedor.innerHTML = `<div class="products-grid">${data.map(renderTarjetaCompleta).join('')}</div>`;
}

// ── ORDENAMIENTO ──
function aplicarSort(data, criterio) {
    const d = [...data];
    if (criterio === 'precio-asc')  d.sort((a, b) => a.price - b.price);
    if (criterio === 'precio-desc') d.sort((a, b) => b.price - a.price);
    if (criterio === 'nombre-az')   d.sort((a, b) => a.name.localeCompare(b.name));
    return d;
}

function sortCatalog(val) { renderVista(); }

// ── FILTRO DESDE CAJÓN ──
function setFilter(cat) {
    if (cat === 'Todos') { volverHome(); return; }
    verCategoria(cat);
    closeCatDrawer();
}

// ── VISTA DETALLE DEL PRODUCTO ──
function openProductDetail(id) {
    const item = inventoryData.find(i => i.id === id);
    if (!item) return;
    const ok     = item.stock > 0;
    const imgUrl = cloudinaryUrl(item.imageUrl, 600, 600) || item.imageUrl;
    const msjWa  = encodeURIComponent(`Hola, me interesa el producto "${item.name}"${item.size ? ' (Talla: ' + item.size + ')' : ''} ¿Sigue disponible?`);

    document.getElementById('productDetailContent').innerHTML = `
        <div class="detail-img-wrap">
            <img src="${imgUrl}" alt="${item.name}"
                 onerror="this.src='https://via.placeholder.com/400x400?text=Sin+imagen'">
        </div>
        <div class="detail-info">
            <div class="detail-cat-tag">${item.category}</div>
            <h2 class="detail-title">${item.name}</h2>
            <p class="detail-meta">${item.size ? 'Talla: ' + item.size : ''}${item.size && item.color ? ' · ' : ''}${item.color ? 'Color: ' + item.color : ''}</p>
            ${item.description ? `<p class="detail-description">${item.description}</p>` : ''}
            <div class="detail-price">$${item.price}</div>
            <div class="detail-stock ${!ok ? 'agotado-text' : ''}">
                ${ok ? `✅ Disponible · ${item.stock} unidad${item.stock !== 1 ? 'es' : ''}` : '❌ Agotado'}
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
                <button class="btn btn-cart" style="font-size:1rem;padding:14px;"
                        onclick="carritoAgregar('${item.id}')" ${ok ? '' : 'disabled'}>
                    🛒 ${ok ? 'Agregar al carrito' : 'Agotado'}
                </button>
                <a href="https://wa.me/${miNumeroWhatsApp}?text=${msjWa}" target="_blank" style="text-decoration:none;">
                    <button class="btn btn-wa" style="font-size:1rem;padding:14px;" ${ok ? '' : 'disabled'}>
                        💬 Preguntar por WhatsApp
                    </button>
                </a>
                <button class="btn-share-detail" onclick="compartirProducto('${item.id}','${item.name.replace(/'/g,"\\'")}')">
                    🔗 Compartir este producto
                </button>
            </div>
        </div>`;
    document.getElementById('productDetailModal').style.display = 'flex';
}

// ── COMPARTIR ──
function compartirProducto(id, nombre) {
    const url = `${window.location.href.split('?')[0]}?producto=${id}`;
    if (navigator.share) {
        navigator.share({ title: nombre, url }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url)
            .then(() => showToast("🔗 Link copiado"))
            .catch(() => {
                const ta = document.createElement('textarea');
                ta.value = url; document.body.appendChild(ta); ta.select();
                document.execCommand('copy'); document.body.removeChild(ta);
                showToast("🔗 Link copiado");
            });
    }
}

// Abrir producto desde URL
window.addEventListener('load', () => {
    const pid = new URLSearchParams(window.location.search).get('producto');
    if (pid) {
        const unsub = db.collection("productos").onSnapshot(snap => {
            if (snap.docs.find(d => d.id === pid)) { openProductDetail(pid); unsub(); }
        });
    }
});

// ── EXPORTAR CSV ──
function exportarCSV() {
    if (!inventoryData.length) { showToast("No hay productos para exportar", 'error'); return; }
    const headers = ['Nombre','Categoria','Talla','Color','Precio','Stock','Descripcion','ImagenURL'];
    const rows    = inventoryData.map(i => [
        `"${(i.name        || '').replace(/"/g,'""')}"`,
        `"${(i.category    || '').replace(/"/g,'""')}"`,
        `"${(i.size        || '').replace(/"/g,'""')}"`,
        `"${(i.color       || '').replace(/"/g,'""')}"`,
        i.price, i.stock,
        `"${(i.description || '').replace(/"/g,'""')}"`,
        `"${(i.imageUrl    || '').replace(/"/g,'""')}"`
    ]);
    const csv  = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a    = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `catalogo_${new Date().toISOString().slice(0,10)}.csv` });
    a.click(); URL.revokeObjectURL(a.href);
    showToast(`✅ CSV exportado con ${inventoryData.length} productos`);
}
