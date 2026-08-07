// ═══════════════════════════════════════════════════════════
//  RENDERER — Structured HTML/CSS Compositor
//  This file owns ALL layout math. Themes own ONLY visuals.
// ═══════════════════════════════════════════════════════════
import {
    CARD_W, CARD_H, SAFE_MARGIN,
    CHAR_ZONE, TEXT_ZONE, TEXT_SCALE,
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

/**
 * Build complete card HTML from theme + data.
 * Returns a self-contained HTML string.
 * The outer container is exactly CARD_W × CARD_H.
 */
export function composeCard({ theme, data, tier, combo, randomizer }) {
    const d = data;
    const isProfit = d.profit >= 0;
    const sym = d.showBdt ? '৳' : '$';
    const rate = d.showBdt ? (d.bdtRate || 1) : 1;

    // ── Resolve palette & typography ─────────────────────
    const pal  = theme.getPalette(tier.id, combo.accentIdx, isProfit);
    const typo = theme.getTypography();
    const emotion = randomizer.pick(tier.def.emotions);

    // ── Pre-format every data string ─────────────────────
    const tok  = (d.tokenName || 'CRYPTO').toUpperCase();
    const usr  = d.userName  || '';
    const mul  = d.multiplier.toFixed(2) + 'x';
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
        tierLabel: tier.def.label,
        tierBadge: tier.def.badge,
    };

    // ── Build layers ─────────────────────────────────────
    // Layer 0: background (fills full card, position:absolute)
    const bgLayer = theme.renderBackground(pal, tier.id, combo.bgVariant);

    // Layer 1: character (only inside CHAR_ZONE, position:absolute)
    let charLayer = '';
    if (theme.hasCharacter) {
        charLayer = _wrapCharZone(
            theme.renderCharacter(pal, emotion, isProfit, combo.charVariant)
        );
    }

    // Layer 2: effects/overlays (position:absolute, full card)
    const fxLayer = theme.renderEffects
        ? theme.renderEffects(pal, tier.id, combo.detailIdx)
        : '';

    // Layer 3: UI / text data (only inside TEXT_ZONE, position:absolute)
    const uiLayer = _wrapTextZone(
        _renderUI(theme, pal, typo, cd)
    );

    // ── Border / container style ──────────────────────────
    const borderStyle = theme.getBorder
        ? theme.getBorder(pal)
        : `border-radius:20px;border:1px solid ${pal.accent}30;`;

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
        ${charLayer}
        ${fxLayer}
        ${uiLayer}
    </div>`;
}

// ── Zone wrappers ─────────────────────────────────────────

/**
 * Wrap character art inside the CHAR_ZONE absolutely.
 * Character art is clipped to this box — it CANNOT bleed into TEXT_ZONE.
 */
function _wrapCharZone(innerHTML) {
    if (!innerHTML) return '';
    return `<div style="
        position:absolute;
        left:${CHAR_ZONE.x}px;
        top:${CHAR_ZONE.y}px;
        width:${CHAR_ZONE.w}px;
        height:${CHAR_ZONE.h}px;
        overflow:hidden;
        pointer-events:none;
        z-index:5;
    ">${innerHTML}</div>`;
}

/**
 * Wrap UI text inside the TEXT_ZONE absolutely.
 * Text CANNOT bleed into CHAR_ZONE.
 */
function _wrapTextZone(innerHTML) {
    return `<div style="
        position:absolute;
        left:${TEXT_ZONE.x}px;
        top:${TEXT_ZONE.y}px;
        width:${TEXT_ZONE.w}px;
        height:${TEXT_ZONE.h}px;
        display:flex;
        flex-direction:column;
        justify-content:space-between;
        box-sizing:border-box;
        pointer-events:none;
        z-index:10;
    ">${innerHTML}</div>`;
}

// ── UI renderer ───────────────────────────────────────────

/**
 * Render the text/data UI layer.
 * If the theme provides renderLayout(), delegate to it.
 * Otherwise use the default structured layout.
 *
 * Themes that provide renderLayout() receive:
 *   { cd, pal, typo, W, H, S }
 * where W/H are TEXT_ZONE dimensions and S is SAFE_MARGIN.
 * The theme must NOT use absolute pixel positions from the full card.
 */
