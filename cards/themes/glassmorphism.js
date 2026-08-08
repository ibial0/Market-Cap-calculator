// ═══════════════════════════════════════════════════════════
//  THEME: AURORA (Glassmorphism slot)
//  Northern lights inspired. Deep space backgrounds with
//  sweeping, blurred neon color fields (teal, purple, green).
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#040b16', text: '#ffffff', accent: '#00f2fe', positive: '#4facfe', negative: '#ff0844',
      aurora: ['#43e97b', '#38f9d7', '#00f2fe'] }, // Emerald Sky
    { bg: '#0d0221', text: '#ffffff', accent: '#b026ff', positive: '#f093fb', negative: '#ff4b1f',
      aurora: ['#b026ff', '#f093fb', '#f5576c'] }, // Violet Nebula
    { bg: '#001510', text: '#ffffff', accent: '#00ff87', positive: '#60efff', negative: '#ff3366',
      aurora: ['#00ff87', '#60efff', '#0061ff'] }, // Deep Ocean
];

export default {
    id: 'glassmorphism',
    name: 'Aurora',
    hasCharacter: false,
    bgVariants: 3, charVariants: 1, accentVariants: PALETTES.length, detailVariants: 1,

    getPalette(tierId, accentIdx) { return { ...PALETTES[accentIdx % PALETTES.length] }; },
    getTypography() {
        return {
            display: "'Outfit', sans-serif", displayWeight: 800,
            body: "'Inter', sans-serif", mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        // Sweeping SVG paths that we blur heavily
        const a = pal.aurora;
        let waves = '';

        if (variant === 0) {
            waves = `
                <path d="M-200,800 Q400,200 1000,600 T2000,-200 L2000,1200 L-200,1200 Z" fill="${a[0]}" opacity="0.4"/>
                <path d="M-200,1000 Q600,400 1200,800 T2000,0 L2000,1200 L-200,1200 Z" fill="${a[1]}" opacity="0.3"/>
            `;
        } else if (variant === 1) {
            waves = `
                <circle cx="20%" cy="0%" r="50%" fill="${a[0]}" opacity="0.3"/>
                <circle cx="80%" cy="100%" r="50%" fill="${a[2]}" opacity="0.3"/>
                <circle cx="50%" cy="50%" r="40%" fill="${a[1]}" opacity="0.2"/>
            `;
        } else {
            waves = `
                <path d="M0,0 L1600,0 L1600,300 Q800,700 0,300 Z" fill="${a[0]}" opacity="0.3"/>
                <path d="M0,900 L1600,900 L1600,600 Q800,200 0,600 Z" fill="${a[2]}" opacity="0.3"/>
            `;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
            style="position:absolute;inset:0;pointer-events:none;">
            <rect width="100%" height="100%" fill="${pal.bg}"/>
            <g filter="url(#auroraBlur)">
                ${waves}
            </g>
            <defs>
                <filter id="auroraBlur" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="150" result="blur"/>
                    <!-- Mix it slightly to blend smoothly -->
                    <feColorMatrix type="saturate" values="1.2"/>
                </filter>
            </defs>
            <!-- Overlay noise for texture -->
            <rect width="100%" height="100%" fill="url(#noiseOverlay)" opacity="0.15" mix-blend-mode="overlay"/>
            <defs>
                <pattern id="noiseOverlay" viewBox="0 0 200 200" width="20%" height="20%">
                    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter>
                    <rect width="100%" height="100%" filter="url(#n)"/>
                </pattern>
            </defs>
        </svg>`;
    },

    renderEffects() { return ''; },
    getBorder(pal) { return `border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; box-shadow: inset 0 0 80px rgba(0,0,0,0.5);`; },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;

        const lbl = (t) => `<div style="font-size:13px;font-family:${typo.body};color:rgba(255,255,255,0.6);
            font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:32px;font-family:${typo.mono};font-weight:700;
            color:${c || '#fff'};letter-spacing:-0.5px;">${v}</div>`;

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;
            justify-content:space-between;padding:${S+20}px;box-sizing:border-box;text-shadow: 0 4px 20px rgba(0,0,0,0.5);">

            <!-- TOP -->
            <div style="display:flex;justify-content:center;position:relative;">
                <div style="text-align:center;">
                    ${tierBadge ? `<div style="font-size:12px;font-weight:800;color:${pal.accent};
                        letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">[ ${tierBadge} ]</div>` : ''}
                    <div style="font-size:${Math.min(tokSz + 20, 100)}px;font-family:${typo.display};
                        font-weight:800;color:#fff;line-height:1;letter-spacing:0.02em;">${tok}</div>
                    ${usr ? `<div style="font-size:22px;color:rgba(255,255,255,0.7);margin-top:12px;">@${usr}</div>` : ''}
                </div>
            </div>

            <!-- CENTER -->
            <div style="text-align:center; flex:1; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:${Math.min(mulSz + 40, 200)}px;font-family:${typo.display};
                    font-weight:900;color:${profitColor};line-height:0.9;
                    text-shadow: 0 0 60px ${profitColor}80, 0 4px 20px rgba(0,0,0,0.5);">${mul}</div>
                <div style="font-size:48px;font-family:${typo.mono};font-weight:600;
                    color:#fff;opacity:0.9;margin-top:20px;">${roi}</div>
            </div>

            <!-- BOTTOM: Glass panel row -->
            <div style="display:flex;justify-content:space-between;
                background:rgba(255,255,255,0.03);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
                border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:32px 48px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                <div style="text-align:left;">${lbl('Entry Cap')}${dval(ent)}</div>
                <div style="text-align:left;">${lbl('Exit Cap')}${dval(ext)}</div>
                <div style="text-align:left;">${lbl('Invested')}${dval(inv)}</div>
                <div style="text-align:right;">${lbl('Net Profit')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
