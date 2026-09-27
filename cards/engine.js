// ═══════════════════════════════════════════════════════════
//  CARD ENGINE — Main Orchestrator
//  Selects an eligible theme OR PNG template for the user's
//  tier and builds the card HTML.
//
//  Tier Isolation (STRICT):
//    A card assigned to tier X will NEVER appear on tier Y.
//    No fallback to other tiers. If no cards → error message.
//
//  Anti-Repeat System:
//    Per-tier shuffled queue in sessionStorage.
//    Cards cycle through the full pool before any repeat.
//    When reshuffling, ensures the first card of the new cycle
//    is never the same as the last card shown (for pool ≥ 2).
//
//  Single-Design Sentinel:
//    If pool has exactly 1 card and user tries to REROLL,
//    returns CARD_ONLY_ONE_DESIGN so the caller shows a toast.
// ═══════════════════════════════════════════════════════════
import { classifyTier } from './tiers.js';
import { Randomizer } from './randomizer.js';
import { composeCard } from './renderer.js';
import { getTheme, getAllThemeIds, getThemeTiers } from './themes/index.js';
import { getActivePNGTemplates, getPNGTemplate } from './png-loader.js';
import { composePNGCard } from './png-engine.js';

const _randomizer = new Randomizer();

// ── Sentinel: returned when pool has only 1 design and user rerolls ──
export const CARD_ONLY_ONE_DESIGN = '__ONLY_ONE_DESIGN__';

// ── Storage keys ───────────────────────────────────────────
const QUEUE_KEY    = (tierId) => `cardQueue_${tierId}`;
const LAST_KEY     = (tierId) => `cardLast_${tierId}`;

// ── Fisher-Yates shuffle ───────────────────────────────────
function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Pick the next card ID from the shuffled queue for a given tier.
 *
 * Rules:
 *  1. Maintain a shuffled queue per tier in sessionStorage.
 *  2. Pop one item at a time from the front.
 *  3. When the queue empties, reshuffle the full pool.
 *  4. After reshuffle: if pool ≥ 2, and the first item equals
 *     the last-shown card, swap it with position [1] so the
 *     same card is NEVER shown twice in a row.
 *
 * @param {string} tierId
 * @param {Array<{type,id}>} pool - Full eligible pool for this tier
 * @returns {{ type: string, id: string } | null}
 */
function _pickFromQueue(tierId, pool) {
    if (pool.length === 0) return null;

    const qKey = QUEUE_KEY(tierId);
    const lKey = LAST_KEY(tierId);
    let queue = [];
    let lastId = null;

    try {
        lastId = sessionStorage.getItem(lKey);
        const stored = sessionStorage.getItem(qKey);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Keep only IDs that still exist in the current pool
            queue = parsed.filter(item =>
                pool.some(p => p.id === item.id && p.type === item.type)
            );
        }
    } catch (e) {
        queue = [];
    }

    // Queue exhausted → refill with a fresh shuffle
    if (queue.length === 0) {
        queue = _shuffle(pool);

        // ── Anti-consecutive-repeat fix ─────────────────────
        // If pool has ≥ 2 items and the first item in the new
        // shuffled queue is the same as the last card shown,
        // swap it with the next item so no back-to-back repeat.
        if (pool.length >= 2 && lastId && queue[0]?.id === lastId) {
            [queue[0], queue[1]] = [queue[1], queue[0]];
        }
    }

    // Pop the first item
    const pick = queue.shift();

    // Persist queue and last pick
    try {
        sessionStorage.setItem(qKey, JSON.stringify(queue));
        if (pick) sessionStorage.setItem(lKey, pick.id);
    } catch (e) { /* ignore storage errors */ }

    return pick;
}

// ── Card Engine ────────────────────────────────────────────
export class CardEngine {
    constructor(data) {
        this.d    = data;
        this.tier = classifyTier(data.multiplier);
    }

