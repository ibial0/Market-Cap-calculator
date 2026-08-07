// ═══════════════════════════════════════════════════════════
//  THEME: CYBERPUNK HUD
//  High-tech targeting UI, neon borders, dark grid, centered
//  holographic layout. No characters.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#030508', text: '#e0f2fe', accent: '#00f2fe', positive: '#00ff66', negative: '#ff003c' },
    { bg: '#06020a', text: '#fae8ff', accent: '#ff00ff', positive: '#00ff66', negative: '#ff003c' },
    { bg: '#02050a', text: '#e0e7ff', accent: '#8b5cf6', positive: '#00ff66', negative: '#ff003c' },
    { bg: '#050505', text: '#fef9c3', accent: '#fde047', positive: '#00ff66', negative: '#ff003c' },
];

export default {
    id: 'cyberpunk',
    name: 'Cyber HUD',
    hasCharacter: false,
    bgVariants:     3,
    charVariants:   1,
    accentVariants: PALETTES.length,
    detailVariants: 1,

    getPalette(tierId, accentIdx) {
        return { ...PALETTES[accentIdx % PALETTES.length] };
    },

    getTypography() {
        return {
            display:       "'Space Grotesk', sans-serif",
            displayWeight: 700,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = 1600, H = 900;
        const ac = pal.accent;
        let deco = '';

        if (variant === 0) {
            // Radar / Crosshairs
            deco = `
                <circle cx="800" cy="450" r="300" fill="none" stroke="${ac}" stroke-width="1" stroke-dasharray="4 12" opacity="0.3"/>
                <circle cx="800" cy="450" r="600" fill="none" stroke="${ac}" stroke-width="1" opacity="0.1"/>
                <line x1="800" y1="0" x2="800" y2="900" stroke="${ac}" stroke-width="1" opacity="0.2"/>
                <line x1="0" y1="450" x2="1600" y2="450" stroke="${ac}" stroke-width="1" opacity="0.2"/>
            `;
        } else if (variant === 1) {
            // Perspective Grid
            let lines = '';
            for (let i = -800; i <= 2400; i += 80) {
                lines += `<line x1="800" y1="450" x2="${i}" y2="900" stroke="${ac}" stroke-width="1.5" opacity="0.2"/>`;
            }
            for (let y = 450; y <= 900; y += 40) {
                lines += `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="${ac}" stroke-width="1" opacity="0.2"/>`;
            }
            deco = `<rect x="0" y="450" width="1600" height="450" fill="${ac}" opacity="0.05"/>${lines}
                    <line x1="0" y1="450" x2="1600" y2="450" stroke="${ac}" stroke-width="2" opacity="0.5"/>`;
        } else {
            // Hex Grid
            let hex = '';
            for (let x = 0; x < W; x += 44) {
                for (let y = 0; y < H; y += 44) {
                    hex += `<polygon points="${x},${y} ${x+10},${y-17} ${x+30},${y-17} ${x+40},${y} ${x+30},${y+17} ${x+10},${y+17}" fill="none" stroke="${ac}" stroke-width="0.5" opacity="0.15"/>`;
                }
            }
            deco = hex;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;">
            <rect width="100%" height="100%" fill="${pal.bg}"/>
            ${deco}
        </svg>`;
    },

    renderEffects() {
        return `<div style="position:absolute;inset:0;pointer-events:none;z-index:15;background:linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 50%);background-size:100% 4px;mix-blend-mode:overlay;"></div>`;
    },

    getBorder(pal) {
        return `border: 2px solid ${pal.accent}; box-shadow: 0 0 30px ${pal.accent}40, inset 0 0 30px ${pal.accent}40;`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;

        const lbl = (t) => `<div style="font-size:12px; font-family:${typo.mono}; color:${ac}; opacity:0.8; letter-spacing:3px; margin-bottom:8px;">[${t}]</div>`;
        const dval = (v, c) => `<div style="font-size:28px; font-family:${typo.mono}; font-weight:700; color:${c || pal.text};">${v}</div>`;

        return `<div style="padding:${S}px; height:100%; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
            
            <!-- Corner Brackets -->
            <div style="position:absolute; top:32px; left:32px; width:40px; height:40px; border-top:4px solid ${ac}; border-left:4px solid ${ac};"></div>
            <div style="position:absolute; top:32px; right:32px; width:40px; height:40px; border-top:4px solid ${ac}; border-right:4px solid ${ac};"></div>
            <div style="position:absolute; bottom:32px; left:32px; width:40px; height:40px; border-bottom:4px solid ${ac}; border-left:4px solid ${ac};"></div>
            <div style="position:absolute; bottom:32px; right:32px; width:40px; height:40px; border-bottom:4px solid ${ac}; border-right:4px solid ${ac};"></div>

            <!-- Top Row -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0 32px; margin-top:20px;">
                <div style="display:flex; align-items:center; gap:16px;">
                    <div style="background:${ac}; color:${pal.bg}; padding:4px 12px; font-family:${typo.mono}; font-weight:700; font-size:14px; letter-spacing:2px;">SYS.LOG</div>
                    <div style="font-size:24px; font-family:${typo.mono}; color:${pal.text}; opacity:0.7;">${usr ? 'USER::' + usr : 'ANON_SESSION'}</div>
                </div>
                ${tierBadge ? `<div style="border:1px solid ${ac}; color:${ac}; padding:6px 20px; font-family:${typo.mono}; font-size:16px; font-weight:700; letter-spacing:4px; box-shadow:0 0 10px ${ac}40;">${tierBadge}</div>` : ''}
            </div>

            <!-- Center Data -->
            <div style="text-align:center; position:relative;">
                <div style="font-size:${tokSz + 20}px; font-family:${typo.display}; font-weight:700; color:${pal.text}; letter-spacing:0.1em; text-transform:uppercase;">${tok}</div>
                <div style="font-size:${mulSz + 20}px; font-family:${typo.display}; font-weight:700; color:${profitColor}; line-height:1; margin-top:24px; text-shadow:0 0 40px ${profitColor}60;">${mul}</div>
                <div style="font-size:40px; font-family:${typo.mono}; font-weight:700; color:${pal.bg}; background:${profitColor}; display:inline-block; padding:4px 20px; margin-top:24px; clip-path:polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%);">${roi}</div>
            </div>

            <!-- Bottom Data Boxes -->
            <div style="display:flex; justify-content:space-between; gap:24px; padding:0 24px; margin-bottom:20px;">
                <div style="flex:1; background:rgba(0,0,0,0.6); border:1px solid ${ac}40; padding:24px; text-align:center; backdrop-filter:blur(10px);">
                    ${lbl('ENTRY')}
                    ${dval(ent)}
                </div>
                <div style="flex:1; background:rgba(0,0,0,0.6); border:1px solid ${ac}40; padding:24px; text-align:center; backdrop-filter:blur(10px);">
                    ${lbl('EXIT')}
                    ${dval(ext)}
                </div>
                <div style="flex:1; background:rgba(0,0,0,0.6); border:1px solid ${ac}40; padding:24px; text-align:center; backdrop-filter:blur(10px);">
                    ${lbl('INVEST')}
                    ${dval(inv)}
                </div>
                <div style="flex:1; background:rgba(0,0,0,0.6); border:1px solid ${profitColor}80; padding:24px; text-align:center; backdrop-filter:blur(10px); box-shadow:0 0 20px ${profitColor}20;">
                    ${lbl('YIELD')}
                    ${dval(pStr, profitColor)}
                </div>
            </div>
        </div>`;
    },
};
