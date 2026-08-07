// ═══════════════════════════════════════════════════════════
//  THEME: EDITORIAL (Minimal)
//  Light mode, extremely clean typography, giant hero numbers,
//  magazine-like grid layout. No characters.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#ffffff', text: '#111111', accent: '#000000', positive: '#00c853', negative: '#d50000' }, // Pure white
    { bg: '#f4f4f0', text: '#1a1a1a', accent: '#d32f2f', positive: '#2e7d32', negative: '#c62828' }, // Off-white + red accent
    { bg: '#f8f9fa', text: '#212529', accent: '#0056b3', positive: '#00875a', negative: '#de350b' }, // Cool gray + blue
];

export default {
    id: 'minimal',
    name: 'Editorial',
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
            display:       "'Inter', sans-serif",
            displayWeight: 900,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const bg = pal.bg;
        let deco = '';
        if (variant === 0) {
            // Elegant thin border
            deco = `<rect x="24" y="24" width="1552" height="852" fill="none" stroke="${pal.text}" stroke-width="2" opacity="0.1"/>`;
        } else if (variant === 1) {
            // Bauhaus-style circles
            deco = `<circle cx="1600" cy="0" r="400" fill="${pal.accent}" opacity="0.03"/>
                    <circle cx="0" cy="900" r="300" fill="${pal.text}" opacity="0.02"/>`;
        } else {
            // Subtle dot grid
            let dots = '';
            for (let x = 40; x < 1600; x += 40) {
                for (let y = 40; y < 900; y += 40) {
                    dots += `<circle cx="${x}" cy="${y}" r="1" fill="${pal.text}" opacity="0.1"/>`;
                }
            }
            deco = dots;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;">
            <rect width="100%" height="100%" fill="${bg}"/>
            ${deco}
        </svg>`;
    },

    renderEffects() {
        return ''; // Pure clean
    },

    getBorder() {
        return `border: 0; box-shadow: 0 20px 40px rgba(0,0,0,0.1);`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;

        const lbl = (t) => `<div style="font-size:12px; font-weight:700; color:${pal.text}; opacity:0.4; letter-spacing:3px; text-transform:uppercase; margin-bottom:12px;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:38px; font-family:${typo.mono}; font-weight:700; color:${c || pal.text}; letter-spacing:-1px;">${v}</div>`;

        return `<div style="padding:${S+40}px ${S+60}px; height:100%; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
            
            <!-- Top Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; border-bottom:4px solid ${pal.text}; padding-bottom:32px;">
                <div style="flex:1;">
                    <div style="font-size:16px; font-weight:700; letter-spacing:4px; color:${pal.accent}; text-transform:uppercase; margin-bottom:16px;">Verified Trade</div>
                    <div style="font-size:${tokSz + 30}px; font-weight:900; line-height:0.9; letter-spacing:-0.04em; color:${pal.text};">${tok}</div>
                </div>
                <div style="text-align:right;">
                    ${tierBadge ? `<div style="font-size:18px; font-weight:800; background:${pal.text}; color:${pal.bg}; padding:8px 24px; display:inline-block; margin-bottom:16px;">${tierBadge}</div>` : ''}
                    ${usr ? `<div style="font-size:28px; font-weight:600; color:${pal.text}; opacity:0.6;">@${usr}</div>` : ''}
                </div>
            </div>

            <!-- Center Giant Number -->
            <div style="flex:1; display:flex; align-items:center; justify-content:flex-start;">
                <div style="display:flex; flex-direction:column;">
                    <div style="font-size:${Math.min(mulSz + 60, 240)}px; font-family:${typo.display}; font-weight:900; color:${profitColor}; line-height:0.85; letter-spacing:-0.05em;">${mul}</div>
                    <div style="font-size:56px; font-family:${typo.mono}; font-weight:600; color:${pal.text}; opacity:0.8; margin-top:24px;">${roi}</div>
                </div>
            </div>

            <!-- Bottom Grid -->
            <div style="display:flex; gap:80px;">
                <div style="flex:1;">${lbl('Entry Cap')}${dval(ent)}</div>
                <div style="flex:1;">${lbl('Exit Cap')}${dval(ext)}</div>
                <div style="flex:1;">${lbl('Investment')}${dval(inv)}</div>
                <div style="flex:1; border-left:2px solid ${pal.text}20; padding-left:40px;">
                    ${lbl('Net Profit')}
                    ${dval(pStr, profitColor)}
                </div>
            </div>
        </div>`;
    },
};
