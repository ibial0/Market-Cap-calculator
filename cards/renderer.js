// ═══════════════════════════════════════════════════════════
//  RENDERER — Structured HTML/CSS Compositor
//  This file delegates full-width layout to the themes.
// ═══════════════════════════════════════════════════════════
import {
    CARD_W, CARD_H, SAFE_MARGIN,
    TEXT_SCALE,
} from './config.js';

// ── Font size helpers ─────────────────────────────────────

export function tokenFontSize(name) {
    const len = (name || '').length;
    const bp = TEXT_SCALE.tokenName.breakpoints;
    for (const b of bp) {
        if (len <= b.len) return b.size;
    }
    return TEXT_SCALE.tokenName.min;
}

export function heroFontSize(str) {
    const len = (str || '').length;
    const bp = TEXT_SCALE.heroNumber.breakpoints;
    for (const b of bp) {
        if (len <= b.len) return b.size;
    }
    return TEXT_SCALE.heroNumber.min;
}

/** Format large numbers: 1234567 → "1.23M" */
export function fmtNum(val, rate = 1) {
    const v = val * rate;
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// ── Main composer ─────────────────────────────────────────

export function composeCard({ theme, data, tier, combo, randomizer }) {
    const d = data;
    const isProfit = d.profit >= 0;
    const sym = d.showBdt ? '৳' : '$';
    const rate = d.showBdt ? (d.bdtRate || 1) : 1;

    // ── Resolve palette & typography ─────────────────────
    const pal  = theme.getPalette(tier.id, combo.accentIdx, isProfit);
    const typo = theme.getTypography();
    
    // Emotion is no longer used for characters, but kept in case themes use it for tone
    const emotion = randomizer.pick(tier.def.emotions);

    // ── Pre-format every data string ─────────────────────
    const tok  = (d.tokenName || 'CRYPTO').toUpperCase();
    const usr  = d.userName  || '';
    const mul  = (isProfit ? '' : '-') + d.multiplier.toFixed(2) + 'x';
    const roi  = (isProfit ? '+' : '') + d.roi.toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
    const pStr = (isProfit ? '+' : '-') + sym + fmtNum(Math.abs(d.profit), rate);
    const inv  = sym + fmtNum(d.inv, rate);
    const fin  = sym + fmtNum(d.finalValue, rate);
    const ent  = sym + fmtNum(d.initMC, rate);
    const ext  = sym + fmtNum(d.targetMC, rate);

    const profitColor = isProfit ? pal.positive : pal.negative;
    const tokSz  = tokenFontSize(tok);
    const mulSz  = heroFontSize(mul);

    // ── Card data bundle passed to theme renderLayout ─────
    const cd = {
        tok, usr, mul, roi, pStr, inv, fin, ent, ext,
        isProfit, profitColor, tokSz, mulSz,
        sym, rate, emotion,
        tierId:    tier.id,
        tierLabel: tier.def?.label || '',
    };

    // ── Build layers ─────────────────────────────────────
    // Layer 0: Background (fills full card, position:absolute)
    const bgLayer = theme.renderBackground(pal, tier.id, combo.bgVariant);

    // Layer 1: Effects/Overlays (position:absolute, full card)
    const fxLayer = theme.renderEffects ? theme.renderEffects(pal, tier.id, combo.detailIdx) : '';

    // Layer 2: UI / Text Data (position:absolute, full card minus safe margin)
    const uiLayer = _wrapFullLayout(theme, pal, typo, cd);

    // ── Border / container style ──────────────────────────
    const borderStyle = theme.getBorder ? theme.getBorder(pal) : `border-radius:24px;border:1px solid ${pal.accent}30;`;

    return `<div id="card-root" style="
        width:${CARD_W}px;
        height:${CARD_H}px;
        position:relative;
        overflow:hidden;
        box-sizing:border-box;
        font-family:${typo.body};
        color:${pal.text};
        background:${pal.bg};
        ${borderStyle}
    ">
        ${bgLayer}
        ${fxLayer}
        ${uiLayer}
    </div>`;
}

// ── UI renderer ───────────────────────────────────────────

function _wrapFullLayout(theme, pal, typo, cd) {
    const W = CARD_W;
    const H = CARD_H;
    const S = SAFE_MARGIN;

    // We let the theme render its layout occupying the FULL canvas (with padding).
    let html = '';
    if (theme.renderLayout) {
        html = theme.renderLayout({ cd, pal, typo, W, H, S });
    } else {
        html = _defaultLayout({ cd, pal, typo, W, H, S });
    }

    return `<div style="
        position:absolute;
        inset:0;
        display:flex;
        flex-direction:column;
        box-sizing:border-box;
        pointer-events:none;
        z-index:10;
    ">${html}</div>`;
}

/** Fallback default layout if theme doesn't provide one */
function _defaultLayout({ cd, pal, typo, W, H, S }) {
    // Just a clean full-width fallback
    const { tok, usr, mul, roi, pStr, inv, ent, ext, isProfit, profitColor, tokSz, mulSz } = cd;
    return `
        <div style="padding:${S}px; height:100%; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div style="font-size:${tokSz}px; font-weight:900; color:${pal.accent};">${tok}</div>
                <div style="font-size:24px;">${usr ? '@' + usr : ''}</div>
            </div>
            <div>
                <div style="font-size:${mulSz}px; font-weight:900; color:${profitColor};">${mul}</div>
                <div style="font-size:48px; opacity:0.7;">${roi} ROI</div>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:2px solid ${pal.accent}30; padding-top:24px;">
                <div><div style="opacity:0.5; font-size:16px;">ENTRY</div><div style="font-size:32px;">${ent}</div></div>
                <div><div style="opacity:0.5; font-size:16px;">EXIT</div><div style="font-size:32px;">${ext}</div></div>
                <div><div style="opacity:0.5; font-size:16px;">INVESTED</div><div style="font-size:32px;">${inv}</div></div>
                <div><div style="opacity:0.5; font-size:16px;">PROFIT</div><div style="font-size:32px; color:${profitColor};">${pStr}</div></div>
            </div>
        </div>`;
}
