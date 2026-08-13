// ═══════════════════════════════════════════════════════════
//  PERFORMANCE TIER CLASSIFIER
//  Single source of truth for all tier thresholds.
//  Thresholds are based on the profit multiplier (X):
//    1.00x = break-even, 2.00x = +100% profit, etc.
// ═══════════════════════════════════════════════════════════
import { TIER_DEFS } from './config.js';

/**
 * Classifies a trade result into a performance tier.
 * @param {number} multiplier - The X multiple (targetMC / initMC)
 * @param {number} roi        - ROI percentage (can be negative)
 * @param {boolean} isProfit  - Whether the trade is profitable
 * @returns {{ id: string, def: object }}
 */
export function classifyTier(multiplier) {
    let matchedId = null;

    // Strict sequential check against boundaries
    for (const [id, def] of Object.entries(TIER_DEFS)) {
        if (multiplier >= def.minMul && multiplier <= def.maxMul) {
            matchedId = id;
            break;
        }
    }

    return { id: matchedId, def: matchedId ? TIER_DEFS[matchedId] : null };
}

// ── Boundary Tests (Self-Validation) ───────────────
function _validateTierBoundaries() {
    const testVals = [
        1, 1.49, 1.5, 2.49, 2.5, 3.49, 3.5, 4.99, 5, 9.99, 10, 19.99, 20, 
        39.99, 40, 74.99, 75, 99.99, 100, 199.99, 200, 299.99, 300, 399.99, 
        400, 499.99, 500, 1000,
        0.99, 0, -0.99, -1, -1.99, -2, -4.99, -5, -10, -50
    ];
    let errors = 0;
    for (const val of testVals) {
        const t = classifyTier(val);
        if (!t.id) {
            console.error(`[Tier Test] ERROR: Value ${val} matches NO tier.`);
            errors++;
        }
    }
    if (errors === 0) console.log('[Tier Test] All boundary validations passed.');
}
// Run once on load to ensure integrity
_validateTierBoundaries();
