// ═══════════════════════════════════════════════════════════
//  THEME: MINIMAL — Reference Implementation
//
//  Layout contract:
//    renderLayout({ cd, pal, typo, W, H, S })
//      W = TEXT_ZONE width (not full card width)
//      H = TEXT_ZONE height
//      S = inner padding
//    The returned HTML fills TEXT_ZONE exactly — no absolute
//    pixel positions referencing the full 1600×900 canvas.
//
//  Character contract:
//    renderCharacter() returns HTML that fills CHAR_ZONE.
//    Use width:100%; height:100%; on the root SVG/div.
//    No absolute pixel positions referencing the full card.
// ═══════════════════════════════════════════════════════════
import { CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#08090c', text: '#f0f0f0', accent: '#00ff88', positive: '#00ff88', negative: '#ff4b4b', glow: 'rgba(0,255,136,0.15)',  card: '#0d0e12' },
    { bg: '#0a0a10', text: '#eaeaea', accent: '#4facfe', positive: '#4facfe', negative: '#ff4b4b', glow: 'rgba(79,172,254,0.15)', card: '#0e0e16' },
    { bg: '#0c0808', text: '#f5f0ec', accent: '#FFD700', positive: '#FFD700', negative: '#ff4b4b', glow: 'rgba(255,215,0,0.15)',  card: '#110d08' },
    { bg: '#080a0c', text: '#e8eef4', accent: '#00f2fe', positive: '#00f2fe', negative: '#ff4b4b', glow: 'rgba(0,242,254,0.15)',  card: '#0a0f14' },
];

