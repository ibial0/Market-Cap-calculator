import { auth, db } from '../config/firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { collection, query, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { composeCard } from '../cards/renderer.js';
import { getAllThemes } from '../cards/themes/index.js'; // to fetch built-ins

// DOM Elements
const authView = document.getElementById('auth-view');
const dashView = document.getElementById('dashboard-view');
const emailInput = document.getElementById('admin-email');
const passInput = document.getElementById('admin-pass');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const authError = document.getElementById('auth-error');
const designsGrid = document.getElementById('designs-grid');

const createBtn = document.getElementById('create-design-btn');
const editorModal = document.getElementById('editor-modal');
const closeEditor = document.getElementById('close-editor');
const saveBtn = document.getElementById('save-design-btn');
const delBtn = document.getElementById('delete-design-btn');
const refreshPreviewBtn = document.getElementById('refresh-preview-btn');
const editorSubtitle = document.getElementById('editor-subtitle');
const deleteHint = document.getElementById('delete-hint');

// Form elements
const editId = document.getElementById('edit-id');
const editName = document.getElementById('edit-name');
const editActive = document.getElementById('edit-active');
const editPal = document.getElementById('edit-palettes');
const editTypo = document.getElementById('edit-typography');
const editBg = document.getElementById('edit-bg');
const editFx = document.getElementById('edit-fx');
const editBorder = document.getElementById('edit-border');
const editLayout = document.getElementById('edit-layout');

let builtInThemes = {};
let customThemes = {};
let mergedThemes = [];

// ── Auth Flow ─────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
    if (user) {
        authView.classList.add('hidden');
        dashView.classList.remove('hidden');
        loadAllData();
    } else {
        authView.classList.remove('hidden');
        dashView.classList.add('hidden');
    }
});

loginBtn.addEventListener('click', async () => {
    loginBtn.textContent = 'Authenticating...';
    try {
        await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
        authError.classList.add('hidden');
    } catch (e) {
        console.error("Login failed:", e);
        authError.textContent = e.message || "Invalid email or password.";
        authError.classList.remove('hidden');
    } finally {
        loginBtn.textContent = 'Access Dashboard';
    }
});

// Add Enter key support
passInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
});
emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') passInput.focus();
});

logoutBtn.addEventListener('click', () => signOut(auth));


// ── Load & Merge Designs ──────────────────────────────────
async function loadAllData() {
    designsGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--admin-muted); padding: 40px;">Loading designs...</div>';
    
    try {
        // 1. Get built-in themes from code
        builtInThemes = getAllThemes();
        
        // 2. Get custom overrides/new themes from Firestore
        const q = query(collection(db, "card_designs"));
        const snapshot = await getDocs(q);
        
        customThemes = {};
        snapshot.forEach(d => {
            customThemes[d.id] = { id: d.id, ...d.data() };
        });
        
        // 3. Merge them
        mergedThemes = [];
        const allIds = new Set([...Object.keys(builtInThemes), ...Object.keys(customThemes)]);
        
        allIds.forEach(id => {
            const isBuiltIn = !!builtInThemes[id];
            const isCustom = !!customThemes[id];
            
            let data;
            let type = '';
            let isActive = true;
            
            if (isBuiltIn && isCustom) {
                // Custom overrides built-in
                data = customThemes[id];
                type = 'type-overridden';
                isActive = data.isActive !== false;
            } else if (isCustom) {
                // Pure custom from Firestore
                data = customThemes[id];
                type = 'type-custom';
                isActive = data.isActive !== false;
            } else {
                // Pure built-in
                // We need to extract the raw strings from the JS functions to edit them.
                // However, since they are compiled, we can't perfectly edit them as strings unless we serialize them.
                // For built-ins, we can store their basic info. When admin clicks "edit", we provide a blank template,
                // or we use Function.prototype.toString().
                data = serializeBuiltInTheme(builtInThemes[id]);
                type = 'type-builtin';
                isActive = true;
            }
            
            mergedThemes.push({
                ...data,
                _type: type,
                _isBuiltIn: isBuiltIn,
                _isActiveResolved: isActive
            });
        });
        
        // Sort: Active first, then by name
        mergedThemes.sort((a, b) => {
            if (a._isActiveResolved === b._isActiveResolved) return a.name.localeCompare(b.name);
            return a._isActiveResolved ? -1 : 1;
        });
        
        renderGrid();
    } catch (e) {
        console.error("Error loading designs", e);
        designsGrid.innerHTML = `<div style="grid-column: 1/-1; color: #ef4444;">Error loading designs: ${e.message}</div>`;
    }
}

