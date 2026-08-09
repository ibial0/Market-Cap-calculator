import { auth, db } from '../config/firebase.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { collection, query, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { composeCard } from '../cards/renderer.js';

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

// Form elements
const editId = document.getElementById('edit-id');
const editName = document.getElementById('edit-name');
const editActive = document.getElementById('edit-active');
const editChar = document.getElementById('edit-character');
const editPal = document.getElementById('edit-palettes');
const editTypo = document.getElementById('edit-typography');
const editBg = document.getElementById('edit-bg');
const editFx = document.getElementById('edit-fx');
const editBorder = document.getElementById('edit-border');
const editLayout = document.getElementById('edit-layout');

let allDesigns = [];

// ── Auth Flow ─────────────────────────────────────────────
onAuthStateChanged(auth, (user) => {
    if (user) {
        authView.classList.add('hidden');
        dashView.classList.remove('hidden');
        logoutBtn.classList.remove('hidden');
        loadDesigns();
    } else {
        authView.classList.remove('hidden');
        dashView.classList.add('hidden');
        logoutBtn.classList.add('hidden');
    }
});

loginBtn.addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, emailInput.value, passInput.value);
        authError.classList.add('hidden');
    } catch (e) {
        authError.textContent = e.message;
        authError.classList.remove('hidden');
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));


// ── Load Designs ──────────────────────────────────────────
async function loadDesigns() {
    try {
        const q = query(collection(db, "card_designs"));
        const snapshot = await getDocs(q);
        
        allDesigns = [];
        snapshot.forEach(doc => {
            allDesigns.push({ id: doc.id, ...doc.data() });
        });
        
        renderGrid();
    } catch (e) {
        console.error("Error loading designs", e);
        alert("Failed to load designs. Check console.");
    }
}

function renderGrid() {
    designsGrid.innerHTML = '';
    allDesigns.forEach(d => {
        const card = document.createElement('div');
        card.className = 'design-card';
        card.innerHTML = `
            <h3>${d.name || d.id}</h3>
            <span class="design-status ${d.isActive ? 'status-active' : 'status-inactive'}">
                ${d.isActive ? 'Active' : 'Disabled'}
            </span>
            <div style="font-size:12px;opacity:0.6;margin-top:4px;">ID: ${d.id}</div>
            <div class="design-actions">
                <button class="btn-secondary" onclick="window.editDesign('${d.id}')">Edit</button>
            </div>
        `;
        designsGrid.appendChild(card);
    });
}


// ── Editor ────────────────────────────────────────────────

window.editDesign = (id) => {
    const design = allDesigns.find(d => d.id === id);
    if (!design) return;
    
    editId.value = design.id;
    editName.value = design.name || '';
    editActive.checked = design.isActive || false;
    editChar.checked = design.hasCharacter || false;
    
    editPal.value = design.palettes || '[{}]';
    editTypo.value = design.typography || '{}';
    editBg.value = design.renderBackground || "return '';";
    editFx.value = design.renderEffects || "return '';";
    editBorder.value = design.getBorder || "return '';";
    editLayout.value = design.renderLayout || "return '';";
    
    delBtn.classList.remove('hidden');
    editorModal.classList.remove('hidden');
    updatePreview();
};

