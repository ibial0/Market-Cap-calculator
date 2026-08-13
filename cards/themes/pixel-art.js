// ═══════════════════════════════════════════════════════════
//  THEME: NEON GLOW (Pixel Art slot)
//  Vibrant, high-energy neon aesthetic. Deep dark background
//  with intense glowing borders and bright text.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#080012', text: '#ffffff', accent: '#d946ef', positive: '#22d3ee', negative: '#ef4444' }, // Magenta / Cyan
    { bg: '#000812', text: '#ffffff', accent: '#3b82f6', positive: '#10b981', negative: '#f43f5e' }, // Blue / Emerald
    { bg: '#120008', text: '#ffffff', accent: '#f43f5e', positive: '#eab308', negative: '#64748b' }, // Rose / Gold
];

export default {
    id: 'pixel_art',
    name: 'Neon Glow',
    hasCharacter: false,
    bgVariants: 3, charVariants: 1, accentVariants: PALETTES.length, detailVariants: 1,

    getPalette(tierId, accentIdx) { return { ...PALETTES[accentIdx % PALETTES.length] }; },
    getTypography() {
        return {
            display: "'Outfit', sans-serif", displayWeight: 900,
            body: "'Inter', sans-serif", mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = 1600, H = 900;
        
        let grid = '';
        if (variant === 0) {
            // Isometric dotted grid
            for(let x=-H; x<W; x+=40) {
                for(let y=0; y<H; y+=40) {
                    grid += `<circle cx="${x + y/2}" cy="${y}" r="1.5" fill="${pal.accent}" opacity="0.15"/>`;
                }
            }
        } else if (variant === 1) {
            // Hexagon mesh
            for(let x=0; x<W+50; x+=86.6) {
                for(let y=0; y<H+50; y+=75) {
                    const offset = (y/75)%2===0 ? 0 : 43.3;
                    grid += `<polygon points="${x+offset},${y-25} ${x+43.3+offset},${y} ${x+43.3+offset},${y+50} ${x+offset},${y+75} ${x-43.3+offset},${y+50} ${x-43.3+offset},${y}" fill="none" stroke="${pal.accent}" stroke-width="1" opacity="0.1"/>`;
                }
            }
        } else {
            // Concentric rings
            grid = `
                <circle cx="50%" cy="50%" r="20%" fill="none" stroke="${pal.accent}" stroke-width="1" stroke-dasharray="10 10" opacity="0.2"/>
                <circle cx="50%" cy="50%" r="35%" fill="none" stroke="${pal.accent}" stroke-width="1" opacity="0.1"/>
                <circle cx="50%" cy="50%" r="50%" fill="none" stroke="${pal.accent}" stroke-width="1" stroke-dasharray="5 20" opacity="0.1"/>
            `;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
            style="position:absolute;inset:0;pointer-events:none;">
            <rect width="100%" height="100%" fill="${pal.bg}"/>
            <!-- Soft radial glow behind everything -->
            <radialGradient id="neonGlow" cx="50%" cy="50%" r="60%">
                <stop offset="0%" stop-color="${pal.accent}" stop-opacity="0.15"/>
                <stop offset="100%" stop-color="${pal.bg}" stop-opacity="0"/>
            </radialGradient>
            <rect width="100%" height="100%" fill="url(#neonGlow)"/>
            ${grid}
        </svg>`;
    },

    renderEffects() { return ''; },
    
    getBorder(pal) { 
        return `border-radius:24px; border: 2px solid ${pal.accent}; 
                box-shadow: 0 0 30px ${pal.accent}40, inset 0 0 30px ${pal.accent}40;`; 
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz } = cd;

        const lbl = (t) => `<div style="font-size:14px;font-family:${typo.mono};color:${pal.accent};
            opacity:0.8;font-weight:700;letter-spacing:3px;text-transform:uppercase;
            margin-bottom:8px;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:36px;font-family:${typo.mono};font-weight:700;
            color:${c || pal.text};letter-spacing:-1px;">${v}</div>`;

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;
            justify-content:space-between;padding:${S+20}px;box-sizing:border-box;">

            <!-- TOP -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div style="border-left: 4px solid ${pal.accent}; padding-left: 20px;">
                    <div style="font-size:${Math.min(tokSz, 80)}px;font-family:${typo.display};
                        font-weight:900;color:${pal.text};line-height:1;letter-spacing:0.02em;
                        text-shadow: 0 0 20px ${pal.accent}80;">${tok}</div>
                    ${usr ? `<div style="font-size:20px;font-family:${typo.mono};color:${pal.accent};margin-top:12px;">@${usr}</div>` : ''}
                </div>
            </div>

            <!-- CENTER -->
            <div style="text-align:center; flex:1; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:${Math.min(mulSz + 30, 200)}px;font-family:${typo.display};
                    font-weight:900;color:${profitColor};line-height:0.9;
                    text-shadow: 0 0 60px ${profitColor}60, 0 0 10px ${profitColor}90;">${mul}</div>
                <div style="font-size:42px;font-family:${typo.mono};font-weight:700;
                    color:${pal.text};margin-top:24px;text-shadow: 0 0 15px rgba(255,255,255,0.5);">${roi} ROI</div>
            </div>

            <!-- BOTTOM -->
            <div style="display:flex;justify-content:space-between;background:rgba(0,0,0,0.4);
                border-top:1px solid ${pal.accent}60;padding:40px;border-radius:16px;
                backdrop-filter:blur(10px);">
                <div style="text-align:left;">${lbl('Entry Cap')}${dval(ent)}</div>
                <div style="text-align:left;">${lbl('Exit Cap')}${dval(ext)}</div>
                <div style="text-align:left;">${lbl('Invested')}${dval(inv)}</div>
                <div style="text-align:right;">${lbl('Net Profit')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
