// ═══════════════════════════════════════════════════════════
//  CARD ENGINE — Main Orchestrator (V2)
// ═══════════════════════════════════════════════════════════
import { THEME_TIER_MATRIX } from './config.js';
import { classifyTier } from './tiers.js';
import { Randomizer } from './randomizer.js';
import { composeCard } from './renderer.js';
import { getTheme, getAllThemeIds } from './themes/index.js';

const _randomizer = new Randomizer();

export class CardEngine {
    constructor(data) {
        this.d = data;
        this.isProfit = data.profit >= 0;
        this.tier = classifyTier(data.multiplier, data.roi, this.isProfit);
    }

    buildHTML() {
        const tierId = this.tier.id;

        // Get themes compatible with this tier
        const allowedThemes = getAllThemeIds().filter(tid => {
            const matrix = THEME_TIER_MATRIX[tid];
            return matrix && matrix.includes(tierId);
        });

        if (allowedThemes.length === 0) {
            // Fallback — use all themes
            allowedThemes.push(...getAllThemeIds());
        }

        // Build theme registry for randomizer
        const registry = {};
        allowedThemes.forEach(tid => {
            const t = getTheme(tid);
            if (t) registry[tid] = t;
        });

        // Get unique combo
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
