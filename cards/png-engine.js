// ═══════════════════════════════════════════════════════════
//  PNG CARD RENDERER
//  Composes a 1600×900 HTML card from a PNG template + user data.
//  The PNG background is an <img> layer, dynamic text layers are
//  absolutely positioned divs on top.
//  This is intentionally separate from the theme-based renderer.
// ═══════════════════════════════════════════════════════════
import { CARD_W, CARD_H } from './config.js';
import { fmtNum } from './renderer.js';

// ── Default layer positions / styles ─────────────────────
// Coordinates are in absolute 1600×900 pixels.
// These are applied when creating a NEW template; admin can then
// drag/restyle every layer in the visual editor.
export const DEFAULT_LAYERS = [
    {
        id: 'tok', label: 'Token Name', field: 'tok',
        x: 80,   y: 56,  fontSize: 72,  fontFamily: "'Outfit', sans-serif",
        fontWeight: '900', color: '#ffffff', opacity: 1,
        textAlign: 'left', letterSpacing: 2,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: true, useProfit: false,
    },
    {
        id: 'usr', label: 'Username', field: 'usr',
        x: 1520, y: 56,  fontSize: 26,  fontFamily: "'Inter', sans-serif",
        fontWeight: '600', color: '#ffffff', opacity: 0.75,
        textAlign: 'right', letterSpacing: 0,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: true, useProfit: false,
    },
    {
        id: 'mul', label: 'Multiplier (X)', field: 'mul',
        x: 80,   y: 330, fontSize: 130, fontFamily: "'Outfit', sans-serif",
        fontWeight: '900', color: '#00ff88', opacity: 1,
        textAlign: 'left', letterSpacing: -2,
        textShadow: '0 0 48px rgba(0,255,136,0.5)', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: true, useProfit: true,
    },
    {
        id: 'roi', label: 'ROI %', field: 'roi',
        x: 80,   y: 490, fontSize: 52,  fontFamily: "'Inter', sans-serif",
        fontWeight: '700', color: '#00ff88', opacity: 1,
        textAlign: 'left', letterSpacing: 0,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: false, useProfit: true,
    },
    {
        id: 'pStr', label: 'Profit / Loss', field: 'pStr',
        x: 1220, y: 796, fontSize: 32,  fontFamily: "'Inter', sans-serif",
        fontWeight: '700', color: '#00ff88', opacity: 1,
        textAlign: 'left', letterSpacing: 0,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: true, useProfit: true,
    },
    {
        id: 'ent', label: 'Entry MC', field: 'ent',
        x: 80,   y: 796, fontSize: 30,  fontFamily: "'Inter', sans-serif",
        fontWeight: '700', color: '#ffffff', opacity: 0.9,
        textAlign: 'left', letterSpacing: 0,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: true, useProfit: false,
    },
    {
        id: 'ext', label: 'Exit MC', field: 'ext',
        x: 460,  y: 796, fontSize: 30,  fontFamily: "'Inter', sans-serif",
        fontWeight: '700', color: '#ffffff', opacity: 0.9,
        textAlign: 'left', letterSpacing: 0,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: true, useProfit: false,
    },
    {
        id: 'inv', label: 'Investment', field: 'inv',
        x: 840,  y: 796, fontSize: 30,  fontFamily: "'Inter', sans-serif",
        fontWeight: '700', color: '#ffffff', opacity: 0.9,
        textAlign: 'left', letterSpacing: 0,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: true, useProfit: false,
    },
    {
        id: 'fin', label: 'Final Value', field: 'fin',
        x: 800,  y: 430, fontSize: 36,  fontFamily: "'Inter', sans-serif",
        fontWeight: '700', color: '#ffffff', opacity: 0.8,
        textAlign: 'center', letterSpacing: 0,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: false, useProfit: false,
    },
];

