// ═══════════════════════════════════════════════════════════
//  CARD ENGINE — Main Orchestrator
//  Selects an eligible theme OR PNG template for the user's
//  tier and builds the card HTML.
//  Both systems return the same: a 1600×900 HTML string.
//
//  Anti-Repeat System:
//    Uses a per-tier shuffled queue stored in sessionStorage.
//    Cards cycle through the full pool before any repeat.
//    If only 1 card exists in the pool, returns a special sentinel
//    value so the caller can show a "no other designs" message.
// ═══════════════════════════════════════════════════════════
import { classifyTier } from './tiers.js';
import { Randomizer } from './randomizer.js';
import { composeCard } from './renderer.js';
import { getTheme, getAllThemeIds, getThemeTiers } from './themes/index.js';
import { getActivePNGTemplates, getPNGTemplate } from './png-loader.js';
import { composePNGCard } from './png-engine.js';

const _randomizer = new Randomizer();

// ── Sentinel: returned when pool has only 1 design ────────
export const CARD_ONLY_ONE_DESIGN = '__ONLY_ONE_DESIGN__';

// ── Anti-Repeat: Shuffled Queue Manager ────────────────────
// Maintains a per-tier queue in sessionStorage.
// Queue: shuffled array of pool IDs. Pop one at a time.
// When empty → reshuffle from full pool.
const QUEUE_KEY = (tierId) => `cardQueue_${tierId}`;

function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Pick the next card from the shuffled queue for a given tier.
 * @param {string} tierId
 * @param {Array<{type,id}>} pool - Full eligible pool for this tier
 * @returns {{ type: string, id: string } | null}
 */
function _pickFromQueue(tierId, pool) {
    if (pool.length === 0) return null;

    const key = QUEUE_KEY(tierId);
    let queue = [];

    try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Validate: only keep IDs that are still in the current pool
            queue = parsed.filter(item => pool.some(p => p.id === item.id && p.type === item.type));
        }
    } catch (e) {
        queue = [];
    }

    // If queue is empty (or exhausted), refill with a fresh shuffle
    if (queue.length === 0) {
        queue = _shuffle(pool);
    }

    // Pop the first item
    const pick = queue.shift();

    // Save remaining queue back to sessionStorage
    try {
        sessionStorage.setItem(key, JSON.stringify(queue));
    } catch (e) { /* ignore storage errors */ }

    return pick;
}

export class CardEngine {
    constructor(data) {
        this.d    = data;
        this.tier = classifyTier(data.multiplier);
    }

    /**
     * Builds the card HTML.
     * Returns CARD_ONLY_ONE_DESIGN sentinel if pool has exactly 1 design
     * and the caller is requesting a reroll (skipCurrentId is provided).
     * @param {string|null} skipCurrentId - ID of the currently shown card (for reroll)
     */
    buildHTML(skipCurrentId = null) {
        const tierId = this.tier.id;

        if (!tierId) {
            return this._errorCard(`No tier matched for multiplier ${this.d.multiplier}`);
        }

        // ── Theme candidates (STRICT tier match only) ──────
        const allowedThemeIds = getAllThemeIds().filter(tid => {
            const tiers = getThemeTiers(tid);
            return Array.isArray(tiers) && tiers.includes(tierId);
        });

        // ── PNG template candidates (STRICT tier match only) ──
        const allowedPNGTemplates = getActivePNGTemplates().filter(tpl => {
            if (!tpl.tiers || tpl.tiers.length === 0) return false;
            return tpl.tiers.includes(tierId);
        });

        // ── Unified pool ────────────────────────────────────
        const pool = [
            ...allowedThemeIds.map(tid => ({ type: 'theme', id: tid })),
            ...allowedPNGTemplates.map(tpl => ({ type: 'png', id: tpl.id })),
        ];

        // ── Strict: NO fallback. If no designs, say so clearly. ──
        if (pool.length === 0) {
            return this._errorCard(`কোনো ডিজাইন পাওয়া যায়নি এই রেঞ্জের জন্য।<br><small style="opacity:0.6;">No card templates configured for this tier (${tierId})</small>`);
        }

        // ── If reroll requested and only 1 design exists → sentinel ──
        if (skipCurrentId !== null && pool.length === 1) {
            return CARD_ONLY_ONE_DESIGN;
        }

        // ── Pick from anti-repeat queue ─────────────────────
        const pick = _pickFromQueue(tierId, pool);
        if (!pick) {
            return this._errorCard('Queue error. Please refresh.');
        }

        // ── PNG path ────────────────────────────────────────
        if (pick.type === 'png') {
            const tpl = getPNGTemplate(pick.id);
            if (!tpl) {
                console.warn('[CardEngine] PNG template missing from cache:', pick.id);
                // Retry with a theme if available
                if (allowedThemeIds.length > 0) {
                    return this._renderTheme(allowedThemeIds, tierId);
                }
                return this._errorCard('Template not found. Please try again.');
            }
            return composePNGCard(tpl, this.d);
        }

        // ── Theme path ──────────────────────────────────────
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
        return `<div style="width:1600px;height:900px;background:#0a0f1c;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;font-size:28px;font-family:'Inter',sans-serif;text-align:center;padding:60px;box-sizing:border-box;gap:20px;">
            <div style="font-size:48px;">⚠️</div>
            <div style="opacity:0.9;">${msg}</div>
        </div>`;
    }
}

/** Clears the anti-repeat queue for a specific tier (or all tiers). */
export function clearCardQueue(tierId = null) {
    try {
        if (tierId) {
            sessionStorage.removeItem(QUEUE_KEY(tierId));
        } else {
            // Clear all card queues
            Object.keys(sessionStorage)
                .filter(k => k.startsWith('cardQueue_'))
                .forEach(k => sessionStorage.removeItem(k));
        }
    } catch (e) { /* ignore */ }
}
