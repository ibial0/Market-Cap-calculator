// ═══════════════════════════════════════════════════════════
//  ADMIN DASHBOARD — Complete Implementation
//  All buttons functional. Full CRUD. Filter system. Preview modal.
// ═══════════════════════════════════════════════════════════
import { auth, db } from '../config/firebase.js';
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
    collection, getDocs, doc, setDoc, deleteDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { composeCard } from '../cards/renderer.js';
import { getAllThemes, BUILTIN_METADATA, loadCustomThemes } from '../cards/themes/index.js';
import { TIER_DEFS, TIER_ORDER } from '../cards/config.js';

// ── DOM References ─────────────────────────────────────────
const authView   = document.getElementById('auth-view');
const dashView   = document.getElementById('dashboard-view');
const emailInput = document.getElementById('admin-email');
const passInput  = document.getElementById('admin-pass');
const loginBtn   = document.getElementById('login-btn');
const logoutBtn  = document.getElementById('logout-btn');
const authError  = document.getElementById('auth-error');
const designsGrid= document.getElementById('designs-grid');
const filterBar  = document.getElementById('filter-bar');
const sidebarFilter = document.getElementById('sidebar-status-filter');
const createBtn  = document.getElementById('create-design-btn');

// Editor modal
const editorModal   = document.getElementById('editor-modal');
const closeEditor   = document.getElementById('close-editor');
const editorTitle   = document.getElementById('editor-title');
const editorSub     = document.getElementById('editor-subtitle');
const saveBtn       = document.getElementById('save-design-btn');
const delBtn        = document.getElementById('delete-design-btn');
const deleteHint    = document.getElementById('delete-hint');
const refreshPrvBtn = document.getElementById('refresh-preview-btn');

// Editor form fields
const editId       = document.getElementById('edit-id');
const editName     = document.getElementById('edit-name');
const editActive   = document.getElementById('edit-active');
const editCategory = document.getElementById('edit-category');
const editTag      = document.getElementById('edit-tag');
const editPal      = document.getElementById('edit-palettes');
const editTypo     = document.getElementById('edit-typography');
const editBg       = document.getElementById('edit-bg');
const editFx       = document.getElementById('edit-fx');
const editBorder   = document.getElementById('edit-border');
const editLayout   = document.getElementById('edit-layout');

// Preview modal
const previewModal      = document.getElementById('preview-modal');
const closePreview      = document.getElementById('close-preview');
const previewTitle      = document.getElementById('preview-modal-title');
const previewMeta       = document.getElementById('preview-modal-meta');
const previewCard       = document.getElementById('preview-modal-card');
const previewContainer  = document.getElementById('preview-modal-container');
const previewEditBtn    = document.getElementById('preview-edit-btn');
const previewToggleBtn  = document.getElementById('preview-toggle-btn');
const previewDeleteBtn  = document.getElementById('preview-delete-btn');

// ── State ──────────────────────────────────────────────────
let allDesigns      = []; // merged + annotated list
let currentFilter   = { status: 'all', tier: 'all' };
let currentPreviewId= null;

// ── Auth ───────────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
    if (user) {
        authView.classList.add('hidden');
        dashView.classList.remove('hidden');
        initDashboard();
    } else {
        authView.classList.remove('hidden');
        dashView.classList.add('hidden');
        allDesigns = [];
    }
});

loginBtn.addEventListener('click', doLogin);
passInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') passInput.focus(); });
logoutBtn.addEventListener('click', () => signOut(auth));

async function doLogin() {
    const email = emailInput.value.trim();
    const pass  = passInput.value;
    if (!email || !pass) {
        showAuthError('Please enter your email and password.');
        return;
    }
    loginBtn.textContent = 'Signing in…';
    loginBtn.disabled = true;
    authError.classList.add('hidden');
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged handles the redirect
    } catch (e) {
        console.error('[Admin] Login error:', e);
        const msg = _friendlyAuthError(e.code || e.message);
        showAuthError(msg);
    } finally {
        loginBtn.textContent = 'Access Dashboard';
        loginBtn.disabled = false;
    }
}

function showAuthError(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
}

function _friendlyAuthError(code) {
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
        return 'Incorrect email or password.';
    if (code.includes('too-many-requests'))
        return 'Too many attempts. Please wait a moment and try again.';
    if (code.includes('network'))
        return 'Network error. Please check your connection.';
    return 'Login failed: ' + code;
}

// ── Dashboard Init ─────────────────────────────────────────
async function initDashboard() {
    designsGrid.innerHTML = '<div class="gallery-empty"><p>Loading designs…</p></div>';
    filterBar.innerHTML   = '';
    try {
        await loadAllData();
    } catch (e) {
        console.error('[Admin] initDashboard error:', e);
        designsGrid.innerHTML = `<div class="gallery-empty"><h3>Error</h3><p>${e.message}</p></div>`;
    }
}

