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
import { initWallet } from './wallet.js';
import { loadBackgrounds, getNextBackgroundByEmotion, hasMoreBackgrounds, getEligibleBackgrounds } from '../cards/bg-loader.js';
import { composeSimpleCard } from '../cards/png-engine.js';
import { loadTokenCatalog, searchTokenCatalog } from '../cards/token-catalog.js';
import { compressImageFile } from '../utils/image.js';
import { storeIconData } from '../assets/lottie/store-icon.js';
import { saveDownloadIconData } from '../assets/lottie/save-download-icon.js';
import { tickDownloadIconData } from '../assets/lottie/tick-download-icon.js';
import { copyIconData } from '../assets/lottie/copy-icon.js';
import { successTickIconData } from '../assets/lottie/success-tick-icon.js';
import { refreshIconData } from '../assets/lottie/refresh-icon.js';
import { uploadCloudIconData } from '../assets/lottie/upload-cloud-icon.js';
import { createOrbNoise } from './orb-loader.js';
import { createBtnStars } from './btn-stars.js';
import { initReactionController } from './reaction-controller.js';

// Card asset readiness â€” RACE between actual load and a max timeout.
// This means: proceed as soon as assets finish, OR after 10s (whichever is FIRST).
// Previously this was allSettled([..., timeout]) which ALWAYS waited 10 full seconds!
let _assetsLoaded = false;
const _assetLoad = Promise.allSettled([loadCustomThemes(), loadPNGTemplates(), loadBackgrounds()]);
const _assetTimeout = new Promise(r => setTimeout(r, 10000));
const cardAssetsReady = Promise.race([_assetLoad, _assetTimeout])
    .then(() => { _assetsLoaded = true; });

// The Store may be opened before Firestore/image processing finishes. Refresh its
// already-open view once the shared catalogue is ready instead of leaving its
// one-time empty-state render on screen.
loadBackgrounds().finally(() => {
    if (typeof _populateSidebar === 'function' && bgGalleryColumn?.style.display !== 'none') {
        _populateSidebar();
    }
});

// Suggestions are optional, so a catalogue connection problem never delays cards.
loadTokenCatalog();

// // ── Tab Visibility: Re-init if returning after long absence // ──
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !_assetsLoaded) {
        loadPNGTemplates().catch(() => {});
        loadCustomThemes().catch(() => {});
    }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DOM Elements
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const elInitMC   = document.getElementById('initial-mc');
const elTargetMC = document.getElementById('target-mc');
const elInv      = document.getElementById('investment');
const elToken    = document.getElementById('token-name');

// Calculation Mode state: 'mc' (Market Cap) or 'price' (Price)
let _calcMode = Storage.get('calcMode', 'mc');
const modeMCBtn = document.getElementById('mode-mc-btn');
const modePriceBtn = document.getElementById('mode-price-btn');
const modeNftBtn = document.getElementById('mode-nft-btn');
const nftCountWrapper = document.getElementById('nft-count-wrapper');
const elNftCount = document.getElementById('nft-count');

function setCalcMode(mode) {
    _calcMode = mode;
    Storage.set('calcMode', mode);
    const isPrice = mode === 'price';
    const isNft = mode === 'nft';
    
    // Update mode buttons
    const allModeBtns = [modeMCBtn, modePriceBtn, modeNftBtn];
    allModeBtns.forEach(btn => {
        if (!btn) return;
        if (btn.dataset.mode === mode) {
            btn.style.background = 'linear-gradient(90deg, #12e2fd 0%, #3dbbfe 100%)';
            btn.style.color = '#0a0f1c';
            btn.style.fontWeight = '700';
            btn.style.boxShadow = '0 2px 8px rgba(18, 226, 253, 0.25)';
        } else {
            btn.style.background = 'transparent';
            btn.style.color = '#94a3b8';
            btn.style.fontWeight = '600';
            btn.style.boxShadow = 'none';
        }
    });
    
    const lblInit = document.getElementById('lbl-initial');
    const lblTarget = document.getElementById('lbl-target');
    const lblInitDCA = document.getElementById('lbl-init-dca-avg');
    const lblTargetDCA = document.getElementById('lbl-target-dca-avg');
    
    if (isPrice) {
        if (lblInit) lblInit.textContent = 'Entry Price';
        if (lblTarget) lblTarget.textContent = 'Target Price';
        if (lblInitDCA) lblInitDCA.textContent = 'Avg Entry Price:';
        if (lblTargetDCA) lblTargetDCA.textContent = 'Avg Exit Price:';
    } else if (isNft) {
        if (lblInit) lblInit.textContent = 'BUY PRICE ($)';
        if (lblTarget) lblTarget.textContent = 'SELL PRICE ($)';
        if (lblInitDCA) lblInitDCA.textContent = 'Avg Buy Price:';
        if (lblTargetDCA) lblTargetDCA.textContent = 'Avg Sell Price:';
    } else {
        if (lblInit) lblInit.textContent = 'INITIAL MARKET CAP';
        if (lblTarget) lblTarget.textContent = 'TARGET MARKET CAP';
        if (lblInitDCA) lblInitDCA.textContent = 'Avg Entry MC:';
        if (lblTargetDCA) lblTargetDCA.textContent = 'Avg Exit MC:';
    }
    
    const initToggles = document.getElementById('init-toggles');
    const targetToggles = document.getElementById('target-toggles');
    if (initToggles) initToggles.style.display = (isPrice || isNft) ? 'none' : 'flex';
    if (targetToggles) targetToggles.style.display = (isPrice || isNft) ? 'none' : 'flex';
    
    // NFT count field
    if (nftCountWrapper) nftCountWrapper.style.display = isNft ? '' : 'none';
    // Investment Amount — hidden in NFT mode (auto-computed as buyPrice × nftCount)
    const invWrapper = document.getElementById('investment-wrapper');
    if (invWrapper) invWrapper.style.display = isNft ? 'none' : '';
    
    // Token Details: change labels for NFT mode
    const tokenHeaderTitle = document.querySelector('.token-header-title');
    const tokenInputLabel = document.querySelector('.token-input-label');
    const tokenHintText = document.querySelector('.token-hint-text');
    const tokenSearchInput = document.getElementById('token-name');
    
    if (tokenHeaderTitle) tokenHeaderTitle.textContent = isNft ? 'NFT DETAILS' : 'TOKEN DETAILS';
    if (tokenInputLabel) tokenInputLabel.textContent = isNft ? 'NFT NAME' : 'TOKEN NAME';
    if (tokenSearchInput) tokenSearchInput.placeholder = isNft ? 'Enter NFT name' : 'Search token name or symbol';
    if (tokenHintText) tokenHintText.textContent = isNft
        ? 'Enter your NFT name and optionally add a logo below.'
        : 'Start typing to see matching tokens and set a logo automatically.';
    
    // Hide token suggestions in NFT mode
    const tokenSuggestionsEl = document.getElementById('token-suggestions');
    if (isNft && tokenSuggestionsEl) {
        tokenSuggestionsEl.replaceChildren();
        tokenSuggestionsEl.classList.add('hidden');
    }
    
    const dcaInitActive = document.getElementById('dca-init-toggle')?.checked;
    const dcaTargetActive = document.getElementById('dca-target-toggle')?.checked;
    if (dcaInitActive) renderDCARows('init-dca-rows', dcaInitRows, calculate);
    if (dcaTargetActive) renderDCARows('target-dca-rows', dcaTargetRows, calculate);
    
    calculate();
}

