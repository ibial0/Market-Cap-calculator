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
        // Center-aligned at card midpoint so any number length stays centered
        id: 'mul', label: 'Multiplier (X)', field: 'mul',
        x: 800,  y: 300, fontSize: 130, fontFamily: "'Outfit', sans-serif",
        fontWeight: '900', color: '#00ff88', opacity: 1,
        textAlign: 'center', letterSpacing: -2,
        textShadow: '0 0 48px rgba(0,255,136,0.5)', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: true, useProfit: true,
    },
    {
        // Also center-aligned to match multiplier
        id: 'roi', label: 'ROI %', field: 'roi',
        x: 800,  y: 470, fontSize: 52,  fontFamily: "'Inter', sans-serif",
        fontWeight: '700', color: '#00ff88', opacity: 1,
        textAlign: 'center', letterSpacing: 0,
        textShadow: '', stroke: '#000000', strokeWidth: 0,
        rotation: 0, visible: false, useProfit: true,
    },
    {
        // Also center-aligned to match multiplier
        id: 'pStr', label: 'Profit / Loss', field: 'pStr',
        x: 800,  y: 460, fontSize: 52,  fontFamily: "'Inter', sans-serif",
        fontWeight: '700', color: '#00ff88', opacity: 1,
        textAlign: 'center', letterSpacing: 0,
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

        // ── Auto-center: ALL dynamic text layers ─────────────
        // User positions layers in the editor with mock data.
        // When actual data has different length (e.g. "BITCOIN" vs
        // "TREEGJUFV", or "12.50x" vs "0.50x"), left-aligned text
        // shifts visually. Force center alignment for ALL layers
        // so the x coordinate = center point of text. This ensures
        // text ALWAYS stays at the position the user set, regardless
        // of content length.
        // Static labels (admin-set text that never changes) keep
        // their original alignment since their content is fixed.
        const effectiveAlign = (layer.field === 'static_label')
            ? layer.textAlign
            : 'center';

        // Position anchor based on effective text alignment
        let posCSS;
        if (effectiveAlign === 'right') {
            posCSS = `right:${CARD_W - layer.x}px;top:${layer.y}px;`;
        } else if (effectiveAlign === 'center') {
            posCSS = `left:${layer.x}px;top:${layer.y}px;transform:translateX(-50%)${layer.rotation ? ` rotate(${layer.rotation}deg)` : ''};`;
        } else {
            posCSS = `left:${layer.x}px;top:${layer.y}px;`;
        }

        const rotateCSS = (layer.rotation && effectiveAlign !== 'center')
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
            text-align:${effectiveAlign};
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

// ═══════════════════════════════════════════════════════════
//  SIMPLE PNL CARD — New Design
//  Fixed layout matching the reference design:
//    Top:    Token logo + Token name (centered above hero)
//    Middle: Hero multiplier with soft colored background box
//    Bottom: Entry MC → Arrow → Exit MC (centered below hero)
//  All elements centered relative to the hero multiplier.
//  Dark gradient overlay on left side for text readability.
// ═══════════════════════════════════════════════════════════

/**
 * Compose the new simple PnL card design.
 * @param {object} data - Card data (tokenName, multiplier, initMC, targetMC, profit, etc.)
 * @param {string} bgSrc - Background image source (data URL or remote URL)
 * @param {string|null} tokenLogoSrc - Token logo image source (data URL) or null
 * @returns {string} HTML string for the 1600×900 card
 */
export function composeSimpleCard(data, bgSrc, tokenLogoSrc) {
    const isProfit = data.profit >= 0;
    const rate = data.showBdt ? (data.bdtRate || 1) : 1;

    // ── Colors — bright, vivid, eye-catching ─────────────
    const accentColor = isProfit ? '#00e676' : '#ff5252';
    const boxBg       = isProfit ? 'rgba(0,230,118,0.20)' : 'rgba(255,82,82,0.20)';
    const boxBorder   = isProfit ? 'rgba(0,230,118,0.35)' : 'rgba(255,82,82,0.35)';

    // ── Format values ────────────────────────────────────
    // Loss multiplier: show inverse (670K→131K = x5.11 red, not x0.20)
    const rawMul = data.multiplier;
    const displayMul = isProfit ? rawMul : (rawMul > 0 ? (1 / rawMul) : 0);
    const multiplier = 'x' + displayMul.toFixed(2);
    const entryMC    = fmtNum(data.initMC, rate);
    const exitMC     = fmtNum(data.targetMC, rate);
    const tokenName  = (data.tokenName || '').toUpperCase();

    // ── Dynamic font size for hero multiplier ────────────
    const mulLen = multiplier.length;
    let mulFontSize;
    if (mulLen <= 5)       mulFontSize = 154;
    else if (mulLen <= 6)  mulFontSize = 136;
    else if (mulLen <= 7)  mulFontSize = 118;
    else if (mulLen <= 8)  mulFontSize = 102;
    else if (mulLen <= 10) mulFontSize = 86;
    else                   mulFontSize = 72;

    // ── Token logo HTML ──────────────────────────────────
    const logoHtml = tokenLogoSrc
        ? `<img src="${tokenLogoSrc}" style="
            width:64px;height:64px;border-radius:16px;
            object-fit:cover;flex-shrink:0;
            display:block;
          " crossorigin="anonymous">`
        : '';

    // ── Token name HTML ──────────────────────────────────
    const nameHtml = tokenName
        ? `<span style="
            font-size:50px;font-weight:900;color:#ffffff;
            font-family:'Outfit',sans-serif;
            letter-spacing:2px;white-space:nowrap;
            text-shadow:0 2px 8px rgba(0,0,0,0.5);
          ">${_esc(tokenName)}</span>`
        : '';

    // ── Token row (logo + name) — only if at least one exists ──
    let tokenRowHtml = '';
    if (logoHtml || nameHtml) {
        tokenRowHtml = `<div style="
            display:flex;align-items:center;gap:18px;
            margin-bottom:30px;
        ">${logoHtml}${nameHtml}</div>`;
    }

    // ── Arrow SVG (large, matching reference) ────────────
    const arrowSvg = `<svg width="80" height="24" viewBox="0 0 80 24" fill="none"
        xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0;">
        <line x1="2" y1="12" x2="60" y2="12" stroke="${accentColor}"
              stroke-width="3.5" stroke-linecap="round"/>
        <path d="M54 4L68 12L54 20" stroke="${accentColor}"
              stroke-width="3.5" stroke-linecap="round"
              stroke-linejoin="round" fill="none"/>
    </svg>`;

    // ── Background image ─────────────────────────────────
    const bgHtml = bgSrc
        ? `<img src="${bgSrc}" style="
            position:absolute;top:0;left:0;
            width:${CARD_W}px;height:${CARD_H}px;
            object-fit:cover;object-position:center;
            display:block;pointer-events:none;user-select:none;
          " crossorigin="anonymous" loading="eager" decoding="sync">`
        : '';

    // ── Dark gradient overlay (left side, BasedBot-style) ──
    const overlayHtml = `<div style="
        position:absolute;inset:0;
        background:linear-gradient(
            to right,
            rgba(0,0,0,0.50) 0%,
            rgba(0,0,0,0.38) 25%,
            rgba(0,0,0,0.18) 45%,
            rgba(0,0,0,0.06) 60%,
            rgba(0,0,0,0) 75%
        );
        z-index:5;
        pointer-events:none;
    "></div>`;

    // ── Assemble card ────────────────────────────────────
    return `<div id="card-root" style="
        width:${CARD_W}px;
        height:${CARD_H}px;
        position:relative;
        overflow:hidden;
        box-sizing:border-box;
        background:#5a5550;
    ">
        ${bgHtml}
        ${overlayHtml}
        <div style="
            position:absolute;inset:0;
            display:flex;align-items:center;
            padding-left:120px;
            z-index:10;
            pointer-events:none;
        ">
            <div style="display:inline-flex;flex-direction:column;align-items:center;">
                ${tokenRowHtml}
                <div style="
                    background:${boxBg};
                    border:2px solid ${boxBorder};
                    border-radius:24px;
                    padding:24px 56px;
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    backdrop-filter:blur(4px);
                    -webkit-backdrop-filter:blur(4px);
                ">
                    <span style="
                        font-size:${mulFontSize}px;
                        font-weight:900;
                        color:${accentColor};
                        font-family:'Outfit',sans-serif;
                        line-height:1.1;
                        letter-spacing:-2px;
                        white-space:nowrap;
                        text-shadow:0 2px 12px rgba(0,0,0,0.3);
                    ">${_esc(multiplier)}</span>
                </div>
                <div style="
                    display:flex;align-items:center;
                    gap:36px;margin-top:32px;
                ">
                    <span style="
                        font-size:48px;font-weight:800;
                        color:#ffffff;
                        font-family:'Inter',sans-serif;
                        white-space:nowrap;
                        text-shadow:0 2px 8px rgba(0,0,0,0.5);
                    ">${_esc(entryMC)}</span>
                    ${arrowSvg}
                    <span style="
                        font-size:48px;font-weight:800;
                        color:${accentColor};
                        font-family:'Inter',sans-serif;
                        white-space:nowrap;
                        text-shadow:0 2px 8px rgba(0,0,0,0.3);
                    ">${_esc(exitMC)}</span>
                </div>
            </div>
        </div>
    </div>`;
}

function _esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
