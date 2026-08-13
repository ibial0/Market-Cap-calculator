// ═══════════════════════════════════════════════════════════
//  THEME: GHIBLI CATS — Reference Design Adaptation
//
//  Inspired by: Warm anime illustration style — lush green
//  forest, dappled sunlight, two cute cats peeking in.
//
//  Character: Animated cat faces with emotion expressions
//  Expression changes based on profit tier.
//
//  Layout: Cats on left peek at trade data on right.
// ═══════════════════════════════════════════════════════════

// ── Color variants ────────────────────────────────────────
const PALETTES = [
    { // Sunny Forest
        bg: '#0f3a0a', text: '#ffffff', accent: '#7fff6e',
        positive: '#a8ff78', negative: '#ff8a80',
        panelBg: 'rgba(10,40,8,0.82)',
        warm: '#f9a825', bokeh: ['#4caf50','#81c784','#66bb6a','#a5d6a7','#2e7d32'],
    },
    { // Golden Dusk
        bg: '#2d1b00', text: '#fff8e8', accent: '#ffd54f',
        positive: '#ffcc02', negative: '#ff7043',
        panelBg: 'rgba(40,20,0,0.82)',
        warm: '#ff6d00', bokeh: ['#ff8f00','#ffa726','#ffcc02','#ffe082','#bf360c'],
    },
    { // Twilight Forest
        bg: '#0a1a2d', text: '#e0f7fa', accent: '#80deea',
        positive: '#80cbc4', negative: '#ef9a9a',
        panelBg: 'rgba(5,20,40,0.82)',
        warm: '#7e57c2', bokeh: ['#26c6da','#4dd0e1','#80deea','#00bcd4','#00838f'],
    },
];

// ── Emotion → Cat expression mapping ─────────────────────
function _getLevel(emotion) {
    if (['euphoric','triumphant','legendary'].includes(emotion))   return 'ecstatic';
    if (['confident','celebrating','proud'].includes(emotion))      return 'happy';
    if (['content','satisfied','calm','playful'].includes(emotion)) return 'content';
    if (['ironic','smug','shrug','wry','dark_humor'].includes(emotion)) return 'worried';
    if (['somber','dramatic','moody'].includes(emotion))            return 'sad';
    if (['devastated','tragicomic','broken'].includes(emotion))     return 'rekt';
    return 'content';
}

