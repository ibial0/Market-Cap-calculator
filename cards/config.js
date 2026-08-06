// ═══════════════════════════════════════════════════════════
//  TIER & THEME CONFIGURATION — Single source of truth
// ═══════════════════════════════════════════════════════════

export const TIER_DEFS = {
    mega_win:    { label: 'MEGA WIN',    badge: '⬡ MEGA WIN',       emotions: ['euphoric','triumphant','legendary'], colorTemp: 'hot_gold' },
    big_win:     { label: 'BIG WIN',     badge: '✦ BIG WIN',        emotions: ['confident','celebrating','proud'],   colorTemp: 'warm_vibrant' },
    solid_win:   { label: 'SOLID WIN',   badge: '◈ SOLID',          emotions: ['content','satisfied','calm'],        colorTemp: 'warm_neutral' },
    micro_win:   { label: 'MICRO WIN',   badge: '· GREEN',          emotions: ['playful','ironic','smug'],           colorTemp: 'neutral' },
    small_loss:  { label: 'SMALL LOSS',  badge: '↓ MINOR LOSS',     emotions: ['shrug','wry','dark_humor'],          colorTemp: 'cool' },
    medium_loss: { label: 'MEDIUM LOSS', badge: '▼ LOSS',           emotions: ['somber','dramatic','moody'],         colorTemp: 'cool_desat' },
    rekt:        { label: 'REKT',        badge: '✗ REKT',           emotions: ['devastated','tragicomic','broken'],  colorTemp: 'cold_stormy' },
};

// Which themes are allowed for which tiers
export const THEME_TIER_MATRIX = {
    cyberpunk:     ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    anime:         ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    pixel_art:     ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    comic:         ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    minimal:       ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    glassmorphism: ['mega_win','big_win','solid_win','micro_win','small_loss'],
};

// Color temperature palettes per tier
export const TIER_COLORS = {
    mega_win:    { positive: '#FFD700', negative: '#FF4444', glow: 'rgba(255,215,0,0.45)',   bgBase: '#0a0600' },
    big_win:     { positive: '#00FF88', negative: '#FF4444', glow: 'rgba(0,255,136,0.35)',   bgBase: '#001408' },
    solid_win:   { positive: '#00E576', negative: '#FF4444', glow: 'rgba(0,229,118,0.25)',   bgBase: '#000f0a' },
    micro_win:   { positive: '#80E8FF', negative: '#FF6B6B', glow: 'rgba(128,232,255,0.2)',  bgBase: '#030c18' },
    small_loss:  { positive: '#00E576', negative: '#FF6B6B', glow: 'rgba(255,107,107,0.2)',  bgBase: '#100505' },
    medium_loss: { positive: '#00E576', negative: '#FF3333', glow: 'rgba(255,51,51,0.3)',    bgBase: '#100000' },
    rekt:        { positive: '#00E576', negative: '#FF2222', glow: 'rgba(255,34,34,0.35)',   bgBase: '#0a0000' },
};

// Layout templates available
export const LAYOUTS = [
    'cinematic_split',   // Character left, data right
    'backdrop_hero',     // Large faded char behind, data foregrounded
    'poster_mode',       // Centered hero number, char + data balanced
    'command_center',    // Data-heavy grid, small char corner
    'data_terminal',     // Hacker/terminal aesthetic, monospace
    'corner_char',       // Character peeking from corner, data dominant
    'typography_hero',   // No character, pure type (for Minimal)
    'magazine_spread',   // Editorial layout with accent bar
];

// Safe area (pixels) — no text/UI inside this margin
export const SAFE_MARGIN = 48;
export const CARD_W = 1600;
export const CARD_H = 900;

// Font size bounds for auto-scaling
export const TEXT_SCALE = {
    tokenName:  { max: 88, min: 42, breakpoints: [{ len: 8, size: 88 }, { len: 12, size: 68 }, { len: 16, size: 54 }, { len: 20, size: 42 }] },
    heroNumber: { max: 155, min: 72 },
    subNumber:  { max: 62, min: 36 },
    label:      { size: 17 },
    dataValue:  { max: 38, min: 24 },
};
