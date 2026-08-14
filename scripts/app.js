import { State } from '../config/state.js';
import { Storage } from '../utils/storage.js';
import { formatNumber, parseAmount } from '../utils/formatters.js';
import { calculateROI } from '../calculator/core.js';
import { CardEngine, CARD_ONLY_ONE_DESIGN } from '../cards/engine.js';
import { initTheme } from '../ui/theme.js';
import { initModals } from '../ui/modals.js';
import { initProfile } from '../ui/profile.js';
import { initJournal, bindTradeModal, bindAnalysisModal } from './journal.js';
import { loadCustomThemes } from '../cards/themes/index.js';
import { loadPNGTemplates } from '../cards/png-loader.js';

// Card asset readiness — RACE between actual load and a max timeout.
// This means: proceed as soon as assets finish, OR after 10s (whichever is FIRST).
// Previously this was allSettled([..., timeout]) which ALWAYS waited 10 full seconds!
let _assetsLoaded = false;
const _assetLoad = Promise.allSettled([loadCustomThemes(), loadPNGTemplates()]);
const _assetTimeout = new Promise(r => setTimeout(r, 10000));
const cardAssetsReady = Promise.race([_assetLoad, _assetTimeout])
    .then(() => { _assetsLoaded = true; });

// ── Tab Visibility: Re-init if returning after long absence ──
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !_assetsLoaded) {
        loadPNGTemplates().catch(() => {});
        loadCustomThemes().catch(() => {});
    }
});

// ═══════════════════════════════════════════════════════════
//  DOM Elements
// ═══════════════════════════════════════════════════════════
const elInitMC   = document.getElementById('initial-mc');
const elTargetMC = document.getElementById('target-mc');
const elInv      = document.getElementById('investment');
const elToken    = document.getElementById('token-name');

const resFinalValue = document.getElementById('res-final-value');
const resFinalBdt   = document.getElementById('res-final-bdt');
const resProfit     = document.getElementById('res-profit');
const resProfitBdt  = document.getElementById('res-profit-bdt');
const resRoi        = document.getElementById('res-roi');
const resMultiplier = document.getElementById('res-multiplier');

// DCA state
let dcaInitRows   = []; // [{mc, mcUnit, amount}]
let dcaTargetRows = [];

// ═══════════════════════════════════════════════════════════
//  Init inputs from State
// ═══════════════════════════════════════════════════════════
if (elToken) elToken.value = State.tokenName;
_updateNamePreview();

// ═══════════════════════════════════════════════════════════
//  Core Calculate
// ═══════════════════════════════════════════════════════════
const calculate = () => {
    const dcaInitActive   = document.getElementById('dca-init-toggle')?.checked;
    const dcaTargetActive = document.getElementById('dca-target-toggle')?.checked;

    let realInit, realTarget, inv;
    inv = parseAmount(elInv?.value);

    if (dcaInitActive && dcaInitRows.length > 0) {
        realInit = _calcDCAAvg(dcaInitRows);
        _updateDCAAvgDisplay('init-avg-val', realInit);
        // Auto-sum all DCA entry amounts into the investment field
        const totalDCAInv = dcaInitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
        if (totalDCAInv > 0) {
            if (elInv) elInv.value = totalDCAInv;
            inv = totalDCAInv;
        }
    } else {
        const initVal = parseAmount(elInitMC?.value);
        realInit = initVal * State.initMul;
    }

    if (dcaTargetActive && dcaTargetRows.length > 0) {
        realTarget = _calcDCAAvg(dcaTargetRows);
        _updateDCAAvgDisplay('target-avg-val', realTarget);
    } else {
        const targetVal = parseAmount(elTargetMC?.value);
        realTarget = targetVal * State.targetMul;
    }

    State.initVal   = realInit;
    State.targetVal = realTarget;
    State.inv       = inv;

    const result = calculateROI(realInit, realTarget, inv);

    if (result.isValid) {
        resFinalValue.innerText = `$${formatNumber(result.finalValue)}`;
        resProfit.innerText     = `$${formatNumber(result.profit)}`;
        resRoi.innerText        = `${formatNumber(result.roi)}%`;
        resMultiplier.innerText = `${formatNumber(result.multiplier)}x`;

        resProfit.className = 'result-value ' + (result.profit >= 0 ? 'value-green' : 'value-red');
        resRoi.className    = 'result-value ' + (result.roi >= 0 ? 'value-green' : 'value-red');
        
        if (State.showBdt) {
            resFinalBdt.innerText = `৳ ${formatNumber(result.finalValue * State.bdtRate)}`;
            resFinalBdt.classList.remove('hidden');
            resProfitBdt.innerText = `৳ ${formatNumber(result.profit * State.bdtRate)}`;
            resProfitBdt.classList.remove('hidden');
            resProfitBdt.style.color = result.profit >= 0 ? 'var(--success)' : 'var(--danger)';
        } else {
            resFinalBdt.classList.add('hidden');
            resProfitBdt.classList.add('hidden');
        }
    } else {
        resFinalValue.innerText = '$0.00';
        resProfit.innerText     = '$0.00';
        resRoi.innerText        = '0.00%';
        resMultiplier.innerText = '0.00x';
        resProfit.className = 'result-value';
        resRoi.className    = 'result-value';
        resFinalBdt.classList.add('hidden');
        resProfitBdt.classList.add('hidden');
    }
};

