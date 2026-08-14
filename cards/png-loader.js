// ═══════════════════════════════════════════════════════════
//  PNG TEMPLATE LOADER
//  Fetches active PNG templates from Firestore at startup.
//  Pre-converts each background image URL to a base64 data URL
//  so html2canvas can capture it without any CORS issues.
//
//  Timeout: If Firestore takes > 8s, we proceed without PNG
//  templates (built-in themes still work). The user can
//  trigger a retry via reloadPNGTemplates().
// ═══════════════════════════════════════════════════════════
import { db } from '../config/firebase.js';
import {
    collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const LOAD_TIMEOUT_MS = 8000;

// Module-level cache: id → template object (with bgDataUrl pre-loaded)
const _cache = new Map();
let _loadPromise = null;
let _loadSucceeded = false;

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
    return Array.from(_cache.values()).filter(t => t.isActive !== false && t.exportReady !== false);
}

/** Returns a specific PNG template by ID, or null. */
export function getPNGTemplate(id) {
    return _cache.get(id) || null;
}

/** Force a full reload (used by admin after saving changes, or on retry). */
export async function reloadPNGTemplates() {
    _cache.clear();
    _loadPromise = null;
    _loadSucceeded = false;
    return loadPNGTemplates();
}

/** True if the initial load succeeded (used for retry logic). */
export function pngTemplatesLoaded() {
    return _loadSucceeded;
}

// ── Internal ──────────────────────────────────────────────

async function _doLoad() {
    try {
        // Race Firestore against a hard timeout.
        // On slow connections or Firebase cold-start, this prevents
        // the app from hanging on the loading screen forever.
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Firestore timeout after ${LOAD_TIMEOUT_MS}ms`)), LOAD_TIMEOUT_MS)
        );

        const snap = await Promise.race([
            getDocs(collection(db, 'png_templates')),
            timeoutPromise,
        ]);

        const activeTemplates = [];
        snap.forEach(d => {
            const data = { id: d.id, ...d.data() };
            if (data.isActive !== false) {
                activeTemplates.push(data);
            }
        });

        // Pre-fetch background images as data URLs in parallel.
        // Individual failures are caught per-template, not globally.
        await Promise.all(activeTemplates.map(async (tpl) => {
            tpl.exportReady = Boolean(tpl.bgDataUrl && String(tpl.bgDataUrl).startsWith('data:'));

            if (tpl.bgUrl && !tpl.exportReady) {
                try {
                    tpl.bgDataUrl = await _fetchAsDataURL(tpl.bgUrl);
                    tpl.exportReady = true;
                } catch (err) {
                    console.warn('[PNGLoader] Image fetch failed for', tpl.id, '—', err.message);
                    // Keep bgUrl for preview but exclude from user-facing pool
                    tpl.bgDataUrl  = tpl.bgUrl;
                    tpl.exportReady = false;
                }
            }

            _cache.set(tpl.id, tpl);
        }));

        _loadSucceeded = true;
        console.log('[PNGLoader] ✅ Loaded', _cache.size, 'active PNG templates');

    } catch (e) {
        // Timeout or Firestore error — app continues with built-in themes only.
        // _loadPromise is intentionally left set so callers don't retry automatically;
        // use reloadPNGTemplates() for an explicit retry.
        console.warn('[PNGLoader] ⚠️ PNG template load failed:', e.message);
        console.warn('[PNGLoader] App will use built-in themes only until reload.');
    }
}

/**
 * Fetch a remote image URL and return it as a base64 data URL.
 * data: URLs bypass CORS entirely, which is critical for html2canvas.
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
