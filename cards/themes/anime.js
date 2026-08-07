// ═══════════════════════════════════════════════════════════
//  THEME: ANIME ACTION
//  Character fills CHAR_ZONE via viewBox+100% sizing.
//  Layout fills TEXT_ZONE via flex.
// ═══════════════════════════════════════════════════════════
import { CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#2b1b54', text: '#ffffff', accent: '#ff9a00', positive: '#ffbb00', negative: '#4a7cff', glow: 'rgba(255,187,0,0.5)',  card: '#1a103c' },
    { bg: '#0b162c', text: '#f0f4ff', accent: '#00e5ff', positive: '#ffaa00', negative: '#0088ff', glow: 'rgba(0,229,255,0.4)', card: '#070d1a' },
    { bg: '#3a0ca3', text: '#ffffff', accent: '#f72585', positive: '#ffb703', negative: '#4361ee', glow: 'rgba(247,37,133,0.5)',card: '#270870' },
    { bg: '#14213d', text: '#e5e5e5', accent: '#fca311', positive: '#fca311', negative: '#3a86ff', glow: 'rgba(252,163,17,0.4)',card: '#000000' },
];

export default {
    id: 'anime',
    name: 'Anime Action',
    hasCharacter: true,
    bgVariants:     4,
    charVariants:   3,
    accentVariants: PALETTES.length,
    detailVariants: 2,

    getPalette(tierId, accentIdx, isProfit) {
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
        const W = CARD_W, H = CARD_H;
        let inner = '';

        if (variant === 0) {
            // Radial speed lines — seeded angles, no Math.random()
            let lines = '';
            for (let i = 0; i < 36; i++) {
                const a = (i * 10) * Math.PI / 180;
                lines += `<line x1="${W/2}" y1="${H/2}" x2="${(W/2 + Math.cos(a)*1400).toFixed(0)}" y2="${(H/2 + Math.sin(a)*1400).toFixed(0)}" stroke="${pal.text}" stroke-width="${1 + (i%3)}" opacity="0.06"/>`;
            }
            inner = `<defs><linearGradient id="ag0" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${pal.bg}"/><stop offset="100%" stop-color="${pal.card}"/></linearGradient></defs>
                <rect width="${W}" height="${H}" fill="url(#ag0)"/>
                ${lines}`;
        } else if (variant === 1) {
            inner = `<rect width="${W}" height="${H}" fill="${pal.bg}"/>
                <circle cx="200" cy="200" r="700" fill="${pal.accent}" opacity="0.04"/>
                <circle cx="${W-200}" cy="${H-200}" r="500" fill="${pal.negative}" opacity="0.04"/>`;
        } else if (variant === 2) {
            inner = `<defs><radialGradient id="ag2" cx="50%" cy="50%" r="75%"><stop offset="0%" stop-color="${pal.card}"/><stop offset="100%" stop-color="${pal.bg}"/></radialGradient></defs>
                <rect width="${W}" height="${H}" fill="url(#ag2)"/>
                <path d="M 0 0 L ${W} ${H} M ${W} 0 L 0 ${H}" stroke="${pal.accent}" stroke-width="1.5" opacity="0.08"/>`;
        } else {
            let bars = '';
            for (let i = 0; i < 20; i++) {
                bars += `<rect x="${i*80}" y="0" width="40" height="${H}" fill="${pal.accent}" opacity="0.03"/>`;
            }
            inner = `<rect width="${W}" height="${H}" fill="${pal.bg}"/>${bars}`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
            style="position:absolute;top:0;left:0;pointer-events:none;">
            ${inner}
        </svg>`;
    },

    // Character fills CHAR_ZONE (100%×100%)
    renderCharacter(pal, emotion, isProfit, variant) {
        const hairColor = isProfit ? pal.positive : pal.negative;
        const faceColor = '#ffe0bd';

        const hairs = [
            `<polygon points="30,80 65,20 100,60 140,5 180,60 215,15 245,70 285,100 265,165 245,120 65,120 30,165" fill="${hairColor}"/>`,
            `<path d="M 40 110 C 40 15 255 15 255 110 C 295 170 245 185 220 150 C 180 170 120 170 95 150 C 70 185 20 170 40 110 Z" fill="${hairColor}"/>`,
            `<polygon points="20,140 70,40 155,5 240,40 290,140 250,100 200,118 155,90 110,118 60,100" fill="${hairColor}"/>`,
        ];

        let expression = '';
        if (isProfit) {
            // Star eyes + big smile
            expression = `
                <polygon points="105,105 113,128 138,132 120,150 125,175 105,163 85,175 90,150 72,132 97,128" fill="${pal.positive}" opacity="0.9"/>
                <polygon points="200,105 208,128 233,132 215,150 220,175 200,163 180,175 185,150 167,132 192,128" fill="${pal.positive}" opacity="0.9"/>
                <path d="M 120 215 Q 155 245 190 215" stroke="#000" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        } else {
            expression = `
                <ellipse cx="108" cy="135" rx="14" ry="22" fill="#111"/>
                <ellipse cx="202" cy="135" rx="14" ry="22" fill="#111"/>
                <path d="M 225 155 Q 238 175 228 184 Q 218 175 225 155" fill="#00aaff" opacity="0.8"/>
                <path d="M 135 225 Q 155 205 178 225" stroke="#000" stroke-width="5" fill="none" stroke-linecap="round"/>`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 320 420"
            width="100%" height="100%"
            preserveAspectRatio="xMidYMax meet">
            <circle cx="155" cy="165" r="100" fill="${faceColor}" stroke="#000" stroke-width="3"/>
            ${hairs[variant % hairs.length]}
            ${expression}
        </svg>`;
    },

    renderEffects(pal, tierId, detailIdx) {
        if (detailIdx === 0) return '';
        // Speed lines emanating from right side (accent)
        const W = CARD_W, H = CARD_H;
        const cx = W * 0.75, cy = H * 0.4;
        let lines = '';
        for (let i = 0; i < 48; i++) {
            const a = (i * 7.5) * Math.PI / 180;
            const r1 = 120, r2 = 500 + (i % 5) * 60;
            lines += `<line x1="${(cx + Math.cos(a)*r1).toFixed(0)}" y1="${(cy + Math.sin(a)*r1).toFixed(0)}" x2="${(cx + Math.cos(a)*r2).toFixed(0)}" y2="${(cy + Math.sin(a)*r2).toFixed(0)}" stroke="${pal.accent}" stroke-width="${1 + (i%3)}" opacity="${(0.08 + (i%4)*0.04).toFixed(2)}"/>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
            style="position:absolute;top:0;left:0;pointer-events:none;z-index:4;">${lines}</svg>`;
    },

    getBorder(pal) {
        return `border:8px solid #000; outline:3px solid ${pal.accent}; outline-offset:-11px;`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext,
                isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;

        const lbl = (t) => `<div style="font-size:14px;font-family:${typo.body};color:${pal.text};opacity:0.55;font-weight:700;text-transform:uppercase;margin-bottom:5px;white-space:nowrap;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:28px;font-family:${typo.mono};font-weight:700;color:${c || pal.text};white-space:nowrap;line-height:1.1;">${v}</div>`;

        const badge = (isProfit && tierBadge) ? `
            <div style="display:inline-flex;align-items:center;padding:8px 22px;background:${pal.positive};color:#000;font-size:17px;font-weight:900;text-transform:uppercase;transform:skew(-10deg);white-space:nowrap;">
                <span style="transform:skew(10deg);">${tierBadge}</span>
            </div>` : '';

        const usrEl = usr ? `<div style="font-size:22px;font-family:${typo.body};font-weight:700;color:${ac};margin-top:${badge?'8px':'0'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">@${usr}</div>` : '';

        return `<div style="width:100%;height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:${S}px;box-sizing:border-box;">
            <!-- Top -->
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
                <div style="flex:1;min-width:0;overflow:hidden;">
                    <div style="font-size:${tokSz}px;font-family:${typo.display};font-weight:${typo.displayWeight};color:#fff;line-height:1.05;text-shadow:3px 3px 0 #000,-1px -1px 0 #000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tok}</div>
                    ${usrEl}
                </div>
                <div style="flex-shrink:0;text-align:right;">${badge}</div>
            </div>
            <!-- Center -->
            <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
                <div style="font-size:${mulSz}px;font-family:${typo.display};font-weight:${typo.displayWeight};color:${profitColor};line-height:1;text-shadow:5px 5px 0 #000;font-style:italic;white-space:nowrap;overflow:hidden;">${mul}</div>
                <div style="font-size:44px;font-family:${typo.mono};font-weight:900;color:${pal.text};text-shadow:2px 2px 0 #000;margin-top:10px;white-space:nowrap;">${roi}</div>
            </div>
            <!-- Bottom -->
            <div style="display:flex;gap:0;background:rgba(0,0,0,0.65);padding:20px 24px;border-left:6px solid ${ac};transform:skew(-5deg);">
                <div style="flex:1;min-width:0;transform:skew(5deg);">${lbl('Entry')}${dval(ent)}</div>
                <div style="flex:1;min-width:0;transform:skew(5deg);">${lbl('Exit')}${dval(ext)}</div>
                <div style="flex:1;min-width:0;transform:skew(5deg);">${lbl('Invested')}${dval(inv)}</div>
                <div style="flex:1;min-width:0;transform:skew(5deg);">${lbl('P/L')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