function serializeBuiltInTheme(t) {
    const fnToStr = (fn) => fn ? fn.toString().replace(/^function[^{]+{\s*/, '').replace(/}$/, '').trim() : '';
    const extractBody = (fnStr) => {
        const match = fnStr.match(/^[^{]*{\s*([\s\S]*)}\s*$/);
        return match ? match[1].trim() : fnStr; // rough extraction of body
    };

    return {
        id: t.id,
        name: t.id.toUpperCase(), // Built-ins might not have a formal name property exported easily
        isActive: true,
        palettes: "[\n  // Built-in palettes are hardcoded in the JS file.\n  // If you save this, you must define a real JSON array here.\n]",
        typography: "{\n  // Built-in typography\n}",
        renderBackground: extractBody(t.renderBackground ? t.renderBackground.toString() : ''),
        renderEffects: extractBody(t.renderEffects ? t.renderEffects.toString() : ''),
        getBorder: extractBody(t.getBorder ? t.getBorder.toString() : ''),
        renderLayout: extractBody(t.renderLayout ? t.renderLayout.toString() : '')
    };
}


// ── Render Grid with Real Thumbnails ──────────────────────
function renderGrid() {
    designsGrid.innerHTML = '';
    
    // Mock data for thumbnail generation
    const mockData = {
        tokenName: "BITCOIN",
        userName: "Satoshi",
        multiplier: 12.5,
        roi: 1150.0,
        profit: 45000,
        inv: 4000,
        initMC: 500000000,
        targetMC: 6000000000,
        finalValue: 49000,
        showBdt: false,
    };
    const mockTier = { id: 'mega_win', def: { label: 'MEGA WIN', badge: 'LEGEND', emotions: ['euphoric'] } };
    const mockCombo = { themeId: '', bgVariant: 0, charVariant: 0, accentIdx: 0, detailIdx: 0 };
    const randomizer = { pick: arr => arr[0] };

    mergedThemes.forEach(d => {
        const card = document.createElement('div');
        card.className = 'design-card';
        card.onclick = (e) => {
            if(e.target.tagName !== 'BUTTON') window.editDesign(d.id);
        };
        
        let typeLabel = d._type === 'type-builtin' ? 'Built-in Template' : 
                        d._type === 'type-overridden' ? 'Built-in (Overridden)' : 'Custom Design';
        
        // Generate Thumbnail HTML safely
        let thumbHTML = '';
        try {
            let themeObjToRender;
            if (d._type === 'type-builtin' || d._type === 'type-overridden') {
                // If it's overridden, we try to build it, but if it fails, fallback to built-in for preview
                // Actually, if overridden, let's use the override logic.
                if (d._type === 'type-builtin') {
                    themeObjToRender = builtInThemes[d.id];
                } else {
                    themeObjToRender = buildThemeObjectFromData(d) || builtInThemes[d.id];
                }
            } else {
                themeObjToRender = buildThemeObjectFromData(d);
            }
            
            mockCombo.themeId = d.id;
            const fullHtml = composeCard({ theme: themeObjToRender, data: mockData, tier: mockTier, combo: mockCombo, randomizer });
            thumbHTML = fullHtml;
        } catch(e) {
            thumbHTML = `<div style="width:1600px;height:900px;background:#ef444420;color:#ef4444;display:flex;align-items:center;justify-content:center;font-size:48px;">Preview Error</div>`;
            console.error("Thumb error for", d.id, e);
        }

        card.innerHTML = `
            <div class="design-thumb-container">
                <div class="design-thumb-scaler" style="transform: scale(0.225);">${thumbHTML}</div>
            </div>
            <div class="design-info">
                <div class="design-info-header">
                    <div>
                        <h3>${d.name || d.id}</h3>
                        <span class="design-type-badge ${d._type}">${typeLabel}</span>
                    </div>
                    <span class="design-status ${d._isActiveResolved ? 'status-active' : 'status-inactive'}">
                        ${d._isActiveResolved ? 'Active' : 'Inactive'}
                    </span>
                </div>
                
                <div class="design-actions">
                    <span class="text-muted" style="font-size: 11px; margin:0;">ID: ${d.id}</span>
                    <button class="btn-secondary" onclick="event.stopPropagation(); window.editDesign('${d.id}')">Manage</button>
                </div>
            </div>
        `;
        designsGrid.appendChild(card);
    });
    
    // Scale thumbnails perfectly on resize
    function resizeThumbs() {
        const containers = document.querySelectorAll('.design-thumb-container');
        containers.forEach(c => {
            const scaler = c.querySelector('.design-thumb-scaler');
            if(scaler) {
                const scale = c.clientWidth / 1600;
                scaler.style.transform = \`scale(\${scale})\`;
            }
        });
    }
    window.removeEventListener('resize', resizeThumbs);
    window.addEventListener('resize', resizeThumbs);
    setTimeout(resizeThumbs, 50); // initial calc
}

function buildThemeObjectFromData(d) {
    const theme = { id: d.id, name: d.name };
    try {
        const palettes = JSON.parse(d.palettes || '[{}]');
        theme.getPalette = (tierId, accentIdx) => ({ ...palettes[accentIdx % palettes.length] });
    } catch(e) { theme.getPalette = () => ({}); }
    
    try {
        const typoObj = JSON.parse(d.typography || '{}');
        theme.getTypography = () => typoObj;
    } catch(e) { theme.getTypography = () => ({}); }
    
    try { theme.renderBackground = new Function('pal', 'tierId', 'variant', d.renderBackground); } catch(e) { theme.renderBackground = () => ''; }
    try { theme.renderEffects = new Function('pal', 'tierId', 'detailIdx', d.renderEffects); } catch(e) { theme.renderEffects = () => ''; }
    try { theme.getBorder = new Function('pal', d.getBorder); } catch(e) { theme.getBorder = () => ''; }
    try { theme.renderLayout = new Function('{ cd, pal, typo, W, H, S }', d.renderLayout); } catch(e) { theme.renderLayout = () => ''; }
    
    return theme;
}


// ── Editor ────────────────────────────────────────────────

window.editDesign = (id) => {
    const design = mergedThemes.find(d => d.id === id);
    if (!design) return;
    
    editId.value = design.id;
    editorSubtitle.textContent = `ID: ${design.id}  •  ${design._type === 'type-builtin' ? 'Built-in' : 'Custom'}`;
    
    editName.value = design.name || design.id;
    editActive.checked = design._isActiveResolved;
    
    editPal.value = design.palettes || '[{}]';
    editTypo.value = design.typography || '{}';
    editBg.value = design.renderBackground || "return '';";
    editFx.value = design.renderEffects || "return '';";
    editBorder.value = design.getBorder || "return '';";
    editLayout.value = design.renderLayout || "return '';";
    
    // Deletion rules
    if (design._type === 'type-custom' || design._type === 'type-overridden') {
        delBtn.classList.remove('hidden');
        if (design._type === 'type-overridden') {
            deleteHint.style.display = 'block';
            delBtn.textContent = 'Remove Override (Restore Original)';
        } else {
            deleteHint.style.display = 'none';
            delBtn.textContent = 'Delete Custom Theme';
        }
    } else {
        delBtn.classList.add('hidden');
        deleteHint.style.display = 'none';
    }
    
    editorModal.classList.remove('hidden');
    updatePreview();
};

createBtn.addEventListener('click', () => {
    editId.value = 'theme_' + Date.now();
    editorSubtitle.textContent = `New Custom Theme`;
    editName.value = 'New Theme';
    editActive.checked = true; // Default true for new
    
    // Give a usable default template
    editPal.value = "[\n  {\n    \"bg\": \"#0f172a\",\n    \"text\": \"#ffffff\",\n    \"accent\": \"#38bdf8\",\n    \"positive\": \"#10b981\",\n    \"negative\": \"#ef4444\"\n  }\n]";
    editTypo.value = "{\n  \"display\": \"'Inter', sans-serif\",\n  \"displayWeight\": 800,\n  \"body\": \"'Inter', sans-serif\",\n  \"mono\": \"'Roboto Mono', monospace\"\n}";
    editBg.value = "return `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\" style=\"position:absolute;inset:0;\">\n  <rect width=\"100%\" height=\"100%\" fill=\"${pal.bg}\"/>\n</svg>`;";
    editFx.value = "return '';";
    editBorder.value = "return 'border: 1px solid rgba(255,255,255,0.1); border-radius: 24px;';";
    editLayout.value = "const { tok, usr, mul, roi, pStr, inv, ent, ext, profitColor, tokSz, mulSz } = cd;\nreturn `<div style=\"padding:${S}px; display:flex; flex-direction:column; justify-content:space-between; height:100%; box-sizing:border-box;\">\n  <div style=\"font-size:${tokSz}px; font-weight:800; color:${pal.accent};\">${tok}</div>\n  <div style=\"font-size:${mulSz}px; color:${profitColor}; font-weight:900;\">${mul}</div>\n  <div style=\"font-size:32px; color:rgba(255,255,255,0.7);\">ROI: ${roi}</div>\n</div>`;";
    
    delBtn.classList.add('hidden');
    deleteHint.style.display = 'none';
    editorModal.classList.remove('hidden');
    updatePreview();
});

closeEditor.addEventListener('click', () => editorModal.classList.add('hidden'));

saveBtn.addEventListener('click', async () => {
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    const id = editId.value;
    const data = {
        name: editName.value,
        isActive: editActive.checked,
        palettes: editPal.value,
        typography: editTypo.value,
        renderBackground: editBg.value,
        renderEffects: editFx.value,
        getBorder: editBorder.value,
        renderLayout: editLayout.value,
    };
    
    try {
        await setDoc(doc(db, "card_designs", id), data);
        editorModal.classList.add('hidden');
        loadAllData(); // reload
    } catch (e) {
        alert("Failed to save: " + e.message);
    } finally {
        saveBtn.textContent = 'Save Changes';
        saveBtn.disabled = false;
    }
});

delBtn.addEventListener('click', async () => {
    const isOverride = editId.value && builtInThemes[editId.value];
    const msg = isOverride 
        ? "Remove this override? The built-in template will become active again."
        : "Permanently delete this custom design?";
        
    if(!confirm(msg)) return;
    
    try {
        await deleteDoc(doc(db, "card_designs", editId.value));
        editorModal.classList.add('hidden');
        loadAllData();
    } catch (e) {
        alert("Failed to delete: " + e.message);
    }
});


// ── Preview Engine in Editor ──────────────────────────────
refreshPreviewBtn.addEventListener('click', updatePreview);

function updatePreview() {
    try {
        const d = {
            id: editId.value,
            name: editName.value,
            palettes: editPal.value,
            typography: editTypo.value,
            renderBackground: editBg.value,
            renderEffects: editFx.value,
            getBorder: editBorder.value,
            renderLayout: editLayout.value
        };
        const theme = buildThemeObjectFromData(d);
        
        // Mock data
        const data = {
            tokenName: "SOLANA",
            userName: "TraderX",
            multiplier: 3.5,
            roi: 250.0,
            profit: 8000,
            inv: 3200,
            initMC: 15000000,
            targetMC: 52500000,
            finalValue: 11200,
            showBdt: false,
        };
        
        const tier = { id: 'big_win', def: { label: 'BIG WIN', badge: 'BIG WIN', emotions: ['confident'] } };
        const combo = { themeId: theme.id, bgVariant: 0, charVariant: 0, accentIdx: 0, detailIdx: 0 };
        const randomizer = { pick: arr => arr[0] };
        
        const html = composeCard({ theme, data, tier, combo, randomizer });
        
        const node = document.getElementById('card-node');
        node.innerHTML = html;
        
        // Scale to fit preview container
        const cont = document.getElementById('preview-container');
        if(cont && node) {
            const scale = cont.clientWidth / 1600;
            node.style.width = '1600px';
            node.style.height = '900px';
            node.style.transform = `scale(${scale})`;
            node.style.transformOrigin = 'top left';
        }
        
    } catch (e) {
        console.error(e);
        document.getElementById('card-node').innerHTML = `<div style="color:#ef4444;padding:40px;font-size:24px;">Preview Error: ${e.message}</div>`;
    }
}

// Window resize scaling for editor modal
window.addEventListener('resize', () => {
    if(!editorModal.classList.contains('hidden')) updatePreview();
});
