// ═══════════════════════════════════════════════════════════
//  THEME: SUNRISE GOLD (Comic slot)
//  Warm, energetic, bright aesthetic. Deep red to golden
//  yellow gradients, evoking a rising sun or massive win.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#3a0ca3', text: '#ffffff', accent: '#fca311', positive: '#00ff88', negative: '#ff0055', grad: ['#d90429', '#ff5400', '#ffbd00'] }, // Crimson to Gold
    { bg: '#14213d', text: '#ffffff', accent: '#fca311', positive: '#00ff88', negative: '#ff0055', grad: ['#f72585', '#b5179e', '#4cc9f0'] }, // Cyber Sunrise
    { bg: '#2b061e', text: '#ffffff', accent: '#ffd166', positive: '#06d6a0', negative: '#ef476f', grad: ['#8338ec', '#ff006e', '#ffbe0b'] }, // Purple to Yellow
];

export default {
    id: 'comic',
    name: 'Sunrise Gold',
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
        const c = pal.grad;
        let deco = '';

        if (variant === 0) {
            // Smooth angular split
            deco = `<polygon points="0,900 1600,0 1600,900" fill="url(#sunriseGrad)" opacity="0.8"/>`;
        } else if (variant === 1) {
            // Massive rising sun
            deco = `
                <circle cx="800" cy="1100" r="800" fill="url(#sunriseGrad)" opacity="0.9"/>
                <circle cx="800" cy="1100" r="850" fill="none" stroke="${c[1]}" stroke-width="2" opacity="0.3"/>
            `;
        } else {
            // Fluid waves
            deco = `
                <path d="M0,600 Q400,400 800,700 T1600,500 L1600,900 L0,900 Z" fill="${c[0]}" opacity="0.7"/>
                <path d="M0,700 Q400,550 800,800 T1600,600 L1600,900 L0,900 Z" fill="${c[1]}" opacity="0.8"/>
                <path d="M0,850 Q400,750 800,900 T1600,800 L1600,900 L0,900 Z" fill="${c[2]}" opacity="0.9"/>
            `;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
            style="position:absolute;inset:0;pointer-events:none;">
            <defs>
                <linearGradient id="sunriseGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="${c[0]}"/>
                    <stop offset="50%" stop-color="${c[1]}"/>
                    <stop offset="100%" stop-color="${c[2]}"/>
                </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="${pal.bg}"/>
            ${deco}
            <rect width="100%" height="100%" fill="url(#sunriseGrad)" opacity="0.15"/>
        </svg>`;
    },

    renderEffects() { return ''; },
    
    getBorder(pal) { return `border:0;`; },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;

        const lbl = (t) => `<div style="font-size:13px;font-family:${typo.body};color:rgba(255,255,255,0.7);
            font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:36px;font-family:${typo.display};font-weight:800;
            color:${c || '#fff'};letter-spacing:0px;">${v}</div>`;

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;
            justify-content:space-between;padding:${S+20}px;box-sizing:border-box;">

            <!-- TOP -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:${Math.min(tokSz, 80)}px;font-family:${typo.display};
                        font-weight:900;color:#fff;line-height:1;letter-spacing:-0.03em;
                        text-shadow: 0 4px 10px rgba(0,0,0,0.3);">${tok}</div>
                    ${usr ? `<div style="font-size:22px;color:rgba(255,255,255,0.8);margin-top:8px;">@${usr}</div>` : ''}
                </div>
                ${tierBadge ? `<div style="font-size:16px;font-weight:800;color:${pal.bg};
                    background:#fff;padding:12px 30px;border-radius:50px;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);letter-spacing:2px;">${tierBadge}</div>` : ''}
            </div>

            <!-- CENTER -->
            <div style="text-align:center; flex:1; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:${Math.min(mulSz + 40, 220)}px;font-family:${typo.display};
                    font-weight:900;color:${isProfit ? '#fff' : pal.negative};line-height:0.9;
                    text-shadow: 0 10px 40px rgba(0,0,0,0.4);">${mul}</div>
                <div style="font-size:48px;font-family:${typo.mono};font-weight:600;
                    color:rgba(255,255,255,0.9);margin-top:20px;
                    text-shadow: 0 4px 10px rgba(0,0,0,0.2);">${roi} ROI</div>
            </div>

            <!-- BOTTOM -->
            <div style="display:flex;justify-content:space-between;background:rgba(0,0,0,0.3);
                border-top:2px solid rgba(255,255,255,0.2);padding:40px;border-radius:24px;
                backdrop-filter:blur(10px);box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                <div style="text-align:left;">${lbl('Entry Cap')}${dval(ent)}</div>
                <div style="text-align:left;">${lbl('Exit Cap')}${dval(ext)}</div>
                <div style="text-align:left;">${lbl('Invested')}${dval(inv)}</div>
                <div style="text-align:right;">${lbl('Net Profit')}${dval(pStr, isProfit ? '#fff' : pal.negative)}</div>
            </div>
        </div>`;
    },
};
