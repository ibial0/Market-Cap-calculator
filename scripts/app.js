import { State } from '../config/state.js';
import { Storage } from '../utils/storage.js';
import { formatNumber, parseAmount } from '../utils/formatters.js';
import { calculateROI } from '../calculator/core.js';
import { CardEngine } from '../cards/engine.js';
import { initTheme } from '../ui/theme.js';
import { initModals } from '../ui/modals.js';

// DOM Elements
const elInitMC = document.getElementById('initial-mc');
const elTargetMC = document.getElementById('target-mc');
const elInv = document.getElementById('investment');

const elToken = document.getElementById('token-name');
const elUser = document.getElementById('user-name');

const resFinalValue = document.getElementById('res-final-value');
const resFinalBdt = document.getElementById('res-final-bdt');
const resProfit = document.getElementById('res-profit');
const resProfitBdt = document.getElementById('res-profit-bdt');
const resRoi = document.getElementById('res-roi');
const resMultiplier = document.getElementById('res-multiplier');

// Init inputs
if (elToken) elToken.value = State.tokenName;
if (elUser) elUser.value = State.userName;

const calculate = () => {
    State.initVal = parseAmount(elInitMC.value);
    State.targetVal = parseAmount(elTargetMC.value);
    State.inv = parseAmount(elInv.value);

    let realInit = State.initVal * State.initMul;
    let realTarget = State.targetVal * State.targetMul;

    const result = calculateROI(realInit, realTarget, State.inv);

    if (result.isValid) {
        resFinalValue.innerText = `$${formatNumber(result.finalValue)}`;
        resProfit.innerText = `$${formatNumber(result.profit)}`;
        resRoi.innerText = `${formatNumber(result.roi)}%`;
        resMultiplier.innerText = `${formatNumber(result.multiplier)}x`;

        resProfit.className = 'result-value ' + (result.profit >= 0 ? 'value-green' : 'value-red');
        resRoi.className = 'result-value ' + (result.roi >= 0 ? 'value-green' : 'value-red');
        
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
        resProfit.innerText = '$0.00';
        resRoi.innerText = '0.00%';
        resMultiplier.innerText = '0.00x';
        resProfit.className = 'result-value';
        resRoi.className = 'result-value';
        resFinalBdt.classList.add('hidden');
        resProfitBdt.classList.add('hidden');
    }
};

// Handlers
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
if (elUser) {
    elUser.addEventListener('input', e => { 
        State.userName = e.target.value; 
        Storage.set('userName', State.userName); 
    });
}

// Multiplier Toggles
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

// Initialize Theme & Modals
initTheme();
initModals(calculate);

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(()=>{});
    });
}

// Card Generation Logic
let isGenerating = false;

const generateBtn = document.getElementById('btn-generate');
const previewOverlay = document.getElementById('preview-overlay');

if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        if (isGenerating) return;
        
        let initVal = parseAmount(elInitMC.value);
        let targetVal = parseAmount(elTargetMC.value);
        let inv = parseAmount(elInv.value);
        
        let realInit = initVal * State.initMul;
        let realTarget = targetVal * State.targetMul;

        if (realInit <= 0 || inv <= 0 || realTarget <= 0) {
            alert("Please enter valid positive numbers for Initial MC, Target MC, and Investment.");
            return;
        }
        
        const result = calculateROI(realInit, realTarget, inv);
        
        let data = {
            tokenName: State.tokenName,
            userName: State.userName,
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
        await generateRender(data);
    });
}

const rerollBtn = document.getElementById('btn-reroll');
if (rerollBtn) {
    rerollBtn.addEventListener('click', async () => {
        if (isGenerating) return;
        if (!window.lastData) return;
        document.getElementById('preview-img').classList.remove('loaded');
        await generateRender(window.lastData);
    });
}

async function generateRender(data) {
    isGenerating = true;
    window.lastData = data;
    const node = document.getElementById('card-node');
    const spinner = document.getElementById('preview-loading');
    const img = document.getElementById('preview-img');
    
    spinner.style.display = 'block';
    img.classList.remove('loaded');
    
    let engine = new CardEngine(data);
    node.innerHTML = engine.buildHTML();
    
    await new Promise(r => setTimeout(r, 100));
    
    try {
        if (typeof html2canvas === 'undefined') throw new Error("Library not loaded");
        
        const canvas = await html2canvas(node, {
            scale: 1,
            backgroundColor: null,
            useCORS: true,
            logging: false
        });
        
        img.src = canvas.toDataURL('image/png', 1.0);
        img.onload = () => {
            img.classList.add('loaded');
            spinner.style.display = 'none';
            isGenerating = false;
        };
    } catch (err) {
        console.error("Render failed:", err);
        spinner.style.display = 'none';
        isGenerating = false;
        alert("Failed to render card. Please try again.");
    }
}

const downloadBtn = document.getElementById('btn-download');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const imgSrc = document.getElementById('preview-img').src;
        if (!imgSrc) return;
        const link = document.createElement('a');
        link.download = `mccalc-card-${Date.now()}.png`;
        link.href = imgSrc;
        link.click();
    });
}

// Initial calculation
calculate();
