// ═══════════════════════════════════════════════════════════
//  THEME: GLASSMORPHISM
//  No character. Layout fills TEXT_ZONE via flex.
// ═══════════════════════════════════════════════════════════
import { CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#0b0c10', text: '#ffffff', accent: '#45f3ff', positive: '#00ff88', negative: '#ff3366', glow: 'rgba(69,243,255,0.5)',  card: 'rgba(255,255,255,0.06)' },
    { bg: '#100b16', text: '#ffffff', accent: '#b026ff', positive: '#00ff88', negative: '#ff3366', glow: 'rgba(176,38,255,0.5)', card: 'rgba(255,255,255,0.06)' },
    { bg: '#091515', text: '#ffffff', accent: '#26ffb0', positive: '#26ffb0', negative: '#ff3366', glow: 'rgba(38,255,176,0.5)', card: 'rgba(255,255,255,0.06)' },
    { bg: '#160a0a', text: '#ffffff', accent: '#ff265c', positive: '#00ff88', negative: '#ff265c', glow: 'rgba(255,38,92,0.5)',  card: 'rgba(255,255,255,0.06)' },
];

export default {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    hasCharacter: false,
    bgVariants:     4,
    charVariants:   1,
    accentVariants: PALETTES.length,
    detailVariants: 1,

    getPalette(tierId, accentIdx, isProfit) {
        return { ...PALETTES[accentIdx % PALETTES.length] };
    },

    getTypography() {
        return {
            display:       "'Outfit', sans-serif",
            displayWeight: 700,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        const orbs = [
            [[W*0.2, H*0.2, 300], [W*0.8, H*0.8, 400, pal.positive]],
            [[W*0.5, H*0.5, 500]],
            [[W, 0, 450], [0, H, 450, pal.positive]],
            [[W*0.2, H*0.8, 350], [W*0.8, H*0.2, 350, pal.negative], [W*0.5, H*0.5, 250, pal.positive]],
        ][variant % 4];

        const circles = orbs.map(([cx, cy, r, fill]) =>
            `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill || pal.accent}" opacity="0.18"/>`
        ).join('');

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
            style="position:absolute;top:0;left:0;pointer-events:none;">
            <defs><filter id="gblur"><feGaussianBlur stdDeviation="120"/></filter></defs>
            <rect width="${W}" height="${H}" fill="${pal.bg}"/>
            <g filter="url(#gblur)">${circles}</g>
        </svg>`;
    },

    renderCharacter() { return ''; },
    renderEffects()   { return ''; },

    getBorder(pal) {
        return `border-radius:24px; border:1px solid rgba(255,255,255,0.08);`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext,
                isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;

        const glass = `
            background:rgba(255,255,255,0.06);
            border:1px solid rgba(255,255,255,0.1);
            border-radius:16px;
            box-shadow:0 8px 32px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.08);`;

        const lbl = (t) => `<div style="font-size:14px;font-family:${typo.body};color:${pal.text};opacity:0.55;font-weight:500;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px;white-space:nowrap;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:30px;font-family:${typo.mono};font-weight:700;color:${c || pal.text};white-space:nowrap;line-height:1.1;">${v}</div>`;

        const badge = (isProfit && tierBadge) ? `
            <div style="display:inline-flex;align-items:center;padding:7px 20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:${pal.text};border-radius:50px;font-size:15px;font-weight:700;letter-spacing:2px;white-space:nowrap;">${tierBadge}</div>` : '';

        const usrEl = usr ? `<div style="font-size:22px;font-family:${typo.body};color:${pal.text};opacity:0.5;margin-top:${badge?'10px':'0'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${usr}</div>` : '';

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:${S}px;box-sizing:border-box;gap:${S}px;">

            <!-- Top glass panel -->
            <div style="display:flex;justify-content:space-between;align-items:center;padding:22px 28px;${glass}">
                <div style="flex:1;min-width:0;overflow:hidden;">
                    <div style="font-size:${tokSz}px;font-family:${typo.display};font-weight:700;color:${pal.text};line-height:1.05;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tok}</div>
                </div>
                <div style="flex-shrink:0;text-align:right;padding-left:20px;">
                    ${badge}${usrEl}
                </div>
            </div>

            <!-- Center hero numbers -->
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 ${S}px;">
                <div style="font-size:${mulSz}px;font-family:${typo.display};font-weight:700;color:${profitColor};line-height:1;letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;text-shadow:0 0 60px ${pal.glow};">${mul}</div>
                <div style="font-size:48px;font-family:${typo.mono};font-weight:700;color:${pal.text};opacity:0.8;margin-top:12px;white-space:nowrap;">${roi}</div>
            </div>

            <!-- Bottom glass panel -->
            <div style="display:flex;gap:0;padding:28px;${glass}">
                <div style="flex:1;min-width:0;">${lbl('Entry MC')}${dval(ent)}</div>
                <div style="flex:1;min-width:0;">${lbl('Exit MC')}${dval(ext)}</div>
                <div style="flex:1;min-width:0;">${lbl('Invested')}${dval(inv)}</div>
                <div style="flex:1;min-width:0;">${lbl('P / L')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