// ── SVG Cat Builder ───────────────────────────────────────
function _buildCats(level, pal) {
    // --- Shared eye / mouth snippets ---
    // Black cat eyes (around cx=155, cy=275)
    const blackEyes = {
        ecstatic: `
            <ellipse cx="118" cy="275" rx="30" ry="34" fill="white"/>
            <ellipse cx="192" cy="275" rx="30" ry="34" fill="white"/>
            <polygon points="118,255 122,269 136,269 126,277 129,292 118,283 107,292 110,277 100,269 114,269" fill="#ffd700"/>
            <polygon points="192,255 196,269 210,269 200,277 203,292 192,283 181,292 184,277 174,269 188,269" fill="#ffd700"/>`,
        happy: `
            <ellipse cx="118" cy="275" rx="27" ry="31" fill="white"/>
            <ellipse cx="192" cy="275" rx="27" ry="31" fill="white"/>
            <ellipse cx="118" cy="278" rx="19" ry="22" fill="#1a1a1a"/>
            <ellipse cx="192" cy="278" rx="19" ry="22" fill="#1a1a1a"/>
            <circle cx="124" cy="269" r="7" fill="white"/>
            <circle cx="198" cy="269" r="7" fill="white"/>`,
        content: `
            <path d="M 96 278 Q 118 260 140 278" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/>
            <path d="M 170 278 Q 192 260 214 278" stroke="#1a1a1a" stroke-width="5" fill="none" stroke-linecap="round"/>`,
        worried: `
            <ellipse cx="118" cy="278" rx="22" ry="22" fill="white"/>
            <ellipse cx="192" cy="278" rx="22" ry="22" fill="white"/>
            <ellipse cx="118" cy="281" rx="14" ry="15" fill="#1a1a1a"/>
            <ellipse cx="192" cy="281" rx="14" ry="15" fill="#1a1a1a"/>
            <circle cx="122" cy="274" r="5" fill="white"/>
            <circle cx="196" cy="274" r="5" fill="white"/>
            <line x1="100" y1="258" x2="118" y2="263" stroke="#1a1a1a" stroke-width="3.5"/>
            <line x1="136" y1="258" x2="118" y2="263" stroke="#1a1a1a" stroke-width="3.5"/>`,
        sad: `
            <ellipse cx="118" cy="278" rx="24" ry="26" fill="white"/>
            <ellipse cx="192" cy="278" rx="24" ry="26" fill="white"/>
            <ellipse cx="118" cy="283" rx="16" ry="17" fill="#1a1a1a"/>
            <ellipse cx="192" cy="283" rx="16" ry="17" fill="#1a1a1a"/>
            <circle cx="122" cy="276" r="5" fill="white"/>
            <circle cx="196" cy="276" r="5" fill="white"/>
            <line x1="96" y1="262" x2="115" y2="268" stroke="#1a1a1a" stroke-width="4"/>
            <line x1="140" y1="262" x2="121" y2="268" stroke="#1a1a1a" stroke-width="4"/>
            <ellipse cx="148" cy="306" rx="8" ry="12" fill="#89d4f5" opacity="0.9"/>
            <ellipse cx="224" cy="306" rx="8" ry="12" fill="#89d4f5" opacity="0.9"/>`,
        rekt: `
            <ellipse cx="118" cy="275" rx="28" ry="31" fill="white"/>
            <ellipse cx="192" cy="275" rx="28" ry="31" fill="white"/>
            <line x1="101" y1="258" x2="135" y2="292" stroke="#ff4444" stroke-width="6" stroke-linecap="round"/>
            <line x1="135" y1="258" x2="101" y2="292" stroke="#ff4444" stroke-width="6" stroke-linecap="round"/>
            <line x1="175" y1="258" x2="209" y2="292" stroke="#ff4444" stroke-width="6" stroke-linecap="round"/>
            <line x1="209" y1="258" x2="175" y2="292" stroke="#ff4444" stroke-width="6" stroke-linecap="round"/>
            <ellipse cx="140" cy="312" rx="10" ry="14" fill="#89d4f5" opacity="0.9"/>
            <ellipse cx="220" cy="312" rx="10" ry="14" fill="#89d4f5" opacity="0.9"/>`,
    };

    const blackMouths = {
        ecstatic: `<ellipse cx="155" cy="320" rx="26" ry="16" fill="#e87070"/><path d="M 130 315 Q 155 338 180 315" stroke="#1a1a1a" stroke-width="2.5" fill="none"/>`,
        happy:    `<path d="M 133 318 Q 155 338 177 318" stroke="#555" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
        content:  `<path d="M 140 316 Q 155 326 170 316" stroke="#555" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        worried:  `<path d="M 140 320 Q 155 312 170 320" stroke="#555" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        sad:      `<path d="M 133 325 Q 155 310 177 325" stroke="#555" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
        rekt:     `<ellipse cx="155" cy="328" rx="22" ry="14" fill="#e87070"/><path d="M 133 320 Q 155 340 177 320" stroke="#1a1a1a" stroke-width="2.5" fill="none"/>`,
    };

    // White cat eyes (around cx=180, cy=520)
    const whiteEyes = {
        ecstatic: `
            <ellipse cx="148" cy="522" rx="26" ry="30" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="212" cy="522" rx="26" ry="30" fill="white" stroke="#ddd" stroke-width="1"/>
            <polygon points="148,502 152,516 166,516 156,524 159,538 148,529 137,538 140,524 130,516 144,516" fill="#69d56e"/>
            <polygon points="212,502 216,516 230,516 220,524 223,538 212,529 201,538 204,524 194,516 208,516" fill="#69d56e"/>`,
        happy: `
            <ellipse cx="148" cy="522" rx="24" ry="28" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="212" cy="522" rx="24" ry="28" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="148" cy="526" rx="16" ry="20" fill="#4a8f5c"/>
            <ellipse cx="212" cy="526" rx="16" ry="20" fill="#4a8f5c"/>
            <circle cx="153" cy="518" r="6" fill="white"/>
            <circle cx="217" cy="518" r="6" fill="white"/>`,
        content: `
            <path d="M 126 524 Q 148 505 170 524" stroke="#4a8f5c" stroke-width="4.5" fill="none" stroke-linecap="round"/>
            <path d="M 190 524 Q 212 505 234 524" stroke="#4a8f5c" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
        worried: `
            <ellipse cx="148" cy="525" rx="20" ry="21" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="212" cy="525" rx="20" ry="21" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="148" cy="529" rx="12" ry="13" fill="#4a8f5c"/>
            <ellipse cx="212" cy="529" rx="12" ry="13" fill="#4a8f5c"/>
            <circle cx="152" cy="522" r="4" fill="white"/>
            <circle cx="216" cy="522" r="4" fill="white"/>
            <line x1="130" y1="509" x2="148" y2="514" stroke="#888" stroke-width="3"/>
            <line x1="166" y1="509" x2="148" y2="514" stroke="#888" stroke-width="3"/>`,
        sad: `
            <ellipse cx="148" cy="524" rx="22" ry="23" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="212" cy="524" rx="22" ry="23" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="148" cy="530" rx="14" ry="15" fill="#4a8f5c"/>
            <ellipse cx="212" cy="530" rx="14" ry="15" fill="#4a8f5c"/>
            <circle cx="152" cy="522" r="4" fill="white"/>
            <circle cx="216" cy="522" r="4" fill="white"/>
            <line x1="128" y1="509" x2="146" y2="515" stroke="#888" stroke-width="3.5"/>
            <line x1="168" y1="509" x2="150" y2="515" stroke="#888" stroke-width="3.5"/>
            <ellipse cx="170" cy="554" rx="7" ry="10" fill="#89d4f5" opacity="0.88"/>`,
        rekt: `
            <ellipse cx="148" cy="522" rx="24" ry="26" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="212" cy="522" rx="24" ry="26" fill="white" stroke="#ddd" stroke-width="1"/>
            <ellipse cx="148" cy="528" rx="15" ry="17" fill="#4a8f5c"/>
            <ellipse cx="212" cy="528" rx="15" ry="17" fill="#4a8f5c"/>
            <circle cx="152" cy="519" r="5" fill="white"/>
            <circle cx="216" cy="519" r="5" fill="white"/>
            <line x1="126" y1="506" x2="145" y2="513" stroke="#888" stroke-width="3.5"/>
            <line x1="170" y1="506" x2="151" y2="513" stroke="#888" stroke-width="3.5"/>
            <ellipse cx="162" cy="558" rx="8" ry="12" fill="#89d4f5" opacity="0.9"/>
            <ellipse cx="238" cy="558" rx="8" ry="12" fill="#89d4f5" opacity="0.9"/>`,
    };

    const whiteMouths = {
        ecstatic: `<ellipse cx="180" cy="570" rx="22" ry="14" fill="#e87070"/><path d="M 158 564 Q 180 582 202 564" stroke="#bbb" stroke-width="2" fill="none"/>`,
        happy:    `<path d="M 161 568 Q 180 584 199 568" stroke="#bbb" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        content:  `<path d="M 166 566 Q 180 576 194 566" stroke="#bbb" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
        worried:  `<path d="M 165 570 Q 180 562 195 570" stroke="#bbb" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
        sad:      `<path d="M 161 575 Q 180 562 199 575" stroke="#bbb" stroke-width="3" fill="none" stroke-linecap="round"/>`,
        rekt:     `<ellipse cx="180" cy="576" rx="20" ry="13" fill="#e87070"/><path d="M 160 570 Q 180 588 200 570" stroke="#bbb" stroke-width="2" fill="none"/>`,
    };

    // --- Black cat body ---
    const blackCat = (eyeK, mouthK, yShift=0) => `
        <g transform="translate(0,${yShift})">
            <!-- Body peeking in -->
            <ellipse cx="155" cy="420" rx="110" ry="140" fill="#1c1c1e"/>
            <!-- Head -->
            <ellipse cx="155" cy="260" rx="118" ry="110" fill="#1c1c1e"/>
            <!-- Ears -->
            <polygon points="60,200 82,120 138,200" fill="#1c1c1e"/>
            <polygon points="172,200 228,120 250,200" fill="#1c1c1e"/>
            <polygon points="71,195 87,137 127,195" fill="#c07540" opacity="0.88"/>
            <polygon points="183,195 223,137 239,195" fill="#c07540" opacity="0.88"/>
            <!-- Fur highlight -->
            <ellipse cx="100" cy="280" rx="20" ry="30" fill="#2a2a2c" opacity="0.5"/>
            <!-- Eyes -->
            ${blackEyes[eyeK]}
            <!-- Nose -->
            <polygon points="148,330 162,330 155,341" fill="#e87070"/>
            <!-- Mouth -->
            ${blackMouths[mouthK]}
            <!-- Whiskers -->
            <line x1="28" y1="336" x2="128" y2="330" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="28" y1="348" x2="128" y2="344" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="182" y1="330" x2="282" y2="336" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="182" y1="344" x2="282" y2="348" stroke="#666" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Paw over edge -->
            <ellipse cx="200" cy="480" rx="50" ry="30" fill="#1c1c1e"/>
            <ellipse cx="185" cy="492" rx="16" ry="12" fill="#2a2a2c"/>
            <ellipse cx="205" cy="495" rx="16" ry="12" fill="#2a2a2c"/>
            <ellipse cx="225" cy="492" rx="16" ry="12" fill="#2a2a2c"/>
        </g>`;

    // --- White cat body (lower position) ---
    const whiteCat = (eyeK, mouthK, yShift=0) => `
        <g transform="translate(0,${yShift})">
            <!-- Fluffy body -->
            <ellipse cx="180" cy="690" rx="130" ry="100" fill="#f5f5f0"/>
            <ellipse cx="80" cy="640" rx="55" ry="45" fill="#f5f5f0"/>
            <ellipse cx="280" cy="640" rx="55" ry="45" fill="#f5f5f0"/>
            <!-- Head -->
            <ellipse cx="180" cy="520" rx="115" ry="108" fill="#f5f5f0"/>
            <!-- Ear fluff -->
            <ellipse cx="108" cy="452" rx="40" ry="35" fill="#f5f5f0"/>
            <ellipse cx="252" cy="452" rx="40" ry="35" fill="#f5f5f0"/>
            <!-- Ears -->
            <polygon points="100,468 118,388 168,468" fill="#f5f5f0"/>
            <polygon points="192,468 242,388 260,468" fill="#f5f5f0"/>
            <polygon points="110,462 124,404 158,462" fill="#e8a470" opacity="0.88"/>
            <polygon points="202,462 236,404 250,462" fill="#e8a470" opacity="0.88"/>
            <!-- Chest fluff -->
            <ellipse cx="180" cy="600" rx="60" ry="40" fill="white" opacity="0.7"/>
            <!-- Eyes -->
            ${whiteEyes[eyeK]}
            <!-- Nose -->
            <polygon points="173,558 187,558 180,568" fill="#e87070"/>
            <!-- Mouth -->
            ${whiteMouths[mouthK]}
            <!-- Whiskers -->
            <line x1="35" y1="562" x2="148" y2="556" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
            <line x1="35" y1="574" x2="148" y2="570" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
            <line x1="212" y1="556" x2="325" y2="562" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
            <line x1="212" y1="570" x2="325" y2="574" stroke="#ccc" stroke-width="2" stroke-linecap="round"/>
            <!-- Paw peeking -->
            <ellipse cx="240" cy="730" rx="55" ry="28" fill="#f0f0eb"/>
            <ellipse cx="222" cy="742" rx="16" ry="11" fill="#e8e8e2"/>
            <ellipse cx="244" cy="746" rx="16" ry="11" fill="#e8e8e2"/>
            <ellipse cx="266" cy="742" rx="16" ry="11" fill="#e8e8e2"/>
        </g>`;

    // ── Expression mapping ────────────────────────────────
    const builds = {
        ecstatic:  blackCat('ecstatic','ecstatic') + whiteCat('ecstatic','ecstatic'),
        happy:     blackCat('happy','happy'),
        content:   blackCat('content','content'),
        worried:   whiteCat('worried','worried'),
        sad:       whiteCat('sad','sad'),
        rekt:      blackCat('rekt','rekt') + whiteCat('rekt','rekt'),
    };

    const sparkles = ['ecstatic','happy'].includes(level)
        ? `<circle cx="300" cy="60"  r="10" fill="#ffd700" opacity="0.9"/>
           <circle cx="340" cy="100" r="6"  fill="#fff" opacity="0.7"/>
           <circle cx="30"  cy="490" r="7"  fill="#a8ff78" opacity="0.7"/>
           <circle cx="60"  cy="130" r="5"  fill="#ffd700" opacity="0.6"/>
           <circle cx="320" cy="760" r="8"  fill="#a8ff78" opacity="0.5"/>`
        : (level === 'rekt' || level === 'sad')
        ? `<circle cx="180" cy="60" r="6" fill="#89d4f5" opacity="0.5"/>
           <circle cx="100" cy="120" r="4" fill="#89d4f5" opacity="0.4"/>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 360 900"
        width="100%" height="100%"
        preserveAspectRatio="xMidYMid meet">
        ${sparkles}
        ${builds[level] || builds['content']}
    </svg>`;
}