export default {
    id: 'minimal',
    name: 'Minimal',
    hasCharacter: false,

    bgVariants:     4,
    charVariants:   1,
    accentVariants: PALETTES.length,
    detailVariants: 1,

    // ── Palette ────────────────────────────────────────────
    getPalette(tierId, accentIdx, isProfit) {
        const p = PALETTES[accentIdx % PALETTES.length];
        return { ...p };
    },

    // ── Typography ─────────────────────────────────────────
    getTypography() {
        return {
            display:       "'Inter', sans-serif",
            displayWeight: 900,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    // ── Background: full-card SVG, position:absolute ───────
    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        const ac = pal.accent;
        let decoration = '';

        if (variant === 0) {
            // Subtle diagonal lines
            decoration = `
                <line x1="0" y1="${H}" x2="${W}" y2="0" stroke="${ac}" stroke-width="1" opacity="0.05"/>
                <line x1="0" y1="${H - 200}" x2="${W - 200}" y2="0" stroke="${ac}" stroke-width="0.5" opacity="0.03"/>`;
        } else if (variant === 1) {
            // Corner arc
            decoration = `
                <circle cx="${W}" cy="0" r="320" fill="none" stroke="${ac}" stroke-width="1" opacity="0.07"/>
                <circle cx="${W}" cy="0" r="240" fill="none" stroke="${ac}" stroke-width="0.5" opacity="0.04"/>`;
        } else if (variant === 2) {
            // Horizontal mid-rule
            decoration = `
                <line x1="0" y1="${H * 0.5}" x2="${W}" y2="${H * 0.5}" stroke="${ac}" stroke-width="1" opacity="0.04"/>`;
        } else {
            // Grid dots
            let dots = '';
            for (let x = 80; x < W; x += 80) {
                for (let y = 80; y < H; y += 80) {
                    dots += `<circle cx="${x}" cy="${y}" r="1" fill="${ac}" opacity="0.06"/>`;
                }
            }
            decoration = dots;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg"
            width="${W}" height="${H}"
            style="position:absolute;top:0;left:0;pointer-events:none;">
            <rect width="${W}" height="${H}" fill="${pal.bg}"/>
            ${decoration}
        </svg>`;
    },

    // ── Character: minimal has none ────────────────────────
    renderCharacter() { return ''; },

    // ── Effects: none ──────────────────────────────────────
    renderEffects() { return ''; },

    // ── Border ─────────────────────────────────────────────
    getBorder(pal) {
        return `border-radius:16px; border:1px solid ${pal.accent}18;`;
    },

    // ── Layout ─────────────────────────────────────────────
    // Receives { cd, pal, typo, W, H, S } from renderer.
    // W/H = TEXT_ZONE dimensions. Use % or flex — no raw canvas coords.
    renderLayout({ cd, pal, typo, W, H, S }) {
        const {
            tok, usr, mul, roi, pStr, inv, fin, ent, ext,
            isProfit, profitColor, tokSz, mulSz, tierBadge,
        } = cd;
        const ac = pal.accent;

        // ── Small helpers ────────────────────────────────
        const lbl = (t) => `
            <div style="
                font-size:15px;
                font-family:${typo.body};
                color:${pal.text};
                opacity:0.35;
                font-weight:400;
                letter-spacing:3px;
                text-transform:uppercase;
                margin-bottom:7px;
                white-space:nowrap;
            ">${t}</div>`;

        const dval = (v, c) => `
            <div style="
                font-size:30px;
                font-family:${typo.mono};
                font-weight:700;
                color:${c || pal.text};
                white-space:nowrap;
                line-height:1.1;
            ">${v}</div>`;

        // Badge — only on wins
        const badge = (isProfit && tierBadge) ? `
            <div style="
                display:inline-flex;
                align-items:center;
                padding:7px 20px;
                background:${ac}14;
                border:1px solid ${ac}28;
                color:${ac};
                border-radius:50px;
                font-size:15px;
                font-weight:700;
                letter-spacing:3px;
                white-space:nowrap;
            ">${tierBadge}</div>` : '';

        // Username
        const usrEl = usr ? `
            <div style="
                font-size:22px;
                font-family:${typo.body};
                font-weight:400;
                color:${pal.text};
                opacity:0.4;
                margin-top:${badge ? '10px' : '0'};
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
            ">${usr}</div>` : '';

        // ── ROW 1: token name + badge/user ───────────────
        const row1 = `
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;">
                <div style="flex:1;min-width:0;overflow:hidden;">
                    <div style="
                        font-size:13px;
                        letter-spacing:4px;
                        text-transform:uppercase;
                        color:${pal.text};
                        opacity:0.25;
                        margin-bottom:10px;
                    ">TRADE REPORT</div>
                    <div style="
                        font-size:${tokSz}px;
                        font-family:${typo.display};
                        font-weight:900;
                        color:${ac};
                        line-height:1.05;
                        letter-spacing:-0.02em;
                        overflow:hidden;
                        text-overflow:ellipsis;
                        white-space:nowrap;
                    ">${tok}</div>
                </div>
                <div style="flex-shrink:0;text-align:right;">
                    ${badge}
                    ${usrEl}
                </div>
            </div>`;

        // ── ROW 2: hero numbers ───────────────────────────
        const row2 = `
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
                <div style="
                    font-size:${mulSz}px;
                    font-family:${typo.display};
                    font-weight:900;
                    color:${profitColor};
                    line-height:1;
                    letter-spacing:-0.04em;
                    white-space:nowrap;
                    overflow:hidden;
                ">${mul}</div>
                <div style="
                    font-size:48px;
                    font-family:${typo.mono};
                    font-weight:700;
                    color:${pal.text};
                    opacity:0.55;
                    margin-top:10px;
                    white-space:nowrap;
                ">${roi}</div>
            </div>`;

        // ── ROW 3: data cells ─────────────────────────────
        const row3 = `
            <div style="
                display:flex;
                gap:0;
                border-top:1px solid ${ac}12;
                padding-top:${S}px;
            ">
                <div style="flex:1;min-width:0;">${lbl('Entry MC')}${dval(ent)}</div>
                <div style="flex:1;min-width:0;">${lbl('Exit MC')}${dval(ext)}</div>
                <div style="flex:1;min-width:0;">${lbl('Invested')}${dval(inv)}</div>
                <div style="flex:1;min-width:0;">${lbl('P / L')}${dval(pStr, profitColor)}</div>
            </div>`;

        return `
            <div style="
                width:100%;
                height:100%;
                display:flex;
                flex-direction:column;
                justify-content:space-between;
                padding:${S}px;
                box-sizing:border-box;
            ">
                ${row1}
                ${row2}
                ${row3}
            </div>`;
    },
};
