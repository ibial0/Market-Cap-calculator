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
import { THEME_TIER_MATRIX } from '../config.js';

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
// This is shown in the Admin Gallery. Does NOT affect rendering.
export const BUILTIN_METADATA = {
    cyberpunk:      { name: 'Luxury Gold',      category: 'Premium',     tag: 'All Wins',      tiers: ['legendary','mega_win','big_win','solid_win','micro_win'] },
    anime:          { name: 'Ghibli Cats',       category: 'Character',   tag: 'All Tiers',     tiers: ['legendary','mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'] },
    pixel_art:      { name: 'Neon Glow',         category: 'Neon',        tag: 'Big+ Wins',     tiers: ['legendary','mega_win','big_win','solid_win'] },
    minimal:        { name: 'Crystal Clean',     category: 'Minimal',     tag: 'All Tiers',     tiers: ['legendary','mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'] },
    comic:          { name: 'Sunrise Gold',      category: 'Warm',        tag: 'All Wins',      tiers: ['legendary','mega_win','big_win','solid_win','micro_win'] },
    glassmorphism:  { name: 'Aurora',            category: 'Glassmorphism','tag': 'Small+ Wins', tiers: ['legendary','mega_win','big_win','solid_win','micro_win','small_loss'] },
};

// ── Track which built-ins are disabled via Firestore ──────
// Key: themeId, Value: true if disabled
const _disabledBuiltins = {};

/**
 * Load custom themes from Firestore and merge with built-ins.
 * Call once on app startup (app.js) and once on admin load.
 */
export async function loadCustomThemes() {
    try {
        const querySnapshot = await getDocs(collection(db, 'card_designs'));

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const id   = docSnap.id;

            // If a Firestore doc targets an existing built-in id with isActive=false,
            // disable that built-in rather than replacing it with a broken custom.
            if (data.isActive === false) {
                if (THEMES[id]) {
                    _disabledBuiltins[id] = true;
                    delete THEMES[id];
                } else {
                    // Custom-only design: just skip it
                }
                return;
            }

            // Re-enable if previously disabled
            if (_disabledBuiltins[id]) {
                delete _disabledBuiltins[id];
            }

            // If this Firestore doc is purely a status override for a built-in (no renderLayout),
            // just make sure it's enabled and move on.
            if (!data.renderLayout && THEMES[id]) {
                // Built-in is explicitly active — keep as-is
                return;
            }

            // Build a full custom theme from Firestore data
            const theme = {
                id,
                name:          data.name || id,
                hasCharacter:  data.hasCharacter  || false,
                bgVariants:    data.bgVariants    || 1,
                charVariants:  data.charVariants  || 1,
                accentVariants:data.accentVariants || 1,
                detailVariants:data.detailVariants || 1,
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

            // Register in tier matrix if not already there
            if (!THEME_TIER_MATRIX[id]) {
                const tiers = data.tiers && Array.isArray(data.tiers) ? data.tiers
                    : ['legendary','mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'];
                THEME_TIER_MATRIX[id] = tiers;
            }
        });

        console.log('[ThemeRegistry] Loaded. Active themes:', Object.keys(THEMES));
    } catch (err) {
        console.error('[ThemeRegistry] Error loading from Firestore:', err);
    }
}

export function getTheme(id)        { return THEMES[id] || null; }
export function getAllThemeIds()     { return Object.keys(THEMES); }
export function getAllThemes()       { return { ...THEMES }; }
export function isBuiltIn(id)       { return Object.prototype.hasOwnProperty.call(BUILTIN_METADATA, id); }