function _renderUI(theme, pal, typo, cd) {
    const W = TEXT_ZONE.w;
    const H = TEXT_ZONE.h;
    const S = 32; // inner padding within the text zone

    if (theme.renderLayout) {
        return theme.renderLayout({ cd, pal, typo, W, H, S });
    }
    return _defaultLayout({ cd, pal, typo, W, H, S });
}

/**
 * Default layout — used as fallback and as the reference design.
 * Three rows: top (token+user), center (hero numbers), bottom (data grid).
 */
function _defaultLayout({ cd, pal, typo, W, H, S }) {
    const {
        tok, usr, mul, roi, pStr, inv, fin, ent, ext,
        isProfit, profitColor, tokSz, mulSz, tierBadge,
    } = cd;
    const ac = pal.accent;
    const TS = TEXT_SCALE;

    // ── Helper builders ───────────────────────────────────
    const lbl = (t) => `
        <div style="
            font-size:${TS.dataLabel.size}px;
            font-family:${typo.body};
            color:${pal.text};
            opacity:0.45;
            font-weight:500;
            letter-spacing:2.5px;
            text-transform:uppercase;
            margin-bottom:6px;
            white-space:nowrap;
        ">${t}</div>`;

    const dval = (v, c) => `
        <div style="
            font-size:${TS.dataValue.size}px;
            font-family:${typo.mono || typo.body};
            font-weight:700;
            color:${c || pal.text};
            line-height:1.1;
            white-space:nowrap;
        ">${v}</div>`;

    const cell = (label, value, color) => `
        <div style="flex:1;min-width:0;">
            ${lbl(label)}${dval(value, color)}
        </div>`;

    // ── Badge ─────────────────────────────────────────────
    const badge = (isProfit && tierBadge) ? `
        <div style="
            display:inline-flex;
            align-items:center;
            padding:7px 20px;
            background:${ac}18;
            border:1px solid ${ac}35;
            color:${ac};
            border-radius:50px;
            font-size:${TS.badge.size}px;
            font-weight:700;
            font-family:${typo.display || typo.body};
            letter-spacing:2.5px;
            white-space:nowrap;
        ">${tierBadge}</div>` : '';

    // ── Username ──────────────────────────────────────────
    const usrEl = usr ? `
        <div style="
            font-size:${TS.username.size}px;
            font-family:${typo.body};
            font-weight:500;
            color:${pal.text};
            opacity:0.5;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
            max-width:100%;
            margin-top:${badge ? 10 : 0}px;
        ">${usr}</div>` : '';

    // ── ROW 1: Token name + user/badge ────────────────────
    const row1 = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
            <div style="flex:1;min-width:0;overflow:hidden;">
                <div style="
                    font-size:${tokSz}px;
                    font-family:${typo.display || typo.body};
                    font-weight:${typo.displayWeight || 900};
                    color:${ac};
                    line-height:1.05;
                    letter-spacing:-0.02em;
                    overflow:hidden;
                    text-overflow:ellipsis;
                    white-space:nowrap;
                ">${tok}</div>
            </div>
            <div style="flex-shrink:0;text-align:right;">
                ${badge}
                ${usrEl}
            </div>
        </div>`;

    // ── ROW 2: Hero multiplier + ROI % ────────────────────
    const row2 = `
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:${S}px 0;">
            <div style="
                font-size:${mulSz}px;
                font-family:${typo.display || typo.body};
                font-weight:900;
                color:${profitColor};
                line-height:1;
                letter-spacing:-0.03em;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:clip;
            ">${mul}</div>
            <div style="
                font-size:${TS.roiPercent.size}px;
                font-family:${typo.mono || typo.body};
                font-weight:700;
                color:${pal.text};
                opacity:0.65;
                margin-top:12px;
                white-space:nowrap;
            ">${roi}</div>
        </div>`;

    // ── ROW 3: Data grid ──────────────────────────────────
    const row3 = `
        <div style="
            display:flex;
            gap:0;
            border-top:1px solid ${ac}18;
            padding-top:${S}px;
        ">
            ${cell('Entry MC',   ent)}
            ${cell('Exit MC',    ext)}
            ${cell('Invested',   inv)}
            ${cell('P/L',        pStr, profitColor)}
        </div>`;

    return `
        <div style="
            width:100%;
            height:100%;
            display:flex;
            flex-direction:column;
            justify-content:space-between;
            padding:${S}px;
            box-sizing:border-box;
        ">
            ${row1}
            ${row2}
            ${row3}
        </div>`;
}
