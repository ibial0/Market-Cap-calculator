export const formatNumber = (num, maxFrac = 2) => {
    if (isNaN(num) || num === 0) return '0.00';
    return num.toLocaleString('en-US', { maximumFractionDigits: maxFrac });
};

export const parseAmount = (str) => {
    if (typeof str !== 'string') str = String(str);
    return parseFloat(str.replace(/,/g, '')) || 0;
};
