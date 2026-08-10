// ═══════════════════════════════════════════════════════════
//  CARD ENGINE — Main Orchestrator
//  Selects an eligible theme OR PNG template for the user's
//  tier and builds the card HTML.
//  Both systems return the same: a 1600×900 HTML string.
// ═══════════════════════════════════════════════════════════
import { THEME_TIER_MATRIX } from './config.js';
import { classifyTier } from './tiers.js';
import { Randomizer } from './randomizer.js';
import { composeCard } from './renderer.js';
import { getTheme, getAllThemeIds } from './themes/index.js';
import { getActivePNGTemplates, getPNGTemplate } from './png-loader.js';
import { composePNGCard } from './png-engine.js';

const _randomizer = new Randomizer();

export class CardEngine {
    constructor(data) {
        this.d       = data;
        this.isProfit = data.profit >= 0;
        this.tier    = classifyTier(data.multiplier, data.roi, this.isProfit);
    }

    buildHTML() {
        const tierId = this.tier.id;

        // ── Theme candidates (existing system, unchanged) ──
        let allowedThemes = getAllThemeIds().filter(tid => {
            const matrix = THEME_TIER_MATRIX[tid];
            return matrix && matrix.includes(tierId);
        });
        if (allowedThemes.length === 0) {
            console.warn(`[CardEngine] No themes for tier "${tierId}", using all active themes.`);
            allowedThemes = getAllThemeIds();
        }

        // ── PNG template candidates (new system) ──
        const pngTemplates = getActivePNGTemplates().filter(tpl => {
            if (!tpl.tiers || tpl.tiers.length === 0) return true;
            return tpl.tiers.includes(tierId);
        });

        // ── Build unified pool ──
        // Each entry knows its type so we can route to the correct renderer.
        const pool = [
            ...allowedThemes.map(tid => ({ type: 'theme', id: tid })),
            ...pngTemplates.map(tpl => ({ type: 'png',   id: tpl.id })),
        ];

        if (pool.length === 0) {
            return `<div style="width:1600px;height:900px;background:#0a0f1c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;">No card templates available</div>`;
        }

        // ── Random pick from unified pool ──
        const pick = pool[Math.floor(Math.random() * pool.length)];

        // ── PNG template path ──
        if (pick.type === 'png') {
            const tpl = getPNGTemplate(pick.id);
            if (!tpl) {
                console.warn('[CardEngine] PNG template not found in cache:', pick.id);
                // Fall back to first theme
                return this._renderTheme(allowedThemes, tierId);
            }
            // Attach tier info so png-engine can use it if needed
            const dataWithTier = {
                ...this.d,
                tierBadge: this.tier.def?.badge || this.tier.id.toUpperCase(),
            };
            return composePNGCard(tpl, dataWithTier);
        }

        // ── Theme path (existing logic) ──
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
}
