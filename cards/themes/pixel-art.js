// ═══════════════════════════════════════════════════════════
//  THEME: PIXEL ART
//  Character fills CHAR_ZONE via viewBox+100% sizing.
//  Layout fills TEXT_ZONE via flex.
//  Note: 'Press Start 2P' font must be loaded in index.html
// ═══════════════════════════════════════════════════════════
import { CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#000000', text: '#ffffff', accent: '#00ff00', positive: '#00ff00', negative: '#ff0000', glow: 'rgba(0,255,0,0.2)',   card: '#111111' },
    { bg: '#0d0015', text: '#d9d9d9', accent: '#00e5ff', positive: '#00e5ff', negative: '#ff0055', glow: 'rgba(0,229,255,0.2)',card: '#1a0029' },
    { bg: '#001a00', text: '#e6ffe6', accent: '#ffff00', positive: '#ffff00', negative: '#ff3300', glow: 'rgba(255,255,0,0.2)', card: '#002200' },
    { bg: '#000022', text: '#e0e0ff', accent: '#ff00ff', positive: '#ff00ff', negative: '#cc0000', glow: 'rgba(255,0,255,0.2)', card: '#000033' },
];

export default {
    id: 'pixel_art',
    name: 'Pixel Art',
    hasCharacter: true,
    bgVariants:     4,
    charVariants:   2,
    accentVariants: PALETTES.length,
    detailVariants: 1,

    getPalette(tierId, accentIdx, isProfit) {
        return { ...PALETTES[accentIdx % PALETTES.length] };
    },

    getTypography() {
        return {
            display:       "'Press Start 2P', 'Courier New', monospace",
            displayWeight: 400,
            body:          "'Inter', sans-serif",
            mono:          "'Courier New', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        let inner = '';

        if (variant === 0) {
            // Blocky starfield — seeded positions
            let stars = '';
            for (let i = 0; i < 60; i++) {
                const x = ((i * 137) % W).toFixed(0);
                const y = ((i * 89)  % H).toFixed(0);
                const s = (i % 3 === 0) ? 8 : 4;
                stars += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${pal.text}" opacity="${(0.1 + (i%5)*0.06).toFixed(2)}"/>`;
            }
            inner = stars;
        } else if (variant === 1) {
            // Pixel mountains/skyline
            inner = `
                <rect x="0"   y="${H-180}" width="380" height="180" fill="${pal.accent}" opacity="0.08"/>
                <rect x="200" y="${H-280}" width="380" height="280" fill="${pal.accent}" opacity="0.10"/>
                <rect x="500" y="${H-220}" width="500" height="220" fill="${pal.accent}" opacity="0.07"/>
                <rect x="900" y="${H-320}" width="600" height="320" fill="${pal.accent}" opacity="0.06"/>`;
        } else if (variant === 2) {
            // Pixel grid
            let grid = '';
            for (let x = 0; x < W; x += 40) {
                grid += `<rect x="${x}" y="0" width="2" height="${H}" fill="${pal.accent}" opacity="0.08"/>`;
            }
            for (let y = 0; y < H; y += 40) {
                grid += `<rect x="0" y="${y}" width="${W}" height="2" fill="${pal.accent}" opacity="0.08"/>`;
            }
            inner = grid;
        } else {
            // Corner UI brackets
            inner = `
                <rect x="40" y="40" width="100" height="32" fill="${pal.accent}" opacity="0.18"/>
                <rect x="${W-140}" y="40" width="100" height="32" fill="${pal.accent}" opacity="0.18"/>
                <rect x="40" y="${H-72}" width="180" height="32" fill="${pal.accent}" opacity="0.18"/>`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
            style="position:absolute;top:0;left:0;pointer-events:none;">
            <rect width="${W}" height="${H}" fill="${pal.bg}"/>
            ${inner}
        </svg>`;
    },

    // Pixel character — fills CHAR_ZONE via viewBox
    renderCharacter(pal, emotion, isProfit, variant) {
        const bodyColor = isProfit ? pal.positive : pal.negative;
        const eyeColor  = pal.bg;

        // Happy face (isProfit): normal eyes + smile curve made of rects
        // Sad face: X eyes + flat mouth
        let face = '';
        if (isProfit) {
            face = `
                <!-- Eyes -->
                <rect x="110" y="110" width="24" height="24" fill="${eyeColor}"/>
                <rect x="186" y="110" width="24" height="24" fill="${eyeColor}"/>
                <!-- Smile (pixel curve) -->
                <rect x="110" y="170" width="24" height="20" fill="${eyeColor}"/>
                <rect x="134" y="190" width="52" height="20" fill="${eyeColor}"/>
                <rect x="186" y="170" width="24" height="20" fill="${eyeColor}"/>`;
        } else {
            face = `
                <!-- X eyes left -->
                <rect x="108" y="108" width="16" height="16" fill="${eyeColor}"/>
                <rect x="132" y="108" width="16" height="16" fill="${eyeColor}"/>
                <rect x="120" y="124" width="16" height="16" fill="${eyeColor}"/>
                <!-- X eyes right -->
                <rect x="184" y="108" width="16" height="16" fill="${eyeColor}"/>
                <rect x="208" y="108" width="16" height="16" fill="${eyeColor}"/>
                <rect x="196" y="124" width="16" height="16" fill="${eyeColor}"/>
                <!-- Flat sad mouth -->
                <rect x="120" y="178" width="80" height="18" fill="${eyeColor}"/>`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 400"
            width="100%" height="100%"
            preserveAspectRatio="xMidYMid meet">
            <!-- Body -->
            <rect x="80"  y="220" width="160" height="120" fill="${bodyColor}"/>
            <!-- Head -->
            <rect x="80"  y="72"  width="160" height="148" fill="${bodyColor}"/>
            ${face}
        </svg>`;
    },

    renderEffects(pal) {
        // CRT scanlines
        return `
            <div style="position:absolute;inset:0;pointer-events:none;z-index:20;
                background:repeating-linear-gradient(0deg,rgba(0,0,0,0.14) 0px,rgba(0,0,0,0.14) 1px,transparent 1px,transparent 4px);">
            </div>
            <div style="position:absolute;inset:0;pointer-events:none;z-index:19;box-shadow:inset 0 0 90px rgba(0,0,0,0.7);"></div>`;
    },

    getBorder(pal) {
        return `border:8px solid ${pal.accent}; border-radius:0; box-shadow:inset 8px 8px 0 rgba(255,255,255,0.15),inset -8px -8px 0 rgba(0,0,0,0.4);`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext,
                isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;

        const lbl = (t) => `<div style="font-size:11px;font-family:${typo.mono};color:${pal.text};opacity:0.65;text-transform:uppercase;margin-bottom:8px;letter-spacing:1px;white-space:nowrap;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:20px;font-family:${typo.display};color:${c || pal.text};white-space:nowrap;line-height:1.2;">${v}</div>`;

        const usrEl = usr ? `<div style="font-size:14px;font-family:${typo.mono};color:${pal.text};opacity:0.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${usr}</div>` : '';

        // Cap token size for pixel font
        const pixTokSz = Math.min(tokSz, 36);
        const pixMulSz = Math.min(mulSz, 90);

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:${S}px;box-sizing:border-box;text-shadow:2px 2px 0 #000;">
            <!-- Top -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
                <div style="flex:1;min-width:0;overflow:hidden;">
                    <div style="font-size:12px;font-family:${typo.mono};color:${pal.text};opacity:0.7;margin-bottom:10px;">1P SCORE</div>
                    <div style="font-size:${pixTokSz}px;font-family:${typo.display};color:${ac};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tok}</div>
                    ${usrEl}
                </div>
                <div style="flex-shrink:0;text-align:right;">
                    ${tierBadge ? `<div style="font-size:12px;font-family:${typo.display};color:${ac};">STAGE: ${tierBadge}</div>` : ''}
                </div>
            </div>
            <!-- Center -->
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
                <div style="font-size:${pixMulSz}px;font-family:${typo.display};color:${profitColor};line-height:1.1;white-space:nowrap;overflow:hidden;">${mul}</div>
                <div style="font-size:26px;font-family:${typo.display};color:${pal.text};opacity:0.85;margin-top:12px;white-space:nowrap;">${roi}</div>
            </div>
            <!-- Bottom -->
            <div style="display:flex;gap:0;padding:20px 22px;background:rgba(0,0,0,0.55);border:3px solid ${ac};">
                <div style="flex:1;min-width:0;">${lbl('ENTRY')}${dval(ent)}</div>
                <div style="flex:1;min-width:0;">${lbl('EXIT')}${dval(ext)}</div>
                <div style="flex:1;min-width:0;">${lbl('INVEST')}${dval(inv)}</div>
                <div style="flex:1;min-width:0;">${lbl('PROFIT')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
