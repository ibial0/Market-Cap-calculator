// ═══════════════════════════════════════════════════════════
//  ADMIN DASHBOARD
//  Management for Token Catalog & Card Backgrounds.
// ═══════════════════════════════════════════════════════════
import { auth, db } from '../config/firebase.js';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
    collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, addDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { compressImageFile } from '../utils/image.js';
import { EMOTIONS, getEmotionById } from '../cards/emotions.js';
import { emojiHappyData } from '../assets/lottie/emoji-happy.js';
import { emojiShockData } from '../assets/lottie/emoji-shock.js';
import { emojiGreedData } from '../assets/lottie/emoji-greed.js';
import { emojiCryData } from '../assets/lottie/emoji-cry.js';
import { emojiAngryData } from '../assets/lottie/emoji-angry.js';
import { emojiWorriedData } from '../assets/lottie/emoji-worried.js';
import { emojiRelievedData } from '../assets/lottie/emoji-relieved.js';
import { saveIconData } from '../assets/lottie/save-icon.js';
import { successTickIconData } from '../assets/lottie/success-tick-icon.js';

// ── DOM References: Auth ───────────────────────────────────
const authView   = document.getElementById('auth-view');
const dashView   = document.getElementById('dashboard-view');
const emailInput = document.getElementById('admin-email');
const passInput  = document.getElementById('admin-pass');
const loginBtn   = document.getElementById('login-btn');
const logoutBtn  = document.getElementById('logout-btn');
const authError  = document.getElementById('auth-error');

// ── DOM References: Navigation ─────────────────────────────
const navTokens  = document.getElementById('nav-tokens');
const navBg      = document.getElementById('nav-bg');
const secTokens  = document.getElementById('section-tokens');
const secBg      = document.getElementById('bg-section');

// ── DOM References: Token Catalog ──────────────────────────
const tokenNameInput    = document.getElementById('catalog-token-name');
const tokenLogoInput    = document.getElementById('catalog-token-logo');
const tokenLogoLabel    = document.getElementById('catalog-token-logo-label');
const tokenUrlInput     = document.getElementById('catalog-token-url');
const tokenUrlBtn       = document.getElementById('catalog-token-url-btn');
const pasteZone         = document.getElementById('catalog-paste-zone');
const pasteStatus       = document.getElementById('catalog-paste-status');
const previewBox        = document.getElementById('catalog-preview-box');
const previewImg        = document.getElementById('catalog-token-preview-img');
const previewEmpty      = document.getElementById('catalog-token-preview-empty');
const clearLogoBtn      = document.getElementById('catalog-token-clear-btn');
const saveTokenBtn      = document.getElementById('save-token-btn');
const saveLottieContainer = document.getElementById('save-lottie-container');
const tickLottieContainer = document.getElementById('tick-lottie-container');
const saveTokenBtnText    = document.getElementById('save-token-btn-text');

// ── Save Button Lottie Controller ──────────────────────────
let saveLottieAnim = null;
let tickLottieAnim = null;
let saveBtnState = 'idle'; // 'idle' | 'saving' | 'success'
let successResetTimer = null;

function updateSaveBtnText(text) {
    if (saveTokenBtnText) {
        saveTokenBtnText.textContent = text;
    } else if (saveTokenBtn) {
        saveTokenBtn.textContent = text;
    }
}

function resetSaveButtonState() {
    if (successResetTimer) {
        clearTimeout(successResetTimer);
        successResetTimer = null;
    }
    saveBtnState = 'idle';
    if (saveTokenBtn) {
        saveTokenBtn.disabled = false;
        saveTokenBtn.classList.remove('is-success');
    }
    updateSaveBtnText(editingToken ? 'Update Token' : 'Save Token');
    if (saveLottieAnim) saveLottieAnim.goToAndStop(0, true);
    if (tickLottieAnim) tickLottieAnim.goToAndStop(0, true);
}

function initSaveButtonLottie() {
    const lottieLib = window.lottie || window.bodymovin;
    if (!lottieLib || !saveLottieContainer || !tickLottieContainer) return;

    try {
        saveLottieAnim = lottieLib.loadAnimation({
            container: saveLottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            animationData: saveIconData
        });
        saveLottieAnim.goToAndStop(0, true);

        tickLottieAnim = lottieLib.loadAnimation({
            container: tickLottieContainer,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            animationData: successTickIconData
        });
        tickLottieAnim.goToAndStop(0, true);
    } catch (err) {
        console.error('[Admin] Failed to initialize Lottie animations:', err);
    }

    // Requirement 1: Animate ONLY when hovered. On leave, stop and return to normal static state.
    saveTokenBtn?.addEventListener('mouseenter', () => {
        if (saveBtnState === 'idle' && saveLottieAnim) {
            saveLottieAnim.goToAndPlay(0, true);
        }
    });

    saveTokenBtn?.addEventListener('mouseleave', () => {
        if (saveBtnState === 'idle' && saveLottieAnim) {
            saveLottieAnim.goToAndStop(0, true);
        }
    });
}
const cancelEditBtn     = document.getElementById('cancel-token-edit-btn');
const tokenCountBadge   = document.getElementById('catalog-token-count');
const tokenSearchInput  = document.getElementById('catalog-search-input');
const tokenCatalogGrid  = document.getElementById('token-catalog-grid');
const tokenFormPanel    = document.getElementById('catalog-form-panel');

