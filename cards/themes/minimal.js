// ═══════════════════════════════════════════════════════════
//  THEME: MINIMAL — Typography-led, no character, clean flex
//  Signature: Extreme font weight contrast, single accent color
// ═══════════════════════════════════════════════════════════
import { SAFE_MARGIN, CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#08090c', text: '#f0f0f0', accent: '#00ff88', positive: '#00ff88', negative: '#ff4b4b', glow: 'rgba(0,255,136,0.15)', card: '#0d0e12' },
    { bg: '#0a0a10', text: '#eaeaea', accent: '#4facfe', positive: '#4facfe', negative: '#ff4b4b', glow: 'rgba(79,172,254,0.15)', card: '#0e0e16' },
    { bg: '#0c0808', text: '#f5f0ec', accent: '#FFD700', positive: '#FFD700', negative: '#ff4b4b', glow: 'rgba(255,215,0,0.15)', card: '#110d08' },
    { bg: '#080a0c', text: '#e8eef4', accent: '#00f2fe', positive: '#00f2fe', negative: '#ff4b4b', glow: 'rgba(0,242,254,0.15)', card: '#0a0f14' },
];

export default {
    id: 'minimal',
    name: 'Minimal',
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
            display: "'Inter', sans-serif",
            displayWeight: 900,
            body: "'Inter', sans-serif",
            mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        const ac = pal.accent;
        let svg = '';

        if (variant === 0) {
            // Subtle diagonal line
            svg = `<line x1="0" y1="${H}" x2="${W}" y2="0" stroke="${ac}" stroke-width="1" opacity="0.06"/>
                   <line x1="0" y1="${H-200}" x2="${W-200}" y2="0" stroke="${ac}" stroke-width="0.5" opacity="0.04"/>`;
        } else if (variant === 1) {
            // Corner accent circle
            svg = `<circle cx="${W}" cy="0" r="320" fill="none" stroke="${ac}" stroke-width="1" opacity="0.08"/>
                   <circle cx="${W}" cy="0" r="280" fill="none" stroke="${ac}" stroke-width="0.5" opacity="0.05"/>`;
        } else if (variant === 2) {
            // Horizontal rule accent
            svg = `<line x1="0" y1="${H*0.5}" x2="${W}" y2="${H*0.5}" stroke="${ac}" stroke-width="1" opacity="0.05"/>
                   <rect x="${W-120}" y="${H*0.5-40}" width="80" height="80" fill="${ac}" opacity="0.03"/>`;
        } else {
            // Grid dots
            let dots = '';
            for (let x = 80; x < W; x += 80) {
                for (let y = 80; y < H; y += 80) {
                    dots += `<circle cx="${x}" cy="${y}" r="1" fill="${ac}" opacity="0.07"/>`;
                }
            }
            svg = dots;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;">
            <rect width="${W}" height="${H}" fill="${pal.bg}"/>
            ${svg}
        </svg>`;
    },

    renderCharacter() { return ''; },

    renderEffects(pal, tierId, detailIdx) {
        return ''; // Minimal has no effects — clean is the fingerprint
    },

    getBorder(pal) {
        return `border-radius:16px;border:1px solid ${pal.accent}18;`;
    },

    renderLayout({ S, cd, pal, typo }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext, isProfit, profitColor, tokSz, mulSz, roiSz, tierBadge } = cd;
        const ac = pal.accent;

        const lbl = (t) => `<div style="font-size:13px;font-family:${typo.body};color:${pal.text};opacity:0.35;font-weight:400;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">${t}</div>`;
        const dataVal = (v, c) => `<div style="font-size:30px;font-family:${typo.mono};font-weight:700;color:${c || pal.text};letter-spacing:0.02em;">${v}</div>`;

        const badge = (isProfit && tierBadge) ? `<div style="display:inline-flex;align-items:center;padding:8px 22px;background:${ac}15;border:1px solid ${ac}30;color:${ac};border-radius:50px;font-size:16px;font-weight:700;letter-spacing:3px;">${tierBadge}</div>` : '';

        return `<div style="position:relative;z-index:10;width:100%;height:100%;padding:${S + 16}px ${S + 24}px;display:flex;flex-direction:column;justify-content:space-between;">
            <!-- Top: Token + User -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:14px;font-family:${typo.body};color:${pal.text};opacity:0.3;font-weight:400;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;">TRADE REPORT</div>
                    <div style="font-size:${tokSz}px;font-family:${typo.display};font-weight:900;color:${ac};line-height:1;letter-spacing:-0.03em;">${tok}</div>
                </div>
                <div style="text-align:right;">
                    ${badge}
                    ${usr ? `<div style="font-size:22px;font-family:${typo.body};font-weight:500;color:${pal.text};opacity:0.45;margin-top:12px;">${usr}</div>` : ''}
                </div>
            </div>

            <!-- Center: Hero Numbers -->
            <div>
                <div style="font-size:${Math.min(mulSz, 155)}px;font-family:${typo.display};font-weight:900;color:${profitColor};line-height:1;letter-spacing:-0.04em;filter:drop-shadow(0 0 30px ${pal.glow});">${mul}</div>
                <div style="font-size:48px;font-family:${typo.mono};font-weight:700;color:${pal.text};opacity:0.6;margin-top:8px;">${roi}</div>
            </div>

            <!-- Bottom: Data Row -->
            <div style="display:flex;gap:48px;flex-wrap:wrap;padding-top:20px;border-top:1px solid ${ac}12;">
                <div>${lbl('Entry MC')}${dataVal(ent)}</div>
                <div>${lbl('Exit MC')}${dataVal(ext)}</div>
                <div>${lbl('Investment')}${dataVal(inv)}</div>
                <div>${lbl('Profit')}${dataVal(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