// ─── DCA Avg Calculation ──────────────────────────────────
const _calcDCAAvg = (rows) => {
    let totalWeight = 0, totalAmount = 0;
    rows.forEach(r => {
        const mc  = parseFloat(r.mc || 0) * parseFloat(r.unit || 1);
        const amt = parseFloat(r.amount || 0);
        if (mc > 0 && amt > 0) {
            totalWeight += mc * amt;
            totalAmount += amt;
        }
    });
    return totalAmount > 0 ? totalWeight / totalAmount : 0;
};

const _updateDCAAvgDisplay = (elId, avgMC) => {
    const el = document.getElementById(elId);
    if (!el) return;
    if (avgMC <= 0) { el.textContent = '—'; return; }
    if (avgMC >= 1e9) el.textContent = `$${(avgMC / 1e9).toFixed(2)}B`;
    else if (avgMC >= 1e6) el.textContent = `$${(avgMC / 1e6).toFixed(2)}M`;
    else if (avgMC >= 1e3) el.textContent = `$${(avgMC / 1e3).toFixed(2)}K`;
    else el.textContent = `$${formatNumber(avgMC)}`;
};

// ═══════════════════════════════════════════════════════════
//  Handlers
// ═══════════════════════════════════════════════════════════
const handleInput = () => calculate();
const handleBlur = (e) => {
    let val = parseAmount(e.target.value);
    if (val > 0) e.target.value = formatNumber(val, 4);
};
const handleFocus = (e) => {
    let val = parseAmount(e.target.value);
    if (val > 0) e.target.value = val;
};

[elInitMC, elTargetMC, elInv].forEach(el => {
    if (el) {
        el.addEventListener('input', handleInput);
        el.addEventListener('blur', handleBlur);
        el.addEventListener('focus', handleFocus);
    }
});

if (elToken) {
    elToken.addEventListener('input', e => { 
        State.tokenName = e.target.value; 
        Storage.set('tokenName', State.tokenName); 
    });
}

// ═══════════════════════════════════════════════════════════
//  Multiplier Toggles (single mode)
// ═══════════════════════════════════════════════════════════
const setupToggles = (groupId, stateKey) => {
    const btns = document.querySelectorAll(`#${groupId} .mul-btn`);
    btns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            btns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            State[stateKey] = parseFloat(e.target.getAttribute('data-val'));
            calculate();
        });
    });
};
setupToggles('init-toggles', 'initMul');
setupToggles('target-toggles', 'targetMul');

// ═══════════════════════════════════════════════════════════
//  DCA Toggle Setup
// ═══════════════════════════════════════════════════════════
const setupDCAToggle = (toggleId, singleId, multiId, rowsContainerId, addBtnId, rows, avgContainerId) => {
    const toggle   = document.getElementById(toggleId);
    const single   = document.getElementById(singleId);
    const multi    = document.getElementById(multiId);
    const addBtn   = document.getElementById(addBtnId);
    const avgCont  = document.getElementById(avgContainerId);

    if (!toggle) return;

    // Init with 2 empty rows
    const addRow = () => {
        const rowData = { mc: '', unit: '1000', amount: '' };
        rows.push(rowData);
        renderDCARows(rowsContainerId, rows, calculate);
        calculate();
    };

    toggle.addEventListener('change', () => {
        if (toggle.checked) {
            single.classList.add('hidden');
            multi.classList.remove('hidden');
            if (rows.length === 0) { addRow(); addRow(); }
            renderDCARows(rowsContainerId, rows, calculate);
        } else {
            single.classList.remove('hidden');
            multi.classList.add('hidden');
            rows.length = 0;
        }
        calculate();
    });

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            addRow();
        });
    }
};