// ── Token Catalog State ────────────────────────────────────
let catalogTokens = [];
let editingToken = null;
let currentLogoDataUrl = null;

// ── DOM References: Card Backgrounds ───────────────────────
const bgUploadBtn   = document.getElementById('admin-bg-upload-btn');
const bgFileInput   = document.getElementById('admin-bg-file');
const bgFileLabel   = document.getElementById('bg-file-label');
const bgFileName    = document.getElementById('bg-file-name');
const adminEmPicker = document.getElementById('admin-emotion-picker');
const adminPnlPicker = document.getElementById('admin-pnl-type-picker');
const adminEmFilter = document.getElementById('admin-emotion-filter');
const adminBgGrid   = document.getElementById('admin-bg-gallery');

let _adminSelectedEmotion = null;
let _adminSelectedPnlType = null;
let _adminFilterEmotion = 'all';

const ADMIN_EMOTION_ANIMATIONS = {
    happy: emojiHappyData, shock: emojiShockData, greed: emojiGreedData,
    cry: emojiCryData, angry: emojiAngryData, worried: emojiWorriedData,
    relieved: emojiRelievedData,
};

function mountAdminEmotionIcon(container, emotionId) {
    const animationData = ADMIN_EMOTION_ANIMATIONS[emotionId];
    if (!container || !animationData || !(window.lottie || window.bodymovin)) return;
    const icon = document.createElement('span');
    icon.style.cssText = 'display:inline-flex;width:18px;height:18px;flex:none;pointer-events:none;';
    container.prepend(icon);
    try {
        (window.lottie || window.bodymovin).loadAnimation({
            container: icon, renderer: 'svg', loop: true, autoplay: true, animationData
        });
    } catch (error) {
        console.warn('[Admin] Emotion animation failed to load:', emotionId, error);
        icon.remove();
    }
}


// ═══════════════════════════════════════════════════════════
//  AUTHENTICATION
// ═══════════════════════════════════════════════════════════
onAuthStateChanged(auth, async (user) => {
    if (user) {
        authView?.classList.add('hidden');
        dashView?.classList.remove('hidden');
        // Initial load on login: load Token Catalog by default
        await loadTokenCatalogSection();
    } else {
        dashView?.classList.add('hidden');
        authView?.classList.remove('hidden');
        if (emailInput) emailInput.value = '';
        if (passInput)  passInput.value  = '';
        if (authError) {
            authError.textContent = '';
            authError.classList.add('hidden');
        }
    }
});

async function handleLogin() {
    const email = (emailInput?.value || '').trim();
    const pass  = (passInput?.value || '').trim();
    if (!email || !pass) {
        showAuthError('Please enter both email and password.');
        return;
    }
    loginBtn.disabled = true;
    loginBtn.textContent = 'Authenticating…';
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        console.error('[Admin] Login error:', err);
        showAuthError(err.message.replace('Firebase: ', ''));
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Access Dashboard';
    }
}

function showAuthError(msg) {
    if (!authError) return;
    authError.textContent = msg;
    authError.classList.remove('hidden');
}

loginBtn?.addEventListener('click', handleLogin);
passInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
logoutBtn?.addEventListener('click', () => signOut(auth));


// ═══════════════════════════════════════════════════════════
//  SECTION NAVIGATION
// ═══════════════════════════════════════════════════════════
if (navTokens) {
    navTokens.addEventListener('click', async () => {
        navTokens.classList.add('active');
        navBg?.classList.remove('active');
        if (secTokens) secTokens.style.display = '';
        if (secBg) secBg.style.display = 'none';
        await loadTokenCatalogSection();
    });
}

if (navBg) {
    navBg.addEventListener('click', async () => {
        navBg.classList.add('active');
        navTokens?.classList.remove('active');
        if (secTokens) secTokens.style.display = 'none';
        if (secBg) secBg.style.display = '';
        await loadBgSection();
    });
}


