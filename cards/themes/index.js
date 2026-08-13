// ═══════════════════════════════════════════════════════════
//  THEME REGISTRY
// ═══════════════════════════════════════════════════════════
import cyberpunk from './cyberpunk.js';
import anime from './anime.js';
import pixelArt from './pixel-art.js';
import minimal from './minimal.js';
import comic from './comic.js';
import glassmorphism from './glassmorphism.js';

import { db } from '../../config/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// ── Built-in theme registry ───────────────────────────────
const THEMES = {
    [cyberpunk.id]:      cyberpunk,
    [anime.id]:          anime,
    [pixelArt.id]:       pixelArt,
    [minimal.id]:        minimal,
    [comic.id]:          comic,
    [glassmorphism.id]:  glassmorphism,
};

// ── Human-readable metadata for each built-in theme ──────
export const BUILTIN_METADATA = {
    cyberpunk:      { name: 'Luxury Gold',      tag: '5X → 10X', tiers: ['profit_5','profit_6'] },
    anime:          { name: 'Ghibli Cats',      tag: '1X → 1.5X', tiers: ['profit_1','profit_2'] },
    pixel_art:      { name: 'Neon Glow',        tag: '10X → 20X', tiers: ['profit_6','profit_7'] },
    minimal:        { name: 'Crystal Clean',    tag: '1.5X → 2.5X', tiers: ['profit_2','profit_3'] },
    comic:          { name: 'Sunrise Gold',     tag: '2.5X → 3.5X', tiers: ['profit_3','profit_4'] },
    glassmorphism:  { name: 'Aurora',           tag: '0 → -1X', tiers: ['loss_1','loss_2'] },
};

// ── Track which built-ins are disabled via Firestore ──────
const _disabledBuiltins = {};

export async function loadCustomThemes() {
    try {
        const querySnapshot = await getDocs(collection(db, 'card_designs'));

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id   = docSnap.id;

            if (data.isActive === false) {
                if (THEMES[id]) {
                    _disabledBuiltins[id] = true;
                    delete THEMES[id];
                }
                return;
            }

            if (_disabledBuiltins[id]) delete _disabledBuiltins[id];

            if (!data.renderLayout && THEMES[id]) return;

            const theme = {
                id,
                name:          data.name || id,
                hasCharacter:  data.hasCharacter  || false,
                bgVariants:    data.bgVariants    || 1,
                charVariants:  data.charVariants  || 1,
                accentVariants:data.accentVariants || 1,
                detailVariants:data.detailVariants || 1,
                tiers:         data.tiers || [],
                _isCustom:     true,
            };

            try {
                const palettes = JSON.parse(data.palettes || '[]');
                theme.getPalette = (tierId, accentIdx) =>
                    palettes.length ? { ...palettes[accentIdx % palettes.length] } : {};
            } catch { theme.getPalette = () => ({}); }

            try {
                const typo = JSON.parse(data.typography || '{}');
                theme.getTypography = () => typo;
            } catch { theme.getTypography = () => ({}); }

            if (data.renderBackground) {
                try { theme.renderBackground = new Function('pal', 'tierId', 'variant', data.renderBackground); }
                catch { theme.renderBackground = () => ''; }
            } else { theme.renderBackground = () => ''; }

            if (data.renderEffects) {
                try { theme.renderEffects = new Function('pal', 'tierId', 'detailIdx', data.renderEffects); }
                catch { theme.renderEffects = () => ''; }
            } else { theme.renderEffects = () => ''; }

            if (data.getBorder) {
                try { theme.getBorder = new Function('pal', data.getBorder); }
                catch { theme.getBorder = () => ''; }
            } else { theme.getBorder = () => ''; }

            if (data.renderLayout) {
                try { theme.renderLayout = new Function('{ cd, pal, typo, W, H, S }', data.renderLayout); }
                catch { theme.renderLayout = null; }
            }

            THEMES[id] = theme;
        });

        console.log('[ThemeRegistry] Loaded. Active themes:', Object.keys(THEMES));
    } catch (err) {
        console.error('[ThemeRegistry] Error loading from Firestore:', err);
    }
}

export function getTheme(id)        { return THEMES[id] || null; }
export function getAllThemeIds()    { return Object.keys(THEMES); }
export function getAllThemes()      { return { ...THEMES }; }
export function getThemeTiers(id)   { return THEMES[id]?.tiers || BUILTIN_METADATA[id]?.tiers || []; }
export function isBuiltIn(id)       { return Object.prototype.hasOwnProperty.call(BUILTIN_METADATA, id); }