    /**
     * Builds the card HTML.
     *
     * @param {boolean} isReroll - true when the user clicked Reroll (not first generate)
     * @returns {string} HTML string, or CARD_ONLY_ONE_DESIGN sentinel
     */
    buildHTML(isReroll = false) {
        const tierId = this.tier.id;

        if (!tierId) {
            return this._errorCard(
                `No tier matched for multiplier ${this.d.multiplier}.<br>` +
                `<small style="opacity:0.6;">Check TIER_DEFS in config.js</small>`
            );
        }

        // ── STRICT: Build pool from this tier only ──────────
        // Theme candidates
        const allowedThemeIds = getAllThemeIds().filter(tid => {
            const tiers = getThemeTiers(tid);
            return Array.isArray(tiers) && tiers.includes(tierId);
        });

        // PNG template candidates
        const allowedPNGs = getActivePNGTemplates().filter(tpl => {
            if (!tpl.tiers || tpl.tiers.length === 0) return false;
            return tpl.tiers.includes(tierId);
        });

        // Unified pool
        const pool = [
            ...allowedThemeIds.map(tid => ({ type: 'theme', id: tid })),
            ...allowedPNGs.map(tpl => ({ type: 'png', id: tpl.id })),
        ];

        // ── No designs at all → error (NO fallback to other tiers) ──
        if (pool.length === 0) {
            return this._errorCard(
                `No card designs available for this range.<br>` +
                `<small style="opacity:0.6;">Tier: ${tierId} — assign a design in the Admin panel</small>`
            );
        }

        // ── Reroll with only 1 design → sentinel (show toast, don't regenerate) ──
        if (isReroll && pool.length === 1) {
            return CARD_ONLY_ONE_DESIGN;
        }

        // ── Pick next card from anti-repeat queue ───────────
        const pick = _pickFromQueue(tierId, pool);
        if (!pick) {
            return this._errorCard('Internal queue error. Please refresh the page.');
        }

        // ── Render PNG template ─────────────────────────────
        if (pick.type === 'png') {
            const tpl = getPNGTemplate(pick.id);
            if (!tpl) {
                console.warn('[CardEngine] PNG template missing from cache:', pick.id);
                // Fall back to a theme IF one is available in the same tier
                if (allowedThemeIds.length > 0) {
                    return this._renderTheme(allowedThemeIds, tierId);
                }
                return this._errorCard('Template image not loaded. Please try again.');
            }
            return composePNGCard(tpl, this.d);
        }

        // ── Render built-in theme ───────────────────────────
        return this._renderTheme(allowedThemeIds, tierId);
    }

    _renderTheme(allowedThemeIds, tierId) {
        const registry = {};
        allowedThemeIds.forEach(tid => {
            const t = getTheme(tid);
            if (t) registry[tid] = t;
        });

        const combo = _randomizer.getCombo(tierId, allowedThemeIds, registry);
        const theme = getTheme(combo.themeId);

        if (!theme) {
            return this._errorCard('Theme not found. Please refresh the page.');
        }

        return composeCard({ theme, data: this.d, tier: this.tier, combo, randomizer: _randomizer });
    }

    _errorCard(msg) {
        return `<div style="
            width:1600px;height:900px;background:#0a0f1c;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            color:#fff;font-size:26px;font-family:'Inter',sans-serif;
            text-align:center;padding:60px;box-sizing:border-box;gap:20px;">
            <div style="font-size:48px;">⚠️</div>
            <div style="opacity:0.9;line-height:1.5;">${msg}</div>
        </div>`;
    }
}

/** Clears the anti-repeat queue for a specific tier (or all tiers). */
export function clearCardQueue(tierId = null) {
    try {
        const keys = Object.keys(sessionStorage).filter(k =>
            k.startsWith('cardQueue_') || k.startsWith('cardLast_')
        );
        if (tierId) {
            sessionStorage.removeItem(QUEUE_KEY(tierId));
            sessionStorage.removeItem(LAST_KEY(tierId));
        } else {
            keys.forEach(k => sessionStorage.removeItem(k));
        }
    } catch (e) { /* ignore */ }
}
