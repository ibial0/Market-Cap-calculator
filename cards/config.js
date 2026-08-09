// ═══════════════════════════════════════════════════════════
//  CARD LAYOUT SYSTEM — Fixed Anchor Grid
//  ALL themes must render into these named slots.
//  NOTHING outside this file should define positions.
// ═══════════════════════════════════════════════════════════

// ── Dimensions & Safe Zones ─────────────────────────────────
export const CARD_W = 1600;
export const CARD_H = 900;
export const SAFE_MARGIN = 64;

// ── Named Anchor Slots ────────────────────────────────────
export const SLOTS = {
    token_name: { row: 'top',    align: 'left'  },
    username:   { row: 'top',    align: 'right' },
    tier_badge: { row: 'top',    align: 'right', below: 'username' },
    pnl_multiple: { row: 'center', align: 'left' },
    pnl_percent:  { row: 'center', align: 'left', below: 'pnl_multiple' },
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
// minMul / maxMul are used by the category filtering system.
// A multiplier of 1.00 = break-even. Below 1.00 = loss.
export const TIER_DEFS = {
    legendary:   { label: 'LEGENDARY',   badge: 'LEGENDARY',  tag: 'Legendary',   minMul: 10,   maxMul: Infinity, emotions: ['legendary','euphoric','transcendent'],          colorTemp: 'ultra_gold'    },
    mega_win:    { label: 'MEGA WIN',    badge: 'MEGA WIN',   tag: 'Mega Win',    minMul: 5,    maxMul: 9.99,     emotions: ['euphoric','triumphant','legendary'],            colorTemp: 'hot_gold'      },
    big_win:     { label: 'BIG WIN',     badge: 'BIG WIN',    tag: 'Big Win',     minMul: 3,    maxMul: 4.99,     emotions: ['confident','celebrating','proud'],             colorTemp: 'warm_vibrant'  },
    solid_win:   { label: 'GOOD WIN',    badge: 'GOOD WIN',   tag: 'Good Win',    minMul: 1.5,  maxMul: 2.99,     emotions: ['content','satisfied','calm'],                  colorTemp: 'warm_neutral'  },
    micro_win:   { label: 'SMALL WIN',   badge: 'SMALL WIN',  tag: 'Small Win',   minMul: 1.0,  maxMul: 1.49,     emotions: ['playful','ironic','smug'],                     colorTemp: 'neutral'       },
    small_loss:  { label: 'SMALL LOSS',  badge: 'SMALL LOSS', tag: 'Small Loss',  minMul: 0.5,  maxMul: 0.99,     emotions: ['shrug','wry','dark_humor'],                    colorTemp: 'cool'          },
    medium_loss: { label: 'HEAVY LOSS',  badge: 'LOSS',       tag: 'Heavy Loss',  minMul: 0,    maxMul: 0.49,     emotions: ['somber','dramatic','moody'],                   colorTemp: 'cool_desat'    },
    rekt:        { label: 'REKT',        badge: 'REKT',       tag: 'Loss',        minMul: -Infinity, maxMul: 0,   emotions: ['devastated','tragicomic','broken'],            colorTemp: 'cold_stormy'   },
};

// ── Performance Tier Order (for UI display) ───────────────
export const TIER_ORDER = ['legendary','mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'];

// ── Theme / Tier Compatibility Matrix ─────────────────────
// This is the authoritative list of which tiers a theme supports.
// Designs best suited for high-energy wins should NOT appear for losses.
export const THEME_TIER_MATRIX = {
    // Luxury Gold — premium, works for all positive tiers
    cyberpunk:     ['legendary','mega_win','big_win','solid_win','micro_win'],
    // Anime (Ghibli Cats) — emotional range covers everything
    anime:         ['legendary','mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    // Neon Glow — high-energy, best for wins
    pixel_art:     ['legendary','mega_win','big_win','solid_win'],
    // Comic / Sunrise Gold — warm energy, positive trades
    comic:         ['legendary','mega_win','big_win','solid_win','micro_win'],
    // Crystal Clean — minimal/neutral, good for all
    minimal:       ['legendary','mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
    // Aurora Glassmorphism — ethereal, best for positive trades
    glassmorphism: ['legendary','mega_win','big_win','solid_win','micro_win','small_loss'],
};
