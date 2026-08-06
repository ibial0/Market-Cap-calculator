// ═══════════════════════════════════════════════════════════
//  THEME REGISTRY
// ═══════════════════════════════════════════════════════════
import cyberpunk from './cyberpunk.js';
import anime from './anime.js';
import pixelArt from './pixel-art.js';
import minimal from './minimal.js';
import comic from './comic.js';
import glassmorphism from './glassmorphism.js';

const THEMES = {
    [cyberpunk.id]: cyberpunk,
    [anime.id]: anime,
    [pixelArt.id]: pixelArt,
    [minimal.id]: minimal,
    [comic.id]: comic,
    [glassmorphism.id]: glassmorphism,
};

export function getTheme(id) { return THEMES[id] || null; }
export function getAllThemeIds() { return Object.keys(THEMES); }
export function getAllThemes() { return THEMES; }