// ── Load & Merge All Designs ───────────────────────────────
async function loadAllData() {
    // 1. Load custom theme overrides from Firestore
    await loadCustomThemes();

    // 2. Get built-in theme objects
    const builtins = getAllThemes();

    // 3. Get all Firestore docs (custom + status overrides)
    const snapshot = await getDocs(collection(db, 'card_designs'));
    const firestoreDocs = {};
    snapshot.forEach(d => { firestoreDocs[d.id] = { id: d.id, ...d.data() }; });

    // 4. Merge into a unified list
    allDesigns = [];
    const processedIds = new Set();

    // 4a. Iterate all built-in themes
    Object.keys(builtins).forEach(id => {
        processedIds.add(id);
        const builtinMeta = BUILTIN_METADATA[id] || {};
        const firestoreOverride = firestoreDocs[id];
        let isActive = true;
        let type = 'builtin';

        if (firestoreOverride) {
            isActive = firestoreOverride.isActive !== false;
            type = 'overridden';
        }

        allDesigns.push({
            id,
            name:     (firestoreOverride && firestoreOverride.name) || builtinMeta.name || id,
            category: (firestoreOverride && firestoreOverride.category) || builtinMeta.category || '',
            tag:      (firestoreOverride && firestoreOverride.tag)      || builtinMeta.tag      || '',
            tiers:    (firestoreOverride && firestoreOverride.tiers)    || builtinMeta.tiers    || [],
            isActive,
            _type:    type,
            _builtinTheme: builtins[id],
            _firestoreData: firestoreOverride || null,
        });
    });

    // 4b. Iterate Firestore-only docs (not already in built-ins)
    Object.values(firestoreDocs).forEach(fd => {
        if (processedIds.has(fd.id)) return; // already handled above
        processedIds.add(fd.id);
        allDesigns.push({
            id:       fd.id,
            name:     fd.name || fd.id,
            category: fd.category || '',
            tag:      fd.tag      || '',
            tiers:    fd.tiers    || [],
            isActive: fd.isActive !== false,
            _type:    'custom',
            _builtinTheme: null,
            _firestoreData: fd,
        });
    });

    // 5. Sort: Active first, then alphabetically
    allDesigns.sort((a, b) => {
        if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    renderFilterBar();
    renderGrid();
}

// ── Filter Bar ─────────────────────────────────────────────
function renderFilterBar() {
    const total    = allDesigns.length;
    const active   = allDesigns.filter(d => d.isActive).length;
    const inactive = allDesigns.filter(d => !d.isActive).length;

    // Tier counts
    const tierCounts = {};
    TIER_ORDER.forEach(tid => { tierCounts[tid] = 0; });
    allDesigns.forEach(d => {
        (d.tiers || []).forEach(t => {
            if (tierCounts[t] !== undefined) tierCounts[t]++;
        });
    });

    sidebarFilter.innerHTML = `
        <button class="filter-tab ${currentFilter.status === 'all'      ? 'active' : ''}" data-status="all">
            All Designs <span class="count-badge">${total}</span>
        </button>
        <button class="filter-tab ${currentFilter.status === 'active'   ? 'active' : ''}" data-status="active">
            Active <span class="count-badge">${active}</span>
        </button>
        <button class="filter-tab ${currentFilter.status === 'inactive' ? 'active' : ''}" data-status="inactive">
            Inactive <span class="count-badge">${inactive}</span>
        </button>
    `;

    filterBar.innerHTML = `
        <div class="filter-row">
            <span class="filter-row-label">Performance:</span>
            <button class="filter-tab ${currentFilter.tier === 'all' ? 'active' : ''}" data-tier="all">
                All Tiers
            </button>
            ${TIER_ORDER.map(tid => {
                const def = TIER_DEFS[tid];
                if (!def) return '';
                return `<button class="filter-tab ${currentFilter.tier === tid ? 'active' : ''}" data-tier="${tid}">
                    ${def.tag || def.label} <span class="count-badge">${tierCounts[tid]}</span>
                </button>`;
            }).join('')}
        </div>
    `;

    // Status filter clicks
    sidebarFilter.querySelectorAll('[data-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter.status = btn.dataset.status;
            renderFilterBar();
            renderGrid();
        });
    });

    // Tier filter clicks
    filterBar.querySelectorAll('[data-tier]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter.tier = btn.dataset.tier;
            renderFilterBar();
            renderGrid();
        });
    });
}

// ── Gallery Grid ───────────────────────────────────────────
// Mock data used for generating thumbnails
const MOCK_DATA = {
    tokenName: 'BITCOIN', userName: 'Satoshi',
    multiplier: 12.5, roi: 1150.0, profit: 45000,
    inv: 4000, initMC: 500000000, targetMC: 6250000000,
    finalValue: 49000, showBdt: false,
};
const MOCK_TIER = { id: 'mega_win', def: { label: 'MEGA WIN', badge: 'LEGEND', emotions: ['euphoric'] } };
const MOCK_COMBO = { themeId: '', bgVariant: 0, charVariant: 0, accentIdx: 0, detailIdx: 0 };
const MOCK_RNG = { pick: arr => arr[0] };

