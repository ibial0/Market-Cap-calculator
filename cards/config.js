// ═══════════════════════════════════════════════════════════
//  CARD LAYOUT SYSTEM — Fixed Anchor Grid
//  ALL themes must render into these named slots.
//  NOTHING outside this file should define positions.
// ═══════════════════════════════════════════════════════════

// ── Dimensions & Safe Zones ─────────────────────────────────
// No more character/text split. The entire canvas is available
// to the renderer, minus the safe margin on the edges.
export const CARD_W = 1600;
export const CARD_H = 900;
export const SAFE_MARGIN = 64;

// ── Named Anchor Slots ────────────────────────────────────
// Each slot lives inside TEXT_ZONE. Positions are % of TEXT_ZONE.
// Themes change colors/fonts — they do NOT change these anchors.
export const SLOTS = {
    // Row 1 (top): token name LEFT, username RIGHT
    token_name: { row: 'top',    align: 'left'  },
    username:   { row: 'top',    align: 'right' },
    tier_badge: { row: 'top',    align: 'right', below: 'username' },

    // Row 2 (center): hero numbers
    pnl_multiple: { row: 'center', align: 'left' },
    pnl_percent:  { row: 'center', align: 'left', below: 'pnl_multiple' },

    // Row 3 (bottom): data grid — 4 cells
    entry_mc:     { row: 'bottom', col: 0 },
    exit_mc:      { row: 'bottom', col: 1 },
    investment:   { row: 'bottom', col: 2 },
    profit:       { row: 'bottom', col: 3 },
};

// ── Font Size Rules ───────────────────────────────────────
export const TEXT_SCALE = {
    tokenName: {
        max: 80,
        min: 36,
        // Map token name char count → font size
        breakpoints: [
            { len: 4,  size: 80 },
            { len: 6,  size: 72 },
            { len: 8,  size: 64 },
            { len: 10, size: 54 },
            { len: 14, size: 44 },
            { len: 20, size: 36 },
        ],
    },
    heroNumber: {
        max: 140,
        min: 60,
        // Map string length → font size
        breakpoints: [
            { len: 4,  size: 140 },
            { len: 5,  size: 120 },
            { len: 6,  size: 104 },
            { len: 7,  size: 90  },
            { len: 8,  size: 78  },
            { len: 10, size: 66  },
            { len: 12, size: 60  },
        ],
    },
    roiPercent: { size: 52 },
    dataLabel:  { size: 16 },
    dataValue:  { size: 32 },
    username:   { size: 24 },
    badge:      { size: 17 },
};

// ── Tier Definitions ──────────────────────────────────────
export const TIER_DEFS = {
    mega_win:    { label: 'MEGA WIN',    badge: 'MEGA WIN',   emotions: ['euphoric','triumphant','legendary'], colorTemp: 'hot_gold' },
    big_win:     { label: 'BIG WIN',     badge: 'BIG WIN',    emotions: ['confident','celebrating','proud'],   colorTemp: 'warm_vibrant' },
    solid_win:   { label: 'SOLID WIN',   badge: 'SOLID WIN',  emotions: ['content','satisfied','calm'],        colorTemp: 'warm_neutral' },
    micro_win:   { label: 'MICRO WIN',   badge: 'GREEN',      emotions: ['playful','ironic','smug'],           colorTemp: 'neutral' },
    small_loss:  { label: 'SMALL LOSS',  badge: 'MINOR LOSS', emotions: ['shrug','wry','dark_humor'],          colorTemp: 'cool' },
    medium_loss: { label: 'MEDIUM LOSS', badge: 'LOSS',       emotions: ['somber','dramatic','moody'],         colorTemp: 'cool_desat' },
    rekt:        { label: 'REKT',        badge: 'REKT',       emotions: ['devastated','tragicomic','broken'],  colorTemp: 'cold_stormy' },
};

// ── Theme / Tier Compatibility Matrix ─────────────────────
export const THEME_TIER_MATRIX = {
    cyberpunk:     ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    anime:         ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    pixel_art:     ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    comic:         ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    minimal:       ['mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    glassmorphism: ['mega_win','big_win','solid_win','micro_win','small_loss'],
};
