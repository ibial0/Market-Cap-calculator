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
export function classifyTier(multiplier, roi, isProfit) {
    let id;

    if (!isProfit || multiplier < 1) {
        // Loss territory
        if (multiplier < 0.5)   id = 'medium_loss';   // Heavy Loss: below 0.50x
        else                    id = 'small_loss';     // Small Loss: 0.50x – 0.99x
    } else {
        // Profit territory — multiplier >= 1.0
        if (multiplier >= 10)       id = 'legendary';   // 10x+
        else if (multiplier >= 5)   id = 'mega_win';    // 5x – 9.99x
        else if (multiplier >= 3)   id = 'big_win';     // 3x – 4.99x
        else if (multiplier >= 1.5) id = 'solid_win';  // 1.5x – 2.99x
        else                        id = 'micro_win';   // 1.0x – 1.49x (small/break-even win)
    }

    return { id, def: TIER_DEFS[id] };
}
