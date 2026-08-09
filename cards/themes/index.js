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
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const THEMES = {
    [cyberpunk.id]: cyberpunk,
    [anime.id]: anime,
    [pixelArt.id]: pixelArt,
    [minimal.id]: minimal,
    [comic.id]: comic,
    [glassmorphism.id]: glassmorphism,
};

// Also inject valid tiers into config so engine knows they can be used.
import { THEME_TIER_MATRIX } from '../config.js';

export async function loadCustomThemes() {
    try {
        const q = query(collection(db, "card_designs"));
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // If the design is explicitly marked as inactive, remove it from THEMES
            // This safely disables built-in themes if they are overridden in Firestore
            if (data.isActive === false) {
                delete THEMES[doc.id];
                return;
            }

            // Build the theme object dynamically
            const theme = {
                id: doc.id,
                name: data.name,
                hasCharacter: data.hasCharacter || false,
                bgVariants: data.bgVariants || 1,
                charVariants: data.charVariants || 1,
                accentVariants: data.accentVariants || 1,
                detailVariants: data.detailVariants || 1,
            };

            // Parse JSON structures
            try {
                const palettes = JSON.parse(data.palettes || '[]');
                theme.getPalette = (tierId, accentIdx, isProfit) => {
                    if (palettes.length === 0) return {};
                    return { ...palettes[accentIdx % palettes.length] };
                };
            } catch (e) {
                console.error(`Failed to parse palettes for theme ${doc.id}:`, e);
                theme.getPalette = () => ({});
            }

            try {
                const typoObj = JSON.parse(data.typography || '{}');
                theme.getTypography = () => typoObj;
            } catch (e) {
                console.error(`Failed to parse typography for theme ${doc.id}:`, e);
                theme.getTypography = () => ({});
            }

            // Parse JavaScript functions securely for client execution
            // We expect the stored string to be the function BODY.
            // example renderBackgroundCode: "return `<svg>...</svg>`;"
            
            if (data.renderBackground) {
                theme.renderBackground = new Function('pal', 'tierId', 'variant', data.renderBackground);
            } else {
                theme.renderBackground = () => '';
            }

            if (data.renderEffects) {
                theme.renderEffects = new Function('pal', 'tierId', 'detailIdx', data.renderEffects);
            } else {
                theme.renderEffects = () => '';
            }

            if (data.getBorder) {
                theme.getBorder = new Function('pal', data.getBorder);
            } else {
                theme.getBorder = () => '';
            }

            if (data.renderLayout) {
                // Notice the arguments match what renderer.js passes: { cd, pal, typo, W, H, S }
                theme.renderLayout = new Function('{ cd, pal, typo, W, H, S }', data.renderLayout);
            }

            THEMES[theme.id] = theme;

            // Make sure this custom theme is available for all tiers by default
            if (!THEME_TIER_MATRIX[theme.id]) {
                THEME_TIER_MATRIX[theme.id] = ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'];
            }
        });
        
        console.log("Custom themes loaded successfully.");
    } catch (error) {
        console.error("Error loading custom themes from Firestore:", error);
    }
}

export function getTheme(id) { return THEMES[id] || null; }
export function getAllThemeIds() { return Object.keys(THEMES); }
export function getAllThemes() { return THEMES; }