export default {
    id: 'anime',
    name: 'Ghibli Cats',
    hasCharacter: true,
    bgVariants:     3,
    charVariants:   1,
    accentVariants: PALETTES.length,
    detailVariants: 1,

    getPalette(tierId, accentIdx, isProfit) {
        return { ...PALETTES[accentIdx % PALETTES.length] };
    },

    getTypography() {
        return {
            display:       "'Outfit', sans-serif",
            displayWeight: 800,
            body:          "'Inter', sans-serif",
            mono:          "'Roboto Mono', monospace",
        };
    },

    renderBackground(pal, tierId, variant) {
        const W = 1600, H = 900;

        // Gradient sets per variant
        const bgs = [
            { g1:'#0a2c07', g2:'#1a5210', warm:'#f9a825' },
            { g1:'#2a1500', g2:'#4a2a00', warm:'#ff6500' },
            { g1:'#061828', g2:'#0a2a3a', warm:'#7e57c2' },
        ][variant % 3];

        // Bokeh circles (static positions, no Math.random)
        const circles = [
            [280, 80,  130, 0], [130, 320, 90, 1], [450, 200, 70, 2],
            [80,  620, 110, 0], [500, 780, 95, 3], [1460, 180, 150, 1],
            [1380, 650, 100, 2],[930, 60,  140, 0], [820, 820, 120, 3],
            [1150, 430, 80, 1],[670, 450, 60, 2],
        ].map(([x,y,r,ci]) =>
            `<circle cx="${x}" cy="${y}" r="${r}" fill="${pal.bokeh[ci % pal.bokeh.length]}"/>`
        ).join('');

        // Simple leaf shapes (ellipses at angles)
        const leafColor = pal.bokeh[0];
        const leaves = [
            [320,170,42,16,-32],[195,430,50,18,22],[1410,280,45,17,-47],
            [1490,620,38,14,62],[740,60,55,20,-18],[110,760,42,16,41],
            [590,890,48,18,10],[1280,80,50,19,-55],
        ].map(([x,y,rx,ry,a]) =>
            `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${leafColor}" opacity="0.55" transform="rotate(${a},${x},${y})"/>`
        ).join('');

        return `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"
            style="position:absolute;inset:0;pointer-events:none;">
            <defs>
                <linearGradient id="gbg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="${bgs.g1}"/>
                    <stop offset="100%" stop-color="${bgs.g2}"/>
                </linearGradient>
                <radialGradient id="gwarm" cx="95%" cy="5%" r="60%">
                    <stop offset="0%" stop-color="${bgs.warm}" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="${bgs.warm}" stop-opacity="0"/>
                </radialGradient>
                <radialGradient id="gcenter" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#fff" stop-opacity="0.04"/>
                    <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
                </radialGradient>
                <filter id="gbokeh" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="50"/>
                </filter>
                <filter id="gleaf" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="4"/>
                </filter>
            </defs>
            <rect width="100%" height="100%" fill="url(#gbg)"/>
            <g filter="url(#gbokeh)" opacity="0.65">${circles}</g>
            <rect width="100%" height="100%" fill="url(#gwarm)"/>
            <g filter="url(#gleaf)" opacity="0.38">${leaves}</g>
            <rect width="100%" height="100%" fill="url(#gcenter)"/>
        </svg>`;
    },

    renderEffects() { return ''; },

    getBorder(pal) {
        return `border-radius:28px; border:2px solid rgba(255,255,255,0.15);
                box-shadow:0 24px 64px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.08);`;
    },

    renderLayout({ cd, pal, typo, W, H, S }) {
        const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz, emotion } = cd;
        const level = _getLevel(emotion || 'content');
        const catSVG = _buildCats(level, pal);

        const lbl = (t) => `<div style="font-size:14px;font-family:${typo.body};color:${pal.text};
            opacity:0.5;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;
            margin-bottom:8px;white-space:nowrap;">${t}</div>`;
        const dval = (v, c) => `<div style="font-size:34px;font-family:${typo.mono};font-weight:700;
            color:${c || pal.text};white-space:nowrap;line-height:1.1;">${v}</div>`;

        const badge = '';

        const usrEl = usr ? `<div style="font-size:22px;font-family:${typo.body};font-weight:500;
            color:${pal.text};opacity:0.5;margin-top:8px;white-space:nowrap;
            overflow:hidden;text-overflow:ellipsis;">@${usr}</div>` : '';

        return `<div style="width:100%;height:100%;display:flex;box-sizing:border-box;">

            <!-- Left: Cat zone (38% of card width) -->
            <div style="width:38%;flex-shrink:0;position:relative;overflow:hidden;">
                ${catSVG}
            </div>

            <!-- Right: Data panel -->
            <div style="flex:1;margin:${S}px ${S}px ${S}px 0;
                background:${pal.panelBg};
                border-radius:24px;
                border:1px solid rgba(255,255,255,0.12);
                border-top:1px solid rgba(255,255,255,0.2);
                display:flex;flex-direction:column;
                justify-content:space-between;
                padding:44px 48px;
                box-sizing:border-box;">

                <!-- TOP: Token + badge/user -->
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
                    <div style="flex:1;min-width:0;overflow:hidden;">
                        <div style="font-size:${Math.min(tokSz, 74)}px;font-family:${typo.display};
                            font-weight:${typo.displayWeight};color:${pal.accent};
                            line-height:1.05;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${tok}</div>
                        ${usrEl}
                    </div>
                    <div style="flex-shrink:0;text-align:right;">${badge}</div>
                </div>

                <!-- CENTER: Hero numbers -->
                <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:28px 0;">
                    <div style="font-size:${Math.min(mulSz, 148)}px;font-family:${typo.display};
                        font-weight:900;color:${profitColor};line-height:1;
                        letter-spacing:-0.03em;white-space:nowrap;overflow:hidden;">${mul}</div>
                    <div style="font-size:46px;font-family:${typo.mono};font-weight:700;
                        color:${pal.text};opacity:0.7;margin-top:14px;white-space:nowrap;">${roi}</div>
                </div>

                <!-- BOTTOM: Data cells -->
                <div style="display:flex;gap:0;border-top:1px solid rgba(255,255,255,0.12);padding-top:28px;">
                    <div style="flex:1;min-width:0;">${lbl('Entry Cap')}${dval(ent)}</div>
                    <div style="flex:1;min-width:0;">${lbl('Exit Cap')}${dval(ext)}</div>
                    <div style="flex:1;min-width:0;">${lbl('Invested')}${dval(inv)}</div>
                    <div style="flex:1;min-width:0;">${lbl('P / L')}${dval(pStr, profitColor)}</div>
                </div>
            </div>
        </div>`;
    },
};