function renderGrid() {
    // Apply filters
    let filtered = allDesigns;

    if (currentFilter.status === 'active')   filtered = filtered.filter(d => d.isActive);
    if (currentFilter.status === 'inactive') filtered = filtered.filter(d => !d.isActive);
    if (currentFilter.tier !== 'all')        filtered = filtered.filter(d => (d.tiers || []).includes(currentFilter.tier));

    if (filtered.length === 0) {
        designsGrid.innerHTML = `
            <div class="gallery-empty">
                <h3>No designs found</h3>
                <p>Try changing your filter, or add a new design.</p>
            </div>`;
        return;
    }

    designsGrid.innerHTML = '';

    filtered.forEach(d => {
        const card = document.createElement('div');
        card.className = 'design-card';
        card.dataset.id = d.id;

        // Generate thumbnail
        let thumbHTML = '';
        try {
            let theme = d._builtinTheme;
            if (!theme && d._firestoreData) {
                theme = _buildThemeFromFirestore(d._firestoreData);
            }
            if (theme) {
                MOCK_COMBO.themeId = d.id;
                thumbHTML = composeCard({ theme, data: MOCK_DATA, tier: MOCK_TIER, combo: MOCK_COMBO, randomizer: MOCK_RNG });
            } else {
                thumbHTML = `<div style="width:1600px;height:900px;background:#1a2340;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:48px;">Custom Design</div>`;
            }
        } catch (e) {
            thumbHTML = `<div style="width:1600px;height:900px;background:#2d1010;display:flex;align-items:center;justify-content:center;color:#f87171;font-size:36px;">Preview Error</div>`;
            console.warn('[Admin] Thumb error for', d.id, e.message);
        }

        const typeBadgeClass = d._type === 'builtin' ? 'type-builtin' : d._type === 'overridden' ? 'type-overridden' : 'type-custom';
        const typeLabel       = d._type === 'builtin' ? 'Built-in' : d._type === 'overridden' ? 'Modified' : 'Custom';

        card.innerHTML = `
            <div class="design-thumb-container">
                <div class="design-thumb-scaler" style="transform:scale(0.2);transform-origin:top left;">${thumbHTML}</div>
            </div>
            <div class="design-info">
                <div class="design-info-header">
                    <div style="min-width:0;">
                        <h3 title="${d.name}">${d.name}</h3>
                        <div class="design-badges">
                            <span class="design-type-badge ${typeBadgeClass}">${typeLabel}</span>
                            ${d.tag ? `<span class="design-tag-badge">${d.tag}</span>` : ''}
                        </div>
                    </div>
                    <span class="design-status ${d.isActive ? 'status-active' : 'status-inactive'}">
                        ${d.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="design-actions">
                    <span class="design-id-label">${d.id}</span>
                    <button class="btn-secondary manage-btn" data-id="${d.id}">Manage</button>
                </div>
            </div>
        `;

        // Click card body → open preview modal
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.manage-btn')) openPreviewModal(d.id);
        });

        // Click Manage button → open editor
        card.querySelector('.manage-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditor(d.id);
        });

        designsGrid.appendChild(card);
    });

    // Scale thumbnails responsively
    _resizeThumbs();
}

function _resizeThumbs() {
    document.querySelectorAll('.design-thumb-container').forEach(c => {
        const scaler = c.querySelector('.design-thumb-scaler');
        if (scaler) {
            const scale = c.clientWidth / 1600;
            scaler.style.transform = 'scale(' + scale + ')';
        }
    });
}

window.addEventListener('resize', _resizeThumbs);

// ── Build Theme Object from Firestore Data ─────────────────
function _buildThemeFromFirestore(data) {
    const theme = {
        id: data.id, name: data.name,
        bgVariants: 1, charVariants: 1, accentVariants: 1, detailVariants: 1,
    };
    try {
        const pal = JSON.parse(data.palettes || '[]');
        theme.getPalette = (tid, idx) => pal.length ? { ...pal[idx % pal.length] } : {};
    } catch { theme.getPalette = () => ({}); }

    try {
        const typo = JSON.parse(data.typography || '{}');
        theme.getTypography = () => typo;
    } catch { theme.getTypography = () => ({}); }

    const _fn = (args, body) => { try { return new Function(args, body); } catch { return () => ''; } };
    theme.renderBackground = data.renderBackground ? _fn('pal,tierId,variant', data.renderBackground) : () => '';
    theme.renderEffects     = data.renderEffects    ? _fn('pal,tierId,detailIdx', data.renderEffects)  : () => '';
    theme.getBorder         = data.getBorder        ? _fn('pal', data.getBorder)                        : () => '';
    theme.renderLayout      = data.renderLayout     ? _fn('{ cd, pal, typo, W, H, S }', data.renderLayout) : null;
    return theme;
}