if (modeMCBtn) modeMCBtn.addEventListener('click', () => setCalcMode('mc'));
if (modePriceBtn) modePriceBtn.addEventListener('click', () => setCalcMode('price'));
if (modeNftBtn) modeNftBtn.addEventListener('click', () => setCalcMode('nft'));


// Token logo state
let _tokenLogoDataUrl = null;
let _tokenLogoSource = 'none'; // 'catalog', 'upload', or 'none'

// Current background state (for change-bg feature)
let _currentBgSrc = null;
let _currentBgId = null;

function getBackgroundContext(data = null) {
    // The calculator is the authoritative source; never infer P/L from an emotion or a card name.
    const result = data || calculateROI(State.initVal, State.targetVal, State.inv);
    if (!result?.isValid || !Number.isFinite(result.profit)) return { emotion: _selectedEmotion, outcome: null };
    return { emotion: _selectedEmotion, outcome: result.profit >= 0 ? 'profit' : 'loss' };
}

// Token logo upload handler
const tokenLogoArea   = document.getElementById('token-logo-area');
const tokenLogoUpload = document.getElementById('token-logo-upload');
const tokenLogoPreview = document.getElementById('token-logo-preview');
const tokenLogoPlaceholder = document.getElementById('token-logo-placeholder');
const tokenLogoRemove = document.getElementById('token-logo-remove');
const tokenLogoSub = document.querySelector('.token-logo-sub');
const tokenSuggestions = document.getElementById('token-suggestions');
const _tokenBadgeImg = document.getElementById('token-badge-img');
const _badgeDollarSrc = './assets/figma/badge-dollar-sign.svg';
let _highlightedSuggestion = -1;

function setTokenLogo(dataUrl, source = 'upload') {
    _tokenLogoDataUrl = dataUrl || null;
    _tokenLogoSource = dataUrl ? source : 'none';
    // TASK2: Reset badge icon to dollar when no logo
    if (!dataUrl && _tokenBadgeImg) {
        _tokenBadgeImg.src = _badgeDollarSrc;
        _tokenBadgeImg.style.width = '14px';
        _tokenBadgeImg.style.height = '14px';
        _tokenBadgeImg.style.borderRadius = '';
        _tokenBadgeImg.style.objectFit = '';
    }
    if (tokenLogoPreview) {
        tokenLogoPreview.src = dataUrl || '';
        tokenLogoPreview.classList.toggle('hidden', !dataUrl);
    }
    tokenLogoPlaceholder?.classList.toggle('hidden', Boolean(dataUrl));
    tokenLogoRemove?.classList.toggle('hidden', !dataUrl);
    if (tokenLogoSub) {
        tokenLogoSub.textContent = dataUrl
            ? (source === 'catalog' ? 'Saved token logo selected' : 'Custom logo selected')
            : 'Optional â€” tap to upload';
    }
}

function saveTokenName(name) {
    State.tokenName = name;
    Storage.set('tokenName', name);
}

function hideTokenSuggestions() {
    if (!tokenSuggestions) return;
    tokenSuggestions.replaceChildren();
    tokenSuggestions.classList.add('hidden');
    tokenSuggestions.style.cssText = '';
    elToken?.setAttribute('aria-expanded', 'false');
    _highlightedSuggestion = -1;
}

function selectCatalogToken(token) {
    if (!elToken) return;
    const name = String(token.name || '').toUpperCase();
    elToken.value = name;
    saveTokenName(name);
    setTokenLogo(token.logoDataUrl, 'catalog');
    hideTokenSuggestions();
    // TASK2: Show selected token logo in badge icon slot
    if (_tokenBadgeImg && token.logoDataUrl) {
        _tokenBadgeImg.src = token.logoDataUrl;
        _tokenBadgeImg.style.width = '32px';
        _tokenBadgeImg.style.height = '32px';
        _tokenBadgeImg.style.borderRadius = '8px';
        _tokenBadgeImg.style.objectFit = 'cover';
        _tokenBadgeImg.onerror = function() {
            this.src = _badgeDollarSrc;
            this.style.width = '14px';
            this.style.height = '14px';
            this.style.borderRadius = '';
            this.style.objectFit = '';
            this.onerror = null;
        };
    }
}

function renderTokenSuggestions(query) {
    if (!tokenSuggestions) return;
    const matches = searchTokenCatalog(query);
    tokenSuggestions.replaceChildren();
    _highlightedSuggestion = -1;

    matches.forEach((token, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'token-suggestion';
        option.dataset.index = String(index);

        const logo = document.createElement('img');
        logo.className = 'token-suggestion-logo';
        if (token.logoDataUrl) {
            logo.src = token.logoDataUrl;
            logo.alt = '';
        } else {
            logo.style.display = 'none';
        }

        const labels = document.createElement('span');
        labels.className = 'token-suggestion-labels';
        const name = document.createElement('strong');
        name.textContent = String(token.name || '').toUpperCase();
        labels.append(name);
        option.append(logo, labels);

        const selectHandler = (event) => {
            event.preventDefault();
            event.stopPropagation();
            selectCatalogToken(token);
        };
        option.addEventListener('pointerdown', selectHandler);
        option.addEventListener('mousedown', selectHandler);
        option.addEventListener('click', selectHandler);

        tokenSuggestions.append(option);
    });
    tokenSuggestions.classList.toggle('hidden', matches.length === 0);
    elToken?.setAttribute('aria-expanded', String(matches.length > 0));

    // Body-level positioning to escape overflow:hidden parents
    if (matches.length > 0 && elToken) {
        if (tokenSuggestions.parentElement !== document.body) {
            document.body.appendChild(tokenSuggestions);
        }
        const rect = elToken.closest('[style*="position"]')?.getBoundingClientRect()
                  || elToken.getBoundingClientRect();
        const inputRect = elToken.getBoundingClientRect();
        tokenSuggestions.style.position = 'fixed';
        tokenSuggestions.style.left = rect.left + 'px';
        tokenSuggestions.style.width = rect.width + 'px';
        tokenSuggestions.style.top = (inputRect.bottom + 4) + 'px';
        tokenSuggestions.style.zIndex = '99999';
    }
}

