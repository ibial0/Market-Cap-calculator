import { State } from '../config/state.js';
import { Storage } from '../utils/storage.js';
import { formatNumber, parseAmount } from '../utils/formatters.js';
import { calculateROI } from '../calculator/core.js';
import { CardEngine } from '../cards/engine.js';
import { initTheme } from '../ui/theme.js';
import { initModals } from '../ui/modals.js';
import { initProfile } from '../ui/profile.js';
import { initJournal, bindTradeModal, bindAnalysisModal } from './journal.js';
import { loadCustomThemes } from '../cards/themes/index.js';
import { loadPNGTemplates } from '../cards/png-loader.js';

// Load custom themes and PNG templates from Firestore asynchronously at startup
loadCustomThemes();
loadPNGTemplates();

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

// Pre-fetch an image URL as a blob: URL to avoid CORS canvas taint.
// Mobile browsers often block canvas export when crossorigin images are used directly.
async function _fetchAsBlob(url) {
    try {
        const resp = await fetch(url, { mode: 'cors', cache: 'force-cache' });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    } catch { return null; }
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
            alert("Please enter valid positive numbers for Initial MC, Target MC, and Investment.");
            return;
        }
        
        const result = calculateROI(realInit, realTarget, inv);
        const showName = document.getElementById('show-name-toggle')?.checked;
        
        let data = {
            tokenName: State.tokenName,
            userName: showName ? State.userName : '',
            initMC: realInit,
            targetMC: realTarget,
            inv: inv,
            finalValue: result.finalValue,
            profit: result.profit,
            roi: result.roi,
            multiplier: result.multiplier,
            showBdt: State.showBdt,
            bdtRate: State.bdtRate
        };
        
        previewOverlay.classList.add('active');
        
        // Button loading state
        const originalBtnHtml = generateBtn.innerHTML;
        generateBtn.innerHTML = 'Generating...';
        generateBtn.disabled = true;
        generateBtn.style.opacity = '0.7';
        
        await generateRender(data);
        
        // Restore button state
        generateBtn.innerHTML = originalBtnHtml;
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
    });
}

const rerollBtn = document.getElementById('btn-reroll');
if (rerollBtn) {
    rerollBtn.addEventListener('click', async () => {
        if (isGenerating) return;
        if (!window.lastData) return;
        document.getElementById('preview-img').classList.remove('loaded');
        
        // Button loading state
        const originalBtnHtml = rerollBtn.innerHTML;
        rerollBtn.innerHTML = 'Generating...';
        rerollBtn.disabled = true;
        rerollBtn.style.opacity = '0.7';
        
        await generateRender(window.lastData);
        
        // Restore button state
        rerollBtn.innerHTML = originalBtnHtml;
        rerollBtn.disabled = false;
        rerollBtn.style.opacity = '1';
    });
}

async function generateRender(data) {
    isGenerating = true;
    window.lastData = data;
    const node    = document.getElementById('card-node');
    const spinner = document.getElementById('preview-loading');
    const img     = document.getElementById('preview-img');

    spinner.style.display = 'block';
    img.classList.remove('loaded');

    // 1. Inject card HTML
    let engine = new CardEngine(data);
    node.innerHTML = engine.buildHTML();

    try {
        if (typeof html2canvas === 'undefined') throw new Error('html2canvas not loaded');

        // 2. For PNG templates: pre-fetch background as blob: URL
        //    This bypasses CORS canvas taint on mobile browsers.
        const bgImgs = Array.from(node.querySelectorAll('img[crossorigin]'));
        const blobUrls = [];
        for (const el of bgImgs) {
            if (el.src && !el.src.startsWith('data:') && !el.src.startsWith('blob:')) {
                const blobUrl = await _fetchAsBlob(el.src);
                if (blobUrl) {
                    el.removeAttribute('crossorigin');
                    el.src = blobUrl;
                    blobUrls.push(blobUrl);
                }
            }
        }

        // 3. Wait for ALL fonts to finish loading
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        // 4. Wait for every <img> inside the card node to fully load
        const imgs = Array.from(node.querySelectorAll('img'));
        if (imgs.length > 0) {
            await Promise.all(imgs.map(el => {
                if (el.complete && el.naturalWidth > 0) return Promise.resolve();
                return new Promise(res => {
                    el.onload  = res;
                    el.onerror = res; // skip broken images
                    setTimeout(res, isMobile ? 12000 : 8000);
                });
            }));
        }

        // 5. Give browser 2 animation frames to fully paint (extra on mobile)
        await new Promise(r => requestAnimationFrame(r));
        if (isMobile) await new Promise(r => requestAnimationFrame(r));

        // 6. Capture — lower scale on mobile to avoid OOM crash
        const captureScale = isMobile ? 1.5 : 2;
        const canvas = await html2canvas(node, {
            scale:           captureScale,
            backgroundColor: null,
            useCORS:         true,
            allowTaint:      false,
            logging:         false,
            width:           node.offsetWidth  || 1600,
            height:          node.offsetHeight || 900,
            imageTimeout:    isMobile ? 15000 : 10000,
        });

        img.src = canvas.toDataURL('image/png', 1.0);
        img.onload = () => {
            img.classList.add('loaded');
            spinner.style.display = 'none';
            isGenerating = false;
        };

        // 7. Free blob memory
        blobUrls.forEach(u => URL.revokeObjectURL(u));

    } catch (err) {
        console.error('Render failed:', err);
        spinner.style.display = 'none';
        isGenerating = false;
        const msg = (err.message || '').includes('html2canvas')
            ? 'Renderer not ready. Please refresh the page and try again.'
            : 'Card generation failed. Please try again.';
        alert(msg);
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