// ── Editor Form ────────────────────────────────────────────
let currentEditorId = null;
let isEditorPng = false;

function openEditor(id, isPngOverride = false) {
    currentEditorId = id;
    
    // Check if it's a PNG
    const pngDesign = allPngTemplates.find(p => p.id === id);
    if (pngDesign || isPngOverride) {
        isEditorPng = true;
        const d = pngDesign;
        document.getElementById('edit-name').value     = d ? (d.name || '') : '';
        document.getElementById('edit-category').value = d ? (d.category || '') : '';
        document.getElementById('edit-tag').value      = d ? (d.tag || '') : '';
        document.getElementById('edit-active').checked = d ? (d.isActive !== false) : true;
        
        document.getElementById('theme-logic-section').style.display = 'none';
        document.getElementById('png-logic-section').style.display = 'block';
        
        document.getElementById('delete-design-btn').classList.remove('hidden');
        document.getElementById('delete-hint').style.display = 'none';
        
        editorModal.style.display = 'flex';
        updateEditorPreview();
        return;
    }

    // It's a Theme
    isEditorPng = false;
    document.getElementById('theme-logic-section').style.display = 'block';
    document.getElementById('png-logic-section').style.display = 'none';

    const design = allDesigns.find(d => d.id === id);
    if (!design) return;

    const fd = design._firestoreData;

    editorTitle.textContent  = id ? 'Edit Design' : 'New Design';
    editorSub.textContent    = 'ID: ' + design.id + '  •  ' + (design._type === 'builtin' ? 'Built-in' : design._type === 'overridden' ? 'Built-in (modified)' : 'Custom');
    editId.value             = design.id;
    editName.value           = design.name;
    editActive.checked       = design.isActive;
    editCategory.value       = design.category || '';
    editTag.value            = design.tag || '';
    editPal.value            = fd ? (fd.palettes   || '[{}]')     : '[{}]';
    editTypo.value           = fd ? (fd.typography || '{}')       : '{}';
    editBg.value             = fd ? (fd.renderBackground || "return '';") : "return '';";
    editFx.value             = fd ? (fd.renderEffects    || "return '';") : "return '';";
    editBorder.value         = fd ? (fd.getBorder         || "return '';") : "return '';";
    editLayout.value         = fd ? (fd.renderLayout      || "return '';") : "return '';";

    // Show/hide Theme Logic section and delete button
    const isBuiltin = design._type === 'builtin' || design._type === 'overridden';
    const logicSection = document.getElementById('theme-logic-section');
    
    if (isBuiltin) {
        logicSection.classList.add('hidden');
    } else {
        logicSection.classList.remove('hidden');
    }

    if (!isBuiltin || design._type === 'overridden') {
        delBtn.classList.remove('hidden');
        deleteHint.style.display = design._type === 'overridden' ? 'block' : 'none';
        delBtn.textContent = design._type === 'overridden' ? 'Remove Override (Restore Original)' : 'Delete Custom Design';
    } else {
        delBtn.classList.add('hidden');
        deleteHint.style.display = 'none';
    }

    editorModal.style.display = 'flex';
    updateEditorPreview();
}

function openNewDesignEditor() {
    const newId = 'theme_' + Date.now();
    editorTitle.textContent  = 'New Custom Design';
    editorSub.textContent    = 'ID: ' + newId + '  •  New Custom';
    editId.value             = newId;
    editName.value           = 'My New Design';
    editActive.checked       = true;
    editCategory.value       = 'Custom';
    editTag.value            = 'All Tiers';
    editPal.value            = JSON.stringify([
        { bg: '#0f172a', text: '#ffffff', accent: '#38bdf8', positive: '#10b981', negative: '#ef4444' }
    ], null, 2);
    editTypo.value           = JSON.stringify({
        display: "'Inter', sans-serif", displayWeight: 800,
        body: "'Inter', sans-serif", mono: "'Roboto Mono', monospace"
    }, null, 2);
    editBg.value             = "// Return SVG string for the card background\nconst W=1600, H=900;\nreturn `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${W}\" height=\"${H}\"><rect width=\"${W}\" height=\"${H}\" fill=\"${pal.bg}\"/></svg>`;";
    editFx.value             = "return '';";
    editBorder.value         = "return 'border-radius:24px;border:1px solid ' + pal.accent + '30;';";
    editLayout.value         = "const { tok, usr, mul, roi, pStr, inv, ent, ext, profitColor, tokSz, mulSz } = cd;\nreturn `<div style=\"padding:${S}px;display:flex;flex-direction:column;justify-content:space-between;height:100%;box-sizing:border-box;\">\n  <div style=\"font-size:${tokSz}px;font-weight:900;color:${pal.accent};\">${tok}</div>\n  <div>\n    <div style=\"font-size:${mulSz}px;font-weight:900;color:${profitColor};\">${mul}</div>\n    <div style=\"font-size:48px;opacity:0.7;\">${roi} ROI</div>\n  </div>\n  <div style=\"display:flex;justify-content:space-between;\">\n    <div><div style=\"opacity:0.5;font-size:16px;\">ENTRY</div><div style=\"font-size:32px;\">${ent}</div></div>\n    <div><div style=\"opacity:0.5;font-size:16px;\">EXIT</div><div style=\"font-size:32px;\">${ext}</div></div>\n    <div><div style=\"opacity:0.5;font-size:16px;\">INVESTED</div><div style=\"font-size:32px;\">${inv}</div></div>\n    <div><div style=\"opacity:0.5;font-size:16px;\">PROFIT</div><div style=\"font-size:32px;color:${profitColor};\">${pStr}</div></div>\n  </div>\n</div>\`;";

    const logicSection = document.getElementById('theme-logic-section');
    logicSection.classList.remove('hidden');

    delBtn.classList.add('hidden');
    deleteHint.style.display = 'none';
    editorModal.style.display = 'flex';
    updateEditorPreview();
}

