// Shared Firestore background catalogue, eligibility and deterministic rotation.
import { db } from '../config/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const LOAD_TIMEOUT_MS = 8000;
const VALID_EMOTIONS = new Set(['happy', 'shock', 'greed', 'cry', 'angry', 'worried', 'relieved']);
const VALID_TYPES = new Set(['profit', 'loss']);
const _cache = [];
const _rotation = new Map();
let _loadPromise = null;
let _loaded = false;

export function normalizeEmotion(value) {
    const legacy = { smile: 'happy', calm: 'happy', stress: 'shock', confused: 'shock', angel: 'relieved', crying: 'cry' };
    const normalized = legacy[String(value || '').toLowerCase()] || String(value || '').toLowerCase();
    return VALID_EMOTIONS.has(normalized) ? normalized : null;
}

/** A missing emotion is universal. Backgrounds without explicit pnlType match any outcome. */
export function getEligibleBackgrounds({ emotion = null, outcome = null } = {}) {
    const requestedEmotion = normalizeEmotion(emotion);
    const requestedOutcome = VALID_TYPES.has(outcome) ? outcome : null;
    return _cache.filter(bg => {
        const bgEmotion = normalizeEmotion(bg.emotion);
        const hasAssignedEmotion = bg.emotion !== null && bg.emotion !== undefined && bg.emotion !== '';
        // If an emotion is requested, only match that emotion or universal (unassigned)
        if (requestedEmotion && hasAssignedEmotion && bgEmotion !== requestedEmotion) return false;

        // PnL outcome rule: if outcome is requested and background has an assigned pnlType, it must match
        const hasAssignedPnlType = bg.pnlType === 'profit' || bg.pnlType === 'loss';
        if (requestedOutcome && hasAssignedPnlType && bg.pnlType !== requestedOutcome) return false;

        return true;
    });
}

function rotationKey(context) {
    return `${normalizeEmotion(context?.emotion) || 'all'}:${VALID_TYPES.has(context?.outcome) ? context.outcome : 'unknown'}`;
}

/** Returns backgrounds in Firestore creation order, looping only after every eligible item was used. */
export function getNextEligibleBackground(context = {}) {
    const eligible = getEligibleBackgrounds(context);
    if (!eligible.length) return null;
    const key = rotationKey(context);
    const ids = eligible.map(bg => bg.id);
    const state = _rotation.get(key) || { ids: [], next: 0 };
    if (state.ids.join('|') !== ids.join('|')) {
        const currentId = state.ids[state.next - 1];
        state.ids = ids;
        state.next = Math.max(0, ids.indexOf(currentId) + 1) % ids.length;
    }
    const bg = eligible[state.next % eligible.length];
    state.next = (state.next + 1) % eligible.length;
    _rotation.set(key, state);
    return bg;
}

export function getNextBackground() { return getNextEligibleBackground(); }
export function getNextBackgroundByEmotion(emotionId, outcome = null) { return getNextEligibleBackground({ emotion: emotionId, outcome }); }
export function hasMoreBackgrounds(currentBgId, context = {}) {
    const eligible = getEligibleBackgrounds(context);
    return eligible.length > 1 || (eligible.length === 1 && eligible[0].id !== currentBgId);
}
export function getBackgroundCount(context = {}) { return getEligibleBackgrounds(context).length; }
export function getAllBackgrounds() { return [..._cache]; }
export function backgroundsLoaded() { return _loaded; }

export async function loadBackgrounds() {
    if (_loadPromise) return _loadPromise;
    _loadPromise = _doLoad();
    return _loadPromise;
}
export async function reloadBackgrounds() {
    _cache.length = 0; _rotation.clear(); _loaded = false; _loadPromise = null;
    return loadBackgrounds();
}

async function _doLoad() {
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), LOAD_TIMEOUT_MS));
        const snap = await Promise.race([getDocs(collection(db, 'card_backgrounds')), timeout]);
        const items = [];
        snap.forEach(d => { const item = { id: d.id, ...d.data() }; if (item.isActive !== false) items.push(item); });
        items.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0) || a.id.localeCompare(b.id));
        await Promise.all(items.map(async bg => {
            const url = bg.imageUrl || bg.bgUrl || '';
            if (!url) return;
            if (url.startsWith('data:')) bg.dataUrl = url;
            else {
                try {
                    const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const blob = await response.blob();
                    bg.dataUrl = await new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(blob); });
                } catch { bg.dataUrl = url; }
            }
            _cache.push(bg);
        }));
    } catch (error) { console.warn('[BgLoader] Background load failed:', error.message); }
    finally { _loaded = true; }
}
