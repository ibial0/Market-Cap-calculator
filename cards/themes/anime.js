import { SAFE_MARGIN, CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#2b1b54', text: '#ffffff', accent: '#ff9a00', positive: '#ffbb00', negative: '#4a7cff', glow: 'rgba(255,187,0,0.5)', card: '#1a103c' },
    { bg: '#0b162c', text: '#f0f4ff', accent: '#00e5ff', positive: '#ffaa00', negative: '#0088ff', glow: 'rgba(0,229,255,0.4)', card: '#070d1a' },
    { bg: '#3a0ca3', text: '#ffffff', accent: '#f72585', positive: '#ffb703', negative: '#4361ee', glow: 'rgba(247,37,133,0.5)', card: '#270870' },
    { bg: '#14213d', text: '#e5e5e5', accent: '#fca311', positive: '#fca311', negative: '#3a86ff', glow: 'rgba(252,163,17,0.4)', card: '#000000' },
];

export default {
    id: 'anime',
    name: 'Anime Action',
    hasCharacter: true,
    bgVariants: 4,
    charVariants: 3,
    accentVariants: PALETTES.length,
    detailVariants: 3,

    getPalette(tierId, accentIdx, isProfit) {
        const p = PALETTES[accentIdx % PALETTES.length];
        return { ...p, positive: isProfit ? p.positive : p.text, negative: p.negative };
    },

    getTypography() {
        return {
            display: "'Outfit', sans-serif",
            displayWeight: 900,
            body: "'Inter', sans-serif",
            mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        let bgSvg = '';
        if (variant === 0) {
            // Radial speed lines from center
            let lines = '';
            for (let i = 0; i < 40; i++) {
                const angle = (i * 9) * Math.PI / 180;
                const x2 = W/2 + Math.cos(angle) * 1200;
                const y2 = H/2 + Math.sin(angle) * 1200;
                lines += `<line x1="${W/2}" y1="${H/2}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="${pal.text}" stroke-width="${(Math.random()*4+1).toFixed(1)}" opacity="0.08"/>`;
            }
            bgSvg = `<defs><linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="${pal.bg}"/><stop offset="100%" stop-color="${pal.card}"/>
            </linearGradient></defs>
            <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
            <g>${lines}</g>`;
        } else if (variant === 1) {
            bgSvg = `<rect width="${W}" height="${H}" fill="${pal.bg}"/>
            <circle cx="200" cy="200" r="800" fill="${pal.accent}" opacity="0.05"/>
            <circle cx="${W-200}" cy="${H-200}" r="600" fill="${pal.negative}" opacity="0.05"/>`;
        } else if (variant === 2) {
            bgSvg = `<defs><radialGradient id="bgRad" cx="50%" cy="50%" r="75%">
                <stop offset="0%" stop-color="${pal.card}"/><stop offset="100%" stop-color="${pal.bg}"/>
            </radialGradient></defs>
            <rect width="${W}" height="${H}" fill="url(#bgRad)"/>
            <path d="M 0 0 L ${W} ${H} M ${W} 0 L 0 ${H}" stroke="${pal.accent}" stroke-width="2" opacity="0.1"/>`;
        } else {
            let bars = '';
            for (let i = 0; i < 20; i++) {
                bars += `<rect x="${i*80}" y="0" width="40" height="${H}" fill="${pal.accent}" opacity="0.04"/>`;
            }
            bgSvg = `<rect width="${W}" height="${H}" fill="${pal.bg}"/><g>${bars}</g>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;">${bgSvg}</svg>`;
    },

    renderCharacter(pal, emotion, isProfit, variant) {
        const faceColor = '#ffe0bd';
        const hairColor = isProfit ? pal.positive : pal.negative;

        let expression = '';
        if (isProfit) {
            expression = `
                <path d="M 120 120 L 130 140 L 150 145 L 135 160 L 140 180 L 120 170 L 100 180 L 105 160 L 90 145 L 110 140 Z" fill="${pal.positive}"/>
                <path d="M 220 120 L 230 140 L 250 145 L 235 160 L 240 180 L 220 170 L 200 180 L 205 160 L 190 145 L 210 140 Z" fill="${pal.positive}"/>
                <path d="M 140 220 Q 170 250 200 220" stroke="#000" stroke-width="5" fill="none" stroke-linecap="round"/>
            `;
        } else {
            expression = `
                <ellipse cx="120" cy="140" rx="15" ry="25" fill="#000"/>
                <ellipse cx="220" cy="140" rx="15" ry="25" fill="#000"/>
                <path d="M 240 160 Q 250 180 240 190 Q 230 180 240 160" fill="#00aaff"/>
                <path d="M 150 240 Q 170 220 190 240" stroke="#000" stroke-width="5" fill="none" stroke-linecap="round"/>
            `;
        }

        const hair = variant === 0 ?
            `<polygon points="50,100 80,40 110,80 150,20 190,80 230,30 260,90 300,120 280,180 260,140 80,140 40,180" fill="${hairColor}"/>` :
            variant === 1 ?
            `<path d="M 60 120 C 60 20 280 20 280 120 C 320 180 260 200 240 160 C 200 180 140 180 100 160 C 80 200 20 180 60 120 Z" fill="${hairColor}"/>` :
            `<polygon points="40,150 90,50 170,10 250,50 300,150 260,110 210,130 170,100 130,130 80,110" fill="${hairColor}"/>`;

        return `<div style="position:absolute;bottom:-40px;left:-20px;width:420px;height:420px;z-index:8;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
                <g transform="translate(30, 80)">
                    <circle cx="170" cy="170" r="100" fill="${faceColor}" stroke="#000" stroke-width="4"/>
                    ${hair}
                    ${expression}
                </g>
            </svg>
        </div>`;
    },

    renderEffects(pal, tierId, detailIdx) {
        const W = CARD_W, H = CARD_H;
        const cx = W - 350, cy = H / 2 - 50;
        let lines = '';
        for (let i = 0; i < 60; i++) {
            const angle = (i * 6) * Math.PI / 180;
            const r1 = 150 + Math.random() * 50;
            const r2 = 600 + Math.random() * 200;
            lines += `<line x1="${(cx + Math.cos(angle) * r1).toFixed(0)}" y1="${(cy + Math.sin(angle) * r1).toFixed(0)}" x2="${(cx + Math.cos(angle) * r2).toFixed(0)}" y2="${(cy + Math.sin(angle) * r2).toFixed(0)}" stroke="${pal.accent}" stroke-width="${(Math.random()*4+1).toFixed(1)}" opacity="${(Math.random()*0.4+0.1).toFixed(2)}"/>`;
        }
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;z-index:5;">${lines}</svg>`;
    },

    getBorder(pal) {
        return `border: 12px solid #000; outline: 4px solid ${pal.accent}; outline-offset: -16px;`;
    },

    renderLayout({ S, cd, pal, typo }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge, emotion } = cd;
        const ac = pal.accent;

        const lbl = (t) => `<div style="font-size:16px;font-family:${typo.body};color:${pal.text};opacity:0.6;font-weight:700;text-transform:uppercase;margin-bottom:4px;">${t}</div>`;
        const dataVal = (v, c) => `<div style="font-size:28px;font-family:${typo.mono};font-weight:700;color:${c || pal.text};">${v}</div>`;
        const badge = (isProfit && tierBadge) ? `<div style="display:inline-flex;align-items:center;padding:10px 24px;background:${pal.positive};color:#000;border-radius:0;font-size:18px;font-weight:900;text-transform:uppercase;transform:skew(-10deg);">${tierBadge}</div>` : '';

        return `<div style="position:relative;z-index:10;width:100%;height:100%;padding:${S + 24}px;display:flex;flex-direction:column;justify-content:space-between;box-sizing:border-box;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div style="font-size:${tokSz}px;font-family:${typo.display};font-weight:${typo.displayWeight};color:#fff;line-height:1;text-shadow: 4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000;">${tok}</div>
                    ${usr ? `<div style="font-size:24px;font-family:${typo.body};font-weight:700;color:${ac};margin-top:8px;text-shadow: 2px 2px 0 #000;">@${usr}</div>` : ''}
                </div>
                <div style="text-align:right;">${badge}</div>
            </div>
            <div style="position:relative;flex:1;display:flex;align-items:center;">
                <div style="position:absolute;right:0;top:20%;text-align:right;">
                    <div style="font-size:${Math.min(mulSz, 180)}px;font-family:${typo.display};font-weight:${typo.displayWeight};color:${profitColor};line-height:0.9;text-shadow:6px 6px 0 #000;font-style:italic;transform:skew(-5deg);">${mul}</div>
                    <div style="font-size:64px;font-family:${typo.mono};font-weight:900;color:${pal.text};text-shadow:3px 3px 0 #000;margin-top:10px;">${roi}</div>
                </div>
            </div>
            <div style="display:flex;gap:40px;background:rgba(0,0,0,0.7);padding:24px;border:4px solid #000;border-left:8px solid ${ac};transform:skew(-5deg);margin:0 10px;">
                <div style="transform:skew(5deg)">${lbl('Entry')}${dataVal(ent)}</div>
                <div style="transform:skew(5deg)">${lbl('Exit')}${dataVal(ext)}</div>
                <div style="transform:skew(5deg)">${lbl('Invested')}${dataVal(inv)}</div>
                <div style="transform:skew(5deg)">${lbl('P/L')}${dataVal(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
