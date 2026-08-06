import { SAFE_MARGIN, CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#fcd5ce', text: '#000000', accent: '#ff0a54', positive: '#38b000', negative: '#d00000', glow: 'rgba(255,10,84,0.3)', card: '#ffffff' },
    { bg: '#caf0f8', text: '#000000', accent: '#0077b6', positive: '#00b4d8', negative: '#e63946', glow: 'rgba(0,119,182,0.3)', card: '#ffffff' },
    { bg: '#fdf0d5', text: '#000000', accent: '#ffb703', positive: '#8ac926', negative: '#d90429', glow: 'rgba(255,183,3,0.3)', card: '#ffffff' },
    { bg: '#e0aaff', text: '#000000', accent: '#7209b7', positive: '#4cc9f0', negative: '#f72585', glow: 'rgba(114,9,183,0.3)', card: '#ffffff' },
];

export default {
    id: 'comic',
    name: 'Comic Pop',
    hasCharacter: true,
    bgVariants: 3,
    charVariants: 3,
    accentVariants: PALETTES.length,
    detailVariants: 3,

    getPalette(tierId, accentIdx, isProfit) {
        const p = PALETTES[accentIdx % PALETTES.length];
        return { ...p, positive: isProfit ? p.positive : p.negative, negative: p.negative };
    },

    getTypography() {
        return {
            display: "'Outfit', sans-serif",
            displayWeight: 900,
            body: "'Inter', sans-serif",
            mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        let bgSvg = '';
        const defs = `<defs><pattern id="halftone" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="4" fill="#000000" opacity="0.1"/>
        </pattern></defs>`;

        if (variant === 0) {
            let rays = '';
            for (let i = 0; i < 24; i++) {
                const a1 = (i*15) * Math.PI/180;
                const a2 = (i*15 + 7) * Math.PI/180;
                rays += `<polygon points="${W/2},${H/2} ${(W/2 + Math.cos(a1)*1500).toFixed(0)},${(H/2 + Math.sin(a1)*1500).toFixed(0)} ${(W/2 + Math.cos(a2)*1500).toFixed(0)},${(H/2 + Math.sin(a2)*1500).toFixed(0)}" fill="${pal.accent}" opacity="0.2"/>`;
            }
            bgSvg = `${defs}<rect width="${W}" height="${H}" fill="${pal.bg}"/>${rays}<rect width="${W}" height="${H}" fill="url(#halftone)"/>`;
        } else if (variant === 1) {
            bgSvg = `${defs}<rect width="${W}" height="${H}" fill="${pal.bg}"/><rect width="${W}" height="${H}" fill="url(#halftone)"/>
            <polygon points="0,0 ${W},0 0,${H}" fill="${pal.accent}" opacity="0.15"/>`;
        } else {
            bgSvg = `${defs}<rect width="${W}" height="${H}" fill="${pal.bg}"/><rect width="${W}" height="${H}" fill="url(#halftone)"/>
            <circle cx="${W/2}" cy="${H/2}" r="600" fill="none" stroke="${pal.accent}" stroke-width="40" stroke-dasharray="20 40" opacity="0.2"/>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;">${bgSvg}</svg>`;
    },

    renderCharacter(pal, emotion, isProfit, variant) {
        const faceColor = '#ffc8a2';
        let inner = '';
        if (isProfit) {
            inner = `<circle cx="150" cy="150" r="90" fill="${faceColor}" stroke="#000" stroke-width="8"/>
                <polygon points="90,130 140,130 150,150 100,150" fill="#000"/>
                <polygon points="160,130 210,130 200,150 150,150" fill="#000"/>
                <path d="M 120 180 Q 150 210 180 180" stroke="#000" stroke-width="6" fill="none" stroke-linecap="round"/>
                <circle cx="240" cy="220" r="40" fill="${faceColor}" stroke="#000" stroke-width="8"/>
                <path d="M 210 210 L 270 210" stroke="#000" stroke-width="6"/>
                <path d="M 210 230 L 270 230" stroke="#000" stroke-width="6"/>`;
        } else {
            inner = `<circle cx="150" cy="150" r="90" fill="${faceColor}" stroke="#000" stroke-width="8"/>
                <circle cx="120" cy="140" r="10" fill="#000"/><circle cx="180" cy="140" r="10" fill="#000"/>
                <path d="M 130 190 Q 150 170 170 190" stroke="#000" stroke-width="6" fill="none" stroke-linecap="round"/>
                <path d="M 100 200 C 80 150 120 120 150 150 C 180 120 220 150 200 200 Z" fill="${faceColor}" stroke="#000" stroke-width="8"/>`;
        }

        return `<div style="position:absolute;bottom:60px;left:40px;width:350px;height:350px;z-index:8;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
                <g transform="translate(40, 60)">
                    <circle cx="150" cy="150" r="120" fill="${isProfit ? pal.positive : pal.negative}" opacity="0.3"/>
                    ${inner}
                </g>
            </svg>
        </div>`;
    },

    renderEffects(pal, tierId, detailIdx) {
        const W = CARD_W, H = CARD_H;
        const cx = W - 320, cy = 250;
        let path = '';
        for (let i = 0; i < 20; i++) {
            const a1 = (i * 18) * Math.PI / 180;
            const a2 = (i * 18 + 9) * Math.PI / 180;
            const r1 = 300, r2 = 200 + Math.random() * 50;
            const x1 = cx + Math.cos(a1) * r1, y1 = cy + Math.sin(a1) * r1;
            const x2 = cx + Math.cos(a2) * r2, y2 = cy + Math.sin(a2) * r2;
            path += i === 0 ? `M ${x2.toFixed(0)} ${y2.toFixed(0)} L ${x1.toFixed(0)} ${y1.toFixed(0)} ` : `L ${x2.toFixed(0)} ${y2.toFixed(0)} L ${x1.toFixed(0)} ${y1.toFixed(0)} `;
        }
        path += 'Z';
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:4;">
            <path d="${path}" fill="${pal.accent}" stroke="#000" stroke-width="8" opacity="0.5"/>
        </svg>`;
    },

    getBorder(pal) {
        return `border: 4px solid #000; box-shadow: inset 0 0 0 8px #fff, inset 0 0 0 12px #000;`;
    },

    renderLayout({ S, cd, pal, typo }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;

        const lbl = (t) => `<div style="font-size:18px;font-family:${typo.display};color:#000;font-weight:900;text-transform:uppercase;margin-bottom:4px;border-bottom:3px solid #000;display:inline-block;padding-bottom:2px;">${t}</div>`;
        const dataVal = (v, c) => `<div style="font-size:32px;font-family:${typo.mono};font-weight:900;color:${c || '#000'};text-shadow:2px 2px 0 #fff;">${v}</div>`;
        const badge = (isProfit && tierBadge) ? `<div style="display:inline-block;padding:8px 16px;background:${pal.positive};border:4px solid #000;color:#000;font-size:20px;font-weight:900;text-transform:uppercase;transform:rotate(-3deg);box-shadow:4px 4px 0 #000;">${tierBadge}</div>` : '';

        return `<div style="position:relative;z-index:10;width:100%;height:100%;padding:${S + 24}px;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div style="background:#fff;border:4px solid #000;padding:16px 24px;box-shadow:6px 6px 0 #000;transform:rotate(-2deg);">
                    <div style="font-size:${tokSz}px;font-family:${typo.display};font-weight:${typo.displayWeight};color:#000;line-height:1;text-transform:uppercase;">${tok}</div>
                    ${usr ? `<div style="font-size:24px;font-family:${typo.body};font-weight:700;color:${pal.accent};margin-top:8px;">@${usr}</div>` : ''}
                </div>
                <div>${badge}</div>
            </div>
            <div style="position:relative;flex:1;">
                <div style="position:absolute;right:120px;top:80px;text-align:center;z-index:15;">
                    <div style="font-size:${Math.min(mulSz, 160)}px;font-family:${typo.display};font-weight:${typo.displayWeight};color:${profitColor};line-height:0.9;text-shadow:4px 4px 0 #000,-2px -2px 0 #000,2px -2px 0 #000,-2px 2px 0 #000;transform:rotate(5deg);">${mul}</div>
                    <div style="font-size:48px;font-family:${typo.mono};font-weight:900;color:#000;background:#fff;border:3px solid #000;padding:4px 12px;display:inline-block;margin-top:16px;transform:rotate(-3deg);box-shadow:4px 4px 0 #000;">${roi}</div>
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;background:#fff;padding:24px;border:6px solid #000;box-shadow:8px 8px 0 #000;margin-left:45%;">
                <div>${lbl('Entry')}<br/>${dataVal(ent)}</div>
                <div>${lbl('Exit')}<br/>${dataVal(ext)}</div>
                <div>${lbl('Invested')}<br/>${dataVal(inv)}</div>
                <div>${lbl('P/L')}<br/>${dataVal(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