createBtn.addEventListener('click', () => {
    editId.value = 'theme_' + Date.now();
    editName.value = 'New Theme';
    editActive.checked = false;
    editChar.checked = false;
    editPal.value = "[\n  {\n    \"bg\": \"#1a1a1a\",\n    \"text\": \"#ffffff\",\n    \"accent\": \"#00ff00\",\n    \"positive\": \"#00ff00\",\n    \"negative\": \"#ff0000\"\n  }\n]";
    editTypo.value = "{\n  \"display\": \"'Inter', sans-serif\",\n  \"displayWeight\": 700,\n  \"body\": \"'Inter', sans-serif\",\n  \"mono\": \"'Roboto Mono', monospace\"\n}";
    editBg.value = "return `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100%\" height=\"100%\" style=\"position:absolute;inset:0;\">\n  <rect width=\"100%\" height=\"100%\" fill=\"${pal.bg}\"/>\n</svg>`;";
    editFx.value = "return '';";
    editBorder.value = "return 'border: 1px solid rgba(255,255,255,0.1); border-radius: 20px;';";
    editLayout.value = "const { tok, mul, roi } = cd;\nreturn `<div style=\"padding:${S}px; display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%;\">\n  <div style=\"font-size:100px; font-weight:bold;\">${tok}</div>\n  <div style=\"font-size:150px; color:${pal.positive};\">${mul}</div>\n</div>`;";
    
    delBtn.classList.add('hidden');
    editorModal.classList.remove('hidden');
    updatePreview();
});

closeEditor.addEventListener('click', () => editorModal.classList.add('hidden'));

saveBtn.addEventListener('click', async () => {
    const id = editId.value;
    const data = {
        name: editName.value,
        isActive: editActive.checked,
        hasCharacter: editChar.checked,
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
        loadDesigns();
    } catch (e) {
        alert("Failed to save: " + e.message);
    }
});

delBtn.addEventListener('click', async () => {
    if(!confirm("Are you sure you want to delete this design?")) return;
    try {
        await deleteDoc(doc(db, "card_designs", editId.value));
        editorModal.classList.add('hidden');
        loadDesigns();
    } catch (e) {
        alert("Failed to delete: " + e.message);
    }
});


// ── Preview Engine ────────────────────────────────────────
refreshPreviewBtn.addEventListener('click', updatePreview);

function updatePreview() {
    try {
        const theme = buildThemeFromForm();
        
        // Mock data
        const data = {
            tokenName: "PEPE",
            userName: "Chad",
            multiplier: 5.2,
            roi: 420.69,
            profit: 15000,
            inv: 3000,
            initMC: 50000,
            targetMC: 260000,
            finalValue: 18000,
            showBdt: false,
        };
        
        // Mock tier
        const tier = {
            id: 'mega_win',
            def: { label: 'MEGA WIN', badge: 'MEGA WIN', emotions: ['euphoric'] }
        };
        
        const combo = { themeId: theme.id, bgVariant: 0, charVariant: 0, accentIdx: 0, detailIdx: 0 };
        
        // We need a simple randomizer mock
        const randomizer = { pick: arr => arr[0] };
        
        const html = composeCard({ theme, data, tier, combo, randomizer });
        
        const node = document.getElementById('card-node');
        node.innerHTML = html;
        
        // Scale to fit preview container
        const cont = document.getElementById('preview-container');
        const scale = cont.clientWidth / 1600;
        node.style.transform = `scale(${scale})`;
        node.style.transformOrigin = 'top left';
        
    } catch (e) {
        console.error(e);
        document.getElementById('card-node').innerHTML = `<div style="color:red;padding:20px;">Preview Error: ${e.message}</div>`;
    }
}

function buildThemeFromForm() {
    const theme = {
        id: editId.value,
        name: editName.value
    };
    
    const palettes = JSON.parse(editPal.value || '[{}]');
    theme.getPalette = (tierId, accentIdx) => ({ ...palettes[accentIdx % palettes.length] });
    
    const typoObj = JSON.parse(editTypo.value || '{}');
    theme.getTypography = () => typoObj;
    
    theme.renderBackground = new Function('pal', 'tierId', 'variant', editBg.value);
    theme.renderEffects = new Function('pal', 'tierId', 'detailIdx', editFx.value);
    theme.getBorder = new Function('pal', editBorder.value);
    theme.renderLayout = new Function('{ cd, pal, typo, W, H, S }', editLayout.value);
    
    return theme;
}

// Window resize scaling
window.addEventListener('resize', () => {
    if(!editorModal.classList.contains('hidden')) updatePreview();
});
