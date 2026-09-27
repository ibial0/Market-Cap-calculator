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
// IMPORTANT: Boundaries are STRICTLY non-overlapping.
//   - Profit tiers: multiplier >= 1 (asset went up)
//   - Loss tiers:   multiplier < 1  (asset went down or broke even below 1x)
// The check in tiers.js uses: minMul <= multiplier < maxMul  (exclusive upper bound)
// except profit_14 which has no upper limit (maxMul: Infinity).
export const TIER_DEFS = {
    // ── PROFIT TIERS (multiplier >= 1.0) ──────────────────
    profit_1:  { label: '1X → 1.5X',   tag: '1X → 1.5X',   minMul: 1.0,   maxMul: 1.5   },
    profit_2:  { label: '1.5X → 2.5X', tag: '1.5X → 2.5X', minMul: 1.5,   maxMul: 2.5   },
    profit_3:  { label: '2.5X → 3.5X', tag: '2.5X → 3.5X', minMul: 2.5,   maxMul: 3.5   },
    profit_4:  { label: '3.5X → 5X',   tag: '3.5X → 5X',   minMul: 3.5,   maxMul: 5.0   },
    profit_5:  { label: '5X → 10X',    tag: '5X → 10X',    minMul: 5.0,   maxMul: 10.0  },
    profit_6:  { label: '10X → 20X',   tag: '10X → 20X',   minMul: 10.0,  maxMul: 20.0  },
    profit_7:  { label: '20X → 40X',   tag: '20X → 40X',   minMul: 20.0,  maxMul: 40.0  },
    profit_8:  { label: '40X → 75X',   tag: '40X → 75X',   minMul: 40.0,  maxMul: 75.0  },
    profit_9:  { label: '75X → 100X',  tag: '75X → 100X',  minMul: 75.0,  maxMul: 100.0 },
    profit_10: { label: '100X → 200X', tag: '100X → 200X', minMul: 100.0, maxMul: 200.0 },
    profit_11: { label: '200X → 300X', tag: '200X → 300X', minMul: 200.0, maxMul: 300.0 },
    profit_12: { label: '300X → 400X', tag: '300X → 400X', minMul: 300.0, maxMul: 400.0 },
    profit_13: { label: '400X → 500X', tag: '400X → 500X', minMul: 400.0, maxMul: 500.0 },
    profit_14: { label: '500X+',       tag: '500X+',       minMul: 500.0, maxMul: Infinity },

    // ── LOSS TIERS (multiplier < 1.0) ─────────────────────
    // loss_1: 0X → -1X means multiplier in [0, 1) — asset still has value but no profit
    loss_1:    { label: '0 → -1X',   tag: '0 → -1X',   minMul: 0.0,      maxMul: 1.0   },
    // loss_2: -1X → -2X means multiplier in [-1, 0) — went below purchase price
    loss_2:    { label: '-1X → -2X', tag: '-1X → -2X', minMul: -1.0,     maxMul: 0.0   },
    // loss_3: -2X → -5X
    loss_3:    { label: '-2X → -5X', tag: '-2X → -5X', minMul: -5.0,     maxMul: -1.0  },
    // loss_4: -5X → -10X
    loss_4:    { label: '-5X → -10X',tag: '-5X → -10X',minMul: -10.0,    maxMul: -5.0  },
    // loss_5: -10X+ (total destruction)
    loss_5:    { label: '-10X+',     tag: '-10X+',     minMul: -Infinity, maxMul: -10.0 },
};

// ── Performance Tier Order (for UI display) ───────────────
export const TIER_ORDER = [
    'profit_14', 'profit_13', 'profit_12', 'profit_11', 'profit_10', 'profit_9',
    'profit_8', 'profit_7', 'profit_6', 'profit_5', 'profit_4', 'profit_3', 'profit_2', 'profit_1',
    'loss_1', 'loss_2', 'loss_3', 'loss_4', 'loss_5'
];