if (tokenLogoArea) {
    tokenLogoArea.addEventListener('click', () => tokenLogoUpload?.click());
}

if (tokenLogoUpload) {
    tokenLogoUpload.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setTokenLogo(await compressImageFile(file), 'upload');
        } catch (error) {
            console.warn('[TokenLogo] Upload failed:', error.message);
            _showToast(error.message || 'Could not use that logo. Please choose another image.', 'warning');
        } finally {
            // Allows choosing the same file again after removing or correcting it.
            tokenLogoUpload.value = '';
        }
    });
}

// ─── TASK1: Paste image to import token logo ──────────────
async function _handleClipboardImage(items) {
    for (const item of items) {
        if (item.type && item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (!file) continue;
            try {
                setTokenLogo(await compressImageFile(file), 'upload');
                setTimeout(_refreshLogoPanel, 50);
            } catch (error) {
                _showToast(error.message || 'Could not use that image.', 'warning');
            }
            return true;
        }
    }
    return false;
}

if (tokenLogoArea) {
    tokenLogoArea.addEventListener('paste', async (e) => {
        const items = Array.from(e.clipboardData?.items || []);
        const hadImage = await _handleClipboardImage(items);
        if (hadImage) e.preventDefault();
    });
    tokenLogoArea.setAttribute('tabindex', '0');
}

if (tokenLogoRemove) {
    tokenLogoRemove.addEventListener('click', () => {
        setTokenLogo(null);
        if (tokenLogoUpload) tokenLogoUpload.value = '';
    });
}

// // ── Reaction Popover & Continuously Animated Button ────────────────────────
let _selectedEmotion = null; // null means "any/random"

const reactionController = initReactionController({
    getSelectedEmotion: () => _selectedEmotion,
    setSelectedEmotion: (val) => { _selectedEmotion = val; },
    onEmotionChange: () => {
        // Never keep displaying a background that the newly selected emotion cannot use.
        if (_currentBgId && !getEligibleBackgrounds(getBackgroundContext()).some(bg => bg.id === _currentBgId)) {
            _currentBgId = null;
            _currentBgSrc = null;
        }
        _populateSidebar();
    }
});

// // ── Background Gallery (Middle Column) // ─────────────────────────────────────
const bgGalleryColumn  = document.getElementById('bg-gallery-column');
const bgSidebarGrid    = document.getElementById('bg-sidebar-grid');
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
const closeGallery     = document.getElementById('close-gallery');
const calcSplitLayout  = document.querySelector('.calc-split-layout');

// Legacy references for backward compatibility
const bgSidebar = bgGalleryColumn;

function toggleSidebar() {
    if (!bgGalleryColumn) return;
    const isHidden = bgGalleryColumn.style.display === 'none';
    if (isHidden) {
        bgGalleryColumn.style.display = '';
        _populateSidebar();

    } else {
        bgGalleryColumn.style.display = 'none';
    }
}

function _hideGallery() {
    if (bgGalleryColumn) bgGalleryColumn.style.display = 'none';
}

if (btnToggleSidebar) btnToggleSidebar.addEventListener('click', toggleSidebar);

// Initialize Store animated Lottie icon
function initStoreLottie() {
    const storeLottieContainer = document.getElementById('store-lottie-icon');
    if (!storeLottieContainer) return;
    const lottieLib = window.lottie || window.bodymovin;
    if (lottieLib) {
        try {
            lottieLib.loadAnimation({
                container: storeLottieContainer,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: storeIconData
            });
        } catch (err) {
            console.error('Failed to initialize store Lottie animation:', err);
        }
    } else {
        window.addEventListener('load', () => {
            const lib = window.lottie || window.bodymovin;
            if (lib && storeLottieContainer.childElementCount === 0) {
                try {
                    lib.loadAnimation({
                        container: storeLottieContainer,
                        renderer: 'svg',
                        loop: true,
                        autoplay: true,
                        animationData: storeIconData
                    });
                } catch (err) {
                    console.error('Failed to initialize store Lottie animation on window load:', err);
                }
            }
        }, { once: true });
    }
}
initStoreLottie();
if (closeGallery) closeGallery.addEventListener('click', _hideGallery);


const resFinalValue = document.getElementById('res-final-value');
const resFinalBdt   = document.getElementById('res-final-bdt');
const resProfit     = document.getElementById('res-profit');
const resProfitBdt  = document.getElementById('res-profit-bdt');
const resRoi        = document.getElementById('res-roi');
const resMultiplier = document.getElementById('res-multiplier');

