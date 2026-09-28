// ═══════════════════════════════════════════════════════════
//  BACKGROUND IMAGE LOADER
//  Fetches admin-uploaded background images from Firestore
//  collection 'card_backgrounds' at startup.
//  Pre-converts each image URL to a base64 data URL for
//  html2canvas CORS compatibility.
//
//  Anti-Repeat Queue:
//    Shuffled rotation — cycles through all backgrounds
//    before any repeat. Never shows the same background
//    twice in a row (for pool ≥ 2).
// ═══════════════════════════════════════════════════════════
import { db } from '../config/firebase.js';
import {
    collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const LOAD_TIMEOUT_MS = 8000;

// Module-level state
const _cache = [];          // Array of { id, imageUrl, dataUrl, isActive, ... }
let _loadPromise = null;
let _loaded = false;
let _shuffled = [];         // Shuffled index array
let _queueIdx = 0;          // Current position in shuffled queue
let _lastShownId = null;    // Last shown background ID (anti-repeat)

// ── Public API ────────────────────────────────────────────

/** Load all active backgrounds from Firestore. Call once at startup. */
export async function loadBackgrounds() {
    if (_loadPromise) return _loadPromise;
    _loadPromise = _doLoad();
    return _loadPromise;
}

/**
 * Get the next background from the shuffled queue.
 * Avoids showing the same background consecutively.
 * @returns {{ id:string, dataUrl:string, imageUrl:string }|null}
 */
export function getNextBackground() {
    if (_cache.length === 0) return null;

    if (_queueIdx >= _shuffled.length) {
        _reshuffle();
    }

    const bg = _cache[_shuffled[_queueIdx]];
    _queueIdx++;
    _lastShownId = bg?.id || null;
    return bg || null;
}

/**
 * Get a random background filtered by emotion category.
 * Falls back to any background if none match the emotion.
 * @param {string} emotionId - Emotion category ID (e.g. 'legendary', 'rekt')
 * @returns {{ id:string, dataUrl:string, imageUrl:string, emotion:string }|null}
 */
export function getNextBackgroundByEmotion(emotionId) {
    if (_cache.length === 0) return null;

    // Filter by emotion
    const filtered = _cache.filter(bg => bg.emotion === emotionId);

    if (filtered.length === 0) {
        // Fallback: return any background
        return getNextBackground();
    }

    if (filtered.length === 1) {
        _lastShownId = filtered[0].id;
        return filtered[0];
    }

    // Pick random from filtered, avoid last shown
    let pool = filtered.filter(bg => bg.id !== _lastShownId);
    if (pool.length === 0) pool = filtered;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    _lastShownId = pick.id;
    return pick;
}

/**
 * Check if there are more backgrounds to show (different from current).
 * Used to decide whether to show "Change Background" or "No more available".
 * @param {string|null} currentBgId - ID of the currently displayed background
 * @returns {boolean}
 */
export function hasMoreBackgrounds(currentBgId) {
    if (_cache.length === 0) return false;
    if (_cache.length === 1) return _cache[0].id !== currentBgId;
    return true;
}

/** Returns the total number of available backgrounds. */
export function getBackgroundCount() {
    return _cache.length;
}

/** True if the initial load has completed (success or failure). */
export function backgroundsLoaded() {
    return _loaded;
}

/** Force reload (used after admin uploads new backgrounds). */
export async function reloadBackgrounds() {
    _cache.length = 0;
    _shuffled.length = 0;
    _queueIdx = 0;
    _lastShownId = null;
    _loaded = false;
    _loadPromise = null;
    return loadBackgrounds();
}

// ── Internal ──────────────────────────────────────────────

async function _doLoad() {
    try {
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Firestore timeout after ${LOAD_TIMEOUT_MS}ms`)), LOAD_TIMEOUT_MS)
        );

        const snap = await Promise.race([
            getDocs(collection(db, 'card_backgrounds')),
            timeoutPromise,
        ]);

        const items = [];
        snap.forEach(d => {
            const data = { id: d.id, ...d.data() };
            if (data.isActive !== false) items.push(data);
        });

        // Process images — if already a data URL (base64), use directly;
        // otherwise fetch as blob (backward compatibility with remote URLs)
        await Promise.all(items.map(async (bg) => {
            const url = bg.imageUrl || bg.bgUrl || '';
            if (!url) return;

            if (url.startsWith('data:')) {
                // Already a data URL (stored directly in Firestore)
                bg.dataUrl = url;
            } else {
                // Remote URL — fetch as blob and convert
                try {
                    const resp = await fetch(url, { mode: 'cors', cache: 'force-cache' });
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    const blob = await resp.blob();
                    bg.dataUrl = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = () => reject(new Error('FileReader error'));
                        reader.readAsDataURL(blob);
                    });
                } catch (err) {
                    console.warn('[BgLoader] Image fetch failed for', bg.id, '—', err.message);
                    bg.dataUrl = url;
                }
            }

            _cache.push(bg);
        }));

        _reshuffle();
        _loaded = true;
        console.log('[BgLoader] ✅ Loaded', _cache.length, 'background images');

    } catch (e) {
        _loaded = true; // Mark as loaded even on failure so app doesn't hang
        console.warn('[BgLoader] ⚠️ Background load failed:', e.message);
        console.warn('[BgLoader] App will use default backgrounds or user uploads.');
    }
}

/** Fisher-Yates shuffle the index array with anti-repeat on first element. */
function _reshuffle() {
    _shuffled = [...Array(_cache.length).keys()];
    for (let i = _shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [_shuffled[i], _shuffled[j]] = [_shuffled[j], _shuffled[i]];
    }
    // Anti-repeat: if first item is the same as last shown, swap with second
    if (_cache.length >= 2 && _lastShownId && _cache[_shuffled[0]]?.id === _lastShownId) {
        [_shuffled[0], _shuffled[1]] = [_shuffled[1], _shuffled[0]];
    }
    _queueIdx = 0;
}
