// ── TOAST ──
function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 350); }, 3200);
}

// ── AUTH ──
const ADMINS = ["vicjoelescobar@gmail.com", "caixbaelsa2@gmail.com"].map(e => e.toLowerCase());
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
auth.onAuthStateChanged(user => {
    if (user && ADMINS.includes(user.email.toLowerCase())) {
        document.body.classList.add('modo-admin');
        document.getElementById('loginModal').style.display = 'none';
        showToast(`Bienvenido, ${user.displayName || user.email.split('@')[0]} 👋`);
    } else {
        document.body.classList.remove('modo-admin');
    }
    renderCatDrawer();
    renderDashboard();
});
function loginAdmin1() { auth.signInWithEmailAndPassword("vicjoelescobar@gmail.com", prompt("Contraseña:")).catch(() => showToast("Contraseña incorrecta", 'error')); }
function loginAdmin2() { auth.signInWithEmailAndPassword("caixbaelsa2@gmail.com",   prompt("Contraseña:")).catch(() => showToast("Contraseña incorrecta", 'error')); }
function loginGoogle() {
    const p = new firebase.auth.GoogleAuthProvider();
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? auth.signInWithRedirect(p)
        : auth.signInWithPopup(p).catch(e => showToast("Error: " + e.message, 'error'));
}
function cerrarSesion() { auth.signOut().then(() => showToast("Sesión cerrada")); }

// ── PANEL ──
function togglePanel(id) {
    const p = document.getElementById(id);
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
}

// ── CATEGORÍAS — sin iconos ──
let categorias = [];

function renderCatDrawer() {
    const body      = document.getElementById('catDrawerBody');
    const listAdmin = document.getElementById('catListAdmin');
    const pCatSel   = document.getElementById('pCat');
    const eCatSel   = document.getElementById('eCat');
    if (!body) return;

    const counts = {};
    inventoryData.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });

    body.innerHTML =
        `<div class="cat-item ${filtroActivo === 'Todos' ? 'active' : ''}" onclick="setFilter('Todos');closeCatDrawer();">
            <span class="cat-label">Todos los productos</span>
            <span class="cat-count">${inventoryData.length}</span>
         </div>` +
        categorias.map(cat =>
            `<div class="cat-item ${filtroActivo === cat ? 'active' : ''}" onclick="setFilter('${cat}');closeCatDrawer();">
                <span class="cat-label">${cat}</span>
                <span class="cat-count">${counts[cat] || 0}</span>
             </div>`
        ).join('');

    if (listAdmin) {
        listAdmin.innerHTML = categorias.map(cat =>
            `<div class="cat-admin-item">
                <span>${cat}</span>
                <button class="cat-del-btn" onclick="deleteCategoria('${cat}')">🗑</button>
             </div>`
        ).join('');
    }

    const opts = categorias.map(c => `<option value="${c}">${c}</option>`).join('');
    if (pCatSel) pCatSel.innerHTML = opts;
    if (eCatSel) eCatSel.innerHTML = opts;
}

function openCatDrawer()  { document.getElementById('catDrawer').classList.add('open'); document.getElementById('catOverlay').classList.add('open'); }
function closeCatDrawer() { document.getElementById('catDrawer').classList.remove('open'); document.getElementById('catOverlay').classList.remove('open'); }

db.collection("categorias").orderBy("nombre").onSnapshot(snap => {
    categorias = snap.empty ? ["Ropa","Audífonos","Accesorios"] : snap.docs.map(d => d.data().nombre);
    renderCatDrawer();
}, () => { categorias = ["Ropa","Audífonos","Accesorios"]; renderCatDrawer(); });

function addCategoria() {
    const input = document.getElementById('newCatInput');
    const nombre = input.value.trim();
    if (!nombre) return;
    if (categorias.includes(nombre)) { showToast("Esa categoría ya existe", 'error'); return; }
    db.collection("categorias").add({ nombre })
        .then(() => { input.value = ''; showToast(`✅ "${nombre}" agregada`); })
        .catch(e => showToast("Error: " + e.message, 'error'));
}
function deleteCategoria(nombre) {
    if (!confirm(`¿Eliminar la categoría "${nombre}"?`)) return;
    db.collection("categorias").where("nombre","==",nombre).get()
        .then(snap => { const b = db.batch(); snap.forEach(d => b.delete(d.ref)); return b.commit(); })
        .then(() => showToast(`🗑️ "${nombre}" eliminada`))
        .catch(e => showToast("Error: " + e.message, 'error'));
}

function verificarCategoria() {
    document.getElementById('sizeContainer').style.display =
        document.getElementById('pCat').value === "Ropa" ? "block" : "none";
}
function verificarCategoriaEdit() {
    document.getElementById('eSizeContainer').style.display =
        document.getElementById('eCat').value === "Ropa" ? "block" : "none";
}
