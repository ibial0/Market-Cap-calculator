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
    // Only offer templates that have an export-safe source to the card engine.
    // A remote image that refuses CORS may display in a browser, but html2canvas
    // cannot reliably export it (especially on mobile) and produces black cards.
    return Array.from(_cache.values()).filter(t => t.isActive !== false && t.exportReady !== false);
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
            tpl.exportReady = Boolean(tpl.bgDataUrl && String(tpl.bgDataUrl).startsWith('data:'));
            // Case 1: External URL (Imgur, imgBB, etc.) — fetch and convert to data URL
            if (tpl.bgUrl) {
                try {
                    tpl.bgDataUrl = await _fetchAsDataURL(tpl.bgUrl);
                    tpl.exportReady = true;
                } catch (err) {
                    console.warn('[PNGLoader] Excluding export-unsafe image for', tpl.id, err.message);
                    // Keep the URL for the admin/editor preview, but do not let this
                    // template enter the user-facing random pool until it is hosted
                    // with CORS support or saved as a data URL.
                    tpl.bgDataUrl = tpl.bgUrl;
                    tpl.exportReady = false;
                }
            }
            // Case 2: bgDataUrl already stored in Firestore (local file upload) — ready to use
            // No action needed, bgDataUrl is already set from Firestore data.

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
