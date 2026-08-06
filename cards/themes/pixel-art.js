// Requires: <link href='https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap' rel='stylesheet'>
import { SAFE_MARGIN, CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#000000', text: '#ffffff', accent: '#00ff00', positive: '#00ff00', negative: '#ff0000', glow: 'rgba(0,255,0,0.2)', card: '#111111' },
    { bg: '#0d0015', text: '#d9d9d9', accent: '#00e5ff', positive: '#00e5ff', negative: '#ff0055', glow: 'rgba(0,229,255,0.2)', card: '#1a0029' },
    { bg: '#001a00', text: '#e6ffe6', accent: '#ffff00', positive: '#ffff00', negative: '#ff3300', glow: 'rgba(255,255,0,0.2)', card: '#002200' },
    { bg: '#000022', text: '#e0e0ff', accent: '#ff00ff', positive: '#ff00ff', negative: '#cc0000', glow: 'rgba(255,0,255,0.2)', card: '#000033' },
];

export default {
    id: 'pixel_art',
    name: 'Pixel Art',
    hasCharacter: true,
    bgVariants: 4,
    charVariants: 3,
    accentVariants: PALETTES.length,
    detailVariants: 3,

    getPalette(tierId, accentIdx, isProfit) {
        const p = PALETTES[accentIdx % PALETTES.length];
        return { ...p, positive: isProfit ? p.positive : p.text, negative: p.negative };
    },

    getTypography() {
        return {
            display: "'Press Start 2P', 'Courier New', monospace",
            displayWeight: 400,
            body: "'Inter', sans-serif",
            mono: "'Courier New', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        let svg = '';

        if (variant === 0) {
            // Blocky starfield
            let stars = '';
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * W, y = Math.random() * H;
                const size = Math.random() > 0.5 ? 4 : 8;
                stars += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${size}" height="${size}" fill="${pal.text}" opacity="${(Math.random() * 0.5 + 0.1).toFixed(2)}"/>`;
            }
            svg = stars;
        } else if (variant === 1) {
            // Pixelated mountains
            svg = `<rect x="0" y="${H - 200}" width="400" height="200" fill="${pal.accent}" opacity="0.1"/>
                <rect x="200" y="${H - 300}" width="400" height="300" fill="${pal.accent}" opacity="0.15"/>
                <rect x="500" y="${H - 250}" width="500" height="250" fill="${pal.accent}" opacity="0.12"/>
                <rect x="900" y="${H - 350}" width="600" height="350" fill="${pal.accent}" opacity="0.08"/>`;
        } else if (variant === 2) {
            // Pixel grid
            let grid = '';
            for (let x = 0; x < W; x += 40) {
                grid += `<rect x="${x}" y="0" width="2" height="${H}" fill="${pal.accent}" opacity="0.1"/>`;
            }
            for (let y = 0; y < H; y += 40) {
                grid += `<rect x="0" y="${y}" width="${W}" height="2" fill="${pal.accent}" opacity="0.1"/>`;
            }
            svg = grid;
        } else {
            // Corner UI elements
            svg = `<rect x="40" y="40" width="120" height="40" fill="${pal.accent}" opacity="0.2"/>
                <rect x="${W - 160}" y="40" width="120" height="40" fill="${pal.accent}" opacity="0.2"/>
                <rect x="40" y="${H - 80}" width="200" height="40" fill="${pal.accent}" opacity="0.2"/>`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;">
            <rect width="${W}" height="${H}" fill="${pal.bg}"/>
            ${svg}
        </svg>`;
    },

    renderCharacter(pal, emotion, isProfit, variant) {
        const cColor = isProfit ? pal.positive : pal.negative;
        const eyeColor = pal.bg;
        let face = '';

        if (isProfit) {
            // Happy pixel face - normal eyes + smile
            face = `<rect x="180" y="140" width="20" height="20" fill="${eyeColor}"/>
                <rect x="240" y="140" width="20" height="20" fill="${eyeColor}"/>
                <rect x="180" y="200" width="20" height="20" fill="${eyeColor}"/>
                <rect x="200" y="220" width="40" height="20" fill="${eyeColor}"/>
                <rect x="240" y="200" width="20" height="20" fill="${eyeColor}"/>`;
        } else {
            // X-eyes + sad mouth
            face = `<rect x="180" y="140" width="20" height="20" fill="${eyeColor}"/>
                <rect x="200" y="160" width="20" height="20" fill="${eyeColor}"/>
                <rect x="220" y="140" width="20" height="20" fill="${eyeColor}"/>
                <rect x="240" y="140" width="20" height="20" fill="${eyeColor}"/>
                <rect x="260" y="160" width="20" height="20" fill="${eyeColor}"/>
                <rect x="280" y="140" width="20" height="20" fill="${eyeColor}"/>
                <rect x="200" y="220" width="60" height="20" fill="${eyeColor}"/>`;
        }

        const xPos = CARD_W - 500;
        const yPos = CARD_H / 2 - 200;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" style="position:absolute;top:${yPos}px;left:${xPos}px;pointer-events:none;z-index:8;">
            <rect x="120" y="260" width="200" height="140" fill="${cColor}"/>
            <rect x="140" y="80" width="160" height="160" fill="${cColor}"/>
            ${face}
        </svg>`;
    },

    renderEffects(pal, tierId, detailIdx) {
        // CRT scanlines + vignette
        return `
            <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 4px);pointer-events:none;z-index:50;"></div>
            <div style="position:absolute;top:0;left:0;width:100%;height:100%;box-shadow:inset 0 0 100px rgba(0,0,0,0.8);pointer-events:none;z-index:51;"></div>
        `;
    },

    getBorder(pal) {
        return `border: 8px solid ${pal.accent}; border-radius: 0; box-shadow: inset 8px 8px 0 rgba(255,255,255,0.2), inset -8px -8px 0 rgba(0,0,0,0.5);`;
    },

    renderLayout({ S, cd, pal, typo }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;

        const lbl = (t) => `<div style="font-size:12px;font-family:${typo.mono};color:${pal.text};opacity:0.7;margin-bottom:8px;text-transform:uppercase;">${t}</div>`;
        const dataVal = (v, c) => `<div style="font-size:20px;font-family:${typo.display};color:${c || pal.text};">${v}</div>`;

        return `<div style="position:relative;z-index:10;width:100%;height:100%;padding:${S + 16}px ${S + 24}px;display:flex;flex-direction:column;justify-content:space-between;text-shadow:2px 2px 0px #000;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:16px;font-family:${typo.mono};color:${pal.text};opacity:0.8;margin-bottom:12px;">1P SCORE</div>
                    <div style="font-size:${Math.min(tokSz, 60)}px;font-family:${typo.display};color:${ac};">${tok}</div>
                </div>
                <div style="text-align:right;">
                    ${tierBadge ? `<div style="font-size:16px;font-family:${typo.display};color:${ac};margin-bottom:12px;">STAGE: ${tierBadge}</div>` : ''}
                    ${usr ? `<div style="font-size:18px;font-family:${typo.mono};color:${pal.text};">${usr}</div>` : ''}
                </div>
            </div>
            <div style="margin-top:-60px;">
                <div style="font-size:${Math.min(mulSz, 120)}px;font-family:${typo.display};color:${profitColor};line-height:1;margin-bottom:16px;">${mul}</div>
                <div style="font-size:32px;font-family:${typo.display};color:${pal.text};opacity:0.9;">${roi}</div>
            </div>
            <div style="display:flex;gap:40px;flex-wrap:wrap;padding:24px;background:rgba(0,0,0,0.6);border:4px solid ${ac};">
                <div>${lbl('ENTRY')}${dataVal(ent)}</div>
                <div>${lbl('EXIT')}${dataVal(ext)}</div>
                <div>${lbl('INVEST')}${dataVal(inv)}</div>
                <div>${lbl('PROFIT')}${dataVal(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
