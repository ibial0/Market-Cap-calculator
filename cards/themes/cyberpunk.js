// ═══════════════════════════════════════════════════════════
//  THEME: LUXURY GOLD (Cyberpunk slot)
//  Ultra-premium dark card. Think Black Amex, Bloomberg terminal,
//  private wealth management. Deep charcoal + brushed gold.
//  No character. Full-width centered layout.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg:'#0b0b0b', text:'#f5f0e8', accent:'#c9a84c', positive:'#d4b896', negative:'#c0392b',
      panelBg:'rgba(28,22,14,0.95)', lineColor:'rgba(201,168,76,0.25)' },  // Classic Gold
    { bg:'#080c10', text:'#e8f4f0', accent:'#7ec8e3', positive:'#7ec8e3', negative:'#e05a5a',
      panelBg:'rgba(10,18,26,0.95)', lineColor:'rgba(126,200,227,0.2)' },  // Platinum Blue
    { bg:'#100808', text:'#f5ebe8', accent:'#c0392b', positive:'#e8a090', negative:'#7f8c8d',
      panelBg:'rgba(26,10,8,0.95)', lineColor:'rgba(192,57,43,0.2)' },     // Crimson Executive
];

export default {
    id: 'cyberpunk',
    name: 'Luxury Gold',
    hasCharacter: false,
    bgVariants: 3, charVariants: 1, accentVariants: PALETTES.length, detailVariants: 1,

    getPalette(tierId, accentIdx) { return { ...PALETTES[accentIdx % PALETTES.length] }; },
    getTypography() {
        return {
            display: "'Inter', sans-serif", displayWeight: 800,
            body: "'Inter', sans-serif", mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = 1600, H = 900;
        const ac = pal.accent;

        // Subtle diagonal texture lines (brushed metal effect)
        let lines = '';
        for (let i = -H; i < W + H; i += 18) {
            lines += `<line x1="${i}" y1="0" x2="${i + H}" y2="${H}" stroke="${ac}" stroke-width="0.4" opacity="0.06"/>`;
        }

        // Gold accent shapes
        const deco = variant === 0
            ? `<rect x="0" y="${H*0.5}" width="${W}" height="1" fill="${ac}" opacity="0.2"/>
               <rect x="0" y="${H*0.5+2}" width="${W}" height="1" fill="${ac}" opacity="0.1"/>
               <circle cx="${W}" cy="0" r="600" fill="none" stroke="${ac}" stroke-width="1.5" opacity="0.08"/>
               <circle cx="${W}" cy="0" r="700" fill="none" stroke="${ac}" stroke-width="0.8" opacity="0.05"/>`
            : variant === 1
            ? `<rect x="0" y="0" width="${W}" height="${H*0.03}" fill="${ac}" opacity="0.15"/>
               <rect x="0" y="${H-H*0.03}" width="${W}" height="${H*0.03}" fill="${ac}" opacity="0.15"/>
               <line x1="${W*0.5}" y1="0" x2="${W*0.5}" y2="${H}" stroke="${ac}" stroke-width="1" opacity="0.06"/>`
            : `<rect x="0" y="${H*0.72}" width="${W}" height="1" fill="${ac}" opacity="0.2"/>
               <polygon points="0,0 ${W*0.5},0 0,${H*0.45}" fill="${ac}" opacity="0.02"/>`;

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
            style="position:absolute;inset:0;pointer-events:none;">
            <rect width="100%" height="100%" fill="${pal.bg}"/>
            ${lines}
            ${deco}
            <!-- Edge vignette -->
            <rect width="100%" height="100%" fill="url(#lvignette)"/>
            <defs>
                <radialGradient id="lvignette" cx="50%" cy="50%" r="70%">
                    <stop offset="30%" stop-color="transparent"/>
                    <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
                </radialGradient>
            </defs>
        </svg>`;
    },

    renderEffects() { return ''; },

    getBorder(pal) {
        return `border-radius:20px;
            border-top:1px solid ${pal.accent}60;
            border-left:1px solid ${pal.accent}40;
            border-right:1px solid ${pal.accent}20;
            border-bottom:1px solid ${pal.accent}10;
            box-shadow:0 0 0 1px rgba(0,0,0,0.8), 0 40px 80px rgba(0,0,0,0.7);`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;
        const P = 72; // generous padding for luxury feel

        const lbl = (t) => `<div style="font-size:13px;font-family:${typo.body};color:${ac};
            opacity:0.65;font-weight:600;letter-spacing:3px;text-transform:uppercase;
            margin-bottom:10px;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:38px;font-family:${typo.mono};font-weight:700;
            color:${c || pal.text};letter-spacing:-0.5px;white-space:nowrap;">${v}</div>`;

        // Gold divider line
        const divider = `<div style="height:1px;background:linear-gradient(90deg,transparent,${ac}60,transparent);margin:0;"></div>`;

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;
            justify-content:space-between;padding:${P}px ${P+16}px;box-sizing:border-box;">

            <!-- TOP: Identity row -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:13px;font-weight:700;color:${ac};letter-spacing:5px;
                        text-transform:uppercase;opacity:0.7;margin-bottom:20px;">Private Trade Statement</div>
                    <div style="font-size:${Math.min(tokSz + 18, 90)}px;font-family:${typo.display};
                        font-weight:${typo.displayWeight};color:${pal.text};line-height:1;
                        letter-spacing:-0.03em;">${tok}</div>
                </div>
                <div style="text-align:right;margin-top:6px;">
                    ${tierBadge ? `<div style="font-size:14px;font-weight:700;color:${ac};
                        letter-spacing:4px;border:1px solid ${ac}50;padding:8px 22px;
                        margin-bottom:14px;display:inline-block;">${tierBadge}</div>` : ''}
                    ${usr ? `<div style="font-size:22px;color:${pal.text};opacity:0.45;display:block;margin-top:${tierBadge ? '10px' : '0'};">@${usr}</div>` : ''}
                </div>
            </div>

            ${divider}

            <!-- CENTER: Giant hero number, left-aligned -->
            <div style="flex:1;display:flex;align-items:center;gap:80px;padding:${P*0.6}px 0;">
                <div>
                    <div style="font-size:${Math.min(mulSz + 48, 220)}px;font-family:${typo.display};
                        font-weight:900;color:${profitColor};line-height:0.9;
                        letter-spacing:-0.05em;">${mul}</div>
                </div>
                <div style="border-left:2px solid ${ac}25;padding-left:60px;">
                    <div style="font-size:56px;font-family:${typo.mono};font-weight:700;
                        color:${pal.text};opacity:0.85;white-space:nowrap;">${roi}</div>
                    <div style="font-size:26px;font-family:${typo.body};color:${ac};
                        opacity:0.55;letter-spacing:2px;text-transform:uppercase;margin-top:10px;">Return on Investment</div>
                </div>
            </div>

            ${divider}

            <!-- BOTTOM: Data row -->
            <div style="display:flex;gap:0;padding-top:36px;">
                <div style="flex:1;">${lbl('Entry Cap')}${dval(ent)}</div>
                <div style="flex:1;">${lbl('Exit Cap')}${dval(ext)}</div>
                <div style="flex:1;">${lbl('Invested')}${dval(inv)}</div>
                <div style="flex:1;">${lbl('Net Profit')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
