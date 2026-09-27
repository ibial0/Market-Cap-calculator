// Theme registry. Built-in themes are immutable rendering sources; Firestore
// documents can change their name, availability and tiers, but never replace
// their renderer with an incomplete override.
import cyberpunk from './cyberpunk.js';
import anime from './anime.js';
import pixelArt from './pixel-art.js';
import minimal from './minimal.js';
import comic from './comic.js';
import glassmorphism from './glassmorphism.js';

import { db } from '../../config/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const BUILTIN_THEMES = Object.freeze({
    [cyberpunk.id]: cyberpunk,
    [anime.id]: anime,
    [pixelArt.id]: pixelArt,
    [minimal.id]: minimal,
    [comic.id]: comic,
    [glassmorphism.id]: glassmorphism,
});

const FALLBACK_THEME_ID = cyberpunk.id;

// The live registry is rebuilt on every load so a previously disabled or
// malformed document cannot permanently mutate this module's state.
const THEMES = { ...BUILTIN_THEMES };

export const BUILTIN_METADATA = {
    cyberpunk:      { name: 'Luxury Gold',   tag: '5X → 10X',   tiers: ['profit_5', 'profit_6'] },
    anime:          { name: 'Ghibli Cats',   tag: '1X → 1.5X',  tiers: ['profit_1', 'profit_2'] },
    pixel_art:      { name: 'Neon Glow',     tag: '10X → 20X',  tiers: ['profit_6', 'profit_7'] },
    minimal:        { name: 'Crystal Clean', tag: '1.5X → 2.5X',tiers: ['profit_2', 'profit_3'] },
    comic:          { name: 'Sunrise Gold',  tag: '2.5X → 3.5X',tiers: ['profit_3', 'profit_4'] },
    glassmorphism:  { name: 'Aurora',        tag: '0 → -1X',   tiers: ['loss_1', 'loss_2'] },
};

const DEFAULT_PALETTE = {
    bg: '#0f172a', text: '#f8fafc', accent: '#38bdf8',
    positive: '#34d399', negative: '#f87171',
};
const DEFAULT_TYPOGRAPHY = {
    body: "'Inter', sans-serif", display: "'Outfit', sans-serif",
    mono: "'Roboto Mono', monospace",
};
const themeTiers = {};
const themeNames = {};

function resetRegistry() {
    Object.keys(THEMES).forEach(id => delete THEMES[id]);
    Object.assign(THEMES, BUILTIN_THEMES);

    Object.keys(themeTiers).forEach(id => delete themeTiers[id]);
    Object.keys(themeNames).forEach(id => delete themeNames[id]);
    Object.entries(BUILTIN_METADATA).forEach(([id, meta]) => {
        themeTiers[id] = [...meta.tiers];
        themeNames[id] = meta.name;
    });
}

function parseJSON(value, fallback) {
    if (typeof value !== 'string' || !value.trim()) return fallback;
    try { return JSON.parse(value); } catch { return fallback; }
}

function isUsableFunctionBody(value) {
    const normalized = typeof value === 'string' ? value.trim() : '';
    return normalized && normalized !== "return '';" && normalized !== 'return "";';
}

function compile(args, source, fallback) {
    if (!isUsableFunctionBody(source)) return fallback;
    try { return new Function(...args, source); } catch { return fallback; }
}

function createCustomTheme(id, data) {
    const palettes = parseJSON(data.palettes, []);
    const paletteList = Array.isArray(palettes) && palettes.length ? palettes : [DEFAULT_PALETTE];
    const typography = { ...DEFAULT_TYPOGRAPHY, ...parseJSON(data.typography, {}) };

    return {
        id,
        name: data.name || id,
        hasCharacter: Boolean(data.hasCharacter),
        bgVariants: Number(data.bgVariants) || 1,
        charVariants: Number(data.charVariants) || 1,
        accentVariants: Number(data.accentVariants) || 1,
        detailVariants: Number(data.detailVariants) || 1,
        tiers: Array.isArray(data.tiers) ? data.tiers : [],
        _isCustom: true,
        getPalette: (_tierId, accentIdx) => ({ ...DEFAULT_PALETTE, ...paletteList[Math.abs(accentIdx || 0) % paletteList.length] }),
        getTypography: () => typography,
        renderBackground: compile(['pal', 'tierId', 'variant'], data.renderBackground, pal =>
            `<div style="position:absolute;inset:0;background:${pal.bg};"></div>`),
        renderEffects: compile(['pal', 'tierId', 'detailIdx'], data.renderEffects, () => ''),
        getBorder: compile(['pal'], data.getBorder, pal => `border-radius:24px;border:1px solid ${pal.accent}30;`),
        renderLayout: compile(['{ cd, pal, typo, W, H, S }'], data.renderLayout, null),
    };
}

export async function loadCustomThemes() {
    resetRegistry();
    try {
        const querySnapshot = await getDocs(collection(db, 'card_designs'));

        querySnapshot.forEach(docSnap => {
            const id = docSnap.id;
            const data = docSnap.data() || {};

            // A built-in document is metadata only. Older documents can contain
            // blank render functions; deliberately ignore those fields so they
            // can no longer turn a working built-in card into a black card.
            if (BUILTIN_THEMES[id]) {
                if (Array.isArray(data.tiers)) themeTiers[id] = data.tiers;
                if (data.name) themeNames[id] = data.name;
                if (data.isActive === false) delete THEMES[id];
                return;
            }

            if (data.isActive === false) return;
            THEMES[id] = createCustomTheme(id, data);
            themeTiers[id] = THEMES[id].tiers;
            themeNames[id] = THEMES[id].name;
        });

        console.log('[ThemeRegistry] Loaded active themes:', Object.keys(THEMES));
    } catch (err) {
        console.error('[ThemeRegistry] Error loading from Firestore:', err);
    }
}

export function getTheme(id)        { return THEMES[id] || null; }
export function getAllThemeIds()    { return Object.keys(THEMES); }
// The admin gallery must always list every built-in design, including ones
// temporarily disabled in Firestore. The app itself uses getAllThemeIds(),
// which continues to return active designs only.
export function getAllThemes()      { return { ...BUILTIN_THEMES, ...THEMES }; }
export function getThemeTiers(id)   { return themeTiers[id] || THEMES[id]?.tiers || BUILTIN_METADATA[id]?.tiers || []; }
export function getThemeName(id)    { return themeNames[id] || THEMES[id]?.name || BUILTIN_METADATA[id]?.name || id; }
export function isBuiltIn(id)       { return Object.prototype.hasOwnProperty.call(BUILTIN_THEMES, id); }
export function getFallbackTheme()  { return THEMES[FALLBACK_THEME_ID] || BUILTIN_THEMES[FALLBACK_THEME_ID]; }