// ═══════════════════════════════════════════════════════════
//  TOKEN CATALOGUE
//  Supports File Upload, Multi-format Image URLs, and Ctrl+V Paste
// ═══════════════════════════════════════════════════════════

// Set logo helper
function setTokenLogo(dataUrl, infoText = 'Logo ready') {
    currentLogoDataUrl = dataUrl;
    if (previewImg) {
        previewImg.src = dataUrl;
        previewImg.classList.remove('hidden');
    }
    if (previewEmpty) previewEmpty.classList.add('hidden');
    if (previewBox) previewBox.classList.add('has-logo');
    if (clearLogoBtn) clearLogoBtn.classList.remove('hidden');
    if (tokenLogoLabel) tokenLogoLabel.textContent = 'Change image';
    if (pasteStatus) {
        pasteStatus.innerHTML = `<span style="color:#10b981;font-weight:600;">✓ ${escapeHtml(infoText)}</span> (or paste another)`;
    }
}

// Clear logo helper
function clearTokenLogo() {
    currentLogoDataUrl = null;
    if (previewImg) {
        previewImg.src = '';
        previewImg.classList.add('hidden');
    }
    if (previewEmpty) previewEmpty.classList.remove('hidden');
    if (previewBox) previewBox.classList.remove('has-logo');
    if (clearLogoBtn) clearLogoBtn.classList.add('hidden');
    if (tokenLogoInput) tokenLogoInput.value = '';
    if (tokenUrlInput) tokenUrlInput.value = '';
    if (tokenLogoLabel) tokenLogoLabel.textContent = 'Upload Image';
    if (pasteStatus) {
        pasteStatus.innerHTML = 'Tip: Copy an image from anywhere and press <kbd style="background:#1e293b;padding:2px 6px;border-radius:4px;border:1px solid #475569;font-size:11px;">Ctrl+V</kbd> to paste logo directly!';
    }
}

clearLogoBtn?.addEventListener('click', clearTokenLogo);

// 1. File Upload listener
if (tokenLogoInput) {
    tokenLogoInput.addEventListener('change', async () => {
        const file = tokenLogoInput.files?.[0];
        if (!file) return;
        try {
            setTokenLogoStatus('Processing file…');
            const dataUrl = await compressImageFile(file, { maxSize: 256 });
            setTokenLogo(dataUrl, file.name);
        } catch (err) {
            alert('Could not process this image file: ' + err.message);
            clearTokenLogo();
        }
    });
}

