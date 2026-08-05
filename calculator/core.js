/**
 * Calculates Market Cap Return on Investment
 * @param {number} initMC - Initial Market Cap (Real value, including multiplier)
 * @param {number} targetMC - Target Market Cap (Real value, including multiplier)
 * @param {number} investment - Investment amount
 * @returns {object} Results containing multiplier, finalValue, profit, and roi
 */
export const calculateROI = (initMC, targetMC, investment) => {
    if (initMC <= 0 || investment <= 0 || targetMC <= 0) {
        return {
            isValid: false,
            multiplier: 0,
            finalValue: 0,
            profit: 0,
            roi: 0
        };
    }

    const multiplier = targetMC / initMC;
    const finalValue = investment * multiplier;
    const profit = finalValue - investment;
    const roi = (profit / investment) * 100;

    return {
        isValid: true,
        multiplier,
        finalValue,
        profit,
        roi
    };
};