setupDCAToggle('dca-init-toggle', 'init-single', 'init-multi', 'init-dca-rows', 'add-init-dca-row', dcaInitRows, 'init-dca-avg');
setupDCAToggle('dca-target-toggle', 'target-single', 'target-multi', 'target-dca-rows', 'add-target-dca-row', dcaTargetRows, 'target-dca-avg');

// ─── Render DCA Rows ──────────────────────────────────────
const renderDCARows = (containerId, rows, onChange) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = rows.map((row, i) => `
    <div class="dca-entry-row">
        <div class="input-wrapper">
            <span class="prefix">$</span>
            <input type="number" class="amount-input dca-mc-inp" data-index="${i}" placeholder="0" value="${row.mc}" inputmode="decimal" min="0">
        </div>
        <select class="mc-unit-select dca-unit-sel" data-index="${i}">
            <option value="1000"    ${row.unit === '1000'       ? 'selected' : ''}>K</option>
            <option value="1000000" ${row.unit === '1000000'    ? 'selected' : ''}>M</option>
            <option value="1000000000" ${row.unit === '1000000000' ? 'selected' : ''}>B</option>
        </select>
        <div class="input-wrapper" style="max-width:90px;">
            <span class="prefix">$</span>
            <input type="number" class="amount-input dca-amt-inp" data-index="${i}" placeholder="0" value="${row.amount}" inputmode="decimal" min="0">
        </div>
        ${rows.length > 1 ? `<button class="dca-remove-btn" data-index="${i}">×</button>` : ''}
    </div>`).join('');

    // Bind events
    container.querySelectorAll('.dca-mc-inp').forEach(inp => {
        inp.addEventListener('input', (e) => {
            rows[parseInt(e.target.dataset.index)].mc = e.target.value;
            onChange();
        });
    });
    container.querySelectorAll('.dca-amt-inp').forEach(inp => {
        inp.addEventListener('input', (e) => {
            rows[parseInt(e.target.dataset.index)].amount = e.target.value;
            onChange();
        });
    });
    container.querySelectorAll('.dca-unit-sel').forEach(sel => {
        sel.addEventListener('change', (e) => {
            rows[parseInt(e.target.dataset.index)].unit = e.target.value;
            onChange();
        });
    });
    container.querySelectorAll('.dca-remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.dataset.index);
            rows.splice(idx, 1);
            renderDCARows(containerId, rows, onChange);
            onChange();
        });
    });
};

// ═══════════════════════════════════════════════════════════
//  Show Name Toggle
// ═══════════════════════════════════════════════════════════
const showNameToggle = document.getElementById('show-name-toggle');
if (showNameToggle) {
    showNameToggle.checked = State.showUserName;
    showNameToggle.addEventListener('change', (e) => {
        State.showUserName = e.target.checked;
        Storage.set('showUserName', State.showUserName);
    });
}

function _updateNamePreview() {
    const previewEl = document.getElementById('card-name-preview-text');
    if (!previewEl) return;
    const name = Storage.get('userName', '');
    if (name) {
        previewEl.textContent = `"${name}" will appear on your card`;
    } else {
        previewEl.textContent = 'No name set — Go to Profile to set your name';
    }
}

// ═══════════════════════════════════════════════════════════
//  Tab Navigation
// ═══════════════════════════════════════════════════════════
const tabBtns   = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`tab-${target}`)?.classList.add('active');
    });
});