// DCA state
let dcaInitRows   = []; // [{mc, mcUnit, amount}]
let dcaTargetRows = [];

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Init inputs from State
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
if (elToken) elToken.value = State.tokenName;
_updateNamePreview();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Core Calculate
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const calculate = () => {
    const dcaInitActive   = document.getElementById('dca-init-toggle')?.checked;
    const dcaTargetActive = document.getElementById('dca-target-toggle')?.checked;

    let realInit, realTarget, inv;
    const countVal = parseAmount(elNftCount?.value);
    const nftCount = countVal > 0 ? countVal : 0;

    if (_calcMode === 'nft') {
        // NFT: investment = buyPrice × numberOfNFTs
        inv = parseAmount(elInitMC?.value) * nftCount;
        if (elInv) elInv.value = inv; // keep elInv in sync for card/state reads
    } else {
        inv = parseAmount(elInv?.value);
    }

    if (dcaInitActive && dcaInitRows.length > 0) {
        realInit = _calcDCAAvg(dcaInitRows);
        _updateDCAAvgDisplay('init-avg-val', realInit);
        if (_calcMode === 'nft') {
            inv = realInit * nftCount;
            if (elInv) elInv.value = inv;
        } else {
            // Auto-sum all DCA entry amounts into the investment field
            const totalDCAInv = dcaInitRows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
            if (totalDCAInv > 0) {
                if (elInv) elInv.value = totalDCAInv;
                inv = totalDCAInv;
            }
        }
    } else {
        const initVal = parseAmount(elInitMC?.value);
        realInit = (_calcMode === 'price' || _calcMode === 'nft') ? initVal : initVal * State.initMul;
    }

    if (dcaTargetActive && dcaTargetRows.length > 0) {
        realTarget = _calcDCAAvg(dcaTargetRows);
        _updateDCAAvgDisplay('target-avg-val', realTarget);
    } else {
        const targetVal = parseAmount(elTargetMC?.value);
        realTarget = (_calcMode === 'price' || _calcMode === 'nft') ? targetVal : targetVal * State.targetMul;
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

// // ─── DCA Avg Calculation // ───// ───// ───// ───// ───// ───// ───// ───// ───// ───// ───â”€
const _calcDCAAvg = (rows) => {
    let totalWeight = 0, totalAmount = 0;
    rows.forEach(r => {
        const unit = (_calcMode === 'price' || _calcMode === 'nft') ? 1 : parseFloat(r.unit || 1);
        const mc  = parseFloat(r.mc || 0) * unit;
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
    if (avgMC <= 0) { el.textContent = 'â€”'; return; }
    if (avgMC >= 1e9) el.textContent = `$${(avgMC / 1e9).toFixed(2)}B`;
    else if (avgMC >= 1e6) el.textContent = `$${(avgMC / 1e6).toFixed(2)}M`;
    else if (avgMC >= 1e3) el.textContent = `$${(avgMC / 1e3).toFixed(2)}K`;
    else el.textContent = `$${formatNumber(avgMC)}`;
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Handlers
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const handleInput = () => calculate();
const handleBlur = (e) => {
    let val = parseAmount(e.target.value);
    if (val > 0) {
        if (_calcMode === 'price') {
            e.target.value = val < 1 ? val.toString() : formatNumber(val, 4);
        } else {
            e.target.value = formatNumber(val, 4);
        }
    }
};
const handleFocus = (e) => {
    let val = parseAmount(e.target.value);
    if (val > 0) e.target.value = val;
};

[elInitMC, elTargetMC, elInv, elNftCount].forEach(el => {
    if (el) {
        el.addEventListener('input', handleInput);
        el.addEventListener('blur', handleBlur);
        el.addEventListener('focus', handleFocus);
    }
});

if (elToken) {
    elToken.addEventListener('input', e => { 
        saveTokenName(e.target.value);
        // A changed name should not silently retain the logo from a different
        // catalogue token. Custom uploads remain intact.
        if (_tokenLogoSource === 'catalog') setTokenLogo(null);
        if (_calcMode !== 'nft') renderTokenSuggestions(e.target.value);
    });
    elToken.addEventListener('focus', () => { if (_calcMode !== 'nft') renderTokenSuggestions(elToken.value); });
    elToken.addEventListener('blur', () => setTimeout(hideTokenSuggestions, 250));
    // Reposition suggestions on scroll/resize
    const _reposSuggestions = () => {
        if (!tokenSuggestions || tokenSuggestions.classList.contains('hidden')) return;
        if (!elToken) return;
        const rect = elToken.closest('[style*="position"]')?.getBoundingClientRect()
                  || elToken.getBoundingClientRect();
        const inputRect = elToken.getBoundingClientRect();
        tokenSuggestions.style.left = rect.left + 'px';
        tokenSuggestions.style.width = rect.width + 'px';
        tokenSuggestions.style.top = (inputRect.bottom + 4) + 'px';
    };
    window.addEventListener('scroll', _reposSuggestions, { passive: true, capture: true });
    window.addEventListener('resize', _reposSuggestions, { passive: true });
    elToken.addEventListener('keydown', event => {
        const options = Array.from(tokenSuggestions?.querySelectorAll('.token-suggestion') || []);
        if (!options.length) return;
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            _highlightedSuggestion = event.key === 'ArrowDown'
                ? (_highlightedSuggestion + 1) % options.length
                : (_highlightedSuggestion - 1 + options.length) % options.length;
            options.forEach((option, index) => option.classList.toggle('active', index === _highlightedSuggestion));
        } else if (event.key === 'Enter' && _highlightedSuggestion >= 0) {
            event.preventDefault();
            options[_highlightedSuggestion].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        } else if (event.key === 'Escape') {
            hideTokenSuggestions();
        }
    });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Multiplier Toggles (single mode)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  DCA Toggle Setup
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

// // ─── Render DCA Rows // ───// ───// ───// ───// ───// ───// ───// ───// ───// ───// ───// ───// ──
const renderDCARows = (containerId, rows, onChange) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = rows.map((row, i) => `
    <div class="dca-entry-row">
        <div class="input-wrapper">
            <span class="prefix">$</span>
            <input type="number" class="amount-input dca-mc-inp" data-index="${i}" placeholder="0" value="${row.mc}" inputmode="decimal" min="0" step="any">
        </div>
        <select class="mc-unit-select dca-unit-sel" data-index="${i}" style="${_calcMode === 'price' ? 'display:none;' : ''}">
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Show Name Toggle
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
        previewEl.textContent = 'No name set â€” Go to Profile to set your name';
    }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Tab Navigation
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const menuNavBtns = document.querySelectorAll('.menu-nav-btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const profileMenuOverlayLocal = document.getElementById('profile-menu-overlay');

menuNavBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        menuNavBtns.forEach(b => {
            b.style.borderColor = 'var(--border)';
            b.style.color = 'var(--text-secondary)';
        });
        tabPanels.forEach(p => p.classList.remove('active'));
        
        btn.style.borderColor = 'var(--accent-primary)';
        btn.style.color = 'var(--accent-primary)';
        document.getElementById('tab-' + target)?.classList.add('active');
        
        if (profileMenuOverlayLocal) profileMenuOverlayLocal.classList.remove('active');
    });
});

const calcNavBtn = document.querySelector('.menu-nav-btn[data-tab="calculator"]');
if (calcNavBtn) {
    calcNavBtn.style.borderColor = 'var(--accent-primary)';
    calcNavBtn.style.color = 'var(--accent-primary)';
}

// Switch to calculator tab from journal analysis
window.addEventListener('journal-generate-card', (e) => {
    const { token, dca } = e.detail;
    // Switch to calculator
    document.querySelectorAll('.menu-nav-btn').forEach(b => { b.style.borderColor = 'var(--border)'; b.style.color = 'var(--text-secondary)'; });
    tabPanels.forEach(p => p.classList.remove('active'));
    const calcBtn = document.querySelector('.menu-nav-btn[data-tab="calculator"]'); if (calcBtn) { calcBtn.style.borderColor = 'var(--accent-primary)'; calcBtn.style.color = 'var(--accent-primary)'; }
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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Init subsystems
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
initTheme();
initModals(calculate);
initProfile();
initJournal();
bindTradeModal();
bindAnalysisModal();
initWallet();

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

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Service Worker
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Card Generation Logic
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Detect mobile for performance tuning
const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || window.innerWidth <= 768;

// // ── Toast Notification (replaces all alert() calls) // ───// ───// ──
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
        error:   { bg: '#1e1e2e', border: '#ff4b4b', icon: 'âš ï¸' },
        info:    { bg: '#1e1e2e', border: '#38bdf8', icon: 'â„¹ï¸' },
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

// // ── Image pre-fetch as blob URL (CORS workaround for mobile) // ──
async function _fetchAsBlob(url) {
    // Method 1: Direct fetch with CORS
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    try {
        const resp = await fetch(url, { mode: 'cors', cache: 'force-cache', signal: controller.signal });
        clearTimeout(id);
        if (resp.ok) {
            const blob = await resp.blob();
            return URL.createObjectURL(blob);
        }
    } catch { clearTimeout(id); }

    // Method 2: Load as Image with crossOrigin, draw to canvas → data URL
    // Many CDNs send CORS headers for <img> but not for fetch()
    try {
        const dataUrl = await _imgToDataUrl(url, true);
        if (dataUrl) return dataUrl;
    } catch {}

    // Method 3: Load without crossOrigin, draw to canvas
    // Canvas will be tainted but toDataURL may still work in some browsers
    try {
        const dataUrl = await _imgToDataUrl(url, false);
        if (dataUrl) return dataUrl;
    } catch {}

    return null;
}

function _imgToDataUrl(url, useCors) {
    return new Promise((resolve) => {
        const img = new Image();
        if (useCors) img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => { resolve(null); }, 8000);
        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch { resolve(null); }
        };
        img.onerror = () => { clearTimeout(timer); resolve(null); };
        img.src = url;
    });
}

// // ── Wait for an img element to fully decode // ───// ───// ───// ───// ───â”€
function _waitForImg(el, timeoutMs) {
    if (el.complete && el.naturalWidth > 0) return Promise.resolve(true);
    return new Promise(resolve => {
        const done = (ok) => { resolve(ok); };
        el.onload  = () => done(true);
        el.onerror = () => done(false);
        setTimeout(() => done(false), timeoutMs);
    });
}

// // ── Wait for html2canvas to be ready (loaded with defer) // ──
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

// // ── Core html2canvas capture with retry // ───// ───// ───// ───// ───// ───// ───
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
const generateBtnLoadingLayer = document.querySelector('.btn-gen-loading-layer');
const btnStarsEngine = generateBtnLoadingLayer ? createBtnStars(generateBtnLoadingLayer) : null;

let generateResetTimer = null;

function setGenerateBtnLoading() {
    if (generateResetTimer) {
        clearTimeout(generateResetTimer);
        generateResetTimer = null;
    }
    if (generateBtn) {
        generateBtn.classList.remove('is-success');
        generateBtn.classList.add('is-loading');
        btnStarsEngine?.start();
    }
}

function setGenerateBtnSuccess() {
    if (generateResetTimer) {
        clearTimeout(generateResetTimer);
        generateResetTimer = null;
    }
    if (generateBtn) {
        btnStarsEngine?.finish();
        generateBtn.classList.remove('is-loading');
        generateBtn.classList.add('is-success');

        generateResetTimer = setTimeout(() => {
            generateBtn.classList.remove('is-success');
            btnStarsEngine?.stop();
            generateResetTimer = null;
        }, 1400);
    }
}

function resetGenerateBtn() {
    if (generateResetTimer) {
        clearTimeout(generateResetTimer);
        generateResetTimer = null;
    }
    if (generateBtn) {
        btnStarsEngine?.stop();
        generateBtn.classList.remove('is-loading');
        generateBtn.classList.remove('is-success');
    }
}

// Must be declared before generateBtn handler
let _pendingCardData = null;

if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        if (isGenerating) return;

        const dcaInitActive   = document.getElementById('dca-init-toggle')?.checked;
        const dcaTargetActive = document.getElementById('dca-target-toggle')?.checked;

        let realInit, realTarget;
        let inv;
        const countVal = parseAmount(elNftCount?.value);
        const nftCount = countVal > 0 ? countVal : 0;
        if (_calcMode === 'nft') {
            // NFT: investment = buyPrice × numberOfNFTs (no manual input)
            inv = parseAmount(elInitMC?.value) * nftCount;
        } else {
            inv = parseAmount(elInv?.value);
        }

        if (dcaInitActive && dcaInitRows.length > 0) {
            realInit = _calcDCAAvg(dcaInitRows);
            if (_calcMode === 'nft') {
                inv = realInit * nftCount;
            }
        } else {
            realInit = (_calcMode === 'price' || _calcMode === 'nft') ? parseAmount(elInitMC?.value) : parseAmount(elInitMC?.value) * State.initMul;
        }

        if (dcaTargetActive && dcaTargetRows.length > 0) {
            realTarget = _calcDCAAvg(dcaTargetRows);
        } else {
            realTarget = (_calcMode === 'price' || _calcMode === 'nft') ? parseAmount(elTargetMC?.value) : parseAmount(elTargetMC?.value) * State.targetMul;
        }

        if (realInit <= 0 || inv <= 0 || realTarget <= 0) {
            if (_calcMode === 'nft') {
                _showToast('Please enter valid positive numbers for Buy Price, Sell Price, and Number of NFTs.', 'warning');
            } else if (_calcMode === 'price') {
                _showToast('Please enter valid positive numbers for Entry Price, Target Price, and Investment.', 'warning');
            } else {
                _showToast('Please enter valid positive numbers for Initial MC, Target MC, and Investment.', 'warning');
            }
            return;
        }

        const result = calculateROI(realInit, realTarget, inv);

        const data = {
            tokenName:  State.tokenName,
            userName:   '',
            initMC:     realInit,
            targetMC:   realTarget,
            inv,
            finalValue: result.finalValue,
            profit:     result.profit,
            roi:        result.roi,
            multiplier: result.multiplier,
            showBdt:    State.showBdt,
            bdtRate:    State.bdtRate,
            isPriceMode: _calcMode === 'price' || _calcMode === 'nft',
            isNftMode: _calcMode === 'nft',
            nftCount: _calcMode === 'nft' ? (parseAmount(elNftCount?.value) || 1) : null,
        };

        _pendingCardData = data;

        // Trigger loading animation immediately on click
        setGenerateBtnLoading();

        try {
            const success = await _doGenerate(data);

            if (success) {
                // Smoothly transition to Success Checkmark
                setGenerateBtnSuccess();
            } else {
                // Generation failed: do not show tick, reset to idle
                resetGenerateBtn();
            }
        } catch (err) {
            console.error('[Generate Button] Execution error:', err);
            resetGenerateBtn();
        }
    });
}

// (Emotion popup handlers removed — now using reaction popover in card header)

async function _doGenerate(data) {
    _currentBgSrc = null;
    _currentBgId = null;

    const placeholder = document.getElementById('card-empty-placeholder');
    if (placeholder) placeholder.style.display = 'none';

    if (window.innerWidth < 960) {
        document.getElementById('card-preview-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    _hideGallery();

    return await generateRender(data, false);
}

// // ── Change Background Button // ───// ───// ───// ───// ───// ───// ───// ───// ───// ───// ──
// // ── Change Background Button with Animated Lottie ────────────────────────
const changeBgBtn       = document.getElementById('btn-change-bg');
const changeBgContainer = document.getElementById('change-bg-lottie');
const changeBgText      = document.getElementById('change-bg-text');

let changeBgAnim = null;

function initChangeBgLottie() {
    const lottieLib = window.lottie || window.bodymovin;
    if (!lottieLib || !changeBgContainer) return;

    try {
        changeBgAnim = lottieLib.loadAnimation({
            container: changeBgContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: refreshIconData
        });
        changeBgAnim.goToAndStop(0, true);
    } catch (err) {
        console.error('[Change BG] Failed to initialize Lottie animation:', err);
    }
}

if (changeBgBtn) {
    changeBgBtn.addEventListener('click', async () => {
        // Requirement 2: Do NOT trigger on hover. Trigger only on click.
        // Every click plays once from the beginning alongside background changing.
        if (changeBgAnim) {
            changeBgAnim.goToAndPlay(0, true);
        }

        if (isGenerating) return;
        if (!window.lastData) return;

        // Check if more backgrounds are available
        if (!hasMoreBackgrounds(_currentBgId, getBackgroundContext(window.lastData))) {
            _showToast('No more backgrounds available. Upload your own or ask the admin to add more.', 'info', 4000);
            return;
        }

        document.getElementById('preview-img').classList.remove('loaded');

        if (changeBgText) changeBgText.textContent = 'Changing…';
        changeBgBtn.disabled = true;

        try {
            // Get next background — stay within same emotion
            const bg = getNextBackgroundByEmotion(_selectedEmotion, getBackgroundContext(window.lastData).outcome);
            if (bg) {
                _currentBgSrc = bg.dataUrl || bg.imageUrl || null;
                _currentBgId = bg.id;
            }
            await generateRender(window.lastData, false);
            // Update gallery active state if visible
            if (bgGalleryColumn && bgGalleryColumn.style.display !== 'none') _populateSidebar();
        } finally {
            if (changeBgText) changeBgText.textContent = 'Change Background';
            changeBgBtn.disabled = false;
        }
    });
}

initChangeBgLottie();

// // ── Populate Sidebar Grid // ───// ───// ───// ───// ───// ───// ───// ───// ───// ───// ───â”€

function _populateSidebar() {
    if (!bgSidebarGrid) return;
    const filtered = getEligibleBackgrounds(getBackgroundContext());

    bgSidebarGrid.innerHTML = '';
    if (filtered.length === 0) {
        bgSidebarGrid.innerHTML = '<div style="text-align:center;color:#64748b;font-size:11px;padding:20px 0;">No backgrounds</div>';
        return;
    }

    let activeThumb = null;

    filtered.forEach(bg => {
        const thumb = document.createElement('div');
        thumb.className = 'bg-thumb' + (bg.id === _currentBgId ? ' active' : '');
        if (bg.id === _currentBgId) activeThumb = thumb;

        thumb.innerHTML = `<img src="${bg.dataUrl || bg.imageUrl}" alt="bg" loading="lazy">`;

        thumb.addEventListener('click', async () => {
            if (isGenerating || !window.lastData) return;
            _currentBgSrc = bg.dataUrl || bg.imageUrl || null;
            _currentBgId = bg.id;

            // Update active state
            bgSidebarGrid.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');



            // Regenerate with this background
            document.getElementById('preview-img').classList.remove('loaded');
            await generateRender(window.lastData, false);
        });

        bgSidebarGrid.appendChild(thumb);
    });

    // Gallery opens at scroll position 0 (top) — no auto-scroll
    if (bgSidebarGrid) bgSidebarGrid.scrollTop = 0;
}

// // ── Upload Background Button // ───// ───// ───// ───// ───// ───// ───// ───// ───// ───// ──
// // ── Upload Background Button with Animated Lottie ────────────────────────
const uploadBgBtn       = document.getElementById('btn-upload-bg');
const uploadBgContainer = document.getElementById('upload-bg-lottie');
const bgUploadInput     = document.getElementById('bg-upload-input');

let uploadBgAnim = null;

function initUploadBgLottie() {
    const lottieLib = window.lottie || window.bodymovin;
    if (!lottieLib || !uploadBgContainer) return;

    try {
        uploadBgAnim = lottieLib.loadAnimation({
            container: uploadBgContainer,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            animationData: uploadCloudIconData
        });
        uploadBgAnim.goToAndStop(0, true);
    } catch (err) {
        console.error('[Upload BG] Failed to initialize Lottie animation:', err);
    }

    // Requirement 1: Play only when mouse cursor hovers. Stop on leave and return to static state.
    uploadBgBtn?.addEventListener('mouseenter', () => {
        if (uploadBgAnim) {
            uploadBgAnim.goToAndPlay(0, true);
        }
    });

    uploadBgBtn?.addEventListener('mouseleave', () => {
        if (uploadBgAnim) {
            uploadBgAnim.goToAndStop(0, true);
        }
    });
}

if (uploadBgBtn) {
    uploadBgBtn.addEventListener('click', () => bgUploadInput?.click());
}

initUploadBgLottie();

if (bgUploadInput) {
    bgUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files?.[0];
        if (!file || isGenerating) return;
        if (!window.lastData) return;

        document.getElementById('preview-img').classList.remove('loaded');

        const reader = new FileReader();
        reader.onload = async () => {
            _currentBgSrc = reader.result;
            _currentBgId = '__user_upload__';
            await generateRender(window.lastData, false);
        };
        reader.readAsDataURL(file);
        bgUploadInput.value = ''; // Reset for re-upload
    });
}

// // ── Copy Card Button with Animated Lottie Transition ───────────────────────
const copyBtn                 = document.getElementById('btn-copy');
const copyLottieContainer     = document.getElementById('copy-lottie-container');
const copyTickLottieContainer = document.getElementById('copy-tick-lottie-container');
const copyBtnText             = document.getElementById('copy-btn-text');

let copyAnim       = null;
let copyTickAnim   = null;
let copyBtnState   = 'idle'; // 'idle' | 'copying' | 'success'
let copyResetTimer = null;

function resetCopyBtnState() {
    if (copyResetTimer) {
        clearTimeout(copyResetTimer);
        copyResetTimer = null;
    }
    copyBtnState = 'idle';
    if (copyBtn) {
        copyBtn.classList.remove('is-success');
    }
    if (copyBtnText) {
        copyBtnText.textContent = 'Copy Card';
    }
    if (copyAnim) copyAnim.goToAndStop(0, true);
    if (copyTickAnim) copyTickAnim.goToAndStop(0, true);
}

function initCopyLottie() {
    const lottieLib = window.lottie || window.bodymovin;
    if (!lottieLib || !copyLottieContainer || !copyTickLottieContainer) return;

    try {
        copyAnim = lottieLib.loadAnimation({
            container: copyLottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            animationData: copyIconData
        });
        copyAnim.goToAndStop(0, true);

        copyTickAnim = lottieLib.loadAnimation({
            container: copyTickLottieContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: successTickIconData
        });
        copyTickAnim.goToAndStop(0, true);
    } catch (err) {
        console.error('[Copy] Failed to initialize Lottie animations:', err);
    }

    // Requirement 1: Animate ONLY when hovered. On leave, stop and return to static state.
    copyBtn?.addEventListener('mouseenter', () => {
        if (copyBtnState === 'idle' && copyAnim) {
            copyAnim.goToAndPlay(0, true);
        }
    });

    copyBtn?.addEventListener('mouseleave', () => {
        if (copyBtnState === 'idle' && copyAnim) {
            copyAnim.goToAndStop(0, true);
        }
    });
}

if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
        if (copyBtnState === 'copying') return;

        const imgEl = document.getElementById('preview-img');
        const imgSrc = imgEl?.src;

        // Requirement 5: If copying fails (no card generated yet), do not show Success/Tick animation.
        // Preserve original state and allow user to try again.
        if (!imgSrc || !imgEl.classList.contains('loaded') || imgEl.style.display === 'none') {
            _showToast('Please generate a trading card first.', 'warning', 3000);
            resetCopyBtnState();
            return;
        }

        if (copyResetTimer) {
            clearTimeout(copyResetTimer);
            copyResetTimer = null;
        }

        copyBtnState = 'copying';

        try {
            // Requirement 3: Execute existing copy functionality without changing its logic
            const response = await fetch(imgSrc);
            const blob = await response.blob();

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            // Requirements 4 & 6: Only after the copy operation is successfully completed,
            // smoothly transition from the Copy animation to the Success/Tick animation.
            copyBtnState = 'success';
            copyBtn.classList.add('is-success');
            if (copyBtnText) copyBtnText.textContent = 'Copied!';

            if (copyAnim) copyAnim.stop();
            if (copyTickAnim) copyTickAnim.goToAndPlay(0, true);

            // Smoothly revert back to idle Copy state after 2.5s
            copyResetTimer = setTimeout(() => {
                resetCopyBtnState();
            }, 2500);

        } catch (err) {
            // Requirement 5: If copying fails, do not show the Success/Tick animation.
            console.warn('[Copy] Clipboard API failed:', err);
            resetCopyBtnState();
            _showToast('Copy failed. Your browser may not support this feature.', 'warning', 3000);
        }
    });
}

initCopyLottie();

// // ── Generate Render (New Simple Card Design) // ───// ───// ───// ───// ───â”€
// // ── PNL Card Orb Noise Loader (Particle Wobble) ─────────────────────
const previewLoadingEl = document.getElementById('preview-loading');
let pnlOrbLoader = null;
if (previewLoadingEl) {
    pnlOrbLoader = createOrbNoise(previewLoadingEl, {
        dotColor: '#12e2fd',
        width: 84,
        height: 84,
        density: 300,
        dotSize: 150,
        speed: 50,
        spinTurns: 1
    });

    // Auto-sync with visibility in case anything toggles display
    const _orbObs = new MutationObserver(() => {
        if (previewLoadingEl.style.display !== 'none' && previewLoadingEl.style.display !== '') {
            pnlOrbLoader?.start();
        } else {
            pnlOrbLoader?.stop();
        }
    });
    _orbObs.observe(previewLoadingEl, { attributes: true, attributeFilter: ['style', 'class'] });
}

async function generateRender(data, _unused) {
    isGenerating = true;
    window.lastData = data;
    const node    = document.getElementById('card-node');
    const spinner = document.getElementById('preview-loading');
    const img     = document.getElementById('preview-img');

    try {
        if (!node || !spinner || !img) throw new Error('Card preview is unavailable.');
        const placeholder = document.getElementById('card-empty-placeholder');
        if (placeholder) placeholder.style.display = 'none';
        spinner.style.display = 'block';
        pnlOrbLoader?.start();
        img.classList.remove('loaded');
        // Let the browser paint the first loader frame before image composition/canvas work.
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // 1. Wait for assets AND html2canvas
        const [, h2cReady] = await Promise.all([
            cardAssetsReady,
            _waitForHtml2Canvas(8000),
        ]);
        if (!h2cReady) throw new Error('html2canvas not loaded');

        // 2. Get background image if not already set
        if (!_currentBgSrc) {
            const bg = getNextBackgroundByEmotion(_selectedEmotion, getBackgroundContext(data).outcome);
            if (bg) {
                _currentBgSrc = bg.dataUrl || bg.imageUrl || null;
                _currentBgId = bg.id;
            }
        }

        // 3. Compose the new simple card design
        const html = composeSimpleCard(data, _currentBgSrc, _tokenLogoDataUrl);

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
        return true;

    } catch (err) {
        console.error('[Card] Render failed:', err);
        const msg = err.message?.includes('html2canvas')
            ? 'Renderer not loaded. Please refresh the page.'
            : 'Card generation failed. Please try again.';
        _showToast(msg, 'error', 6000);
        return false;
    } finally {
        if (spinner) {
            spinner.style.display = 'none';
            pnlOrbLoader?.stop();
        }
        // This must run for every failure path; otherwise subsequent Generate
        // clicks are ignored because the app believes a render is still running.
        isGenerating = false;
    }
}

// // ── Download Button with Animated Lottie Transition ────────────────────────
const downloadBtn           = document.getElementById('btn-download');
const downloadSaveContainer = document.getElementById('download-save-lottie');
const downloadTickContainer = document.getElementById('download-tick-lottie');
const downloadBtnText       = document.getElementById('download-btn-text');

let downloadSaveAnim   = null;
let downloadTickAnim   = null;
let downloadBtnState   = 'idle'; // 'idle' | 'saving' | 'success'
let downloadResetTimer = null;

function resetDownloadBtnState() {
    if (downloadResetTimer) {
        clearTimeout(downloadResetTimer);
        downloadResetTimer = null;
    }
    downloadBtnState = 'idle';
    if (downloadBtn) {
        downloadBtn.classList.remove('is-success');
    }
    if (downloadBtnText) {
        downloadBtnText.textContent = 'Download';
    }
    if (downloadSaveAnim) downloadSaveAnim.goToAndStop(0, true);
    if (downloadTickAnim) downloadTickAnim.goToAndStop(0, true);
}

function initDownloadLottie() {
    const lottieLib = window.lottie || window.bodymovin;
    if (!lottieLib || !downloadSaveContainer || !downloadTickContainer) return;

    try {
        downloadSaveAnim = lottieLib.loadAnimation({
            container: downloadSaveContainer,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            animationData: saveDownloadIconData
        });
        downloadSaveAnim.goToAndStop(0, true);

        downloadTickAnim = lottieLib.loadAnimation({
            container: downloadTickContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: tickDownloadIconData
        });
        downloadTickAnim.goToAndStop(0, true);
    } catch (err) {
        console.error('[Download] Failed to initialize Lottie animations:', err);
    }

    // Requirement 1: Animate ONLY when hovered. On leave, stop and return to static state.
    downloadBtn?.addEventListener('mouseenter', () => {
        if (downloadBtnState === 'idle' && downloadSaveAnim) {
            downloadSaveAnim.goToAndPlay(0, true);
        }
    });

    downloadBtn?.addEventListener('mouseleave', () => {
        if (downloadBtnState === 'idle' && downloadSaveAnim) {
            downloadSaveAnim.goToAndStop(0, true);
        }
    });
}

if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        if (downloadBtnState === 'saving') return;

        const imgEl = document.getElementById('preview-img');
        const imgSrc = imgEl?.src;

        // Requirement 5: If saving fails (no card generated yet), do not show success animation.
        // Preserve original save state and allow user to try again.
        if (!imgSrc || !imgEl.classList.contains('loaded') || imgEl.style.display === 'none') {
            _showToast('Please generate a trading card first.', 'warning', 3000);
            resetDownloadBtnState();
            return;
        }

        if (downloadResetTimer) {
            clearTimeout(downloadResetTimer);
            downloadResetTimer = null;
        }

        try {
            downloadBtnState = 'saving';

            // Requirement 2: Trigger actual save/download operation first
            const link = document.createElement('a');
            link.download = `mccalc-${State.tokenName || 'card'}-${Date.now()}.png`;
            link.href = imgSrc;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Requirements 2, 3, 4: Once operation is successfully completed,
            // smoothly transition from Save animation to Success/Tick animation
            downloadBtnState = 'success';
            downloadBtn.classList.add('is-success');
            if (downloadBtnText) downloadBtnText.textContent = 'Downloaded!';

            if (downloadSaveAnim) downloadSaveAnim.stop();
            if (downloadTickAnim) downloadTickAnim.goToAndPlay(0, true);

            // Requirement 4: Display Tick icon as success state. Do not replay Save animation while in success state.
            // After 3 seconds, smoothly return to idle state so user can download again anytime.
            downloadResetTimer = setTimeout(() => {
                resetDownloadBtnState();
            }, 3000);

        } catch (err) {
            // Requirement 5: If saving fails, do not show Success animation. Preserve original Save state and allow retry.
            console.error('[Download] Failed to download card:', err);
            resetDownloadBtnState();
            _showToast('Download failed. Please try again.', 'error', 3000);
        }
    });
}

initDownloadLottie();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  Initial calculation
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
calculate();



// Apply initial calculation mode
setTimeout(() => setCalcMode(_calcMode), 0);


// ═══════════════════════════════════════════════════════════
//  CUSTOM LOGO PANEL — Toggle + URL Input + Upload wiring
// ═══════════════════════════════════════════════════════════

// Toggle the expandable panel when 'Add custom logo' is clicked
const _customLogoTrigger = document.querySelector('.custom-logo-trigger');
const _customLogoPanel   = document.getElementById('custom-logo-panel');

if (_customLogoTrigger && _customLogoPanel) {
    _customLogoTrigger.addEventListener('click', () => {
        const isOpen = _customLogoPanel.style.display === 'flex';
        _customLogoPanel.style.display = isOpen ? 'none' : 'flex';
        const chevron = _customLogoTrigger.querySelector('img');
        if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
        if (!isOpen) setTimeout(() => document.getElementById('custom-logo-url')?.focus(), 50);
    });
}

// Refresh the selected-logo preview row inside the panel
function _refreshLogoPanel() {
    const row     = document.getElementById('custom-logo-selected-row');
    const thumb   = document.getElementById('token-logo-preview');
    const nameLbl = document.getElementById('custom-logo-selected-name');
    if (!row) return;
    if (_tokenLogoDataUrl) {
        row.classList.add('visible');
        if (thumb) { thumb.src = _tokenLogoDataUrl; thumb.style.display = 'block'; }
        if (nameLbl) nameLbl.textContent = _tokenLogoSource === 'catalog' ? 'Catalog logo' : 'Custom logo';
    } else {
        row.classList.remove('visible');
        if (thumb) { thumb.src = ''; thumb.style.display = 'none'; }
    }
}

// Also refresh panel when logo is removed
if (tokenLogoRemove) {
    tokenLogoRemove.addEventListener('click', () => {
        const urlInput = document.getElementById('custom-logo-url');
        if (urlInput) urlInput.value = '';
        setTimeout(_refreshLogoPanel, 50);
    });
}

// URL input: apply logo when user pastes URL and presses Enter or pauses typing
const _customLogoUrlInput = document.getElementById('custom-logo-url');
if (_customLogoUrlInput) {
    let _logoUrlTimer;
    const _applyLogoUrl = async (url) => {
        url = (url || '').trim();
        if (!url || (!url.startsWith('http') && !url.startsWith('data:'))) return;
        try {
            const dataUrl = await _fetchAsBlob(url);
            if (dataUrl) {
                setTokenLogo(dataUrl, 'upload');
                setTimeout(_refreshLogoPanel, 50);
            } else {
                _showToast('Could not load logo — the server may block external access. Try downloading and uploading the image instead.', 'warning', 4000);
            }
        } catch (_e) {
            _showToast('Could not load logo from that URL.', 'warning', 3000);
        }
    };
    _customLogoUrlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { clearTimeout(_logoUrlTimer); _applyLogoUrl(_customLogoUrlInput.value); }
    });
    _customLogoUrlInput.addEventListener('input', () => {
        clearTimeout(_logoUrlTimer);
        _logoUrlTimer = setTimeout(() => _applyLogoUrl(_customLogoUrlInput.value), 1200);
    });
    // TASK1: If clipboard has an image, import it instead of text
    _customLogoUrlInput.addEventListener('paste', async (e) => {
        const items = Array.from(e.clipboardData?.items || []);
        const hadImage = await _handleClipboardImage(items);
        if (hadImage) e.preventDefault();
        // else: default paste (URL text) remains intact
    });
}

// Refresh panel UI after file upload
if (tokenLogoUpload) {
    tokenLogoUpload.addEventListener('change', () => setTimeout(_refreshLogoPanel, 150));
}
