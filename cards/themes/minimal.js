// ═══════════════════════════════════════════════════════════
//  THEME: CRYSTAL CLEAN (Minimal slot)
//  Light, airy, elegant. Pure white/off-white background
//  with delicate frosted glass panels and soft typography.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#f8f9fa', text: '#212529', accent: '#3b82f6', positive: '#10b981', negative: '#ef4444', panel: 'rgba(255,255,255,0.7)', blur: 'blur(30px)' }, // Modern Blue
    { bg: '#fdfbf7', text: '#333333', accent: '#f59e0b', positive: '#059669', negative: '#dc2626', panel: 'rgba(255,255,255,0.85)', blur: 'blur(20px)' }, // Warm Ivory
    { bg: '#f1f5f9', text: '#0f172a', accent: '#8b5cf6', positive: '#047857', negative: '#b91c1c', panel: 'rgba(255,255,255,0.6)', blur: 'blur(40px)' }, // Slate Purple
];

export default {
    id: 'minimal',
    name: 'Crystal Clean',
    hasCharacter: false,
    bgVariants: 3, charVariants: 1, accentVariants: PALETTES.length, detailVariants: 1,

    getPalette(tierId, accentIdx) { return { ...PALETTES[accentIdx % PALETTES.length] }; },
    getTypography() {
        return {
            display: "'Inter', sans-serif", displayWeight: 300,
            body: "'Inter', sans-serif", mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = 1600, H = 900;
        
        let shapes = '';
        if (variant === 0) {
            // Soft floating orbs
            shapes = `
                <circle cx="20%" cy="30%" r="40%" fill="${pal.accent}" opacity="0.05" filter="blur(80px)"/>
                <circle cx="80%" cy="70%" r="35%" fill="${pal.positive}" opacity="0.04" filter="blur(100px)"/>
            `;
        } else if (variant === 1) {
            // Abstract geometric waves
            shapes = `
                <path d="M0,450 Q400,300 800,450 T1600,450 L1600,900 L0,900 Z" fill="${pal.accent}" opacity="0.03"/>
                <path d="M0,600 Q400,500 800,600 T1600,600 L1600,900 L0,900 Z" fill="${pal.positive}" opacity="0.02"/>
            `;
        } else {
            // Very subtle grid dots
            let dots = '';
            for(let x=20; x<W; x+=40) {
                for(let y=20; y<H; y+=40) {
                    dots += `<circle cx="${x}" cy="${y}" r="1" fill="${pal.text}" opacity="0.06"/>`;
                }
            }
            shapes = dots;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
            style="position:absolute;inset:0;pointer-events:none;">
            <rect width="100%" height="100%" fill="${pal.bg}"/>
            ${shapes}
        </svg>`;
    },

    renderEffects() { return ''; },
    getBorder(pal) { return `border-radius:32px; box-shadow: 0 20px 60px rgba(0,0,0,0.05); border: 1px solid rgba(255,255,255,0.8);`; },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz } = cd;
        const P = 60; // Inner padding

        const lbl = (t) => `<div style="font-size:12px;font-family:${typo.body};color:${pal.text};
            opacity:0.4;font-weight:600;letter-spacing:2px;text-transform:uppercase;
            margin-bottom:8px;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:32px;font-family:${typo.display};font-weight:500;
            color:${c || pal.text};letter-spacing:-1px;">${v}</div>`;

        const glassBox = `background:${pal.panel}; backdrop-filter:${pal.blur}; -webkit-backdrop-filter:${pal.blur};
            border:1px solid rgba(255,255,255,0.6); border-radius:24px; box-shadow:0 10px 30px rgba(0,0,0,0.03);`;

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;
            justify-content:space-between;padding:${S}px;box-sizing:border-box;">

            <div style="flex:1; ${glassBox} display:flex; flex-direction:column; justify-content:space-between; padding:${P}px;">
                
                <!-- TOP: Token & User -->
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <div style="font-size:${Math.min(tokSz + 10, 80)}px;font-family:${typo.display};
                            font-weight:700;color:${pal.text};line-height:1;letter-spacing:-0.04em;">${tok}</div>
                        ${usr ? `<div style="font-size:20px;color:${pal.text};opacity:0.5;margin-top:8px;">@${usr}</div>` : ''}
                    </div>
                </div>

                <!-- CENTER: Beautiful airy typography -->
                <div style="text-align:center; flex:1; display:flex; flex-direction:column; justify-content:center;">
                    <div style="font-size:16px;font-weight:500;color:${pal.text};opacity:0.4;letter-spacing:4px;text-transform:uppercase;margin-bottom:12px;">Performance Metrics</div>
                    <div style="font-size:${Math.min(mulSz + 20, 180)}px;font-family:${typo.display};
                        font-weight:300;color:${profitColor};line-height:1;letter-spacing:-0.05em;">${mul}</div>
                    <div style="font-size:42px;font-family:${typo.display};font-weight:400;
                        color:${pal.text};opacity:0.7;margin-top:16px;">${roi} ROI</div>
                </div>

                <!-- BOTTOM: Clean data row -->
                <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(0,0,0,0.06);padding-top:32px;">
                    <div style="text-align:left;">${lbl('Entry Market Cap')}${dval(ent)}</div>
                    <div style="text-align:left;">${lbl('Exit Market Cap')}${dval(ext)}</div>
                    <div style="text-align:left;">${lbl('Initial Investment')}${dval(inv)}</div>
                    <div style="text-align:right;">${lbl('Total Net Profit')}${dval(pStr, profitColor)}</div>
                </div>

            </div>
        </div>`;
    },
};
