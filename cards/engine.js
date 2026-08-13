// ═══════════════════════════════════════════════════════════
//  CARD ENGINE — Main Orchestrator
//  Selects an eligible theme OR PNG template for the user's
//  tier and builds the card HTML.
//  Both systems return the same: a 1600×900 HTML string.
// ═══════════════════════════════════════════════════════════
import { classifyTier } from './tiers.js';
import { Randomizer } from './randomizer.js';
import { composeCard } from './renderer.js';
import { getTheme, getAllThemeIds, getThemeTiers, getFallbackTheme } from './themes/index.js';
import { getActivePNGTemplates, getPNGTemplate } from './png-loader.js';
import { composePNGCard } from './png-engine.js';

const _randomizer = new Randomizer();

export class CardEngine {
    constructor(data) {
        this.d       = data;
        this.tier    = classifyTier(data.multiplier);
    }

    buildHTML() {
        const tierId = this.tier.id;
        
        if (!tierId) {
            return `<div style="width:1600px;height:900px;background:#0a0f1c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;">No tier matched for multiplier ${this.d.multiplier}</div>`;
        }

        // ── Theme candidates (strict match only) ──
        let allowedThemes = getAllThemeIds().filter(tid => {
            const tiers = getThemeTiers(tid);
            return tiers && tiers.includes(tierId);
        });

        // ── PNG template candidates (strict match only) ──
        const pngTemplates = getActivePNGTemplates().filter(tpl => {
            if (!tpl.tiers || tpl.tiers.length === 0) return false; // Strict match means empty tiers = not in this tier
            return tpl.tiers.includes(tierId);
        });

        // ── Build unified pool ──
        const pool = [
            ...allowedThemes.map(tid => ({ type: 'theme', id: tid })),
            ...pngTemplates.map(tpl => ({ type: 'png',   id: tpl.id })),
        ];

        if (pool.length === 0) {
            // A card should always be generated. If an admin has temporarily
            // unassigned every design for a range, render the stable fallback
            // design instead of a black/error card for the user.
            const fallback = getFallbackTheme();
            if (fallback) return this._renderSingleTheme(fallback, tierId);
            return `<div style="width:1600px;height:900px;background:#0a0f1c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;">No card templates available for this tier</div>`;
        }

        // ── Anti-Repeat Logic ──
        let eligiblePool = pool;
        try {
            const lastId = sessionStorage.getItem('lastGeneratedDesignId');
            if (lastId && pool.length > 1) {
                const filtered = pool.filter(p => p.id !== lastId);
                if (filtered.length > 0) {
                    eligiblePool = filtered;
                }
            }
        } catch (e) {
            console.warn('[CardEngine] Anti-repeat check failed:', e);
        }

        // ── Random pick from eligible pool ──
        const pick = eligiblePool[Math.floor(Math.random() * eligiblePool.length)];

        try {
            sessionStorage.setItem('lastGeneratedDesignId', pick.id);
        } catch (e) {}

        // ── PNG template path ──
        if (pick.type === 'png') {
            const tpl = getPNGTemplate(pick.id);
            if (!tpl) {
                console.warn('[CardEngine] PNG template not found in cache:', pick.id);
                if (allowedThemes.length > 0) {
                     return this._renderTheme(allowedThemes, tierId);
                } else {
                     return `<div style="width:1600px;height:900px;background:#0a0f1c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;">Template Error</div>`;
                }
            }
            return composePNGCard(tpl, this.d);
        }

        // ── Theme path ──
        return this._renderTheme(allowedThemes, tierId);
    }

    _renderTheme(allowedThemes, tierId) {
        const registry = {};
        allowedThemes.forEach(tid => {
            const t = getTheme(tid);
            if (t) registry[tid] = t;
        });

        const combo = _randomizer.getCombo(tierId, allowedThemes, registry);
        const theme = getTheme(combo.themeId);

        if (!theme) {
            return `<div style="width:1600px;height:900px;background:#0a0f1c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;">Theme Error</div>`;
        }

        return composeCard({
            theme,
            data: this.d,
            tier: this.tier,
            combo,
            randomizer: _randomizer,
        });
    }

    _renderSingleTheme(theme, tierId) {
        return composeCard({
            theme,
            data: this.d,
            tier: this.tier,
            combo: { themeId: theme.id, bgVariant: 0, charVariant: 0, accentIdx: 0, detailIdx: 0 },
            randomizer: _randomizer,
        });
    }
}