// ── Data formatter (same logic as renderer.js but standalone) ──
export function formatCardData(data) {
    const isProfit = data.profit >= 0;
    const sym  = data.showBdt ? '৳' : '$';
    const rate = data.showBdt ? (data.bdtRate || 1) : 1;
    return {
        tok:        (data.tokenName || 'CRYPTO').toUpperCase(),
        usr:        data.userName ? '@' + data.userName : '',
        mul:        (isProfit ? '' : '-') + data.multiplier.toFixed(2) + 'x',
        roi:        (isProfit ? '+' : '') + data.roi.toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%',
        pStr:       (isProfit ? '+' : '-') + sym + fmtNum(Math.abs(data.profit), rate),
        inv:        sym + fmtNum(data.inv, rate),
        fin:        sym + fmtNum(data.finalValue, rate),
        ent:        sym + fmtNum(data.initMC, rate),
        ext:        sym + fmtNum(data.targetMC, rate),
        isProfit,
        profitColor: isProfit ? '#00ff88' : '#ff4b4b',
    };
}

// ── Main PNG card composer ────────────────────────────────
// Returns a 1600×900 HTML string that is identical to what
// the admin sees in the live editor preview.
export function composePNGCard(template, data) {
    const cd     = formatCardData(data);
    const layers = template.layers || DEFAULT_LAYERS.map(l => ({ ...l }));
    const displayMode = template.displayMode || 'both';

    // Use pre-cached data URL (fetched at startup) if available,
    // otherwise fall back to the Firebase Storage download URL.
    const bgSrc = template.bgDataUrl || template.bgUrl || '';

    const layersHTML = layers.map(layer => {
        if (!layer.visible) return '';

        // Display mode filter
        if (displayMode === 'roi' && layer.field === 'mul') return '';
        if (displayMode === 'multiplier' && layer.field === 'roi') return '';

        const rawVal = layer.field === 'static_label'
            ? (layer.staticText || '')   // static label — value set by admin, never changes
            : cd[layer.field];
        if (rawVal === undefined || rawVal === null || rawVal === '') return '';

        // Dynamic profit color override
        const color = layer.useProfit ? cd.profitColor : layer.color;

        // Stroke
        const strokeCSS = (layer.strokeWidth > 0)
            ? `-webkit-text-stroke:${layer.strokeWidth}px ${layer.stroke || '#000'};paint-order:stroke fill;`
            : '';

        // Shadow
        const shadowCSS = layer.textShadow ? `text-shadow:${layer.textShadow};` : '';

        // Position anchor based on text alignment
        let posCSS;
        if (layer.textAlign === 'right') {
            // x = right edge position from left; place using `right`
            posCSS = `right:${CARD_W - layer.x}px;top:${layer.y}px;`;
        } else if (layer.textAlign === 'center') {
            // x = center position; offset by 50%
            posCSS = `left:${layer.x}px;top:${layer.y}px;transform:translateX(-50%)${layer.rotation ? ` rotate(${layer.rotation}deg)` : ''};`;
        } else {
            posCSS = `left:${layer.x}px;top:${layer.y}px;`;
        }

        const rotateCSS = (layer.rotation && layer.textAlign !== 'center')
            ? `transform:rotate(${layer.rotation}deg);`
            : '';

        return `<div style="
            position:absolute;
            ${posCSS}
            ${rotateCSS}
            font-size:${layer.fontSize}px;
            font-family:${layer.fontFamily};
            font-weight:${layer.fontWeight};
            color:${color};
            opacity:${layer.opacity};
            text-align:${layer.textAlign};
            letter-spacing:${layer.letterSpacing || 0}px;
            ${shadowCSS}
            ${strokeCSS}
            white-space:nowrap;
            pointer-events:none;
            z-index:10;
            line-height:1.1;
            user-select:none;
        ">${_esc(rawVal)}</div>`;
    }).join('\n');

    return `<div id="card-root" style="
        width:${CARD_W}px;
        height:${CARD_H}px;
        position:relative;
        overflow:hidden;
        box-sizing:border-box;
        border-radius:${template.borderRadius || 0}px;
        background:#000;
    ">
        <img
            src="${bgSrc}"
            style="
                position:absolute;
                top:0; left:0;
                width:${CARD_W}px;
                height:${CARD_H}px;
                object-fit:cover;
                object-position:center center;
                display:block;
                pointer-events:none;
                user-select:none;
            "
            crossorigin="anonymous"
            loading="eager"
            decoding="sync"
        >
        ${layersHTML}
    </div>`;
}

function _esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