// 2. URL Loader with Multi-Tier Fallback (CORS proxy, wsrv.nl, allorigins)
async function loadLogoFromUrl(rawUrl) {
    const url = (rawUrl || '').trim();
    if (!url) {
        alert('Please enter an image URL.');
        tokenUrlInput?.focus();
        return;
    }

    // Direct data URL
    if (url.startsWith('data:image/')) {
        setTokenLogo(url, 'Data URL');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }

    const origBtnText = tokenUrlBtn ? tokenUrlBtn.textContent : '';
    if (tokenUrlBtn) {
        tokenUrlBtn.disabled = true;
        tokenUrlBtn.textContent = 'Loading…';
    }
    setTokenLogoStatus('Fetching image from URL…');

    try {
        // Method A: Direct Image Canvas (standard browser CORS)
        try {
            const dataUrl = await _imgToDataUrl(url, true);
            if (dataUrl) {
                setTokenLogo(dataUrl, 'Loaded from URL');
                return;
            }
        } catch {}

        // Method B: Direct fetch blob
        try {
            const resp = await fetch(url, { mode: 'cors' });
            if (resp.ok) {
                const blob = await resp.blob();
                if (blob.type.startsWith('image/')) {
                    const dataUrl = await compressImageFile(blob, { maxSize: 256 });
                    setTokenLogo(dataUrl, 'Loaded from URL');
                    return;
                }
            }
        } catch {}

        // Method C: wsrv.nl free image proxy (supports SVG, WebP, PNG, JPG, AVIF from any server)
        try {
            const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=png&w=256&h=256&fit=contain`;
            const resp = await fetch(proxyUrl);
            if (resp.ok) {
                const blob = await resp.blob();
                const dataUrl = await compressImageFile(blob, { maxSize: 256 });
                setTokenLogo(dataUrl, 'Loaded from URL');
                return;
            }
        } catch {}

        // Method D: allorigins raw proxy fallback
        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            const resp = await fetch(proxyUrl);
            if (resp.ok) {
                const blob = await resp.blob();
                const dataUrl = await compressImageFile(blob, { maxSize: 256 });
                setTokenLogo(dataUrl, 'Loaded from URL');
                return;
            }
        } catch {}

        throw new Error('Image could not be loaded from this URL. The host may block external requests. Try saving the image and using "Upload Image".');
    } catch (err) {
        console.warn('[Admin] URL load failed:', err);
        alert(err.message);
        clearTokenLogo();
    } finally {
        if (tokenUrlBtn) {
            tokenUrlBtn.disabled = false;
            tokenUrlBtn.textContent = origBtnText || 'Load URL';
        }
    }
}

tokenUrlBtn?.addEventListener('click', () => loadLogoFromUrl(tokenUrlInput?.value));
tokenUrlInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        loadLogoFromUrl(tokenUrlInput.value);
    }
});

function setTokenLogoStatus(msg) {
    if (pasteStatus) {
        pasteStatus.innerHTML = `<span style="color:#38bdf8;">⏳ ${escapeHtml(msg)}</span>`;
    }
}

function _imgToDataUrl(url, useCors) {
    return new Promise((resolve) => {
        const img = new Image();
        if (useCors) img.crossOrigin = 'anonymous';
        const timer = setTimeout(() => resolve(null), 8000);
        img.onload = () => {
            clearTimeout(timer);
            try {
                const canvas = document.createElement('canvas');
                const longest = Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height);
                const scale = Math.min(1, 256 / Math.max(1, longest));
                canvas.width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
                canvas.height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/png'));
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => {
            clearTimeout(timer);
            resolve(null);
        };
        img.src = url;
    });
}

// 3. Clipboard Image Paste (Ctrl+V) Support
async function handleClipboardPaste(e) {
    // Only handle if in token catalog section
    if (secTokens && secTokens.style.display === 'none') return;

    const items = Array.from(e.clipboardData?.items || []);
    for (const item of items) {
        if (item.type && item.type.startsWith('image/')) {
            e.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            try {
                setTokenLogoStatus('Processing pasted image…');
                const dataUrl = await compressImageFile(file, { maxSize: 256 });
                setTokenLogo(dataUrl, 'Pasted from clipboard');
            } catch (err) {
                alert('Could not use that pasted image: ' + err.message);
                clearTokenLogo();
            }
            return;
        }
    }

    // If focused on URL input and text is pasted, check if it's an image link
    if (document.activeElement === tokenUrlInput) {
        setTimeout(() => {
            const val = (tokenUrlInput.value || '').trim();
            if (val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:image/')) {
                loadLogoFromUrl(val);
            }
        }, 50);
    }
}

window.addEventListener('paste', handleClipboardPaste);

// Drag and drop onto paste zone or preview box
[pasteZone, previewBox].forEach(dropArea => {
    if (!dropArea) return;
    ['dragenter', 'dragover'].forEach(ev => {
        dropArea.addEventListener(ev, (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '#12e2fd';
        });
    });
    ['dragleave', 'drop'].forEach(ev => {
        dropArea.addEventListener(ev, (e) => {
            e.preventDefault();
            dropArea.style.borderColor = '';
        });
    });
    dropArea.addEventListener('drop', async (e) => {
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            try {
                setTokenLogoStatus('Processing dropped image…');
                const dataUrl = await compressImageFile(file, { maxSize: 256 });
                setTokenLogo(dataUrl, file.name);
            } catch (err) {
                alert('Could not use dropped image: ' + err.message);
                clearTokenLogo();
            }
        }
    });
});

tokenNameInput?.addEventListener('input', () => {
    tokenNameInput.value = tokenNameInput.value.toUpperCase();
    if (saveBtnState === 'success') {
        resetSaveButtonState();
    }
});

// Reset Form
function resetTokenForm() {
    editingToken = null;
    if (tokenNameInput) tokenNameInput.value = '';
    clearTokenLogo();
    resetSaveButtonState();
    cancelEditBtn?.classList.add('hidden');
}

cancelEditBtn?.addEventListener('click', resetTokenForm);

// Save / Update Token
saveTokenBtn?.addEventListener('click', async () => {
    if (saveBtnState === 'saving') return;

    const name = (tokenNameInput?.value || '').trim().toUpperCase();
    if (!name) {
        alert('Please enter a token name.');
        tokenNameInput?.focus();
        return;
    }
    if (!currentLogoDataUrl) {
        alert('Please upload, paste a URL, or copy-paste an image for the token logo.');
        return;
    }

    if (successResetTimer) {
        clearTimeout(successResetTimer);
        successResetTimer = null;
    }

    const wasEditing = !!editingToken;
    saveBtnState = 'saving';
    saveTokenBtn.disabled = true;
    saveTokenBtn.classList.remove('is-success');
    updateSaveBtnText(wasEditing ? 'Updating…' : 'Saving…');

    // Keep save animation playing smoothly during save operation
    if (saveLottieAnim) {
        saveLottieAnim.goToAndPlay(0, true);
    }

    try {
        const tokenData = {
            name,
            logoDataUrl: currentLogoDataUrl,
            isActive: true,
            updatedAt: serverTimestamp()
        };

        if (editingToken) {
            await setDoc(doc(db, 'token_catalog', editingToken.id), tokenData, { merge: true });
        } else {
            tokenData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'token_catalog'), tokenData);
        }

        // Requirements 2, 3, 4:
        // Save operation successfully completed!
        // Smoothly transition from Save animation to Success/Tick Lottie animation.
        saveBtnState = 'success';
        saveTokenBtn.classList.add('is-success');
        updateSaveBtnText(wasEditing ? 'Updated!' : 'Saved!');

        if (saveLottieAnim) saveLottieAnim.stop();
        if (tickLottieAnim) tickLottieAnim.goToAndPlay(0, true);

        // Reset form fields
        editingToken = null;
        if (tokenNameInput) tokenNameInput.value = '';
        clearTokenLogo();
        cancelEditBtn?.classList.add('hidden');

        await loadTokenCatalogSection();

        // Requirement 4: Display Tick icon as success state. Do not replay Save animation while in success state.
        // Return to idle state after 3 seconds so next token can be saved
        successResetTimer = setTimeout(() => {
            resetSaveButtonState();
        }, 3000);

    } catch (err) {
        // Requirement 5: If saving fails, do not show Success animation. Preserve original Save state and allow retry.
        console.error('[Admin] Token save failed:', err);
        saveBtnState = 'idle';
        saveTokenBtn.disabled = false;
        saveTokenBtn.classList.remove('is-success');
        updateSaveBtnText(wasEditing ? 'Update Token' : 'Save Token');
        if (saveLottieAnim) saveLottieAnim.goToAndStop(0, true);
        if (tickLottieAnim) tickLottieAnim.goToAndStop(0, true);
        alert('Could not save token: ' + err.message);
    }
});

// Load saved tokens from Firestore
async function loadTokenCatalogSection() {
    if (!tokenCatalogGrid) return;
    tokenCatalogGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">Loading saved tokens…</div>';
    try {
        const snapshot = await getDocs(collection(db, 'token_catalog'));
        catalogTokens = [];
        snapshot.forEach(record => {
            const data = record.data();
            const logo = data.logoDataUrl || data.logoUrl || data.imageUrl || data.logo || null;
            catalogTokens.push({
                id: record.id,
                ...data,
                name: String(data.name || '').toUpperCase().trim(),
                logoDataUrl: logo
            });
        });
        catalogTokens.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        if (tokenCountBadge) tokenCountBadge.textContent = String(catalogTokens.length);
        renderTokenCatalog(catalogTokens);
    } catch (err) {
        console.error('[Admin] Token catalog load error:', err);
        tokenCatalogGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:#f87171;">
            <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Could not load tokens</div>
            <div style="font-size:13px;">${escapeHtml(err.message)}</div>
        </div>`;
    }
}

// Render token cards grid
function renderTokenCatalog(tokens) {
    if (!tokenCatalogGrid) return;
    if (!tokens.length) {
        tokenCatalogGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:50px 20px;color:#94a3b8;background:#131b2f;border-radius:14px;border:1px dashed #334155;">
            <div style="font-size:17px;font-weight:700;color:#f1f5f9;margin-bottom:6px;">No tokens found</div>
            <div style="font-size:13px;">Add a token name and logo above to save it into the catalog.</div>
        </div>`;
        return;
    }

    tokenCatalogGrid.replaceChildren();
    tokens.forEach(token => {
        const card = document.createElement('article');
        card.className = 'catalog-token-card';

        const logoImg = document.createElement('img');
        logoImg.className = 'catalog-token-logo';
        logoImg.src = token.logoDataUrl || './assets/figma/badge-dollar-sign.svg';
        logoImg.alt = token.name;
        logoImg.onerror = function() {
            this.src = './assets/figma/badge-dollar-sign.svg';
        };

        const details = document.createElement('div');
        details.className = 'catalog-token-details';
        const nameStrong = document.createElement('strong');
        nameStrong.textContent = token.name || 'UNTITLED';
        details.appendChild(nameStrong);

        const actions = document.createElement('div');
        actions.className = 'catalog-token-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'btn-secondary';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
            editingToken = token;
            if (tokenNameInput) {
                tokenNameInput.value = token.name || '';
                tokenNameInput.focus();
            }
            if (token.logoDataUrl) {
                setTokenLogo(token.logoDataUrl, 'Current logo kept');
            } else {
                clearTokenLogo();
            }
            resetSaveButtonState();
            updateSaveBtnText('Update Token');
            cancelEditBtn?.classList.remove('hidden');
            tokenFormPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn-danger-small';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', async () => {
            if (!confirm(`Delete token "${token.name}" from suggestions?`)) return;
            deleteBtn.disabled = true;
            deleteBtn.textContent = '…';
            try {
                await deleteDoc(doc(db, 'token_catalog', token.id));
                if (editingToken?.id === token.id) resetTokenForm();
                await loadTokenCatalogSection();
            } catch (err) {
                alert('Could not delete token: ' + err.message);
                deleteBtn.disabled = false;
                deleteBtn.textContent = 'Delete';
            }
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        card.appendChild(logoImg);
        card.appendChild(details);
        card.appendChild(actions);

        tokenCatalogGrid.appendChild(card);
    });
}

// Search filter
tokenSearchInput?.addEventListener('input', () => {
    const q = (tokenSearchInput.value || '').trim().toUpperCase();
    if (!q) {
        renderTokenCatalog(catalogTokens);
        return;
    }
    const filtered = catalogTokens.filter(t => (t.name || '').includes(q));
    renderTokenCatalog(filtered);
});


// ═══════════════════════════════════════════════════════════
//  CARD BACKGROUNDS SECTION
//  Upload, filter, and manage background images.
// ═══════════════════════════════════════════════════════════

// Custom file picker: click label → open file dialog
if (bgFileLabel && bgFileInput) {
    bgFileLabel.addEventListener('click', () => bgFileInput.click());
    bgFileInput.addEventListener('change', () => {
        const file = bgFileInput.files[0];
        if (bgFileName) {
            bgFileName.textContent = file ? file.name : 'Select image...';
            bgFileLabel.style.borderColor = file ? '#38bdf8' : '#475569';
            bgFileLabel.style.color = file ? '#e2e8f0' : '#94a3b8';
        }
    });
}

// ── Admin Emotion Picker (for upload tagging) ──
if (adminEmPicker) {
    adminEmPicker.innerHTML = '';
    const universal = document.createElement('div');
    universal.dataset.id = '';
    universal.textContent = '❌ Universal';
    universal.style.cssText = `padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid #38bdf8;background:rgba(56,189,248,0.12);color:#e2e8f0;display:flex;align-items:center;transition:all 0.2s ease;user-select:none;`;
    adminEmPicker.appendChild(universal);
    EMOTIONS.forEach(em => {
        const pill = document.createElement('div');
        pill.style.cssText = `
            padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;
            cursor:pointer;border:1.5px solid #334155;background:#0f172a;color:#94a3b8;
            display:flex;align-items:center;gap:5px;transition:all 0.2s ease;user-select:none;
        `;
        pill.textContent = em.label;
        pill.dataset.id = em.id;
        mountAdminEmotionIcon(pill, em.id);

        pill.addEventListener('click', () => {
            adminEmPicker.querySelectorAll('[data-id]').forEach(p => { p.style.borderColor = '#334155'; p.style.background = '#0f172a'; p.style.color = '#94a3b8'; });
            _adminSelectedEmotion = em.id;
            pill.style.borderColor = '#38bdf8'; pill.style.background = 'rgba(56,189,248,0.12)'; pill.style.color = '#e2e8f0';
        });
        adminEmPicker.appendChild(pill);
    });
    universal.addEventListener('click', () => {
        _adminSelectedEmotion = null;
        adminEmPicker.querySelectorAll('[data-id]').forEach(p => { p.style.borderColor = '#334155'; p.style.background = '#0f172a'; p.style.color = '#94a3b8'; });
        universal.style.borderColor = '#38bdf8'; universal.style.background = 'rgba(56,189,248,0.12)'; universal.style.color = '#e2e8f0';
    });
}

if (adminPnlPicker) {
    ['profit', 'loss'].forEach(type => {
        const pill = document.createElement('button');
        pill.type = 'button'; pill.dataset.type = type; pill.textContent = type[0].toUpperCase() + type.slice(1);
        pill.style.cssText = 'padding:6px 12px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid #334155;background:#0f172a;color:#94a3b8;transition:all .2s ease;';
        pill.addEventListener('click', () => { _adminSelectedPnlType = type; adminPnlPicker.querySelectorAll('[data-type]').forEach(p => { p.style.borderColor = '#334155'; p.style.background = '#0f172a'; p.style.color = '#94a3b8'; }); pill.style.borderColor = '#38bdf8'; pill.style.background = 'rgba(56,189,248,.12)'; pill.style.color = '#e2e8f0'; });
        adminPnlPicker.appendChild(pill);
    });
}

// ── Admin Gallery Filter ──
if (adminEmFilter) {
    // Keep "All" pill, add emotion filter pills
    adminEmFilter.querySelectorAll('.adm-em-filter:not([data-filter="all"])').forEach(p => p.remove());
    EMOTIONS.forEach(em => {
        const pill = document.createElement('div');
        pill.className = 'adm-em-filter';
        pill.dataset.filter = em.id;
        pill.style.cssText = `
            padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;
            cursor:pointer;border:1px solid #475569;background:#1e293b;color:#94a3b8;
            transition:all 0.2s ease;
        `;
        pill.textContent = em.label;
        mountAdminEmotionIcon(pill, em.id);
        adminEmFilter.appendChild(pill);
    });

    adminEmFilter.addEventListener('click', async (e) => {
        const target = e.target.closest('[data-filter]');
        if (!target) return;
        _adminFilterEmotion = target.dataset.filter;
        adminEmFilter.querySelectorAll('[data-filter]').forEach(p => {
            p.classList.remove('active');
            p.style.borderColor = '#475569';
            p.style.background = '#1e293b';
            p.style.color = '#94a3b8';
        });
        target.classList.add('active');
        target.style.borderColor = '#38bdf8';
        target.style.background = 'rgba(56,189,248,0.12)';
        target.style.color = '#e2e8f0';
        await loadBgSection();
    });
}

// Background Upload handler
if (bgUploadBtn && bgFileInput) {
    bgUploadBtn.addEventListener('click', async () => {
        const file = bgFileInput.files[0];
        if (!file) {
            alert('Please select an image file first.');
            return;
        }
        if (!_adminSelectedPnlType) {
            alert('Please select Profit or Loss first.');
            return;
        }

        bgUploadBtn.disabled = true;
        bgUploadBtn.textContent = 'Uploading…';

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise(resolve => reader.onload = resolve);
            const rawDataUrl = reader.result;

            const compressedDataUrl = await _compressBgImage(rawDataUrl, 1600, 900, 0.75);

            await addDoc(collection(db, 'card_backgrounds'), {
                imageUrl: compressedDataUrl,
                emotion: _adminSelectedEmotion,
                pnlType: _adminSelectedPnlType,
                isActive: true,
                createdAt: serverTimestamp(),
            });

            bgFileInput.value = '';
            if (bgFileName) {
                bgFileName.textContent = 'Select image...';
                bgFileLabel.style.borderColor = '#475569';
                bgFileLabel.style.color = '#94a3b8';
            }
            _adminSelectedEmotion = null;
            _adminSelectedPnlType = null;
            if (adminEmPicker) {
                adminEmPicker.querySelectorAll('[data-id]').forEach(p => {
                    p.style.borderColor = '#334155';
                    p.style.background = '#0f172a';
                    p.style.color = '#94a3b8';
                });
            }
            alert('Background uploaded successfully!');
            await loadBgSection();
        } catch (e) {
            console.error('[Admin] Upload error:', e);
            alert('Failed to upload background: ' + e.message);
        } finally {
            bgUploadBtn.disabled = false;
            bgUploadBtn.textContent = 'Upload';
        }
    });
}

function _compressBgImage(dataUrl, maxW, maxH, quality) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let w = img.width, h = img.height;
            if (w > maxW || h > maxH) {
                const ratio = Math.min(maxW / w, maxH / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            const result = canvas.toDataURL('image/jpeg', quality);
            resolve(result);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression'));
        img.src = dataUrl;
    });
}

