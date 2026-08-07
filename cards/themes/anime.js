// ═══════════════════════════════════════════════════════════
//  THEME: AURA (Mesh Gradients)
//  Extremely elegant, vibrant background gradients with clean
//  centered Apple-like typography.
// ═══════════════════════════════════════════════════════════

const PALETTES = [
    { bg: '#000000', text: '#ffffff', accent: '#ffffff', positive: '#00ff88', negative: '#ff4444', 
      mesh: ['#ff00cc', '#3333ff', '#00ccff', '#000000'] }, // Cyber pop
    { bg: '#000000', text: '#ffffff', accent: '#ffffff', positive: '#00e5ff', negative: '#ff3366', 
      mesh: ['#4facfe', '#00f2fe', '#f093fb', '#000000'] }, // Cool breeze
    { bg: '#000000', text: '#ffffff', accent: '#ffffff', positive: '#ffdd00', negative: '#ff3366', 
      mesh: ['#fa709a', '#fee140', '#ff0844', '#000000'] }, // Sunset
    { bg: '#000000', text: '#ffffff', accent: '#ffffff', positive: '#00ffaa', negative: '#ff4444', 
      mesh: ['#43e97b', '#38f9d7', '#0072ff', '#000000'] }, // Emerald
];

export default {
    id: 'anime', // Replacing anime with Aura, keep ID to avoid breaking config
    name: 'Aura',
    hasCharacter: false,
    bgVariants:     4,
    charVariants:   1,
    accentVariants: PALETTES.length,
    detailVariants: 1,

    getPalette(tierId, accentIdx) {
        return { ...PALETTES[accentIdx % PALETTES.length] };
    },

    getTypography() {
        return {
            display:       "'Inter', sans-serif",
            displayWeight: 800,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        // We use SVG radial gradients to create a mesh-like blur effect
        const c1 = pal.mesh[0];
        const c2 = pal.mesh[1];
        const c3 = pal.mesh[2];
        const bg = pal.mesh[3] || '#000000';

        // Different positions based on variant
        const positions = [
            [{cx: '20%', cy: '30%', r: '60%'}, {cx: '80%', cy: '70%', r: '70%'}, {cx: '60%', cy: '10%', r: '50%'}],
            [{cx: '50%', cy: '0%',  r: '80%'}, {cx: '10%', cy: '90%', r: '60%'}, {cx: '90%', cy: '90%', r: '60%'}],
            [{cx: '80%', cy: '20%', r: '70%'}, {cx: '20%', cy: '80%', r: '70%'}, {cx: '50%', cy: '50%', r: '50%'}],
            [{cx: '0%',  cy: '50%', r: '80%'}, {cx: '100%',cy: '50%', r: '80%'}, {cx: '50%', cy: '100%',r: '60%'}],
        ][variant % 4];

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="position:absolute;inset:0;pointer-events:none;">
            <defs>
                <radialGradient id="mesh1" cx="${positions[0].cx}" cy="${positions[0].cy}" r="${positions[0].r}">
                    <stop offset="0%" stop-color="${c1}" stop-opacity="0.6"/><stop offset="100%" stop-color="${c1}" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="mesh2" cx="${positions[1].cx}" cy="${positions[1].cy}" r="${positions[1].r}">
                    <stop offset="0%" stop-color="${c2}" stop-opacity="0.5"/><stop offset="100%" stop-color="${c2}" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="mesh3" cx="${positions[2].cx}" cy="${positions[2].cy}" r="${positions[2].r}">
                    <stop offset="0%" stop-color="${c3}" stop-opacity="0.5"/><stop offset="100%" stop-color="${c3}" stop-opacity="0"/>
                </radialGradient>
                <filter id="blur"><feGaussianBlur stdDeviation="80" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect width="100%" height="100%" fill="${bg}"/>
            <g filter="url(#blur)">
                <rect width="100%" height="100%" fill="url(#mesh1)"/>
                <rect width="100%" height="100%" fill="url(#mesh2)"/>
                <rect width="100%" height="100%" fill="url(#mesh3)"/>
            </g>
        </svg>`;
    },

    renderEffects() {
        // Add subtle noise overlay for premium feel
        return `<div style="position:absolute;inset:0;pointer-events:none;opacity:0.25;background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E');mix-blend-mode:overlay;"></div>`;
    },

    getBorder() {
        return `border-radius:32px; border:1px solid rgba(255,255,255,0.15); box-shadow: 0 30px 60px rgba(0,0,0,0.4);`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, tierBadge } = cd;

        const lbl = (t) => `<div style="font-size:14px; font-weight:600; color:rgba(255,255,255,0.5); letter-spacing:2px; text-transform:uppercase; margin-bottom:8px;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:36px; font-family:${typo.mono}; font-weight:700; color:${c || '#fff'}; letter-spacing:-0.5px;">${v}</div>`;

        return `<div style="padding:${S+20}px ${S+40}px; height:100%; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
            
            <!-- Top: Centered Token -->
            <div style="text-align:center; margin-top:20px;">
                ${tierBadge ? `<div style="display:inline-block; font-size:14px; font-weight:700; letter-spacing:4px; color:rgba(255,255,255,0.7); border:1px solid rgba(255,255,255,0.3); border-radius:30px; padding:6px 20px; margin-bottom:20px;">${tierBadge}</div>` : ''}
                <div style="font-size:${tokSz + 20}px; font-weight:900; line-height:1; letter-spacing:-0.03em; color:#fff;">${tok}</div>
                ${usr ? `<div style="font-size:24px; font-weight:500; color:rgba(255,255,255,0.6); margin-top:12px;">@${usr}</div>` : ''}
            </div>

            <!-- Center: Giant Hero Multiplier -->
            <div style="text-align:center; flex:1; display:flex; flex-direction:column; justify-content:center;">
                <div style="font-size:${Math.min(mulSz + 40, 200)}px; font-weight:900; color:${profitColor}; line-height:0.9; letter-spacing:-0.04em; text-shadow: 0 10px 40px ${isProfit ? 'rgba(0,255,136,0.3)' : 'rgba(255,50,50,0.3)'};">${mul}</div>
                <div style="font-size:52px; font-family:${typo.mono}; font-weight:600; color:rgba(255,255,255,0.8); margin-top:16px;">${roi} ROI</div>
            </div>

            <!-- Bottom: Beautifully spaced data row -->
            <div style="display:flex; justify-content:space-between; background:rgba(0,0,0,0.2); backdrop-filter:blur(20px); border-radius:24px; padding:32px 48px; border:1px solid rgba(255,255,255,0.1);">
                <div style="text-align:left;">${lbl('ENTRY MCAP')}${dval(ent)}</div>
                <div style="text-align:left;">${lbl('EXIT MCAP')}${dval(ext)}</div>
                <div style="text-align:left;">${lbl('INVESTED')}${dval(inv)}</div>
                <div style="text-align:right;">${lbl('NET PROFIT')}${dval(pStr, profitColor)}</div>
            </div>
        </div>`;
    },
};
