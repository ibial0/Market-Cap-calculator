// ═══════════════════════════════════════════════════════════
//  THEME: GLASSMORPHISM
//  Deep dark background, huge colorful glowing orbs, frosted
//  glass panels floating in the center. Extremely premium.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#0b0c10', text: '#ffffff', accent: '#45f3ff', positive: '#00ff88', negative: '#ff3366', orbs: ['#45f3ff', '#b026ff', '#00ff88'] },
    { bg: '#050a15', text: '#ffffff', accent: '#b026ff', positive: '#00e5ff', negative: '#ff3366', orbs: ['#b026ff', '#ff3366', '#00e5ff'] },
    { bg: '#0a0a0a', text: '#ffffff', accent: '#ffcc00', positive: '#00ffaa', negative: '#ff3366', orbs: ['#ffcc00', '#ff3366', '#45f3ff'] },
];

export default {
    id: 'glassmorphism',
    name: 'Glassmorphism',
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
            display:       "'Outfit', sans-serif",
            displayWeight: 800,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        // Massive out-of-focus orbs
        const positions = [
            [{x: 200, y: 100, r: 400}, {x: 1400, y: 800, r: 500}, {x: 800, y: 450, r: 350}],
            [{x: 800, y: 100, r: 450}, {x: 200, y: 800, r: 400}, {x: 1400, y: 500, r: 400}],
            [{x: 0, y: 450, r: 500}, {x: 1600, y: 450, r: 500}, {x: 800, y: 0, r: 350}],
        ][variant % 3];

        let orbsHtml = '';
        positions.forEach((p, i) => {
            orbsHtml += `<circle cx="${p.x}" cy="${p.y}" r="${p.r}" fill="${pal.orbs[i]}" opacity="0.3"/>`;
        });

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;">
            <defs><filter id="hugeBlur"><feGaussianBlur stdDeviation="150"/></filter></defs>
            <rect width="100%" height="100%" fill="${pal.bg}"/>
            <g filter="url(#hugeBlur)">${orbsHtml}</g>
        </svg>`;
    },

    renderEffects() { return ''; },
    getBorder() { return `border:0;`; },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;

        const glassStyle = `
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            border-left: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 30px 60px rgba(0,0,0,0.4);
            border-radius: 32px;
        `;

        const lbl = (t) => `<div style="font-size:14px; font-weight:600; color:rgba(255,255,255,0.5); letter-spacing:2px; text-transform:uppercase; margin-bottom:12px;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:36px; font-family:${typo.mono}; font-weight:700; color:${c || '#fff'}; letter-spacing:-0.5px;">${v}</div>`;

        return `<div style="padding:${S}px; height:100%; display:flex; align-items:center; justify-content:center; box-sizing:border-box;">
            
            <div style="width:100%; max-width:1400px; height:100%; max-height:760px; ${glassStyle} display:flex; flex-direction:column; padding:60px 80px; box-sizing:border-box; justify-content:space-between;">
                
                <!-- Top -->
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:24px;">
                        <div style="width:64px; height:64px; border-radius:50%; background:linear-gradient(135deg, ${pal.orbs[0]}, ${pal.orbs[1]}); opacity:0.8;"></div>
                        <div>
                            <div style="font-size:${Math.min(tokSz, 72)}px; font-family:${typo.display}; font-weight:800; color:#fff; line-height:1;">${tok}</div>
                            ${usr ? `<div style="font-size:24px; color:rgba(255,255,255,0.5); margin-top:4px;">@${usr}</div>` : ''}
                        </div>
                    </div>
                    ${tierBadge ? `<div style="font-size:18px; font-weight:700; letter-spacing:4px; padding:12px 32px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:50px;">${tierBadge}</div>` : ''}
                </div>

                <!-- Center -->
                <div style="text-align:left; padding:40px 0;">
                    <div style="font-size:32px; font-weight:600; color:rgba(255,255,255,0.6); margin-bottom:16px;">RETURN ON INVESTMENT</div>
                    <div style="font-size:${Math.min(mulSz + 40, 200)}px; font-family:${typo.display}; font-weight:800; color:${profitColor}; line-height:0.9; text-shadow:0 0 80px ${isProfit ? 'rgba(0,255,136,0.5)' : 'rgba(255,51,102,0.5)'};">${mul}</div>
                    <div style="font-size:56px; font-family:${typo.mono}; font-weight:600; color:#fff; margin-top:20px;">${roi}</div>
                </div>

                <!-- Bottom -->
                <div style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.1); padding-top:40px;">
                    <div>${lbl('Entry Cap')}${dval(ent)}</div>
                    <div>${lbl('Exit Cap')}${dval(ext)}</div>
                    <div>${lbl('Invested')}${dval(inv)}</div>
                    <div>${lbl('Net Profit')}${dval(pStr, profitColor)}</div>
                </div>
            </div>

        </div>`;
    },
};
