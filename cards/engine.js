// ═══════════════════════════════════════════════════════════
//  CARD ENGINE — Main Orchestrator
//  Selects an eligible theme for the user's tier and builds HTML.
// ═══════════════════════════════════════════════════════════
import { THEME_TIER_MATRIX } from './config.js';
import { classifyTier } from './tiers.js';
import { Randomizer } from './randomizer.js';
import { composeCard } from './renderer.js';
import { getTheme, getAllThemeIds } from './themes/index.js';

const _randomizer = new Randomizer();

export class CardEngine {
    constructor(data) {
        this.d    = data;
        this.isProfit = data.profit >= 0;
        this.tier = classifyTier(data.multiplier, data.roi, this.isProfit);
    }

    buildHTML() {
        const tierId = this.tier.id;

        // 1. Find themes compatible with this tier (only ACTIVE themes are in the registry)
        let allowedThemes = getAllThemeIds().filter(tid => {
            const matrix = THEME_TIER_MATRIX[tid];
            return matrix && matrix.includes(tierId);
        });

        // 2. Fallback: if no theme covers this exact tier, use all active themes
        if (allowedThemes.length === 0) {
            console.warn(`[CardEngine] No themes for tier "${tierId}", using all active themes.`);
            allowedThemes = getAllThemeIds();
        }

        // 3. Build registry subset for the randomizer
        const registry = {};
        allowedThemes.forEach(tid => {
            const t = getTheme(tid);
            if (t) registry[tid] = t;
        });

        // 4. Pick a unique combo
        const combo = _randomizer.getCombo(tierId, allowedThemes, registry);
        const theme = getTheme(combo.themeId);

        if (!theme) {
            return `<div style="width:1600px;height:900px;background:#0a0f1c;display:flex;align-items:center;justify-content:center;color:#fff;font-size:32px;">Theme Error</div>`;
        }

        return composeCard({ theme, data: this.d, tier: this.tier, combo, randomizer: _randomizer });
    }
}
