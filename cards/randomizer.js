// ═══════════════════════════════════════════════════════════
//  RANDOMIZATION & UNIQUENESS ENGINE
// ═══════════════════════════════════════════════════════════

const MAX_HISTORY = 12;

export class Randomizer {
    constructor() {
        this._history = [];
    }

    /** Pick random element from array */
    pick(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /** Pick random int in range [min, max] inclusive */
    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Pick a random float in range [min, max) */
    randFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Generate a unique combination that hasn't been served recently
     * @param {string} tierId - Current tier
     * @param {string[]} allowedThemes - Theme IDs allowed for this tier
     * @param {object} themeRegistry - Map of theme objects
     * @returns {{ themeId, bgVariant, charVariant, accentIdx, detailIdx }}
     */
    getCombo(tierId, allowedThemes, themeRegistry) {
        const maxAttempts = 20;
        let combo = null;

        for (let i = 0; i < maxAttempts; i++) {
            const themeId = this.pick(allowedThemes);
            const theme = themeRegistry[themeId];
            if (!theme) continue;

            const bgVariant = this.randInt(0, (theme.bgVariants || 3) - 1);
            const charVariant = this.randInt(0, (theme.charVariants || 3) - 1);
            const accentIdx = this.randInt(0, (theme.accentVariants || 3) - 1);
            const detailIdx = this.randInt(0, (theme.detailVariants || 3) - 1);

            const key = `${themeId}-${bgVariant}-${charVariant}-${accentIdx}-${detailIdx}`;

            if (!this._history.includes(key)) {
                combo = { themeId, bgVariant, charVariant, accentIdx, detailIdx, _key: key };
                break;
            }
        }

        // Fallback if all attempts collided with history
        if (!combo) {
            const themeId = this.pick(allowedThemes);
            combo = {
                themeId,
                bgVariant: this.randInt(0, 2),
                charVariant: this.randInt(0, 2),
                accentIdx: this.randInt(0, 2),
                detailIdx: this.randInt(0, 2),
                _key: `fallback-${Date.now()}`
            };
        }

        // Track history
        this._history.push(combo._key);
        if (this._history.length > MAX_HISTORY) {
            this._history.shift();
        }

        return combo;
    }

    /** Clear history (e.g., on page reload) */
    reset() {
        this._history = [];
    }
}
