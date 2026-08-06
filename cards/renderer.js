// ═══════════════════════════════════════════════════════════
//  LAYERED HTML COMPOSITOR & LAYOUT ENGINE
// ═══════════════════════════════════════════════════════════
import { SAFE_MARGIN, CARD_W, CARD_H, TEXT_SCALE } from './config.js';

/** Auto-scale token name font size based on length */
export function tokenFontSize(name) {
    const len = (name || '').length;
    for (const bp of TEXT_SCALE.tokenName.breakpoints) {
        if (len <= bp.len) return bp.size;
    }
    return TEXT_SCALE.tokenName.min;
}

/** Auto-scale hero number font size based on string length */
export function heroFontSize(str) {
    const len = (str || '').length;
    if (len <= 4) return TEXT_SCALE.heroNumber.max;
    if (len <= 6) return 132;
    if (len <= 8) return 110;
    if (len <= 10) return 92;
    return TEXT_SCALE.heroNumber.min;
}

/** Format number with K/M/B suffix */
export function fmtNum(val, rate) {
    rate = rate || 1;
    const v = val * rate;
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
    return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Compose the full card HTML from theme layers
 * @param {object} params
 * @param {object} params.theme - Theme module
 * @param {object} params.data - Trade data
 * @param {object} params.tier - { id, def }
 * @param {object} params.combo - { bgVariant, charVariant, accentIdx, detailIdx }
 * @param {object} params.randomizer - Randomizer instance for pick()
 * @returns {string} Complete card HTML
 */
export function composeCard({ theme, data, tier, combo, randomizer }) {
    const d = data;
    const isProfit = d.profit >= 0;
    const sym = d.showBdt ? '৳' : '$';
    const rate = d.showBdt ? d.bdtRate : 1;

    // Resolve palette from theme
    const palette = theme.getPalette(tier.id, combo.accentIdx, isProfit);
    const typo = theme.getTypography();
    const emotion = randomizer.pick(tier.def.emotions);

    // Pre-format all data strings
    const tok = d.tokenName || 'CRYPTO';
    const usr = d.userName || '';
    const mul = d.multiplier.toFixed(2) + 'X';
    const roi = (isProfit ? '+' : '') + d.roi.toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%';
    const pStr = (isProfit ? '+' : '-') + sym + fmtNum(Math.abs(d.profit), rate);
    const inv = sym + fmtNum(d.inv, rate);
    const fin = sym + fmtNum(d.finalValue, rate);
    const ent = sym + fmtNum(d.initMC, rate);
    const ext = sym + fmtNum(d.targetMC, rate);

    const profitColor = isProfit ? palette.positive : palette.negative;
    const tokSz = tokenFontSize(tok);
    const mulSz = heroFontSize(mul);
    const roiSz = heroFontSize(roi);

    // Build data object for theme renderers
    const cardData = {
        tok, usr, mul, roi, pStr, inv, fin, ent, ext,
        isProfit, profitColor, tokSz, mulSz, roiSz,
        sym, rate, emotion, tierId: tier.id, tierLabel: tier.def.label,
        tierBadge: tier.def.badge,
    };

    // ── Layer 1: Background ──
    const bgLayer = theme.renderBackground(palette, tier.id, combo.bgVariant);

    // ── Layer 2: Character (optional) ──
    let charLayer = '';
    if (theme.hasCharacter) {
        charLayer = theme.renderCharacter(palette, emotion, isProfit, combo.charVariant);
    }

    // ── Layer 3: Effects / Decorations ──
    const fxLayer = theme.renderEffects(palette, tier.id, combo.detailIdx);

    // ── Layer 4: UI / Data ──
    const layout = theme.pickLayout ? theme.pickLayout(tier.id, isProfit, randomizer) : 'default';
    const uiLayer = renderUILayer(theme, palette, typo, cardData, layout);

    // ── Badge ──
    const badge = renderBadge(tier, isProfit, palette, typo);

    // ── Compose all layers ──
    const borderStyle = theme.getBorder ? theme.getBorder(palette) : `border-radius:20px;border:2px solid ${palette.accent}30;`;

    return `<div style="width:${CARD_W}px;height:${CARD_H}px;position:relative;overflow:hidden;box-sizing:border-box;font-family:${typo.body};color:${palette.text};background:${palette.bg};${borderStyle}">
        ${bgLayer}
        ${charLayer}
        ${fxLayer}
        ${uiLayer}
    </div>`;
}

/** Render the primary UI/text layer */
function renderUILayer(theme, pal, typo, cd, layout) {
    const S = SAFE_MARGIN;
    const { tok, usr, mul, roi, pStr, inv, fin, ent, ext, isProfit, profitColor, tokSz, mulSz, roiSz, tierBadge } = cd;

    // ── Build reusable elements ──
    const tokEl = (extra = '') => `<div style="font-size:${tokSz}px;font-family:${typo.display};font-weight:${typo.displayWeight || 900};letter-spacing:-0.02em;color:${pal.accent};line-height:1.1;overflow-wrap:break-word;max-width:100%;filter:drop-shadow(0 0 18px ${pal.glow || 'transparent'});${extra}">${tok}</div>`;

    const heroNum = (n, sz, color, extra = '') => `<div style="font-size:${sz}px;font-family:${typo.display};font-weight:900;color:${color || profitColor};line-height:1;word-break:break-all;filter:drop-shadow(0 0 22px ${pal.glow || 'transparent'});${extra}">${n}</div>`;

    const subNum = (n, sz, extra = '') => `<div style="font-size:${sz || 52}px;font-family:${typo.mono || typo.body};font-weight:700;color:${pal.text};opacity:0.72;line-height:1.15;${extra}">${n}</div>`;

    const usrEl = () => usr ? `<div style="font-size:28px;font-family:${typo.body};font-weight:600;color:${pal.text};opacity:0.65;white-space:nowrap;">${usr}</div>` : '';

    const lbl = (t) => `<div style="font-size:${TEXT_SCALE.label.size}px;font-family:${typo.body};color:${pal.text};opacity:0.5;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">${t}</div>`;

    const val = (v, color) => `<div style="font-size:32px;font-family:${typo.mono || typo.body};font-weight:700;color:${color || pal.text};line-height:1.1;overflow-wrap:break-word;">${v}</div>`;

    const cell = (l, v, c) => `<div>${lbl(l)}${val(v, c)}</div>`;

    const badge = (isProfit && tierBadge) ? `<div style="display:inline-flex;align-items:center;padding:10px 28px;background:${pal.accent};color:#000;border-radius:50px;font-size:20px;font-weight:800;font-family:${typo.display};letter-spacing:3px;white-space:nowrap;box-shadow:0 0 28px ${pal.glow || 'transparent'};">${tierBadge}</div>` : '';

    const dataGrid = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;">
        ${cell('Entry MC', ent)}${cell('Exit MC', ext)}${cell('Investment', inv)}${cell('Current Value', fin, profitColor)}
    </div>`;

    const dataPills = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        ${[['Entry MC', ent], ['Exit MC', ext], ['Investment', inv], ['Current Value', fin, profitColor]].map(([l, v, c]) =>
        `<div style="background:${pal.accent}0c;border:1px solid ${pal.accent}20;border-radius:14px;padding:18px 24px;">${lbl(l)}${val(v, c)}</div>`
    ).join('')}
    </div>`;

    // ── Apply theme-specific layout override if available ──
    if (theme.renderLayout) {
        return theme.renderLayout({ S, tokEl, heroNum, subNum, usrEl, lbl, val, cell, badge, dataGrid, dataPills, cd, pal, typo, layout });
    }

    // ── Default Layout: cinematic_split ──
    return `<div style="position:relative;z-index:10;width:100%;height:100%;padding:${S}px;display:flex;flex-direction:column;justify-content:space-between;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
            ${tokEl('max-width:60%;')}
            <div style="text-align:right;">${badge}${usr ? `<div style="margin-top:10px;">${usrEl()}</div>` : ''}</div>
        </div>
        <div>
            ${heroNum(mul, mulSz)}
            ${subNum(roi + ' ROI', 50)}
        </div>
        <div>
            ${dataGrid}
        </div>
    </div>`;
}

/** Render tier badge */
function renderBadge(tier, isProfit, pal, typo) {
    if (!isProfit) return '';
    return `<div style="display:inline-flex;align-items:center;padding:10px 28px;background:${pal.accent};color:#000;border-radius:50px;font-size:20px;font-weight:800;font-family:${typo.display};letter-spacing:3px;white-space:nowrap;">${tier.def.badge}</div>`;
}
