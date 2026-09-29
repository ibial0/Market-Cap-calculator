/**
 * Convert a user-selected logo into a small, browser-safe PNG data URL.
 * Keeping logos compact prevents a large phone photo from exhausting
 * html2canvas memory while a trading card is being rendered.
 */
export async function compressImageFile(file, { maxSize = 256, removeBackground = true } = {}) {
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
    if (removeBackground) removeEdgeConnectedBackground(context, width, height);

    // PNG preserves existing transparency and the transparent pixels removed
    // from a plain black/white/solid-colour logo background.
    return canvas.toDataURL('image/png');
}

/**
 * Makes a flat background transparent without touching same-colour artwork
 * surrounded by it. Only pixels connected to an image edge are removed, so a
 * black mark inside a logo remains intact while a black square behind it goes.
 */
function removeEdgeConnectedBackground(context, width, height) {
    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;
    const corners = [0, width - 1, (height - 1) * width, height * width - 1]
        .map(index => [data[index * 4], data[index * 4 + 1], data[index * 4 + 2], data[index * 4 + 3]]);

    // Transparent or strongly different corners indicate a real image/photo,
    // not a single flat background. Leave those images exactly as uploaded.
    if (corners.some(([, , , alpha]) => alpha < 245)) return;
    const background = [0, 1, 2].map(channel => Math.round(corners.reduce((sum, pixel) => sum + pixel[channel], 0) / corners.length));
    const cornerVariation = Math.max(...corners.map(pixel => colorDistance(pixel, background)));
    if (cornerVariation > 52) return;

    const tolerance = 58;
    const visited = new Uint8Array(width * height);
    const queue = [];
    const enqueue = (x, y) => {
        const index = y * width + x;
        if (visited[index]) return;
        visited[index] = 1;
        const offset = index * 4;
        if (data[offset + 3] > 0 && colorDistance([data[offset], data[offset + 1], data[offset + 2]], background) <= tolerance) {
            queue.push(index);
        }
    };

    for (let x = 0; x < width; x++) { enqueue(x, 0); enqueue(x, height - 1); }
    for (let y = 1; y < height - 1; y++) { enqueue(0, y); enqueue(width - 1, y); }

    let removed = 0;
    for (let cursor = 0; cursor < queue.length; cursor++) {
        const index = queue[cursor];
        const offset = index * 4;
        data[offset + 3] = 0;
        removed++;
        const x = index % width;
        const y = Math.floor(index / width);
        if (x > 0) enqueue(x - 1, y);
        if (x < width - 1) enqueue(x + 1, y);
        if (y > 0) enqueue(x, y - 1);
        if (y < height - 1) enqueue(x, y + 1);
    }

    // Never erase an entire image just because it is a solid-colour token.
    if (removed < width * height * 0.94) context.putImageData(imageData, 0, 0);
}

function colorDistance(a, b) {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
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
