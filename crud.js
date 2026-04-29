// ── PREVIEW IMAGEN (compatible móvil) ──
document.addEventListener('DOMContentLoaded', () => {
    const fi = document.getElementById('pImageFile');
    if (fi) {
        fi.addEventListener('change', function () {
            const file = this.files && this.files[0];
            if (!file) return;
            document.getElementById('pFileName').textContent = file.name;
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('pPreviewImg').src = e.target.result;
                document.getElementById('pPreviewWrap').style.display = 'block';
                document.getElementById('pPreviewLabel').textContent =
                    `Original: ${(file.size / 1024).toFixed(0)} KB — se comprimirá`;
            };
            reader.readAsDataURL(file);
        });
    }
});

// ── AGREGAR PRODUCTO ──
async function addProduct() {
    const name        = document.getElementById('pName').value.trim();
    const category    = document.getElementById('pCat').value;
    const size        = document.getElementById('pSize').value.trim();
    const color       = document.getElementById('pColor').value.trim();
    const price       = document.getElementById('pPrice').value;
    const stock       = document.getElementById('pStock').value;
    const description = document.getElementById('pDesc').value.trim();
    const fileInput   = document.getElementById('pImageFile');
    const urlInput    = document.getElementById('pImageUrl').value.trim();

    if (!name || !price || !stock) { showToast("Nombre, Precio y Stock son obligatorios.", 'error'); return; }
    if (isNaN(price) || parseFloat(price) < 0) { showToast("Precio inválido.", 'error'); return; }
    if (isNaN(stock) || parseInt(stock)  < 0) { showToast("Stock inválido.", 'error'); return; }

    const btn = document.getElementById('btnGuardar');
    btn.disabled = true; btn.innerText = "⏳ Guardando...";
    let finalImageUrl = urlInput || "https://via.placeholder.com/250x250?text=Capital+Urbano";

    try {
        const file = fileInput.files && fileInput.files[0];
        if (file) {
            const pw = document.getElementById('uploadProgressWrap');
            const pb = document.getElementById('uploadProgressBar');
            const pl = document.getElementById('uploadProgressLabel');
            pw.style.display = 'block'; pl.style.display = 'block'; pb.style.width = '0%';
            finalImageUrl = await subirACloudinary(file, pct => {
                pb.style.width = pct + '%';
                pl.textContent = `Subiendo imagen... ${pct}%`;
            });
            pw.style.display = 'none'; pl.style.display = 'none';
        }

        await db.collection("productos").add({
            name, category, size, color, description,
            price: parseFloat(price), stock: parseInt(stock),
            imageUrl: finalImageUrl,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        logAdminAction('crear', name);
        document.querySelectorAll('#adminPanel input[type=text], #adminPanel input[type=number], #adminPanel textarea').forEach(i => i.value = '');
        document.getElementById('pFileName').textContent = 'Sin archivo seleccionado';
        document.getElementById('pPreviewWrap').style.display = 'none';
        togglePanel('adminPanel');
        showToast("✅ Producto publicado");

    } catch (err) {
        console.error(err);
        showToast("Error: " + err.message, 'error');
    } finally {
        btn.disabled = false; btn.innerText = "🚀 Publicar en Tienda";
    }
}

// ── BORRADO EN 2 PASOS ──
function confirmDeleteProduct(id, nombre) {
    document.getElementById('deleteProductName').textContent = nombre;
    document.getElementById('deleteConfirmInput').value = '';
    document.getElementById('deleteProductId').value = id;
    document.getElementById('deleteConfirmModal').style.display = 'flex';
}
function executeDelete() {
    const id    = document.getElementById('deleteProductId').value;
    const input = document.getElementById('deleteConfirmInput').value.trim().toUpperCase();
    if (input !== 'BORRAR') { showToast('Escribe BORRAR para confirmar', 'error'); return; }
    const item  = inventoryData.find(i => i.id === id);
    db.collection("productos").doc(id).delete()
        .then(() => {
            logAdminAction('borrar', item ? item.name : id);
            document.getElementById('deleteConfirmModal').style.display = 'none';
            showToast("🗑️ Producto eliminado");
        })
        .catch(e => showToast("Error: " + e.message, 'error'));
}

// ── STOCK ──
function reduceStock(id, s) {
    if (s <= 0) return;
    const item = inventoryData.find(i => i.id === id);
    db.collection("productos").doc(id).update({ stock: s - 1 })
        .then(() => { logAdminAction('vendido', item ? item.name : id); showToast("📦 Stock actualizado"); })
        .catch(e => showToast("Error: " + e.message, 'error'));
}

// ── EDITAR PRODUCTO ──
let currentEditId = null;

function openEditModal(id) {
    const item = inventoryData.find(i => i.id === id);
    if (!item) return;
    currentEditId = id;
    document.getElementById('eName').value        = item.name;
    document.getElementById('eCat').value         = item.category;
    verificarCategoriaEdit();
    document.getElementById('eSize').value        = item.size        || '';
    document.getElementById('eColor').value       = item.color       || '';
    document.getElementById('ePrice').value       = item.price;
    document.getElementById('eStock').value       = item.stock;
    document.getElementById('eDesc').value        = item.description || '';
    document.getElementById('eImageUrl').value    = item.imageUrl    || '';
    const pw = document.getElementById('ePreviewWrap');
    const pi = document.getElementById('ePreviewImg');
    if (item.imageUrl && !item.imageUrl.includes('placeholder')) {
        pi.src = cloudinaryUrl(item.imageUrl, 300, 300) || item.imageUrl;
        pw.style.display = 'block';
    } else { pw.style.display = 'none'; }
    document.getElementById('editModal').style.display = 'flex';
}

function saveEdit() {
    if (!currentEditId) return;
    const item     = inventoryData.find(i => i.id === currentEditId);
    const nuevaUrl = document.getElementById('eImageUrl').value.trim();
    const newPrice = parseFloat(document.getElementById('ePrice').value);
    const newStock = parseInt(document.getElementById('eStock').value);
    if (isNaN(newPrice) || newPrice < 0) { showToast("Precio inválido", 'error'); return; }
    if (isNaN(newStock) || newStock < 0) { showToast("Stock inválido",  'error'); return; }

    db.collection("productos").doc(currentEditId).update({
        name:        document.getElementById('eName').value,
        category:    document.getElementById('eCat').value,
        size:        document.getElementById('eSize').value,
        color:       document.getElementById('eColor').value,
        description: document.getElementById('eDesc').value,
        price:       newPrice,
        stock:       newStock,
        imageUrl:    nuevaUrl || (item ? item.imageUrl : "https://via.placeholder.com/250x250?text=Capital+Urbano")
    }).then(() => {
        logAdminAction('editar', document.getElementById('eName').value);
        document.getElementById('editModal').style.display = 'none';
        currentEditId = null;
        showToast("✏️ Producto actualizado");
    }).catch(e => showToast("Error: " + e.message, 'error'));
}

// ── LOG DE ACCIONES ADMIN ──
function logAdminAction(accion, producto) {
    const user = auth.currentUser;
    if (!user) return;
    db.collection("logs_admin").add({
        accion, producto, admin: user.email,
        fecha: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});
}

// ── IMPORTADOR CSV CON FOTOS ──
let csvFotosMap = {};
document.addEventListener('DOMContentLoaded', () => {
    const fi = document.getElementById('csvFotosInput');
    if (fi) {
        fi.addEventListener('change', function () {
            csvFotosMap = {};
            Array.from(this.files).forEach(f => {
                csvFotosMap[f.name]             = f;
                csvFotosMap[f.name.toLowerCase()] = f;
            });
            document.getElementById('csvFotosLabel').textContent =
                this.files.length > 0
                    ? `${this.files.length} foto${this.files.length !== 1 ? 's' : ''} seleccionada${this.files.length !== 1 ? 's' : ''}`
                    : 'Sin fotos seleccionadas';
        });
    }
});

async function uploadCSV() {
    const file = document.getElementById('csvFile').files[0];
    if (!file) { showToast("Selecciona un archivo CSV.", 'error'); return; }

    const btn = document.getElementById('btnCsvUpload');
    btn.disabled = true; btn.textContent = "⏳ Procesando...";
    const pw = document.getElementById('csvProgressWrap');
    const pb = document.getElementById('csvProgressBar');
    const pl = document.getElementById('csvProgressLabel');

    function parseRow(row) {
        const cols = []; let cur = '', inQ = false;
        for (const ch of row) {
            if (ch === '"') { inQ = !inQ; }
            else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
            else { cur += ch; }
        }
        cols.push(cur.trim());
        return cols;
    }

    try {
        const rows    = (await file.text()).split('\n').filter(r => r.trim());
        const prods   = [];
        for (let i = 1; i < rows.length; i++) {
            const c = parseRow(rows[i]);
            if (c.length >= 6) {
                prods.push({
                    name: c[0]||'', category: c[1]||'', size: c[2]||'',
                    color: c[3]||'', price: parseFloat(c[4])||0,
                    stock: parseInt(c[5])||0, description: c[6]||'',
                    imagenRef: c[7] ? c[7].trim() : ''
                });
            }
        }
        if (!prods.length) { showToast("No se encontraron productos.", 'error'); return; }

        pw.style.display = 'block';
        const batch = db.batch();
        let procesados = 0;

        for (const prod of prods) {
            let imageUrl = "https://via.placeholder.com/250x250?text=Capital+Urbano";
            if (prod.imagenRef) {
                const local = csvFotosMap[prod.imagenRef] || csvFotosMap[prod.imagenRef.toLowerCase()];
                if (local) {
                    try { imageUrl = await subirACloudinary(local, null); } catch (e) { console.warn(e); }
                } else if (prod.imagenRef.startsWith('http')) {
                    imageUrl = prod.imagenRef;
                }
            }
            batch.set(db.collection("productos").doc(), {
                name: prod.name, category: prod.category, size: prod.size,
                color: prod.color, description: prod.description,
                price: prod.price, stock: prod.stock, imageUrl
            });
            procesados++;
            pb.style.width  = Math.round(procesados / prods.length * 100) + '%';
            pl.textContent  = `Procesando ${procesados} de ${prods.length}...`;
        }

        await batch.commit();
        logAdminAction('importar_csv', `${procesados} productos`);
        showToast(`✅ ${procesados} productos importados`);
        togglePanel('csvPanel');
        document.getElementById('csvFile').value        = '';
        document.getElementById('csvFotosInput').value  = '';
        document.getElementById('csvFotosLabel').textContent = 'Sin fotos seleccionadas';
        csvFotosMap = {};

    } catch (err) {
        console.error(err);
        showToast("Error CSV: " + err.message, 'error');
    } finally {
        btn.disabled = false; btn.textContent = "Importar productos";
        pw.style.display = 'none'; pl.textContent = '';
    }
}
