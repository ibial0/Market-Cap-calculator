/**
 * Convert a user-selected image into a small, browser-safe data URL.
 * Keeping token logos compact prevents a large phone photo from exhausting
 * html2canvas memory while a trading card is being rendered.
 */
export async function compressImageFile(file, { maxSize = 256, quality = 0.86 } = {}) {
    if (!(file instanceof Blob) || !file.type.startsWith('image/')) {
        throw new Error('Please choose a valid image file.');
    }

    const source = await readFileAsDataUrl(file);
    const image = await loadImage(source);
    const longestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const scale = Math.min(1, maxSize / Math.max(1, longestSide));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not process this image.');

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read the image file.'));
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Could not open this image file.'));
        image.src = src;
    });
}
