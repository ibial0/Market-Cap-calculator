// ═══════════════════════════════════════════════════════════
//  THEME: COMIC POP
//  Character fills CHAR_ZONE via viewBox+100% sizing.
//  Layout fills TEXT_ZONE via flex.
// ═══════════════════════════════════════════════════════════
import { CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#fcd5ce', text: '#000000', accent: '#ff0a54', positive: '#38b000', negative: '#d00000', glow: 'rgba(255,10,84,0.3)',   card: '#ffffff' },
    { bg: '#caf0f8', text: '#000000', accent: '#0077b6', positive: '#00b4d8', negative: '#e63946', glow: 'rgba(0,119,182,0.3)',  card: '#ffffff' },
    { bg: '#fdf0d5', text: '#000000', accent: '#ffb703', positive: '#8ac926', negative: '#d90429', glow: 'rgba(255,183,3,0.3)',  card: '#ffffff' },
    { bg: '#e0aaff', text: '#000000', accent: '#7209b7', positive: '#4cc9f0', negative: '#f72585', glow: 'rgba(114,9,183,0.3)', card: '#ffffff' },
];

export default {
    id: 'comic',
    name: 'Comic Pop',
    hasCharacter: true,
    bgVariants:     3,
    charVariants:   2,
    accentVariants: PALETTES.length,
    detailVariants: 1,

    getPalette(tierId, accentIdx, isProfit) {
        return { ...PALETTES[accentIdx % PALETTES.length] };
    },

    getTypography() {
        return {
            display:       "'Outfit', sans-serif",
            displayWeight: 900,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        const defs = `<defs><pattern id="ht" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="3.5" fill="#000" opacity="0.08"/></pattern></defs>`;

        let inner = '';
        if (variant === 0) {
            // Sunburst
            let rays = '';
            for (let i = 0; i < 24; i++) {
                const a1 = (i*15) * Math.PI/180;
                const a2 = (i*15+7) * Math.PI/180;
                rays += `<polygon points="${W/2},${H/2} ${(W/2+Math.cos(a1)*1600).toFixed(0)},${(H/2+Math.sin(a1)*1600).toFixed(0)} ${(W/2+Math.cos(a2)*1600).toFixed(0)},${(H/2+Math.sin(a2)*1600).toFixed(0)}" fill="${pal.accent}" opacity="0.18"/>`;
            }
            inner = `<rect width="${W}" height="${H}" fill="${pal.bg}"/>${rays}<rect width="${W}" height="${H}" fill="url(#ht)"/>`;
        } else if (variant === 1) {
            inner = `<rect width="${W}" height="${H}" fill="${pal.bg}"/><rect width="${W}" height="${H}" fill="url(#ht)"/>
                <polygon points="0,0 ${W},0 0,${H}" fill="${pal.accent}" opacity="0.12"/>`;
        } else {
            inner = `<rect width="${W}" height="${H}" fill="${pal.bg}"/><rect width="${W}" height="${H}" fill="url(#ht)"/>
                <circle cx="${W/2}" cy="${H/2}" r="620" fill="none" stroke="${pal.accent}" stroke-width="38" stroke-dasharray="18 38" opacity="0.18"/>`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
            style="position:absolute;top:0;left:0;pointer-events:none;">
            ${defs}${inner}
        </svg>`;
    },

    // Character fills CHAR_ZONE (100%×100%)
    renderCharacter(pal, emotion, isProfit, variant) {
        const faceColor = '#ffc8a2';
        let inner = '';

        if (isProfit) {
            // Sunglasses + fist pump
            inner = `
                <circle cx="155" cy="155" r="90" fill="${faceColor}" stroke="#000" stroke-width="7"/>
                <polygon points="95,128 140,128 150,148 100,148" fill="#000"/>
                <polygon points="160,128 205,128 196,148 150,148" fill="#000"/>
                <path d="M 122 185 Q 155 215 188 185" stroke="#000" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        } else {
            // Sad face + tear
            inner = `
                <circle cx="155" cy="155" r="90" fill="${faceColor}" stroke="#000" stroke-width="7"/>
                <circle cx="125" cy="142" r="10" fill="#111"/>
                <circle cx="185" cy="142" r="10" fill="#111"/>
                <path d="M 200 158 Q 212 177 202 186 Q 192 177 200 158" fill="#00aaff" opacity="0.85"/>
                <path d="M 135 192 Q 155 172 175 192" stroke="#000" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 310 310"
            width="100%" height="100%"
            preserveAspectRatio="xMidYMid meet">
            <circle cx="155" cy="155" r="115" fill="${isProfit ? pal.positive : pal.negative}" opacity="0.25"/>
            ${inner}
        </svg>`;
    },

    renderEffects() { return ''; },

    getBorder(pal) {
        return `border:5px solid #000; box-shadow:inset 0 0 0 6px #fff, inset 0 0 0 11px #000;`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext,
                isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;

        const lbl = (t) => `<div style="font-size:16px;font-family:${typo.display};color:#000;font-weight:900;text-transform:uppercase;margin-bottom:5px;border-bottom:2.5px solid #000;display:inline-block;padding-bottom:2px;white-space:nowrap;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:28px;font-family:${typo.mono};font-weight:900;color:${c || '#000'};text-shadow:1px 1px 0 #fff;white-space:nowrap;line-height:1.1;">${v}</div>`;

        const badge = (isProfit && tierBadge) ? `
            <div style="display:inline-block;padding:7px 16px;background:${pal.positive};border:3px solid #000;color:#000;font-size:18px;font-weight:900;text-transform:uppercase;transform:rotate(-3deg);box-shadow:4px 4px 0 #000;white-space:nowrap;">${tierBadge}</div>` : '';

        const usrEl = usr ? `<div style="font-size:22px;font-family:${typo.body};font-weight:700;color:${pal.accent};margin-top:${badge?'8px':'0'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">@${usr}</div>` : '';

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:${S}px;box-sizing:border-box;">
            <!-- Top: token panel -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
                <div style="background:#fff;border:4px solid #000;padding:14px 20px;box-shadow:5px 5px 0 #000;transform:rotate(-2deg);flex:1;min-width:0;overflow:hidden;">
                    <div style="font-size:${tokSz}px;font-family:${typo.display};font-weight:${typo.displayWeight};color:#000;line-height:1.05;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tok}</div>
                    ${usrEl}
                </div>
                <div style="flex-shrink:0;text-align:right;">${badge}</div>
            </div>
            <!-- Center: hero numbers -->
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
                <div style="font-size:${mulSz}px;font-family:${typo.display};font-weight:${typo.displayWeight};color:${profitColor};line-height:1;text-shadow:4px 4px 0 #000,-2px -2px 0 #000;transform:rotate(3deg);white-space:nowrap;overflow:hidden;">${mul}</div>
                <div style="font-size:42px;font-family:${typo.mono};font-weight:900;color:#000;background:#fff;border:3px solid #000;padding:4px 12px;display:inline-block;margin-top:14px;transform:rotate(-2deg);box-shadow:3px 3px 0 #000;white-space:nowrap;">${roi}</div>
            </div>
            <!-- Bottom: data panel -->
            <div style="display:flex;gap:0;background:#fff;padding:20px 24px;border:5px solid #000;box-shadow:6px 6px 0 #000;">
                <div style="flex:1;min-width:0;">${lbl('Entry')}<br/>${dval(ent)}</div>
                <div style="flex:1;min-width:0;">${lbl('Exit')}<br/>${dval(ext)}</div>
                <div style="flex:1;min-width:0;">${lbl('Invested')}<br/>${dval(inv)}</div>
                <div style="flex:1;min-width:0;">${lbl('P/L')}<br/>${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
