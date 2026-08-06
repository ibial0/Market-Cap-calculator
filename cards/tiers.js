// ═══════════════════════════════════════════════════════════
//  PERFORMANCE TIER CLASSIFIER
// ═══════════════════════════════════════════════════════════
import { TIER_DEFS } from './config.js';

/**
 * Classifies a trade result into a performance tier
 * @param {number} multiplier - The X multiple (targetMC / initMC)
 * @param {number} roi - ROI percentage
 * @param {boolean} isProfit - Whether the trade is profitable
 * @returns {{ id: string, def: object }} Tier ID and its definition
 */
export function classifyTier(multiplier, roi, isProfit) {
    let id;

    if (!isProfit) {
        if (roi <= -60)       id = 'rekt';
        else if (roi <= -25)  id = 'medium_loss';
        else                  id = 'small_loss';
    } else {
        if (multiplier >= 5 || roi >= 400)   id = 'mega_win';
        else if (multiplier >= 2 || roi >= 100) id = 'big_win';
        else if (multiplier >= 1.2 || roi >= 20) id = 'solid_win';
        else id = 'micro_win';
    }

    return { id, def: TIER_DEFS[id] };
}
