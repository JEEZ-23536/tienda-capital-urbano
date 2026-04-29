# Capital Urbano — Tienda Online

## Estructura del proyecto
```
capital-urbano/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── firebase.js     — conexión Firebase + caché offline
│   ├── cloudinary.js   — compresión y subida de imágenes
│   ├── ui.js           — auth, toast, cajón categorías
│   ├── catalog.js      — vista home, categorías, búsqueda, detalle, exportar
│   ├── cart.js         — carrito → WhatsApp
│   └── crud.js         — agregar, editar, borrar, importar CSV
├── LOGO CAPITAL URBANO.jpg   ← copia tu logo aquí
└── README.md
```

---

## Cómo subir a GitHub y publicar con GitHub Pages

### Paso 1 — Preparar la carpeta
Asegúrate de que tu carpeta `capital-urbano/` tenga todos los archivos incluyendo el logo.

### Paso 2 — Subir a tu repositorio
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
git init
git add .
git commit -m "Capital Urbano tienda online"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Cambia `TU_USUARIO` y `TU_REPO` por tu usuario y nombre de repositorio de GitHub.

### Paso 3 — Activar GitHub Pages
1. Ve a tu repositorio en github.com
2. Clic en **Settings** (engrane arriba a la derecha)
3. En el menú izquierdo busca **Pages**
4. En **Source** selecciona **Deploy from a branch**
5. En **Branch** selecciona **main** y carpeta **/ (root)**
6. Clic en **Save**

En 1-2 minutos tu tienda estará en:
```
https://TU_USUARIO.github.io/TU_REPO/
```

### Paso 4 — Actualizar la tienda en el futuro
Cada vez que hagas cambios, solo ejecuta:
```bash
git add .
git commit -m "descripción del cambio"
git push
```
GitHub Pages se actualiza automáticamente.

---

## Reglas de Firestore — copia y pega en Firebase Console → Firestore → Reglas

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{doc} {
      allow read: if true;
      allow write: if request.auth != null
        && (request.auth.token.email == "vicjoelescobar@gmail.com"
         || request.auth.token.email == "caixbaelsa2@gmail.com")
        && request.resource.data.price is number
        && request.resource.data.price >= 0
        && request.resource.data.stock is number
        && request.resource.data.stock >= 0
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0;
    }
    match /categorias/{doc} {
      allow read: if true;
      allow write: if request.auth != null
        && (request.auth.token.email == "vicjoelescobar@gmail.com"
         || request.auth.token.email == "caixbaelsa2@gmail.com");
    }
    match /logs_admin/{doc} {
      allow read, write: if request.auth != null
        && (request.auth.token.email == "vicjoelescobar@gmail.com"
         || request.auth.token.email == "caixbaelsa2@gmail.com");
    }
  }
}
```

---

## Cómo usar el importador CSV con fotos

Formato del CSV (la columna Descripcion y NombreFoto son opcionales):
```
Nombre,Categoria,Talla,Color,Precio,Stock,Descripcion,NombreFoto
Gorra Negra,Gorras,,Negro,150,10,Gorra trucker estilo urbano,gorra_negra.jpg
Playera Blanca,Ropa,M,Blanco,200,1,Playera oversize 100% algodón,playera_blanca.jpg
```

Pasos:
1. Descarga las fotos de Facebook/WhatsApp/Google Photos a tu PC
2. En la tienda (como admin) → Importar CSV
3. Selecciona el CSV → selecciona las fotos
4. El sistema empareja cada fila con su foto y sube todo a Cloudinary

---

## Lo que tiene esta versión

- Vista home con secciones por categoría y scroll horizontal
- Botón "Ver todos" que carga la vista completa de esa categoría
- Carrito de compras que acumula productos y envía todo por WhatsApp
- Buscador que filtra por nombre, categoría, talla, color y descripción
- Campo de descripción en cada producto
- Vista detalle con imagen grande y descripción completa
- Categorías dinámicas sin iconos (texto limpio)
- Importador CSV con subida automática de fotos a Cloudinary
- Exportar catálogo a CSV
- Compresión automática de imágenes
- Imágenes responsive desde Cloudinary
- Caché offline — carga aunque no haya internet
- Dashboard de inventario para el admin
- Borrado en 2 pasos con confirmación
- Log de acciones admin
- Compartir producto con link directo
