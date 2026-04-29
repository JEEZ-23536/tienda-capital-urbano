const CLOUDINARY_CLOUD  = "dk4lk9cqb";
const CLOUDINARY_PRESET = "capital_urbano";

function comprimirImagen(file, maxPx = 800, calidad = 0.80) {
    return new Promise(resolve => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            let { width, height } = img;
            if (width > maxPx || height > maxPx) {
                if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
                else { width = Math.round(width * maxPx / height); height = maxPx; }
            }
            const c = document.createElement('canvas');
            c.width = width; c.height = height;
            c.getContext('2d').drawImage(img, 0, 0, width, height);
            c.toBlob(blob => { URL.revokeObjectURL(url); resolve(blob); }, 'image/jpeg', calidad);
        };
        img.src = url;
    });
}

function subirACloudinary(file, onProgress) {
    return new Promise(async (resolve, reject) => {
        try {
            const blob = await comprimirImagen(file);
            const fd   = new FormData();
            fd.append('file', blob, 'imagen.jpg');
            fd.append('upload_preset', CLOUDINARY_PRESET);
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`);
            xhr.upload.onprogress = e => { if (e.lengthComputable && onProgress) onProgress(Math.round(e.loaded / e.total * 100)); };
            xhr.onload  = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText).secure_url) : reject(new Error("Cloudinary " + xhr.status));
            xhr.onerror = () => reject(new Error("Error de red"));
            xhr.send(fd);
        } catch (e) { reject(e); }
    });
}

function cloudinaryUrl(url, w, h) {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);
}
