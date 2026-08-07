// ═══════════════════════════════════════════════════════════
//  THEME: SYNTHWAVE / NEON RETRO (Replacing Comic)
//  80s outrun aesthetic: perspective grid, neon sun, 
//  vibrant sunset colors.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#0b001a', text: '#ffffff', accent: '#ff00ff', positive: '#00ffff', negative: '#ff0055' }, // Outrun Purple
    { bg: '#000b18', text: '#ffffff', accent: '#ff007f', positive: '#00ffcc', negative: '#ff3300' }, // Cyber Sunset
    { bg: '#1a0000', text: '#ffffff', accent: '#ffaa00', positive: '#00ff88', negative: '#ff0000' }, // Blood Dragon
    { bg: '#001a1a', text: '#ffffff', accent: '#00ffcc', positive: '#ff00ff', negative: '#ff0055' }, // Miami Vice
];

export default {
    id: 'comic', // Keep ID same for config compatibility
    name: 'Synthwave',
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
            displayWeight: 900,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = 1600, H = 900;
        
        // Sun
        let sun = `<defs><linearGradient id="sunGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffff00"/><stop offset="100%" stop-color="#ff00ff"/></linearGradient></defs>
                   <circle cx="800" cy="500" r="300" fill="url(#sunGrad)" opacity="0.8"/>`;
                   
        // Slice the sun with dark lines
        for(let i=0; i<10; i++) {
            const h = 4 + i*2;
            const y = 500 + i*30;
            if (y < 800) {
                sun += `<rect x="400" y="${y}" width="800" height="${h}" fill="${pal.bg}"/>`;
            }
        }

        // Perspective Grid (Floor)
        let grid = `<rect x="0" y="600" width="1600" height="300" fill="${pal.bg}"/>`;
        for (let i = -1600; i <= 3200; i += 120) {
            grid += `<line x1="800" y1="600" x2="${i}" y2="900" stroke="${pal.accent}" stroke-width="2" opacity="0.5"/>`;
        }
        for (let i = 0; i < 15; i++) {
            const y = 600 + Math.pow(i, 2.2) * 1.5;
            if (y < 900) {
                grid += `<line x1="0" y1="${y}" x2="1600" y2="${y}" stroke="${pal.accent}" stroke-width="2" opacity="0.5"/>`;
            }
        }
        grid += `<line x1="0" y1="600" x2="1600" y2="600" stroke="${pal.positive}" stroke-width="4" opacity="0.8"/>`;
        grid += `<line x1="0" y1="600" x2="1600" y2="600" stroke="#fff" stroke-width="1" opacity="0.9"/>`;

        // Stars
        let stars = '';
        for(let i=0; i<100; i++) {
            const x = (i * 87) % 1600;
            const y = (i * 33) % 600;
            stars += `<circle cx="${x}" cy="${y}" r="${(i%3)/2+0.5}" fill="#fff" opacity="${0.2 + (i%5)*0.1}"/>`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;">
            <rect width="100%" height="100%" fill="${pal.bg}"/>
            ${stars}
            ${sun}
            ${grid}
        </svg>`;
    },

    renderEffects() {
        return `<div style="position:absolute;inset:0;pointer-events:none;z-index:20;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.15) 0px,rgba(0,0,0,0.15) 2px,transparent 2px,transparent 4px);"></div>`;
    },

    getBorder(pal) {
        return `border: 4px solid ${pal.accent}; box-shadow: inset 0 0 40px ${pal.accent}, 0 0 40px ${pal.accent}; border-radius: 16px;`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;

        const lbl = (t) => `<div style="font-size:14px; font-family:${typo.body}; font-weight:700; color:${pal.accent}; letter-spacing:2px; text-transform:uppercase; margin-bottom:8px; text-shadow:0 0 10px ${pal.accent};">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:36px; font-family:${typo.display}; font-weight:900; color:${c || '#fff'}; letter-spacing:1px; text-shadow:2px 2px 0px #000;">${v}</div>`;

        return `<div style="padding:${S+20}px; height:100%; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
            
            <!-- Top Bar -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="background:rgba(0,0,0,0.5); padding:16px 32px; border:2px solid ${pal.accent}; border-radius:8px; backdrop-filter:blur(4px);">
                    <div style="font-size:14px; font-weight:700; color:${pal.positive}; letter-spacing:4px; margin-bottom:8px;">// SYS_TRADE</div>
                    <div style="font-size:${tokSz}px; font-family:${typo.display}; font-weight:900; color:#fff; line-height:1; text-transform:uppercase; text-shadow:0 0 20px ${pal.accent}, 4px 4px 0 #000; font-style:italic;">${tok}</div>
                    ${usr ? `<div style="font-size:24px; color:#fff; opacity:0.8; margin-top:8px;">@${usr}</div>` : ''}
                </div>
                
                ${tierBadge ? `<div style="font-size:20px; font-weight:900; font-style:italic; letter-spacing:2px; background:${pal.positive}; color:#000; padding:12px 32px; transform:skewX(-15deg); box-shadow:8px 8px 0px ${pal.accent};">
                    <span style="display:block; transform:skewX(15deg);">${tierBadge}</span>
                </div>` : ''}
            </div>

            <!-- Center Giant Hero -->
            <div style="text-align:center; transform:skewX(-5deg); margin-top:-60px;">
                <div style="font-size:${Math.min(mulSz + 60, 240)}px; font-family:${typo.display}; font-weight:900; color:${profitColor}; line-height:0.9; text-shadow: 0 0 60px ${profitColor}, 6px 6px 0px #000; font-style:italic;">${mul}</div>
                <div style="font-size:52px; font-family:${typo.display}; font-weight:900; color:#fff; margin-top:8px; text-shadow:4px 4px 0px #000; font-style:italic;">${roi} ROI</div>
            </div>

            <!-- Bottom Data Panel -->
            <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.7); border-top:4px solid ${pal.positive}; padding:32px 48px; border-radius:12px; backdrop-filter:blur(8px);">
                <div style="text-align:left;">${lbl('Entry Cap')}${dval(ent)}</div>
                <div style="text-align:left;">${lbl('Exit Cap')}${dval(ext)}</div>
                <div style="text-align:left;">${lbl('Invested')}${dval(inv)}</div>
                <div style="text-align:right;">${lbl('Net Profit')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