// Switch to calculator tab from journal analysis
window.addEventListener('journal-generate-card', (e) => {
    const { token, dca } = e.detail;
    // Switch to calculator
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="calculator"]')?.classList.add('active');
    document.getElementById('tab-calculator')?.classList.add('active');
    // Pre-fill token name
    if (elToken) { elToken.value = token.tokenName; State.tokenName = token.tokenName; }
    // Pre-fill with avg entry/exit if available
    if (dca.avgEntryMC > 0 && elInitMC) {
        const inK = dca.avgEntryMC / 1000;
        elInitMC.value = formatNumber(inK, 2);
        State.initMul = 1000;
    }
    if (dca.avgExitMC > 0 && elTargetMC) {
        const inK = dca.avgExitMC / 1000;
        elTargetMC.value = formatNumber(inK, 2);
        State.targetMul = 1000;
    }
    
    // Set investment amount
    if (dca.totalEntryAmount > 0 && elInv) {
        elInv.value = dca.totalEntryAmount;
        State.inv = dca.totalEntryAmount;
    }

    // Turn off multi-entry/exit toggles to use the pre-filled average values
    const dcaInitToggle = document.getElementById('dca-init-toggle');
    if (dcaInitToggle && dcaInitToggle.checked) {
        dcaInitToggle.checked = false;
        dcaInitToggle.dispatchEvent(new Event('change'));
    }
    const dcaTargetToggle = document.getElementById('dca-target-toggle');
    if (dcaTargetToggle && dcaTargetToggle.checked) {
        dcaTargetToggle.checked = false;
        dcaTargetToggle.dispatchEvent(new Event('change'));
    }
    
    calculate();
});

// ═══════════════════════════════════════════════════════════
//  Init subsystems
// ═══════════════════════════════════════════════════════════
initTheme();
initModals(calculate);
initProfile();
initJournal();
bindTradeModal();
bindAnalysisModal();

// Close new-token-cancel-x button
const newTokenCancelX = document.getElementById('new-token-cancel-x');
if (newTokenCancelX) {
    newTokenCancelX.addEventListener('click', () => {
        document.getElementById('new-token-modal')?.classList.remove('active');
    });
}

// Update name preview when profile saved (listen to Storage change)
document.getElementById('profile-save-btn')?.addEventListener('click', () => {
    setTimeout(_updateNamePreview, 900);
});

// ═══════════════════════════════════════════════════════════
//  Service Worker
// ═══════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

// ═══════════════════════════════════════════════════════════
//  Card Generation Logic
// ═══════════════════════════════════════════════════════════

// Detect mobile for performance tuning
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || window.innerWidth <= 768;

