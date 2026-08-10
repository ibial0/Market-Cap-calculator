// ═══════════════════════════════════════════════════════════
//  PNG TEMPLATE LOADER
//  Fetches active PNG templates from Firestore at startup.
//  Pre-converts each background image URL to a base64 data URL
//  so html2canvas can capture it without any CORS issues.
// ═══════════════════════════════════════════════════════════
import { db } from '../config/firebase.js';
import {
    collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Module-level cache: id → template object (with bgDataUrl pre-loaded)
const _cache = new Map();
let _loadPromise = null;

// ── Public API ────────────────────────────────────────────

/** Call once at app startup. Loads and caches all active PNG templates. */
export async function loadPNGTemplates() {
    // Deduplicate concurrent calls
    if (_loadPromise) return _loadPromise;
    _loadPromise = _doLoad();
    return _loadPromise;
}

/** Returns array of all currently active PNG templates (already cached). */
export function getActivePNGTemplates() {
    return Array.from(_cache.values()).filter(t => t.isActive !== false);
}

/** Returns a specific PNG template by ID, or null. */
export function getPNGTemplate(id) {
    return _cache.get(id) || null;
}

/** Force a full reload (used by admin after saving changes). */
export async function reloadPNGTemplates() {
    _cache.clear();
    _loadPromise = null;
    return loadPNGTemplates();
}

// ── Internal ──────────────────────────────────────────────

async function _doLoad() {
    try {
        const snap = await getDocs(collection(db, 'png_templates'));
        const activeTemplates = [];
        snap.forEach(d => {
            const data = { id: d.id, ...d.data() };
            if (data.isActive !== false) {
                activeTemplates.push(data);
            }
        });

        // Pre-fetch background images as data URLs in parallel
        await Promise.all(activeTemplates.map(async (tpl) => {
            if (tpl.bgUrl) {
                try {
                    tpl.bgDataUrl = await _fetchAsDataURL(tpl.bgUrl);
                } catch (err) {
                    console.warn('[PNGLoader] CORS fetch failed for', tpl.id, '— using URL directly');
                    // Fall back: the <img> tag will still load it visually,
                    // html2canvas may or may not capture it depending on CORS headers
                    tpl.bgDataUrl = tpl.bgUrl;
                }
            }
            _cache.set(tpl.id, tpl);
        }));

        console.log('[PNGLoader] Loaded', _cache.size, 'active PNG templates');
    } catch (e) {
        console.error('[PNGLoader] Failed to load PNG templates:', e);
    }
}

/**
 * Fetch a remote image URL and return it as a base64 data URL.
 * This is critical for html2canvas — data URLs bypass CORS entirely.
 */
async function _fetchAsDataURL(url) {
    const resp = await fetch(url, { mode: 'cors', cache: 'force-cache' });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
    });
}
