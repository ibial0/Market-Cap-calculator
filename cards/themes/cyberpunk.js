// ═══════════════════════════════════════════════════════════
//  THEME: CYBERPUNK
//  Character: geometric robot SVG, fills CHAR_ZONE (100%×100%)
//  Layout: fills TEXT_ZONE via flex, no raw canvas coords
// ═══════════════════════════════════════════════════════════
import { CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#0a0a1e', text: '#e0f2fe', accent: '#00f2fe', positive: '#00ff66', negative: '#ff003c', glow: 'rgba(0,242,254,0.3)',   card: '#0f172a' },
    { bg: '#090514', text: '#fae8ff', accent: '#ff00ff', positive: '#00ff66', negative: '#ff003c', glow: 'rgba(255,0,255,0.3)',   card: '#1c0c2e' },
    { bg: '#050a14', text: '#e0e7ff', accent: '#8b5cf6', positive: '#00ff66', negative: '#ff003c', glow: 'rgba(139,92,246,0.3)', card: '#0f172a' },
    { bg: '#0a0a0a', text: '#fef9c3', accent: '#fde047', positive: '#00ff66', negative: '#ff003c', glow: 'rgba(253,224,71,0.3)',  card: '#171717' },
];

export default {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    hasCharacter: true,
    bgVariants:     4,
    charVariants:   3,
    accentVariants: 4,
    detailVariants: 3,

    getPalette(tierId, accentIdx, isProfit) {
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
        const W = CARD_W, H = CARD_H;
        const ac = pal.accent;
        let inner = '';

        if (variant === 0) {
            // Neon perspective grid
            let lines = '';
            for (let i = -W; i <= W * 2; i += 60) {
                lines += `<line x1="${W/2}" y1="${H/2}" x2="${i}" y2="${H}" stroke="${ac}" stroke-width="1.5" opacity="0.35"/>`;
            }
            for (let y = H/2; y <= H; y += 30) {
                lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${ac}" stroke-width="0.8" opacity="0.25"/>`;
            }
            inner = `<rect x="0" y="${H/2}" width="${W}" height="${H/2}" fill="${ac}" opacity="0.04"/>${lines}
                <line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="${ac}" stroke-width="2" opacity="0.6"/>`;
        } else if (variant === 1) {
            // Holographic fragments
            inner = `
                <rect x="80" y="60" width="260" height="180" fill="none" stroke="${ac}" stroke-width="1.5" stroke-dasharray="8 5" opacity="0.25"/>
                <rect x="${W-380}" y="200" width="220" height="380" fill="none" stroke="${ac}" stroke-width="1" opacity="0.18"/>
                <circle cx="${W-270}" cy="390" r="90" fill="none" stroke="${ac}" stroke-width="1" stroke-dasharray="4 8" opacity="0.3"/>`;
        } else if (variant === 2) {
            // Rain streaks
            let drops = '';
            // Use seeded positions for consistency (no Math.random() in background)
            for (let i = 0; i < 120; i++) {
                const x = (i * 137.5) % W;
                const y = (i * 89.3) % H;
                const len = 20 + (i % 5) * 8;
                drops += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - len/4).toFixed(0)}" y2="${(y + len).toFixed(0)}" stroke="${ac}" stroke-width="1" opacity="${(0.15 + (i % 4) * 0.08).toFixed(2)}"/>`;
            }
            inner = drops;
        } else {
            // Hex grid
            let hex = '';
            for (let x = 0; x < W; x += 44) {
                for (let y = 0; y < H; y += 44) {
                    hex += `<polygon points="${x},${y} ${x+10},${y-17} ${x+30},${y-17} ${x+40},${y} ${x+30},${y+17} ${x+10},${y+17}" fill="none" stroke="${ac}" stroke-width="0.5" opacity="0.12"/>`;
                }
            }
            inner = hex;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
            style="position:absolute;top:0;left:0;pointer-events:none;">
            <rect width="${W}" height="${H}" fill="${pal.bg}"/>
            ${inner}
        </svg>`;
    },

    // Character fills CHAR_ZONE — use 100%×100% sizing only
    renderCharacter(pal, emotion, isProfit, variant) {
        const eyeColor = isProfit ? pal.positive : pal.negative;

        // Head shape variants
        const heads = [
            `<polygon points="100,160 260,160 230,280 130,280" fill="${pal.card}" stroke="${pal.accent}" stroke-width="3"/>`,
            `<rect x="110" y="150" width="140" height="130" rx="18" fill="${pal.card}" stroke="${pal.accent}" stroke-width="3"/>`,
            `<polygon points="180,140 270,210 180,280 90,210" fill="${pal.card}" stroke="${pal.accent}" stroke-width="3"/>`,
        ];
        const head = heads[variant % heads.length];

        return `<svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 360 600"
            width="100%" height="100%"
            preserveAspectRatio="xMidYMid meet">
            <!-- Body -->
            <path d="M 80,400 L 280,400 L 320,560 L 40,560 Z" fill="${pal.card}" stroke="${pal.accent}" stroke-width="3"/>
            <line x1="180" y1="400" x2="180" y2="560" stroke="${pal.accent}" stroke-width="1.5" opacity="0.5"/>
            <line x1="80"  y1="480" x2="280" y2="480" stroke="${pal.accent}" stroke-width="1.5" opacity="0.5"/>
            <!-- Neck -->
            <rect x="155" y="280" width="50" height="120" fill="${pal.bg}" stroke="${pal.accent}" stroke-width="3"/>
            <line x1="155" y1="305" x2="205" y2="305" stroke="${pal.accent}" stroke-width="1.5"/>
            <line x1="155" y1="330" x2="205" y2="330" stroke="${pal.accent}" stroke-width="1.5"/>
            <line x1="155" y1="355" x2="205" y2="355" stroke="${pal.accent}" stroke-width="1.5"/>
            <!-- Head -->
            ${head}
            <!-- Visor -->
            <rect x="130" y="195" width="100" height="35" rx="8" fill="#000" stroke="${pal.accent}" stroke-width="1.5"/>
            <circle cx="155" cy="212" r="7" fill="${eyeColor}" opacity="0.9"/>
            <circle cx="205" cy="212" r="7" fill="${eyeColor}" opacity="0.9"/>
            <!-- Ear details -->
            <circle cx="98"  cy="222" r="12" fill="none" stroke="${pal.accent}" stroke-width="2"/>
            <circle cx="262" cy="222" r="12" fill="none" stroke="${pal.accent}" stroke-width="2"/>
        </svg>`;
    },

    renderEffects(pal, tierId, detailIdx) {
        if (detailIdx === 0) return '';
        // CRT scanlines overlay
        return `<div style="
            position:absolute;inset:0;pointer-events:none;z-index:15;
            background:
                linear-gradient(rgba(0,0,0,0) 50%, rgba(0,0,0,0.18) 50%),
                linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.01), rgba(0,0,255,0.04));
            background-size: 100% 4px, 3px 100%;
            mix-blend-mode:overlay;">
        </div>
        <div style="position:absolute;inset:0;pointer-events:none;z-index:14;box-shadow:inset 0 0 120px rgba(0,0,0,0.75);"></div>`;
    },

    getBorder(pal) {
        return `border-radius:16px; border:2px solid ${pal.accent}; box-shadow:0 0 12px ${pal.glow}, inset 0 0 12px ${pal.glow};`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext,
                isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;

        const lbl = (t) => `<div style="font-size:13px;font-family:${typo.body};color:${ac};opacity:0.75;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:5px;white-space:nowrap;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:28px;font-family:${typo.mono};font-weight:700;color:${c || pal.text};white-space:nowrap;line-height:1.1;">${v}</div>`;

        const badge = (isProfit && tierBadge) ? `
            <div style="display:inline-flex;align-items:center;padding:5px 16px;background:transparent;border:2px solid ${ac};color:${ac};font-family:${typo.display};font-size:15px;font-weight:700;letter-spacing:2px;transform:skewX(-12deg);white-space:nowrap;">
                <span style="transform:skewX(12deg);">${tierBadge}</span>
            </div>` : '';

        const usrEl = usr ? `<div style="font-size:18px;font-family:${typo.mono};color:${pal.text};opacity:0.5;margin-top:${badge?'8px':'0'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">USR_${usr}</div>` : '';

        // Holographic data backdrop
        const backdrop = `<div style="
            position:absolute;inset:0;
            background:rgba(10,10,30,0.55);
            border-left:3px solid ${ac};
            border-right:1px solid ${ac}30;
            pointer-events:none;">
            <div style="position:absolute;top:0;right:0;width:24px;height:24px;border-top:2px solid ${ac};border-right:2px solid ${ac};"></div>
            <div style="position:absolute;bottom:0;right:0;width:24px;height:24px;border-bottom:2px solid ${ac};border-right:2px solid ${ac};"></div>
        </div>`;

        return `<div style="position:relative;width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:${S}px;box-sizing:border-box;">
            ${backdrop}
            <!-- Top -->
            <div style="position:relative;display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
                <div style="flex:1;min-width:0;overflow:hidden;">
                    <div style="font-size:11px;font-family:${typo.mono};color:${pal.bg};background:${ac};display:inline-block;padding:2px 8px;font-weight:700;letter-spacing:2px;margin-bottom:12px;">SYS // TRADE_LOG</div>
                    <div style="font-size:${tokSz}px;font-family:${typo.display};font-weight:700;color:${pal.text};line-height:1.05;letter-spacing:0.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tok}</div>
                </div>
                <div style="flex-shrink:0;text-align:right;">${badge}${usrEl}</div>
            </div>
            <!-- Center -->
            <div style="position:relative;flex:1;display:flex;flex-direction:column;justify-content:center;padding:${S}px 0;">
                <div style="font-size:${mulSz}px;font-family:${typo.display};font-weight:700;color:${profitColor};line-height:1;letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;transform:skewX(-4deg);">${mul}</div>
                <div style="font-size:40px;font-family:${typo.mono};font-weight:700;color:${pal.text};background:${profitColor}22;display:inline-block;padding:3px 14px;border-left:3px solid ${profitColor};margin-top:14px;white-space:nowrap;">${roi}</div>
            </div>
            <!-- Bottom grid -->
            <div style="position:relative;display:flex;gap:0;border-top:1px solid ${ac}30;padding-top:${S}px;">
                <div style="flex:1;min-width:0;">${lbl('ENTRY_CAP')}${dval(ent)}</div>
                <div style="flex:1;min-width:0;">${lbl('EXIT_CAP')}${dval(ext)}</div>
                <div style="flex:1;min-width:0;">${lbl('INV')}${dval(inv)}</div>
                <div style="flex:1;min-width:0;">${lbl('NET_YIELD')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
