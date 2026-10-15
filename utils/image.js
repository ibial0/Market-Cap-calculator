/**
 * Convert a user-selected logo into a small, browser-safe PNG data URL.
 * Keeping logos compact prevents a large phone photo from exhausting
 * html2canvas memory while a trading card is being rendered. The source
 * pixels are never colour-keyed: a token coin's own coloured backdrop is a
 * part of its logo and must be preserved.
 */
export async function compressImageFile(file, { maxSize = 256 } = {}) {
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

    // PNG preserves transparency supplied by the original image. The UI uses
    // a circle mask; it does not remove any colour from the actual token logo.
    return canvas.toDataURL('image/png');
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
