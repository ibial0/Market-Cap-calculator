// ═══════════════════════════════════════════════════════════
//  THEME: TERMINAL (Replacing Pixel Art)
//  Hacker command line style, pure monospace, ASCII borders.
//  No characters.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#050505', text: '#00ff00', accent: '#00ff00', positive: '#00ff00', negative: '#ff0000' }, // Matrix Green
    { bg: '#050510', text: '#00e5ff', accent: '#00e5ff', positive: '#00e5ff', negative: '#ff0055' }, // Cyan
    { bg: '#100500', text: '#ffaa00', accent: '#ffaa00', positive: '#ffaa00', negative: '#ff0000' }, // Amber
    { bg: '#000000', text: '#ffffff', accent: '#ffffff', positive: '#ffffff', negative: '#ff0000' }, // Pure B&W
];

export default {
    id: 'pixel_art', // Keeping ID same for config compatibility
    name: 'Terminal',
    hasCharacter: false,
    bgVariants:     1,
    charVariants:   1,
    accentVariants: PALETTES.length,
    detailVariants: 1,

    getPalette(tierId, accentIdx) {
        return { ...PALETTES[accentIdx % PALETTES.length] };
    },

    getTypography() {
        return {
            display:       "'Courier New', 'Roboto Mono', monospace",
            displayWeight: 700,
            body:          "'Courier New', 'Roboto Mono', monospace",
            mono:          "'Courier New', 'Roboto Mono', monospace",
        };
    },

    renderBackground(pal) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;">
            <rect width="100%" height="100%" fill="${pal.bg}"/>
        </svg>`;
    },

    renderEffects() {
        // Subtle scanlines
        return `<div style="position:absolute;inset:0;pointer-events:none;z-index:20;background:repeating-linear-gradient(0deg,rgba(0,0,0,0.1) 0px,rgba(0,0,0,0.1) 1px,transparent 1px,transparent 3px);"></div>`;
    },

    getBorder(pal) {
        return `border: 2px solid ${pal.accent}; padding: 12px;`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;
        const ac = pal.accent;

        const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const prefix = `root@system:~#`;

        const pad = (str, len) => (str + ' '.repeat(50)).substring(0, len);
        const line = (label, val, c) => `
            <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
                <span style="opacity:0.7;">${label.padEnd(20, '.')}</span>
                <span style="color:${c || pal.text}; font-weight:700;">${val}</span>
            </div>`;

        return `<div style="border:1px solid ${ac}; height:100%; box-sizing:border-box; padding:40px; display:flex; flex-direction:column; justify-content:space-between;">
            
            <!-- Terminal Header -->
            <div>
                <div style="font-size:20px; margin-bottom:12px;">${prefix} ./analyze_trade --token ${tok} ${usr ? '--user ' + usr : ''}</div>
                <div style="font-size:20px; opacity:0.7; margin-bottom:40px;">[${dateStr}] Initializing protocol... OK</div>
                
                <div style="font-size:${tokSz}px; font-weight:700; border-bottom:2px dashed ${ac}50; padding-bottom:16px; margin-bottom:32px;">
                    > TARGET_ASSET: ${tok}
                </div>
            </div>

            <!-- Huge ASCII-style Numbers -->
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:24px; opacity:0.7; margin-bottom:12px;">> CALC_MULTIPLIER:</div>
                <div style="font-size:${mulSz + 20}px; font-weight:700; color:${profitColor}; line-height:1;">${mul}</div>
                <div style="font-size:40px; margin-top:16px; opacity:0.9;">> CALC_ROI: ${roi}</div>
                ${tierBadge ? `<div style="font-size:24px; margin-top:32px; background:${ac}; color:${pal.bg}; display:inline-block; padding:4px 16px;">STATUS: ${tierBadge}</div>` : ''}
            </div>

            <!-- Terminal Data Grid -->
            <div style="display:flex; gap:64px; border-top:2px dashed ${ac}50; padding-top:40px; font-size:28px;">
                <div style="flex:1;">
                    ${line('> ENTRY_MCAP', ent)}
                    ${line('> EXIT_MCAP', ext)}
                </div>
                <div style="flex:1;">
                    ${line('> INV_AMOUNT', inv)}
                    ${line('> NET_PROFIT', pStr, profitColor)}
                </div>
            </div>

            <!-- Blinking Cursor at bottom -->
            <div style="margin-top:24px; font-size:24px;">
                ${prefix} <span style="animation:blink 1s step-end infinite; display:inline-block; width:14px; height:24px; background:${ac}; vertical-align:bottom;"></span>
            </div>
            <style>@keyframes blink { 0%, 100% { opacity:1; } 50% { opacity:0; } }</style>
        </div>`;
    },
};
