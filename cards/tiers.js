// ═══════════════════════════════════════════════════════════
//  PERFORMANCE TIER CLASSIFIER
//  Single source of truth for all tier thresholds.
//
//  Boundary Rule (STRICT, NON-OVERLAPPING):
//    minMul <= multiplier < maxMul   (lower inclusive, upper exclusive)
//  Exception: profit_14 uses maxMul = Infinity (no upper bound).
//  Exception: loss_5 uses minMul = -Infinity (no lower bound).
//
//  Profit tiers:  multiplier >= 1.0
//  Loss tiers:    multiplier < 1.0  (includes 0 and negatives)
// ═══════════════════════════════════════════════════════════
import { TIER_DEFS } from './config.js';

/**
 * Classifies a trade result into a performance tier.
 * @param {number} multiplier - The X multiple (targetMC / initMC)
 * @returns {{ id: string|null, def: object|null }}
 */
export function classifyTier(multiplier) {
    if (typeof multiplier !== 'number' || !isFinite(multiplier) && multiplier !== Infinity && multiplier !== -Infinity) {
        console.warn('[Tier] Invalid multiplier:', multiplier);
        return { id: null, def: null };
    }

    // Scan tiers: minMul <= multiplier < maxMul (exclusive upper bound)
    for (const [id, def] of Object.entries(TIER_DEFS)) {
        const inRange = multiplier >= def.minMul && multiplier < def.maxMul;
        // Special case: profit_14 has maxMul=Infinity → >= minMul is enough
        const isTopTier = def.maxMul === Infinity && multiplier >= def.minMul;
        if (inRange || isTopTier) {
            return { id, def };
        }
    }

    // Should never reach here if TIER_DEFS covers all real numbers.
    console.error('[Tier] No tier matched for multiplier:', multiplier);
    return { id: null, def: null };
}

// ── Boundary Self-Validation ────────────────────────────────
// Runs once on load. Tests critical boundary values to catch any
// future config regressions immediately in the browser console.
function _validateTierBoundaries() {
    const tests = [
        // Profit tiers — test at boundaries
        { val: 1.0,    expected: 'profit_1'  },
        { val: 1.49,   expected: 'profit_1'  },
        { val: 1.5,    expected: 'profit_2'  },
        { val: 2.499,  expected: 'profit_2'  },
        { val: 2.5,    expected: 'profit_3'  },
        { val: 3.499,  expected: 'profit_3'  },
        { val: 3.5,    expected: 'profit_4'  },
        { val: 4.999,  expected: 'profit_4'  },
        { val: 5.0,    expected: 'profit_5'  },
        { val: 9.999,  expected: 'profit_5'  },
        { val: 10.0,   expected: 'profit_6'  },
        { val: 19.999, expected: 'profit_6'  },
        { val: 20.0,   expected: 'profit_7'  },
        { val: 39.999, expected: 'profit_7'  },
        { val: 40.0,   expected: 'profit_8'  },
        { val: 74.999, expected: 'profit_8'  },
        { val: 75.0,   expected: 'profit_9'  },
        { val: 99.999, expected: 'profit_9'  },
        { val: 100.0,  expected: 'profit_10' },
        { val: 199.999,expected: 'profit_10' },
        { val: 200.0,  expected: 'profit_11' },
        { val: 500.0,  expected: 'profit_14' },
        { val: 10000,  expected: 'profit_14' },
        // Loss tiers
        { val: 0.999,  expected: 'loss_1'    },
        { val: 0.5,    expected: 'loss_1'    },
        { val: 0.0,    expected: 'loss_1'    },
        { val: -0.001, expected: 'loss_2'    },
        { val: -0.999, expected: 'loss_2'    },
        { val: -1.0,   expected: 'loss_3'    },
        { val: -4.999, expected: 'loss_3'    },
        { val: -5.0,   expected: 'loss_4'    },
        { val: -9.999, expected: 'loss_4'    },
        { val: -10.0,  expected: 'loss_5'    },
        { val: -100,   expected: 'loss_5'    },
    ];

    let errors = 0;
    for (const t of tests) {
        const result = classifyTier(t.val);
        if (result.id !== t.expected) {
            console.error(`[Tier FAIL] ${t.val} → got "${result.id}", expected "${t.expected}"`);
            errors++;
        }
    }
    if (errors === 0) {
        console.log('[Tier] ✅ All', tests.length, 'boundary tests passed.');
    } else {
        console.error('[Tier] ❌', errors, 'boundary test(s) FAILED. Check config.js TIER_DEFS.');
    }
}

_validateTierBoundaries();
