import { SAFE_MARGIN, CARD_W, CARD_H } from '../config.js';

const PALETTES = [
    { bg: '#0a0a1e', text: '#e0f2fe', accent: '#00f2fe', positive: '#00ff66', negative: '#ff003c', glow: 'rgba(0,242,254,0.3)', card: '#0f172a' },
    { bg: '#090514', text: '#fae8ff', accent: '#ff00ff', positive: '#00ff66', negative: '#ff003c', glow: 'rgba(255,0,255,0.3)', card: '#1c0c2e' },
    { bg: '#050a14', text: '#e0e7ff', accent: '#8b5cf6', positive: '#00ff66', negative: '#ff003c', glow: 'rgba(139,92,246,0.3)', card: '#0f172a' },
    { bg: '#0a0a0a', text: '#fef9c3', accent: '#fde047', positive: '#00ff66', negative: '#ff003c', glow: 'rgba(253,224,71,0.3)', card: '#171717' },
];

export default {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    hasCharacter: true,
    bgVariants: 4,
    charVariants: 3,
    accentVariants: 4,
    detailVariants: 3,

    getPalette(tierId, accentIdx, isProfit) {
        const p = PALETTES[accentIdx % PALETTES.length];
        return { ...p, positive: isProfit ? p.positive : p.text, negative: p.negative };
    },

    getTypography() {
        return {
            display: "'Space Grotesk', sans-serif",
            displayWeight: 700,
            body: "'Inter', sans-serif",
            mono: "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = CARD_W, H = CARD_H;
        let svg = '';

        const defs = `
            <defs>
                <linearGradient id="gridGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${pal.accent}" stop-opacity="0" />
                    <stop offset="100%" stop-color="${pal.accent}" stop-opacity="0.8" />
                </linearGradient>
            </defs>
        `;

        if (variant === 0) {
            // Neon grid perspective floor
            let lines = '';
            for (let i = -W; i <= W * 2; i += 60) {
                lines += `<line x1="${W/2}" y1="${H/2}" x2="${i}" y2="${H}" stroke="${pal.accent}" stroke-width="1.5" opacity="0.4"/>`;
            }
            for (let y = H/2; y <= H; y += (y - H/2 + 5)/2) {
                lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${pal.accent}" stroke-width="1" opacity="0.4"/>`;
            }
            svg = `
                <rect width="${W}" height="${H}" fill="${pal.bg}"/>
                <rect x="0" y="${H/2}" width="${W}" height="${H/2}" fill="url(#gridGlow)" opacity="0.3"/>
                ${lines}
                <line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="${pal.accent}" stroke-width="3" opacity="0.8"/>
            `;
        } else if (variant === 1) {
            // Holographic UI panel fragments
            svg = `
                <rect width="${W}" height="${H}" fill="${pal.bg}"/>
                <rect x="100" y="50" width="300" height="200" fill="none" stroke="${pal.accent}" stroke-width="2" stroke-dasharray="10 5" opacity="0.3"/>
                <path d="M 120 70 L 150 70 L 160 80 L 160 110" fill="none" stroke="${pal.accent}" stroke-width="2" opacity="0.6"/>
                <rect x="${W - 400}" y="200" width="250" height="400" fill="none" stroke="${pal.accent}" stroke-width="1.5" opacity="0.2"/>
                <circle cx="${W - 275}" cy="400" r="100" fill="none" stroke="${pal.accent}" stroke-width="1" stroke-dasharray="4 8" opacity="0.4"/>
            `;
        } else if (variant === 2) {
            // Rain streaks
            let drops = '';
            for (let i = 0; i < 150; i++) {
                const x = Math.random() * W;
                const y = Math.random() * H;
                const len = 20 + Math.random() * 40;
                drops += `<line x1="${x}" y1="${y}" x2="${x - len/4}" y2="${y + len}" stroke="${pal.accent}" stroke-width="1" opacity="${(0.2 + Math.random() * 0.4).toFixed(2)}"/>`;
            }
            svg = `<rect width="${W}" height="${H}" fill="${pal.bg}"/>${drops}`;
        } else {
            // Hex grid
            let hex = '';
            for (let x = 0; x < W; x += 40) {
                for (let y = 0; y < H; y += 40) {
                    hex += `<polygon points="${x},${y} ${x+10},${y-17} ${x+30},${y-17} ${x+40},${y} ${x+30},${y+17} ${x+10},${y+17}" fill="none" stroke="${pal.accent}" stroke-width="0.5" opacity="0.15"/>`;
                }
            }
            svg = `<rect width="${W}" height="${H}" fill="${pal.bg}"/>${hex}`;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="position:absolute;top:0;left:0;pointer-events:none;">
            ${defs}
            ${svg}
        </svg>`;
    },

    renderCharacter(pal, emotion, isProfit, variant) {
        const eyeColor = isProfit ? pal.positive : pal.negative;
        const slump = isProfit ? 0 : 30;
        const aura = (emotion === 'legendary' || emotion === 'euphoric' || emotion === 'triumphant') ? `<circle cx="200" cy="300" r="150" fill="${pal.accent}" opacity="0.2"/>` : '';

        let head = '';
        if (variant === 0) {
            head = `<polygon points="120,200 280,200 250,320 150,320" fill="${pal.card}" stroke="${pal.accent}" stroke-width="4"/>`;
        } else if (variant === 1) {
            head = `<rect x="130" y="190" width="140" height="130" rx="20" fill="${pal.card}" stroke="${pal.accent}" stroke-width="4"/>`;
        } else {
            head = `<polygon points="200,180 290,250 200,320 110,250" fill="${pal.card}" stroke="${pal.accent}" stroke-width="4"/>`;
        }

        return `
        <div style="position:absolute; left:4%; top:15%; width:400px; height:600px; z-index:8;">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%">
                ${aura}
                <g transform="translate(0, ${slump})">
                    <!-- Body -->
                    <path d="M 100,450 L 300,450 L 350,600 L 50,600 Z" fill="${pal.card}" stroke="${pal.accent}" stroke-width="4"/>
                    <line x1="200" y1="450" x2="200" y2="600" stroke="${pal.accent}" stroke-width="2" opacity="0.5"/>
                    <line x1="100" y1="520" x2="300" y2="520" stroke="${pal.accent}" stroke-width="2" opacity="0.5"/>
                    
                    <!-- Neck -->
                    <rect x="175" y="320" width="50" height="130" fill="${pal.bg}" stroke="${pal.accent}" stroke-width="4"/>
                    <line x1="175" y1="350" x2="225" y2="350" stroke="${pal.accent}" stroke-width="2"/>
                    <line x1="175" y1="380" x2="225" y2="380" stroke="${pal.accent}" stroke-width="2"/>
                    <line x1="175" y1="410" x2="225" y2="410" stroke="${pal.accent}" stroke-width="2"/>

                    <!-- Head -->
                    ${head}

                    <!-- Visor/Eyes -->
                    <rect x="150" y="230" width="100" height="40" rx="10" fill="#000" stroke="${pal.accent}" stroke-width="2"/>
                    <circle cx="175" cy="250" r="8" fill="${eyeColor}"/>
                    <circle cx="225" cy="250" r="8" fill="${eyeColor}"/>

                    <!-- Cyber details -->
                    <circle cx="120" cy="260" r="15" fill="none" stroke="${pal.accent}" stroke-width="3"/>
                    <circle cx="280" cy="260" r="15" fill="none" stroke="${pal.accent}" stroke-width="3"/>
                    <path d="M 180,300 L 220,300" stroke="${pal.accent}" stroke-width="3"/>
                </g>
            </svg>
        </div>`;
    },

    renderEffects(pal, tierId, detailIdx) {
        // CRT Scanlines
        const scanlines = `
            <div style="position:absolute; inset:0; pointer-events:none; z-index:100; 
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                background-size: 100% 4px, 3px 100%;
                mix-blend-mode: overlay;">
            </div>
        `;
        
        // Glitch displacement lines
        let glitches = '';
        if (detailIdx > 0) {
            for (let i = 0; i < 5; i++) {
                const y = (Math.random() * 100).toFixed(1);
                const h = (2 + Math.random() * 10).toFixed(1);
                const opacity = (0.1 + Math.random() * 0.3).toFixed(2);
                glitches += `<div style="position:absolute; top:${y}%; left:0; right:0; height:${h}px; background:${pal.accent}; opacity:${opacity}; mix-blend-mode: screen; z-index:90;"></div>`;
            }
        }
        
        const vignette = `<div style="position:absolute; inset:0; pointer-events:none; z-index:95; box-shadow: inset 0 0 150px rgba(0,0,0,0.9);"></div>`;

        return scanlines + glitches + vignette;
    },

    getBorder(pal) {
        return `border-radius:16px; border:2px solid ${pal.accent}; box-shadow: 0 0 15px ${pal.glow}, inset 0 0 15px ${pal.glow};`;
    },

    renderLayout({ S, cd, pal, typo }) {
        const { tok, usr, mul, roi, pStr, inv, fin, ent, ext, isProfit, profitColor, tokSz, mulSz, roiSz, tierBadge } = cd;
        const ac = pal.accent;

        const lbl = (t) => `<div style="font-size:14px;font-family:${typo.body};color:${pal.accent};opacity:0.8;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;text-shadow: 0 0 8px ${pal.glow};">${t}</div>`;
        const dataVal = (v, c) => `<div style="font-size:28px;font-family:${typo.mono};font-weight:700;color:${c || pal.text};letter-spacing:1px;text-shadow: 0 0 10px ${(c || pal.text)}80;">${v}</div>`;

        const badge = (isProfit && tierBadge) ? `<div style="display:inline-flex;align-items:center;padding:6px 16px;background:transparent;border:2px solid ${ac};color:${ac};border-radius:0;font-family:${typo.display};font-size:18px;font-weight:700;letter-spacing:2px;text-shadow: 0 0 5px ${ac};box-shadow: 0 0 10px ${pal.glow}, inset 0 0 10px ${pal.glow}; transform: skewX(-15deg);"><div style="transform: skewX(15deg);">${tierBadge}</div></div>` : '';

        return `<div style="position:relative;z-index:20;width:100%;height:100%;display:flex;">
            <!-- Left Character Area (40%) -->
            <div style="width:40%; height:100%;"></div>

            <!-- Right Data Area (60%) -->
            <div style="width:60%; height:100%; padding:${S}px ${S + 20}px; display:flex; flex-direction:column; justify-content:center;">
                
                <!-- Holographic Backdrop -->
                <div style="position:absolute; right:48px; top:48px; bottom:48px; width:calc(60% - 96px); background:rgba(10,10,30,0.6); border: 1px solid ${ac}50; border-left: 4px solid ${ac}; z-index:-1;">
                    <div style="position:absolute; top:0; right:0; width:30px; height:30px; border-top: 3px solid ${ac}; border-right: 3px solid ${ac};"></div>
                    <div style="position:absolute; bottom:0; right:0; width:30px; height:30px; border-bottom: 3px solid ${ac}; border-right: 3px solid ${ac};"></div>
                </div>

                <div style="padding: 40px; height:100%; display:flex; flex-direction:column; justify-content:space-between;">
                    
                    <!-- Top: Token & Badge -->
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="display:inline-block; font-size:12px; font-family:${typo.mono}; color:${pal.bg}; background:${ac}; padding:2px 8px; font-weight:700; letter-spacing:2px; margin-bottom:16px;">SYS.OP // TRADE_LOG</div>
                            <div style="font-size:${tokSz}px; font-family:${typo.display}; font-weight:700; color:${pal.text}; line-height:1; letter-spacing:1px; text-shadow: 2px 2px 0px ${ac}, -1px -1px 0px #ff00ff;">${tok}</div>
                        </div>
                        <div style="text-align:right;">
                            ${badge}
                            ${usr ? `<div style="font-size:18px; font-family:${typo.mono}; font-weight:400; color:${pal.text}; opacity:0.6; margin-top:16px;">USR_${usr}</div>` : ''}
                        </div>
                    </div>

                    <!-- Center: Profit/Loss -->
                    <div style="margin: 40px 0;">
                        <div style="font-size:${Math.min(mulSz, 140)}px; font-family:${typo.display}; font-weight:700; color:${profitColor}; line-height:0.9; text-shadow: 0 0 20px ${profitColor}80, 4px 4px 0px ${pal.bg}; transform: skewX(-5deg);">${mul}</div>
                        <div style="font-size:36px; font-family:${typo.mono}; font-weight:700; color:${pal.text}; background:${profitColor}30; display:inline-block; padding:4px 16px; border-left:4px solid ${profitColor}; margin-top:16px; text-shadow: 0 0 8px ${profitColor}80;">${roi}</div>
                    </div>

                    <!-- Bottom: Metrics Grid -->
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px; padding-top:30px; border-top: 1px solid ${ac}40;">
                        <div>${lbl('ENTRY_CAP')}${dataVal(ent)}</div>
                        <div>${lbl('EXIT_CAP')}${dataVal(ext)}</div>
                        <div>${lbl('INITIAL_INV')}${dataVal(inv)}</div>
                        <div>${lbl('NET_YIELD')}${dataVal(pStr, profitColor)}</div>
                    </div>
                </div>

            </div>
        </div>`;
    },
};