async function loadBgSection() {
    const grid = adminBgGrid;
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#94a3b8;">Loading backgrounds…</div>';

    try {
        const snap = await getDocs(collection(db, 'card_backgrounds'));
        const backgrounds = [];
        snap.forEach(d => backgrounds.push({ id: d.id, ...d.data() }));

        backgrounds.sort((a, b) => {
            const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return tb - ta || b.id.localeCompare(a.id);
        });

        const filtered = _adminFilterEmotion === 'all'
            ? backgrounds
            : backgrounds.filter(bg => bg.emotion === _adminFilterEmotion);

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:#94a3b8;">
                    <div style="font-size:18px;font-weight:700;margin-bottom:8px;">${
                        _adminFilterEmotion === 'all' ? 'No Backgrounds Found' : 'No backgrounds for this emotion'
                    }</div>
                    <div style="font-size:14px;">Use the upload button above to add backgrounds.</div>
                </div>`;
            return;
        }

        grid.innerHTML = '';
        filtered.forEach(bg => {
            const card = document.createElement('div');
            card.className = 'bg-card';
            card.style.cssText = 'background:#1e293b;border-radius:12px;overflow:hidden;border:1px solid #334155;display:flex;flex-direction:column;';

            const emObj = getEmotionById(bg.emotion);
            const emBadge = emObj
                ? `<span class="bg-emotion-badge" data-emotion-icon="${emObj.id}" style="font-size:11px;padding:3px 8px;border-radius:12px;background:rgba(56,189,248,0.12);color:#7dd3fc;font-weight:600;display:inline-flex;align-items:center;gap:4px;">${emObj.label}</span>`
                : `<span class="bg-emotion-badge" style="font-size:11px;padding:3px 8px;border-radius:12px;background:rgba(148,163,184,0.12);color:#94a3b8;font-weight:600;display:inline-flex;align-items:center;gap:4px;">❌ ${bg.emotion ? 'Legacy / review' : 'Universal'}</span>`;

            const emOptions = `<option value="" ${!bg.emotion ? 'selected' : ''}>Universal (no emotion)</option>` + EMOTIONS.map(e =>
                `<option value="${e.id}" ${e.id === bg.emotion ? 'selected' : ''}>${e.label}</option>`
            ).join('');
            const pnlOptions = `<option value="" disabled ${!bg.pnlType ? 'selected' : ''}>Legacy / unclassified — assign a type</option><option value="profit" ${bg.pnlType === 'profit' ? 'selected' : ''}>Profit</option><option value="loss" ${bg.pnlType === 'loss' ? 'selected' : ''}>Loss</option>`;

            card.innerHTML = `
                <div style="height:150px;background:url('${bg.imageUrl}') center/cover;border-bottom:1px solid #334155;position:relative;">
                    <div style="position:absolute;top:8px;left:8px;">${emBadge}</div>
                </div>
                <div style="padding:8px 12px;">
                    <select class="bg-emotion-select" data-id="${bg.id}" style="
                        width:100%;padding:5px 8px;border-radius:8px;font-size:11px;font-weight:600;
                        background:#0f172a;color:#94a3b8;border:1px solid #334155;cursor:pointer;
                        margin-bottom:8px;
                    ">${emOptions}</select>
                    <select class="bg-pnl-select" data-id="${bg.id}" style="
                        width:100%;padding:5px 8px;border-radius:8px;font-size:11px;font-weight:600;
                        background:#0f172a;color:#94a3b8;border:1px solid #334155;cursor:pointer;margin-bottom:8px;
                    ">${pnlOptions}</select>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:12px;color:#94a3b8;font-family:monospace;">${bg.id.substring(0,8)}...</span>
                        <button class="btn-danger bg-delete-btn" data-id="${bg.id}" style="padding:6px 12px;font-size:12px;">Delete</button>
                    </div>
                </div>
            `;

            card.querySelectorAll('[data-emotion-icon]').forEach(icon => {
                mountAdminEmotionIcon(icon, icon.dataset.emotionIcon);
            });

            card.querySelector('.bg-emotion-select').addEventListener('change', async (e) => {
                const select = e.target;
                const bgId = select.dataset.id;
                const newEmotion = select.value;
                select.disabled = true;
                try {
                    await setDoc(doc(db, 'card_backgrounds', bgId), { emotion: newEmotion || null }, { merge: true });
                    select.style.borderColor = '#00e676';
                    setTimeout(() => { select.style.borderColor = '#334155'; }, 1000);
                } catch (err) {
                    alert('Failed to update emotion: ' + err.message);
                } finally {
                    select.disabled = false;
                }
            });

            card.querySelector('.bg-pnl-select').addEventListener('change', async (e) => {
                const select = e.target;
                select.disabled = true;
                try {
                    await setDoc(doc(db, 'card_backgrounds', select.dataset.id), { pnlType: select.value || null }, { merge: true });
                    select.style.borderColor = '#00e676';
                    setTimeout(() => { select.style.borderColor = '#334155'; }, 1000);
                } catch (err) { alert('Failed to update Profit/Loss type: ' + err.message); }
                finally { select.disabled = false; }
            });

            card.querySelector('.bg-delete-btn').addEventListener('click', async (e) => {
                const id = e.target.dataset.id;
                if (!confirm('Are you sure you want to delete this background?')) return;
                e.target.disabled = true;
                e.target.textContent = 'Deleting...';
                try {
                    await deleteDoc(doc(db, 'card_backgrounds', id));
                    await loadBgSection();
                } catch (err) {
                    alert('Failed to delete: ' + err.message);
                    e.target.disabled = false;
                    e.target.textContent = 'Delete';
                }
            });

            grid.appendChild(card);
        });
    } catch (e) {
        console.error('[Admin] Load backgrounds error:', e);
        grid.innerHTML = `<div style="grid-column:1/-1;color:#f87171;padding:40px;">Error loading backgrounds: ${e.message}</div>`;
    }
}

function escapeHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

initSaveButtonLottie();
