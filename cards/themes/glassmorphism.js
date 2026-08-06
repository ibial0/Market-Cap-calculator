import { SAFE_MARGIN, CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#0b0c10', text: '#ffffff', accent: '#45f3ff', positive: '#00ff88', negative: '#ff3366', glow: 'rgba(69,243,255,0.5)', card: 'rgba(255,255,255,0.06)' },
    { bg: '#100b16', text: '#ffffff', accent: '#b026ff', positive: '#00ff88', negative: '#ff3366', glow: 'rgba(176,38,255,0.5)', card: 'rgba(255,255,255,0.06)' },
    { bg: '#091515', text: '#ffffff', accent: '#26ffb0', positive: '#26ffb0', negative: '#ff3366', glow: 'rgba(38,255,176,0.5)', card: 'rgba(255,255,255,0.06)' },
    { bg: '#160a0a', text: '#ffffff', accent: '#ff265c', positive: '#00ff88', negative: '#ff265c', glow: 'rgba(255,38,92,0.5)', card: 'rgba(255,255,255,0.06)' },
];

export default {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    hasCharacter: false,
    bgVariants: 4,
    charVariants: 1,
    accentVariants: PALETTES.length,
    detailVariants: 3,

    getPalette(tierId, accentIdx, isProfit) {
        const p = PALETTES[accentIdx % PALETTES.length];
        return { ...p, positive: isProfit ? p.positive : p.text, negative: p.negative };
    },

    getTypography() {
        return {
            display: "'Outfit', sans-serif",
            displayWeight: 700,
            body: "'Inter', sans-serif",
            mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        let orbs = '';

        if (variant === 0) {
            orbs = `<circle cx="${W*0.2}" cy="${H*0.2}" r="300" fill="${pal.accent}" opacity="0.15"/>
                <circle cx="${W*0.8}" cy="${H*0.8}" r="400" fill="${pal.positive}" opacity="0.1"/>`;
        } else if (variant === 1) {
            orbs = `<circle cx="${W*0.5}" cy="${H*0.5}" r="500" fill="${pal.accent}" opacity="0.12"/>`;
        } else if (variant === 2) {
            orbs = `<circle cx="${W}" cy="0" r="450" fill="${pal.accent}" opacity="0.18"/>
                <circle cx="0" cy="${H}" r="450" fill="${pal.positive}" opacity="0.12"/>`;
        } else {
            orbs = `<circle cx="${W*0.2}" cy="${H*0.8}" r="350" fill="${pal.accent}" opacity="0.14"/>
                <circle cx="${W*0.8}" cy="${H*0.2}" r="350" fill="${pal.negative}" opacity="0.1"/>
                <circle cx="${W*0.5}" cy="${H*0.5}" r="250" fill="${pal.positive}" opacity="0.08"/>`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;">
            <defs><filter id="orbBlur"><feGaussianBlur stdDeviation="120"/></filter></defs>
            <rect width="${W}" height="${H}" fill="${pal.bg}"/>
            <g filter="url(#orbBlur)">${orbs}</g>
        </svg>`;
    },

    renderCharacter() { return ''; },

    renderEffects(pal, tierId, detailIdx) {
        return '';
    },

    getBorder(pal) {
        return `border-radius:24px;border:1px solid rgba(255,255,255,0.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,0.05);`;
    },

    renderLayout({ S, cd, pal, typo }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;

        const glassStyle = `background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:16px;box-shadow:0 8px 32px 0 rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1);`;

        const lbl = (t) => `<div style="font-size:14px;font-family:${typo.body};color:${pal.text};opacity:0.6;font-weight:500;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;">${t}</div>`;
        const dataVal = (v, c) => `<div style="font-size:26px;font-family:${typo.mono};font-weight:700;color:${c || pal.text};">${v}</div>`;
        const badge = (isProfit && tierBadge) ? `<div style="display:inline-flex;align-items:center;padding:8px 24px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:${pal.text};border-radius:50px;font-size:16px;font-weight:700;letter-spacing:2px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">${tierBadge}</div>` : '';

        return `<div style="position:relative;z-index:10;width:100%;height:100%;padding:${S}px;display:flex;flex-direction:column;justify-content:space-between;">
            <!-- Top Glass Panel -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding:24px 32px;${glassStyle}">
                <div style="display:flex;align-items:center;gap:24px;">
                    <div style="font-size:${Math.min(tokSz, 72)}px;font-family:${typo.display};font-weight:700;color:${pal.text};line-height:1;text-shadow:0 2px 10px rgba(0,0,0,0.3);">${tok}</div>
                    ${badge}
                </div>
                <div style="text-align:right;">
                    ${usr ? `<div style="font-size:20px;font-family:${typo.body};font-weight:500;color:${pal.text};opacity:0.8;">${usr}</div>` : ''}
                </div>
            </div>

            <!-- Center Hero Numbers -->
            <div style="padding:0 32px;display:flex;flex-direction:column;justify-content:center;">
                <div style="font-size:${Math.min(mulSz, 180)}px;font-family:${typo.display};font-weight:700;color:${profitColor};line-height:1;letter-spacing:-0.02em;text-shadow:0 0 60px ${pal.glow};">${mul}</div>
                <div style="font-size:48px;font-family:${typo.mono};font-weight:700;color:${pal.text};opacity:0.9;margin-top:16px;text-shadow:0 2px 10px rgba(0,0,0,0.3);">${roi}</div>
            </div>

            <!-- Bottom Glass Panel -->
            <div style="display:flex;gap:48px;flex-wrap:wrap;padding:32px;${glassStyle}">
                <div>${lbl('Entry MC')}${dataVal(ent)}</div>
                <div>${lbl('Exit MC')}${dataVal(ext)}</div>
                <div>${lbl('Investment')}${dataVal(inv)}</div>
                <div>${lbl('Profit')}${dataVal(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