function closeEditorModal() {
    editorModal.style.display = 'none';
}

createBtn.addEventListener('click', openNewDesignEditor);
closeEditor.addEventListener('click', closeEditorModal);

// Close modal on overlay click
editorModal.addEventListener('click', (e) => {
    if (e.target === editorModal) closeEditorModal();
});

// Save
document.getElementById('save-design-btn').addEventListener('click', async () => {
    if (!currentEditorId) return;
    const btn = document.getElementById('save-design-btn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
        if (isEditorPng) {
            const data = {
                name:     document.getElementById('edit-name').value.trim(),
                category: document.getElementById('edit-category').value,
                tag:      document.getElementById('edit-tag').value,
                isActive: document.getElementById('edit-active').checked,
                updatedAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'png_templates', currentEditorId), data, { merge: true });
            
            // Reload PNGs
            await loadPNGSection();
            
            // Hide editor and return to PNG gallery
            editorModal.style.display = 'none';
            document.getElementById('nav-png')?.click();
        } else {
            // Existing Theme Save Logic
            const data = {
                name:            document.getElementById('edit-name').value.trim(),
                category:        document.getElementById('edit-category').value,
                tag:             document.getElementById('edit-tag').value,
                isActive:        document.getElementById('edit-active').checked,
                palettes:        document.getElementById('edit-palettes').value,
                typography:      document.getElementById('edit-typography').value,
                renderBackground:document.getElementById('edit-bg').value,
                renderEffects:   document.getElementById('edit-fx').value,
                getBorder:       document.getElementById('edit-border').value,
                renderLayout:    document.getElementById('edit-layout').value,
                updatedAt:       new Date().toISOString(),
            };
            await setDoc(doc(db, 'card_designs', currentEditorId), data, { merge: true });
            await loadAllData();
            
            // Hide editor and return to theme gallery
            editorModal.style.display = 'none';
            document.getElementById('nav-designs')?.click();
        }
    } catch (e) {
        alert('Failed to save: ' + e.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
});

// PNG Visual Editor opener
document.getElementById('open-visual-editor-btn')?.addEventListener('click', () => {
    if (currentEditorId) {
        window.open(`png-editor.html?id=${currentEditorId}`, '_blank');
    }
});

// Delete
delBtn.addEventListener('click', async () => {
    const id = editId.value;
    const design = allDesigns.find(d => d.id === id);
    if (!design) return;

    const msg = design._type === 'overridden'
        ? 'Remove override? The original built-in design will become active again.'
        : 'Permanently delete this custom design? This cannot be undone.';

    if (!confirm(msg)) return;

    try {
        await deleteDoc(doc(db, 'card_designs', id));
        closeEditorModal();
        await loadAllData();
    } catch (e) {
        alert('Failed to delete: ' + e.message);
        console.error('[Admin] Delete error:', e);
    }
});

// ── Map tag → tier IDs ─────────────────────────────────────
function _tiersFromTag(tag) {
    const map = {
        'All Tiers':   ['legendary','mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'],
        'All Wins':    ['legendary','mega_win','big_win','solid_win','micro_win'],
        'Legendary':   ['legendary'],
        'Mega Win':    ['legendary','mega_win'],
        'Big Win':     ['legendary','mega_win','big_win'],
        'Big+ Wins':   ['legendary','mega_win','big_win','solid_win'],
        'Good Win':    ['legendary','mega_win','big_win','solid_win'],
        'Small+ Wins': ['legendary','mega_win','big_win','solid_win','micro_win','small_loss'],
        'Small Win':   ['micro_win'],
        'Small Loss':  ['small_loss'],
        'Heavy Loss':  ['medium_loss','rekt'],
    };
    return map[tag] || ['legendary','mega_win','big_win','solid_win','micro_win','small_loss','medium_loss','rekt'];
}

// ── Editor Live Preview ────────────────────────────────────
refreshPrvBtn.addEventListener('click', updateEditorPreview);

// Auto-update preview 600ms after any textarea change
[editPal, editTypo, editBg, editFx, editBorder, editLayout].forEach(el => {
    el.addEventListener('input', _debounce(updateEditorPreview, 600));
});

function updateEditorPreview() {
    if (!currentEditorId) return;
    try {
        let html = '';
        if (isEditorPng) {
            const pngDesign = allPngTemplates.find(p => p.id === currentEditorId);
            if (pngDesign) {
                // Just show the raw image for preview in the editor
                html = `<div style="width:1600px;height:900px;background:url('${pngDesign.bgDataUrl || pngDesign.bgUrl}') center/cover;"></div>`;
            }
        } else {
            const logicSection = document.getElementById('theme-logic-section');
            const editName     = document.getElementById('edit-name');
            const editPal      = document.getElementById('edit-palettes');
            const editTypo     = document.getElementById('edit-typography');
            const editBg       = document.getElementById('edit-bg');
            const editFx       = document.getElementById('edit-fx');
            const editBorder   = document.getElementById('edit-border');
            const editLayout   = document.getElementById('edit-layout');

            const includeLogic = !logicSection.classList.contains('hidden');
            const design = allDesigns.find(d => d.id === currentEditorId);

            let theme;
            if (!includeLogic && design && design._builtinTheme) {
                theme = design._builtinTheme;
            } else {
                const fd = {
                    id:              currentEditorId,
                    name:            editName.value,
                    palettes:        editPal.value,
                    typography:      editTypo.value,
                    renderBackground:editBg.value,
                    renderEffects:   editFx.value,
                    getBorder:       editBorder.value,
                    renderLayout:    editLayout.value,
                };
                theme = _buildThemeFromFirestore(fd);
            }
            html = composeCard({ theme, data: MOCK_DATA, tier: MOCK_TIER, combo: { ...MOCK_COMBO, themeId: currentEditorId }, randomizer: MOCK_RNG });
        }

        const node = document.getElementById('card-node');
        node.innerHTML = html;

        const cont = document.getElementById('preview-container');
        if (cont && node) {
            const scale = cont.clientWidth / 1600;
            node.style.cssText = 'width:1600px;height:900px;transform:scale(' + scale + ');transform-origin:top left;';
        }
    } catch (e) {
        document.getElementById('card-node').innerHTML =
            '<div style="color:#ef4444;padding:40px;font-size:24px;background:#0f172a;width:1600px;height:900px;box-sizing:border-box;">Preview Error: ' + e.message + '</div>';
    }
}

// Update preview scale on window resize
window.addEventListener('resize', () => {
    if (editorModal.style.display !== 'none') updateEditorPreview();
    if (previewModal.style.display !== 'none') _scalePreviewModal();
});

// ── Preview Modal ──────────────────────────────────────────
let currentPreviewIsPng = false;
function openPreviewModal(id) {
    currentPreviewId = id;
    
    const themeDesign = allDesigns.find(d => d.id === id);
    const pngDesign   = allPngTemplates.find(p => p.id === id);
    
    if (!themeDesign && !pngDesign) return;
    
    currentPreviewIsPng = !!pngDesign;
    const name     = pngDesign ? pngDesign.name : themeDesign.name;
    const tag      = pngDesign ? pngDesign.tag : themeDesign.tag;
    const category = pngDesign ? pngDesign.category : themeDesign.category;
    const isActive = pngDesign ? pngDesign.isActive !== false : themeDesign.isActive;
    
    previewTitle.textContent = name || 'Untitled';

    // Meta badges
    let typeBadgeClass, typeLabel;
    if (pngDesign) {
        typeBadgeClass = 'type-custom';
        typeLabel = 'PNG Template';
        document.getElementById('preview-duplicate-btn').style.display = 'inline-block';
    } else {
        typeBadgeClass = themeDesign._type === 'builtin' ? 'type-builtin' : themeDesign._type === 'overridden' ? 'type-overridden' : 'type-custom';
        typeLabel      = themeDesign._type === 'builtin' ? 'Built-in' : themeDesign._type === 'overridden' ? 'Modified' : 'Custom';
        document.getElementById('preview-duplicate-btn').style.display = 'none';
    }

    previewMeta.innerHTML = `
        <span class="design-type-badge ${typeBadgeClass}">${typeLabel}</span>
        ${tag ? `<span class="design-tag-badge">${tag}</span>` : ''}
        ${category ? `<span class="design-tag-badge" style="background:rgba(129,140,248,0.12);color:#818cf8;">${category}</span>` : ''}
        <span class="design-status ${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
    `;

    // Render card
    try {
        if (pngDesign) {
            previewCard.innerHTML = `<div style="width:1600px;height:900px;background:url('${pngDesign.bgDataUrl || pngDesign.bgUrl}') center/cover;"></div>`;
        } else {
            let theme = themeDesign._builtinTheme;
            if (!theme && themeDesign._firestoreData) theme = _buildThemeFromFirestore(themeDesign._firestoreData);
            if (theme) {
                const html = composeCard({ theme, data: MOCK_DATA, tier: MOCK_TIER, combo: { ...MOCK_COMBO, themeId: id }, randomizer: MOCK_RNG });
                previewCard.innerHTML = html;
            } else {
                previewCard.innerHTML = '<div style="background:#1a2340;width:1600px;height:900px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:36px;">No Preview</div>';
            }
        }
    } catch (e) {
        previewCard.innerHTML = '<div style="background:#2d1010;width:1600px;height:900px;display:flex;align-items:center;justify-content:center;color:#f87171;font-size:36px;">Render Error</div>';
    }

    // Toggle active button label
    const isActiveStatus = currentPreviewIsPng 
        ? allPngTemplates.find(p => p.id === currentPreviewId)?.isActive !== false
        : allDesigns.find(d => d.id === currentPreviewId)?.isActive;
        
    previewToggleBtn.textContent = isActiveStatus ? 'Deactivate' : 'Activate';

    // Show delete
    if (currentPreviewIsPng) {
        previewDeleteBtn.classList.remove('hidden');
    } else {
        const d = allDesigns.find(d => d.id === currentPreviewId);
        if (d && (d._type === 'custom' || d._type === 'overridden')) {
            previewDeleteBtn.classList.remove('hidden');
        } else {
            previewDeleteBtn.classList.add('hidden');
        }
    }

    previewModal.style.display = 'flex';
    _scalePreviewModal();
}

function _scalePreviewModal() {
    if (!previewContainer || !previewCard) return;
    const scale = previewContainer.clientWidth / 1600;
    previewCard.style.cssText = 'width:1600px;height:900px;transform:scale(' + scale + ');transform-origin:top left;';
    previewContainer.style.height = Math.round(900 * scale) + 'px';
}

closePreview.addEventListener('click', () => { previewModal.style.display = 'none'; });
previewModal.addEventListener('click', (e) => { if (e.target === previewModal) previewModal.style.display = 'none'; });

previewEditBtn.addEventListener('click', () => {
    previewModal.style.display = 'none';
    if (currentPreviewId) openEditor(currentPreviewId);
});

document.getElementById('preview-duplicate-btn')?.addEventListener('click', async () => {
    if (!currentPreviewIsPng) return;
    const id = currentPreviewId;
    const tpl = allPngTemplates.find(p => p.id === id);
    if (!tpl) return;
    const newId = 'pngtpl_' + Date.now();
    try {
        const orig = await getDoc(doc(db, 'png_templates', id));
        if (!orig.exists()) return;
        const data = { ...orig.data(), name: (orig.data().name || 'Template') + ' (Copy)', isActive: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        await setDoc(doc(db, 'png_templates', newId), data);
        previewModal.style.display = 'none';
        window.open(`png-editor.html?id=${newId}`, '_blank');
        await loadPNGSection();
    } catch (e) {
        alert('Duplicate failed: ' + e.message);
    }
});

previewToggleBtn.addEventListener('click', async () => {
    const id = currentPreviewId;
    previewToggleBtn.textContent = 'Saving…';
    previewToggleBtn.disabled = true;

    try {
        if (currentPreviewIsPng) {
            const design = allPngTemplates.find(p => p.id === id);
            const newActive = !(design.isActive !== false);
            await setDoc(doc(db, 'png_templates', id), { isActive: newActive, updatedAt: new Date().toISOString() }, { merge: true });
            previewModal.style.display = 'none';
            await loadPNGSection();
        } else {
            const design = allDesigns.find(d => d.id === id);
            const newActive = !design.isActive;
            await setDoc(doc(db, 'card_designs', id), { isActive: newActive, updatedAt: new Date().toISOString() }, { merge: true });
            previewModal.style.display = 'none';
            await loadAllData();
        }
    } catch (e) {
        alert('Failed to update status: ' + e.message);
    } finally {
        previewToggleBtn.disabled = false;
    }
});

previewDeleteBtn.addEventListener('click', async () => {
    const id = currentPreviewId;
    
    if (currentPreviewIsPng) {
        if (!confirm('Delete this PNG template permanently?')) return;
        try {
            await deleteDoc(doc(db, 'png_templates', id));
            previewModal.style.display = 'none';
            await loadPNGSection();
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    } else {
        const design = allDesigns.find(d => d.id === id);
        if (!design) return;
        const msg = design._type === 'overridden'
            ? 'Remove override? The original design will be restored.'
            : 'Delete this custom design permanently?';
        if (!confirm(msg)) return;
        try {
            await deleteDoc(doc(db, 'card_designs', id));
            previewModal.style.display = 'none';
            await loadAllData();
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    }
});

// ── Utilities ───────────────────────────────────────────
function _debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ═══════════════════════════════════════════════════════════
//  PNG TEMPLATES SECTION
//  Navigation, gallery render, activate/deactivate/delete.
// ═══════════════════════════════════════════════════════════

let allPngTemplates = []; // loaded from Firestore

// ── Section Navigation ─────────────────────────────────────
const navDesigns = document.getElementById('nav-designs');
const navPng     = document.getElementById('nav-png');
const secDesigns = document.getElementById('section-designs');
const secPng     = document.getElementById('section-png');
const filterBarEl = document.getElementById('filter-bar');
const contentHeader = document.querySelector('header.content-header');

if (navDesigns) {
    navDesigns.addEventListener('click', () => {
        navDesigns.classList.add('active');
        navPng?.classList.remove('active');
        secDesigns.style.display = '';
        secPng.style.display = 'none';
        filterBarEl.style.display = '';
        if (contentHeader) contentHeader.style.display = '';
    });
}

if (navPng) {
    navPng.addEventListener('click', async () => {
        navPng.classList.add('active');
        navDesigns?.classList.remove('active');
        secDesigns.style.display = 'none';
        secPng.style.display = '';
        filterBarEl.style.display = 'none';
        if (contentHeader) contentHeader.style.display = 'none';
        await loadPNGSection();
    });
}

// ── Add New PNG Template button ─────────────────────────────
const createPngBtn = document.getElementById('create-png-btn');
if (createPngBtn) {
    createPngBtn.addEventListener('click', () => {
        window.open('png-editor.html', '_blank');
    });
}

// ── Load PNG templates from Firestore ────────────────────────
async function loadPNGSection() {
    const grid = document.getElementById('png-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#94a3b8;">Loading PNG templates…</div>';

    try {
        const snap = await getDocs(collection(db, 'png_templates'));
        allPngTemplates = [];
        snap.forEach(d => allPngTemplates.push({ id: d.id, ...d.data() }));

        if (allPngTemplates.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;padding:60px 20px;text-align:center;color:#94a3b8;">
                    <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-width="1" style="opacity:.3;margin-bottom:16px;">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <div style="font-size:18px;font-weight:700;margin-bottom:8px;">No PNG templates yet</div>
                    <div style="font-size:14px;">Click <strong>Add New PNG Template</strong> to upload your first design.</div>
                </div>`;
            return;
        }

        renderPNGGrid();
    } catch (e) {
        grid.innerHTML = `<div style="grid-column:1/-1;color:#f87171;padding:40px;">Error loading templates: ${e.message}</div>`;
    }
}

// ── Render PNG gallery grid ───────────────────────────────
function renderPNGGrid() {
    const grid = document.getElementById('png-grid');
    if (!grid) return;
    grid.innerHTML = '';

    allPngTemplates.forEach(tpl => {
        const card = document.createElement('div');
        card.className = 'design-card';
        card.dataset.id = tpl.id;

        const isActive = tpl.isActive !== false;
        
        // Thumbnail is just the image
        const thumbHTML = `<div style="width:1600px;height:900px;background:url('${tpl.bgDataUrl || tpl.bgUrl}') center/cover;"></div>`;

        card.innerHTML = `
            <div class="design-thumb-container">
                <div class="design-thumb-scaler" style="transform:scale(0.2);transform-origin:top left;">${thumbHTML}</div>
            </div>
            <div class="design-info">
                <div class="design-info-header">
                    <div style="min-width:0;">
                        <h3 title="${tpl.name}">${tpl.name || 'Untitled'}</h3>
                        <div class="design-badges">
                            <span class="design-type-badge type-custom" style="background:#10b981;color:#fff;">PNG</span>
                            ${tpl.tag ? `<span class="design-tag-badge">${tpl.tag}</span>` : ''}
                        </div>
                    </div>
                    <span class="design-status ${isActive ? 'status-active' : 'status-inactive'}">
                        ${isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="design-actions">
                    <span class="design-id-label">${tpl.id}</span>
                    <button class="btn-secondary manage-btn" data-id="${tpl.id}">Manage</button>
                </div>
            </div>
        `;

        // Click card body → open preview modal
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.manage-btn')) openPreviewModal(tpl.id);
        });

        // Click Manage button → open editor
        card.querySelector('.manage-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openEditor(tpl.id);
        });

        grid.appendChild(card);
    });
    
    // Scale thumbnails responsively
    _resizeThumbs();
}