// ── Toast Notification (replaces all alert() calls) ────────
function _showToast(msg, type = 'error', durationMs = 4000) {
    let container = document.getElementById('card-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'card-toast-container';
        container.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
            z-index:99999; display:flex; flex-direction:column; align-items:center;
            gap:10px; pointer-events:none; width:90%; max-width:420px;
        `;
        document.body.appendChild(container);
    }

    const colors = {
        error:   { bg: '#1e1e2e', border: '#ff4b4b', icon: '⚠️' },
        info:    { bg: '#1e1e2e', border: '#38bdf8', icon: 'ℹ️' },
        warning: { bg: '#1e1e2e', border: '#f59e0b', icon: '⚡' },
        success: { bg: '#1e1e2e', border: '#10b981', icon: '✅' },
    };
    const c = colors[type] || colors.error;

    const toast = document.createElement('div');
    toast.style.cssText = `
        background:${c.bg}; border:1px solid ${c.border}; border-radius:12px;
        padding:14px 20px; color:#fff; font-size:14px; font-family:'Inter',sans-serif;
        line-height:1.5; box-shadow:0 8px 32px rgba(0,0,0,0.4);
        display:flex; align-items:flex-start; gap:10px;
        pointer-events:all; opacity:0; transition:opacity 0.25s ease;
        width:100%; box-sizing:border-box;
    `;
    toast.innerHTML = `<span style="font-size:18px;flex-shrink:0">${c.icon}</span><span>${msg}</span>`;
    container.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => { toast.style.opacity = '1'; });

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, durationMs);
}

// ── Image pre-fetch as blob URL (CORS workaround for mobile) ──
async function _fetchAsBlob(url) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8 second max
    try {
        const resp = await fetch(url, { mode: 'cors', cache: 'force-cache', signal: controller.signal });
        clearTimeout(id);
        if (!resp.ok) return null;
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    } catch { 
        clearTimeout(id);
        return null; 
    }
}

// ── Wait for an img element to fully decode ────────────────
function _waitForImg(el, timeoutMs) {
    if (el.complete && el.naturalWidth > 0) return Promise.resolve(true);
    return new Promise(resolve => {
        const done = (ok) => { resolve(ok); };
        el.onload  = () => done(true);
        el.onerror = () => done(false);
        setTimeout(() => done(false), timeoutMs);
    });
}

// ── Wait for html2canvas to be ready (loaded with defer) ──
// html2canvas uses `defer` so it may not be available the instant
// the module runs. Poll every 100ms until it appears or timeout.
function _waitForHtml2Canvas(timeoutMs = 8000) {
    if (typeof html2canvas !== 'undefined') return Promise.resolve(true);
    return new Promise(resolve => {
        const start = Date.now();
        const check = () => {
            if (typeof html2canvas !== 'undefined') return resolve(true);
            if (Date.now() - start >= timeoutMs) return resolve(false);
            setTimeout(check, 100);
        };
        check();
    });
}

// ── Core html2canvas capture with retry ─────────────────────
async function _captureCanvas(node, attempt = 1) {
    const maxAttempts = 3;
    const scale = isMobile ? 1.0 : 2.0; // Lower scale on mobile to prevent OOM

    try {
        // Ensure fonts are loaded (with a max timeout in case the API hangs)
        if (document.fonts && document.fonts.ready) {
            await Promise.race([
                document.fonts.ready,
                new Promise(r => setTimeout(r, 3000))
            ]);
        }

        // Pre-load all images inside card node
        const imgs = Array.from(node.querySelectorAll('img'));
        const blobUrls = [];

        for (const el of imgs) {
            const src = el.getAttribute('src') || '';
            // Convert remote URLs to blob: to bypass CORS canvas taint on mobile
            if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
                const blobUrl = await _fetchAsBlob(src);
                if (blobUrl) {
                    el.removeAttribute('crossorigin');
                    el.src = blobUrl;
                    blobUrls.push(blobUrl);
                }
            }
        }

        // Wait for ALL images to fully decode (check naturalWidth > 0)
        if (imgs.length > 0) {
            const timeout = isMobile ? 15000 : 10000;
            await Promise.all(imgs.map(el => _waitForImg(el, timeout)));

            // Extra delay on mobile to allow GPU texture upload
            if (isMobile) {
                await new Promise(r => setTimeout(r, 400));
            }
        }

        // Two animation frames to ensure full paint
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        const canvas = await Promise.race([
            html2canvas(node, {
                scale,
                backgroundColor:  null,
                useCORS:          true,
                allowTaint:       false,
                logging:          false,
                width:            node.offsetWidth  || 1600,
                height:           node.offsetHeight || 900,
                imageTimeout:     isMobile ? 20000 : 15000,
                onclone:          null,
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('html2canvas execution timed out (25s)')), 25000))
        ]);

        // Free blob memory
        blobUrls.forEach(u => URL.revokeObjectURL(u));

        return canvas;

    } catch (err) {
        console.warn(`[Card] Capture attempt ${attempt} failed:`, err.message);

        if (attempt < maxAttempts) {
            // Progressive delay before retry: 800ms, 1600ms
            await new Promise(r => setTimeout(r, attempt * 800));
            return _captureCanvas(node, attempt + 1);
        }

        throw err;
    }
}

let isGenerating = false;
const generateBtn    = document.getElementById('btn-generate');
const previewOverlay = document.getElementById('preview-overlay');

if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        if (isGenerating) return;

        const dcaInitActive   = document.getElementById('dca-init-toggle')?.checked;
        const dcaTargetActive = document.getElementById('dca-target-toggle')?.checked;

        let realInit, realTarget;
        const inv = parseAmount(elInv?.value);

        if (dcaInitActive && dcaInitRows.length > 0) {
            realInit = _calcDCAAvg(dcaInitRows);
        } else {
            realInit = parseAmount(elInitMC?.value) * State.initMul;
        }

        if (dcaTargetActive && dcaTargetRows.length > 0) {
            realTarget = _calcDCAAvg(dcaTargetRows);
        } else {
            realTarget = parseAmount(elTargetMC?.value) * State.targetMul;
        }

        if (realInit <= 0 || inv <= 0 || realTarget <= 0) {
            _showToast('Please enter valid positive numbers for Initial MC, Target MC, and Investment.', 'warning');
            return;
        }

        const result = calculateROI(realInit, realTarget, inv);
        const showName = document.getElementById('show-name-toggle')?.checked;

        const data = {
            tokenName:  State.tokenName,
            userName:   showName ? State.userName : '',
            initMC:     realInit,
            targetMC:   realTarget,
            inv,
            finalValue: result.finalValue,
            profit:     result.profit,
            roi:        result.roi,
            multiplier: result.multiplier,
            showBdt:    State.showBdt,
            bdtRate:    State.bdtRate,
        };

        previewOverlay.classList.add('active');
        currentCardId = null; // new generate — reset tracking

        const origHtml = generateBtn.innerHTML;
        generateBtn.innerHTML = 'Generating…';
        generateBtn.disabled  = true;
        generateBtn.style.opacity = '0.7';

        try {
            await generateRender(data, false); // false = first generate, not a reroll
        } finally {
            generateBtn.innerHTML = origHtml;
            generateBtn.disabled  = false;
            generateBtn.style.opacity = '1';
        }
    });
}

const rerollBtn = document.getElementById('btn-reroll');
if (rerollBtn) {
    rerollBtn.addEventListener('click', async () => {
        if (isGenerating) return;
        if (!window.lastData) return;
        document.getElementById('preview-img').classList.remove('loaded');

        const origHtml = rerollBtn.innerHTML;
        rerollBtn.innerHTML = 'Generating…';
        rerollBtn.disabled  = true;
        rerollBtn.style.opacity = '0.7';

        try {
            await generateRender(window.lastData, true); // true = reroll
        } finally {
            rerollBtn.innerHTML = origHtml;
            rerollBtn.disabled  = false;
            rerollBtn.style.opacity = '1';
        }
    });
}

async function generateRender(data, isReroll) {
    isGenerating = true;
    window.lastData = data;
    const node    = document.getElementById('card-node');
    const spinner = document.getElementById('preview-loading');
    const img     = document.getElementById('preview-img');

    spinner.style.display = 'block';
    img.classList.remove('loaded');

    try {
        // 1. Wait for templates AND html2canvas to be ready in parallel
        const [, h2cReady] = await Promise.all([
            cardAssetsReady,
            _waitForHtml2Canvas(8000),
        ]);
        if (!h2cReady) throw new Error('html2canvas not loaded');

        const engine = new CardEngine(data);
        const html   = engine.buildHTML(isReroll);

        // 3. Handle "only one design" sentinel — show toast, keep current card visible
        if (html === CARD_ONLY_ONE_DESIGN) {
            spinner.style.display = 'none';
            isGenerating = false;
            _showToast('No other designs available for this range. Only one card is assigned here.', 'info', 5000);
            return;
        }

        node.innerHTML = html;

        // 4. Capture to canvas (with retry on mobile)
        const canvas = await _captureCanvas(node);

        // 5. Show generated image
        const dataUrl = canvas.toDataURL('image/png');
        await new Promise((resolve, reject) => {
            const id = setTimeout(() => reject(new Error('Image load timeout')), 5000);
            img.onload  = () => { clearTimeout(id); resolve(); };
            img.onerror = () => { clearTimeout(id); reject(new Error('Image display failed')); };
            img.src = dataUrl;
        });

        img.classList.add('loaded');
        spinner.style.display = 'none';
        isGenerating = false;

    } catch (err) {
        console.error('[Card] Render failed:', err);
        spinner.style.display = 'none';
        isGenerating = false;

        const msg = err.message?.includes('html2canvas')
            ? 'Renderer not loaded. Please refresh the page.'
            : 'Card generation failed. Please try again.';
        _showToast(msg, 'error', 6000);
    }
}

const downloadBtn = document.getElementById('btn-download');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const imgSrc = document.getElementById('preview-img')?.src;
        if (!imgSrc) return;
        const link = document.createElement('a');
        link.download = `mccalc-${State.tokenName || 'card'}-${Date.now()}.png`;
        link.href = imgSrc;
        link.click();
    });
}

// ═══════════════════════════════════════════════════════════
//  Initial calculation
// ═══════════════════════════════════════════════════════════
calculate();

