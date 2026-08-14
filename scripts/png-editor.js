// ═══════════════════════════════════════════════════════════
//  PNG TEMPLATE EDITOR — Complete Logic
//  Handles: load/new template, canvas scaling, draggable text
//  layers, properties panel, PNG upload, save to Firestore.
// ═══════════════════════════════════════════════════════════
import { auth, db } from '../config/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
    doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { DEFAULT_LAYERS } from '../cards/png-engine.js';

// ── Constants ─────────────────────────────────────────────
const CARD_W = 1600;
const CARD_H = 900;
const SNAP_DISTANCE = 10;
const TIER_GROUPS = [
    { label: 'Profit ranges', ids: Array.from({ length: 14 }, (_, index) => `profit_${index + 1}`) },
    { label: 'Loss ranges', ids: Array.from({ length: 4 }, (_, index) => `loss_${index + 1}`) },
];
const TIER_LABELS = {
    profit_1: '1X → 1.5X', profit_2: '1.5X → 2.5X', profit_3: '2.5X → 3.5X', profit_4: '3.5X → 5X',
    profit_5: '5X → 10X', profit_6: '10X → 20X', profit_7: '20X → 40X', profit_8: '40X → 75X',
    profit_9: '75X → 100X', profit_10: '100X → 200X', profit_11: '200X → 300X', profit_12: '300X → 400X',
    profit_13: '400X → 500X', profit_14: '500X+',
    loss_1: '0 → -1X', loss_2: '-1X → -2X', loss_3: '-2X → -5X', loss_4: '-5X+',
};

const FONT_OPTIONS = [
    { label: 'Inter', value: "'Inter', sans-serif" },
    { label: 'Outfit', value: "'Outfit', sans-serif" },
    { label: 'Roboto Mono', value: "'Roboto Mono', monospace" },
    { label: 'Bebas Neue', value: "'Bebas Neue', cursive" },
    { label: 'Montserrat', value: "'Montserrat', sans-serif" },
    { label: 'Poppins', value: "'Poppins', sans-serif" },
    { label: 'Orbitron', value: "'Orbitron', sans-serif" },
    { label: 'Rajdhani', value: "'Rajdhani', sans-serif" },
];

const MOCK_DATA = {
    tok: 'BITCOIN', usr: '@Satoshi',
    mul: '12.50x', roi: '+1,150%',
    pStr: '+$45,000', inv: '$4,000',
    fin: '$49,000', ent: '$500M', ext: '$6.25B',
    tierBadge: 'MEGA WIN',
    isProfit: true, profitColor: '#00ff88',
};

// HTML escape helper (prevents XSS in template strings)
function _esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}


// ── State ─────────────────────────────────────────────────
let template = {
    id: null,
    name: 'New PNG Template',
    tiers: [],
    isActive: false,
    displayMode: 'both',
    borderRadius: 0,
    bgUrl: null,
    bgDataUrl: null,
    bgWidth: CARD_W,
    bgHeight: CARD_H,
    layers: null, // set in init
    createdAt: null,
    updatedAt: null,
};

let selectedLayerId = null;
let canvasScale     = 1;
let isDirty         = false;

// Drag state
let dragState = null; // null | { layerId, startX, startY, origX, origY }

// ── DOM refs ─────────────────────────────────────────────
const elCanvas      = () => document.getElementById('editor-canvas');
const elLayerList   = () => document.getElementById('layer-list');
const elPropsForm   = () => document.getElementById('props-form');
const elPropsPlaceholder = () => document.getElementById('props-placeholder');
const elPropsName   = () => document.getElementById('props-layer-name');
const elLoading     = () => document.getElementById('editor-loading');
const elLoadingMsg  = () => document.getElementById('loading-msg');
const elToast       = () => document.getElementById('editor-toast');
const elScaleInfo   = () => document.getElementById('canvas-scale-info');
const elPosInfo     = () => document.getElementById('canvas-pos-info');
const elSnapInfo    = () => document.getElementById('canvas-snap-info');

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
async function init() {
    showLoading('Checking authentication…');

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = 'admin.html';
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
            showLoading('Loading template…');
            await loadTemplate(id);
        } else {
            // New template
            template.layers = DEFAULT_LAYERS.map(l => ({ ...l }));
        }

        hideLoading();
        buildTierPicker();
        setSelectedTiers(document.getElementById('tpl-tiers'), template.tiers || []);
        renderAll();
        setupEvents();
    });
}

async function loadTemplate(id) {
    try {
        const snap = await getDoc(doc(db, 'png_templates', id));
        if (!snap.exists()) {
            showToast('Template not found — starting fresh.', 'error');
            template.layers = DEFAULT_LAYERS.map(l => ({ ...l }));
            return;
        }
        const data = snap.data();
        template = { id, ...data };

        // Ensure all DEFAULT layers exist (in case new layers were added after template creation)
        DEFAULT_LAYERS.forEach(def => {
            if (!template.layers.find(l => l.id === def.id)) {
                template.layers.push({ ...def });
            }
        });

        // Populate toolbar / settings UI
        document.getElementById('tpl-name-input').value  = template.name || '';
        const tagSelect = document.getElementById('tpl-tiers');
        setSelectedTiers(tagSelect, template.tiers || []);
        document.getElementById('tpl-display').value     = template.displayMode || 'both';
        document.getElementById('tpl-radius').value      = template.borderRadius || 0;
        document.getElementById('tpl-active').checked    = template.isActive || false;

    } catch (e) {
        showToast('Load error: ' + e.message, 'error');
        template.layers = DEFAULT_LAYERS.map(l => ({ ...l }));
    }
}

// ═══════════════════════════════════════════════════════════
//  CANVAS RENDERING
// ═══════════════════════════════════════════════════════════
function renderAll() {
    updateCanvasScale();
    renderCanvasBg();
    renderCanvasLayers();
    ensureAlignmentGuides();
    renderLayerList();
    if (selectedLayerId) renderPropsPanel(selectedLayerId);
}

function buildTierPicker() {
    const container = document.getElementById('tpl-tiers');
    if (!container) return;
    container.innerHTML = TIER_GROUPS.map(group => `
        <div class="editor-tier-group">
            <span class="editor-tier-group-title">${group.label}</span>
            <div class="editor-tier-options">
                ${group.ids.map(id => `<button type="button" class="editor-tier-option" data-tier-id="${id}" aria-pressed="false">${TIER_LABELS[id]}</button>`).join('')}
            </div>
        </div>`).join('');
    container.addEventListener('click', event => {
        const option = event.target.closest('[data-tier-id]');
        if (!option) return;
        const isSelected = !option.classList.contains('selected');
        option.classList.toggle('selected', isSelected);
        option.setAttribute('aria-pressed', String(isSelected));
        template.tiers = getSelectedTiers(container);
        markDirty();
    });
}

function setSelectedTiers(container, tiers = []) {
    const selected = new Set(Array.isArray(tiers) ? tiers : []);
    container?.querySelectorAll('[data-tier-id]').forEach(option => {
        const isSelected = selected.has(option.dataset.tierId);
        option.classList.toggle('selected', isSelected);
        option.setAttribute('aria-pressed', String(isSelected));
    });
}

function getSelectedTiers(container) {
    return Array.from(container?.querySelectorAll('[data-tier-id].selected') || [], option => option.dataset.tierId);
}

function ensureAlignmentGuides() {
    const canvas = elCanvas();
    if (!canvas || canvas.querySelector('.alignment-guides')) return;
    const guides = document.createElement('div');
    guides.className = 'alignment-guides';
    guides.innerHTML = '<i class="alignment-guide vertical" data-guide="v"></i><i class="alignment-guide horizontal" data-guide="h"></i>';
    canvas.appendChild(guides);
}

function showAlignmentGuides(guides = {}) {
    const canvas = elCanvas();
    if (!canvas) return;
    const vertical = canvas.querySelector('[data-guide="v"]');
    const horizontal = canvas.querySelector('[data-guide="h"]');
    const showGuide = (guide, position, axis) => {
        if (!guide) return;
        const visible = Number.isFinite(position);
        guide.classList.toggle('visible', visible);
        if (visible) guide.style[axis] = `${Math.round(position)}px`;
    };
    showGuide(vertical, guides.x, 'left');
    showGuide(horizontal, guides.y, 'top');
    if (elSnapInfo()) elSnapInfo().textContent = guides.label ? `Guides: ${guides.label}` : 'Guides: ready';
}

function clearAlignmentGuides() {
    showAlignmentGuides({});
}

function layerAnchor(layer) {
    return layer.textAlign === 'right' ? layer.x : layer.x;
}

function snapLayerPosition(layer, x, y) {
    const targetsX = [{ value: 0, label: 'left edge' }, { value: CARD_W / 2, label: 'center' }, { value: CARD_W, label: 'right edge' }];
    const targetsY = [{ value: 0, label: 'top edge' }, { value: CARD_H / 2, label: 'middle' }, { value: CARD_H, label: 'bottom edge' }];

    template.layers?.forEach(other => {
        if (other.id === layer.id || !other.visible) return;
        targetsX.push({ value: layerAnchor(other), label: `${other.label} aligned` });
        targetsY.push({ value: other.y, label: `${other.label} aligned` });
    });

    const nearest = (value, targets) => targets.reduce((best, target) => {
        const distance = Math.abs(value - target.value);
        return distance < best.distance ? { ...target, distance } : best;
    }, { distance: Infinity });

    const xTarget = nearest(x, targetsX);
    const yTarget = nearest(y, targetsY);
    const snapped = { x: Math.max(0, Math.min(CARD_W, x)), y: Math.max(0, Math.min(CARD_H, y)), guides: {}, labels: [] };
    if (xTarget.distance <= SNAP_DISTANCE) {
        snapped.x = xTarget.value;
        snapped.guides.x = xTarget.value;
        snapped.labels.push(xTarget.label);
    }
    if (yTarget.distance <= SNAP_DISTANCE) {
        snapped.y = yTarget.value;
        snapped.guides.y = yTarget.value;
        snapped.labels.push(yTarget.label);
    }
    snapped.guides.label = snapped.labels.join(' + ');
    return snapped;
}

function updateCanvasScale() {
    const scroll = document.getElementById('canvas-scroll');
    if (!scroll) return;

    const availW = scroll.clientWidth  - 56;
    const availH = scroll.clientHeight - 56;
    canvasScale  = Math.min(availW / CARD_W, availH / CARD_H, 1);

    const canvas  = elCanvas();
    const wrapper = document.getElementById('canvas-wrapper');
    if (!canvas || !wrapper) return;

    canvas.style.transform = `scale(${canvasScale})`;
    wrapper.style.width    = Math.round(CARD_W * canvasScale) + 'px';
    wrapper.style.height   = Math.round(CARD_H * canvasScale) + 'px';

    if (elScaleInfo()) {
        elScaleInfo().textContent = `Scale: ${Math.round(canvasScale * 100)}%`;
    }
}

function renderCanvasBg() {
    const canvas = elCanvas();
    if (!canvas) return;

    // Remove existing background without touching the persistent guide overlay.
    canvas.querySelectorAll('.canvas-bg-img, .canvas-no-bg').forEach(old => old.remove());

    const src = template.bgDataUrl || template.bgUrl;
    if (src) {
        const img = document.createElement('img');
        img.className    = 'canvas-bg-img';
        img.src          = src;
        img.crossOrigin  = 'anonymous';
        img.style.cssText = `position:absolute;inset:0;width:${CARD_W}px;height:${CARD_H}px;object-fit:cover;pointer-events:none;display:block;`;
        canvas.style.borderRadius = (template.borderRadius || 0) + 'px';
        canvas.insertBefore(img, canvas.firstChild);
    } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'canvas-no-bg';
        placeholder.innerHTML = `
            <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Click <strong>Upload PNG / BG</strong> in the toolbar<br>to set the card background</p>
        `;
        canvas.insertBefore(placeholder, canvas.firstChild);
    }
}

function renderCanvasLayers() {
    const canvas = elCanvas();
    if (!canvas) return;

    // Remove existing layer elements only
    canvas.querySelectorAll('.canvas-layer').forEach(el => el.remove());

    if (!template.layers) return;

    template.layers.forEach(layer => {
        const el = buildLayerElement(layer);
        canvas.appendChild(el);
    });
}

function buildLayerElement(layer) {
    const displayMode = template.displayMode || 'both';
    const el = document.createElement('div');
    el.className      = 'canvas-layer' + (selectedLayerId === layer.id ? ' selected' : '') + (!layer.visible ? ' hidden-layer' : '');
    el.dataset.id     = layer.id;

    // Get display value — static labels use their own saved text
    const rawVal = layer.field === 'static_label'
        ? (layer.staticText || '')
        : (MOCK_DATA[layer.field] || '');
    let value = rawVal;
    if (displayMode === 'roi'        && layer.field === 'mul') value = '';
    if (displayMode === 'multiplier' && layer.field === 'roi') value = '';

    el.textContent = layer.visible ? (value || `[${layer.label}]`) : '';

    const color = layer.useProfit ? MOCK_DATA.profitColor : layer.color;

    // Build inline styles
    const strokeCSS = (layer.strokeWidth > 0)
        ? `-webkit-text-stroke:${layer.strokeWidth}px ${layer.stroke || '#000'};paint-order:stroke fill;`
        : '';

    let posCSS;
    if (layer.textAlign === 'right') {
        posCSS = `right:${CARD_W - layer.x}px;top:${layer.y}px;`;
    } else if (layer.textAlign === 'center') {
        posCSS = `left:${layer.x}px;top:${layer.y}px;transform:translateX(-50%)${layer.rotation ? ` rotate(${layer.rotation}deg)` : ''};`;
    } else {
        posCSS = `left:${layer.x}px;top:${layer.y}px;${layer.rotation ? `transform:rotate(${layer.rotation}deg);` : ''}`;
    }

    el.style.cssText = `
        position:absolute;
        ${posCSS}
        font-size:${layer.fontSize}px;
        font-family:${layer.fontFamily};
        font-weight:${layer.fontWeight};
        color:${color};
        opacity:${layer.opacity};
        text-align:${layer.textAlign};
        letter-spacing:${layer.letterSpacing || 0}px;
        text-shadow:${layer.textShadow || 'none'};
        ${strokeCSS}
        white-space:nowrap;
        line-height:1.1;
        user-select:none;
        -webkit-user-select:none;
        cursor:grab;
        z-index:${layer.visible ? 10 : 0};
        display:${layer.visible ? 'block' : 'none'};
    `;

    // Mouse drag start
    el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        selectLayer(layer.id);
        dragState = {
            layerId:  layer.id,
            startX:   e.clientX,
            startY:   e.clientY,
            origX:    layer.x,
            origY:    layer.y,
        };
        el.classList.add('dragging');
    });

    // Touch drag start
    el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        selectLayer(layer.id);
        dragState = {
            layerId:  layer.id,
            startX:   touch.clientX,
            startY:   touch.clientY,
            origX:    layer.x,
            origY:    layer.y,
        };
    }, { passive: false });

    return el;
}

function refreshLayerElement(layerId) {
    const canvas = elCanvas();
    if (!canvas) return;
    const old = Array.from(canvas.querySelectorAll('.canvas-layer')).find(el => el.dataset.id === layerId);
    const layer = getLayer(layerId);
    if (!layer) return;
    const newEl = buildLayerElement(layer);
    if (old) {
        canvas.replaceChild(newEl, old);
    } else {
        canvas.appendChild(newEl);
    }
}

// ═══════════════════════════════════════════════════════════
//  LAYER LIST (left panel)
// ═══════════════════════════════════════════════════════════
function renderLayerList() {
    const container = elLayerList();
    if (!container || !template.layers) return;

    container.innerHTML = '';
    template.layers.forEach(layer => {
        const item = document.createElement('div');
        item.className = 'layer-item' +
            (selectedLayerId === layer.id ? ' selected' : '') +
            (!layer.visible ? ' hidden-layer' : '');
        item.dataset.id = layer.id;

        const previewVal = layer.field === 'static_label'
            ? (layer.staticText || '[Static Label]')
            : (MOCK_DATA[layer.field] || '—');

        item.innerHTML = `
            <button class="layer-vis-btn ${layer.visible ? 'visible' : ''}" data-vis="${layer.id}" title="${layer.visible ? 'Visible' : 'Hidden'}">
                ${layer.visible
                    ? `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
                    : `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
                }
            </button>
            <span class="layer-label">${layer.label}</span>
            <span class="layer-preview-val">${previewVal}</span>
        `;

        // Click item → select layer
        item.addEventListener('click', (e) => {
            if (e.target.closest('[data-vis]')) return;
            selectLayer(layer.id);
        });

        // Visibility toggle
        item.querySelector('[data-vis]').addEventListener('click', (e) => {
            e.stopPropagation();
            layer.visible = !layer.visible;
            refreshLayerElement(layer.id);
            renderLayerList();
            if (selectedLayerId === layer.id) renderPropsPanel(layer.id);
            markDirty();
        });

        container.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════════════
//  SELECTION
// ═══════════════════════════════════════════════════════════
function selectLayer(id) {
    if (selectedLayerId === id) return;
    selectedLayerId = id;

    // Update canvas layer outlines
    elCanvas()?.querySelectorAll('.canvas-layer').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
    });

    // Update layer list highlight
    elLayerList()?.querySelectorAll('.layer-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
    });

    renderPropsPanel(id);

    const layer = getLayer(id);
    if (layer && elPosInfo()) {
        elPosInfo().textContent = `X: ${layer.x}  Y: ${layer.y}`;
    }
    if (layer && elPropsName()) {
        elPropsName().textContent = layer.label;
    }
}

function getLayer(id) {
    return template.layers?.find(l => l.id === id) || null;
}

// ═══════════════════════════════════════════════════════════
//  PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════
function renderPropsPanel(layerId) {
    const layer = getLayer(layerId);
    const placeholder = elPropsPlaceholder();
    const form        = elPropsForm();
    if (!layer) {
        if (placeholder) placeholder.style.display = '';
        if (form)        form.style.display = 'none';
        if (elPropsName()) elPropsName().textContent = 'Properties';
        return;
    }

    if (placeholder) placeholder.style.display = 'none';
    if (form)        form.style.display = 'flex';
    if (!form) return;

    form.style.flexDirection = 'column';
    form.style.gap = '12px';

    const fontOptsHTML = FONT_OPTIONS.map(f =>
        `<option value="${f.value}" ${layer.fontFamily === f.value ? 'selected' : ''}>${f.label}</option>`
    ).join('');

    form.innerHTML = `
        ${layer.field === 'static_label' ? `
        <!-- STATIC TEXT (only for static label layers) -->
        <div class="prop-group" style="border:1px solid var(--ed-accent);border-radius:8px;padding:10px;">
            <div class="prop-group-title" style="color:var(--ed-accent);">📝 Static Text Content</div>
            <div style="font-size:10px;color:var(--ed-muted);margin-bottom:8px;">
                This text is fixed — it will always appear exactly as typed on every user's card. 
                Position and style can still be changed freely.
            </div>
            <div class="prop-row">
                <input type="text" class="prop-input" id="prop-static-text"
                    value="${_esc(layer.staticText || '')}"
                    placeholder="Type your label text here…"
                    style="width:100%;font-size:14px;font-weight:600;">
            </div>
        </div>
        ` : ''}

        <!-- POSITION -->
        <div class="prop-group">
            <div class="prop-group-title">Position (px on 1600×900)</div>
            <div class="prop-row-2col">
                <div class="prop-col">
                    <div class="prop-col-label">X</div>
                    <input type="number" class="prop-input" id="prop-x" value="${layer.x}" step="1">
                </div>
                <div class="prop-col">
                    <div class="prop-col-label">Y</div>
                    <input type="number" class="prop-input" id="prop-y" value="${layer.y}" step="1">
                </div>
            </div>
            <div class="prop-row">
                <span class="prop-label">Align</span>
                <select class="prop-select" id="prop-align">
                    <option value="left"   ${layer.textAlign === 'left'   ? 'selected' : ''}>Left (X = left edge)</option>
                    <option value="center" ${layer.textAlign === 'center' ? 'selected' : ''}>Center (X = center)</option>
                    <option value="right"  ${layer.textAlign === 'right'  ? 'selected' : ''}>Right (X = right edge)</option>
                </select>
            </div>
            <div class="prop-row">
                <span class="prop-label">Rotation</span>
                <input type="number" class="prop-input" id="prop-rotation" value="${layer.rotation || 0}" min="-180" max="180" step="1" style="max-width:70px;">
                <span style="font-size:11px;color:var(--ed-muted);margin-left:4px;">deg</span>
            </div>
        </div>

        <!-- TYPOGRAPHY -->
        <div class="prop-group">
            <div class="prop-group-title">Typography</div>
            <div class="prop-row">
                <span class="prop-label">Font</span>
                <select class="prop-select" id="prop-font">${fontOptsHTML}</select>
            </div>
            <div class="prop-row-2col">
                <div class="prop-col">
                    <div class="prop-col-label">Size (px)</div>
                    <input type="number" class="prop-input" id="prop-size" value="${layer.fontSize}" min="8" max="400" step="1">
                </div>
                <div class="prop-col">
                    <div class="prop-col-label">Weight</div>
                    <select class="prop-select" id="prop-weight" style="font-size:11px;">
                        <option value="400" ${layer.fontWeight == 400 ? 'selected' : ''}>Regular (400)</option>
                        <option value="500" ${layer.fontWeight == 500 ? 'selected' : ''}>Medium (500)</option>
                        <option value="600" ${layer.fontWeight == 600 ? 'selected' : ''}>SemiBold (600)</option>
                        <option value="700" ${layer.fontWeight == 700 ? 'selected' : ''}>Bold (700)</option>
                        <option value="800" ${layer.fontWeight == 800 ? 'selected' : ''}>ExtraBold (800)</option>
                        <option value="900" ${layer.fontWeight == 900 ? 'selected' : ''}>Black (900)</option>
                    </select>
                </div>
            </div>
            <div class="prop-row">
                <span class="prop-label">Spacing</span>
                <input type="number" class="prop-input" id="prop-spacing" value="${layer.letterSpacing || 0}" min="-10" max="50" step="1" style="max-width:70px;">
                <span style="font-size:11px;color:var(--ed-muted);margin-left:4px;">px</span>
            </div>
        </div>

        <!-- COLOR -->
        <div class="prop-group">
            <div class="prop-group-title">Color & Opacity</div>
            <div class="prop-row">
                <span class="prop-label">Color</span>
                <input type="color" class="prop-input" id="prop-color" value="${_normalizeHex(layer.color)}">
                <input type="text" class="prop-input" id="prop-color-hex"
                    value="${layer.color}" maxlength="9"
                    style="max-width:90px;font-family:'Roboto Mono',monospace;font-size:11px;">
            </div>
            <div class="prop-row">
                <span class="prop-label">Opacity</span>
                <input type="range" id="prop-opacity-range"
                    min="0" max="1" step="0.01" value="${layer.opacity}"
                    style="flex:1;accent-color:var(--ed-accent);">
                <input type="number" class="prop-input" id="prop-opacity"
                    value="${layer.opacity}" min="0" max="1" step="0.05"
                    style="max-width:60px;font-family:'Roboto Mono',monospace;font-size:11px;">
            </div>
            <div class="prop-row">
                <label class="prop-toggle">
                    <input type="checkbox" id="prop-use-profit" ${layer.useProfit ? 'checked' : ''}>
                    <span class="toggle-track"></span>
                    <span class="prop-toggle-label">Auto profit color (green/red)</span>
                </label>
            </div>
        </div>

        <!-- STROKE -->
        <div class="prop-group">
            <div class="prop-group-title">Stroke / Outline</div>
            <div class="prop-row">
                <span class="prop-label">Width</span>
                <input type="number" class="prop-input" id="prop-stroke-width"
                    value="${layer.strokeWidth || 0}" min="0" max="20" step="0.5"
                    style="max-width:70px;">
                <span style="font-size:11px;color:var(--ed-muted);margin-left:4px;">px</span>
            </div>
            <div class="prop-row">
                <span class="prop-label">Color</span>
                <input type="color" class="prop-input" id="prop-stroke-color" value="${_normalizeHex(layer.stroke || '#000000')}">
                <input type="text" class="prop-input" id="prop-stroke-hex"
                    value="${layer.stroke || '#000000'}" maxlength="9"
                    style="max-width:90px;font-family:'Roboto Mono',monospace;font-size:11px;">
            </div>
        </div>

        <!-- SHADOW -->
        <div class="prop-group">
            <div class="prop-group-title">Text Shadow (CSS)</div>
            <div class="prop-row">
                <input type="text" class="prop-input" id="prop-shadow"
                    value="${layer.textShadow || ''}"
                    placeholder="e.g. 0 0 30px #000 or none">
            </div>
            <div style="padding:4px 10px 8px;font-size:10px;color:var(--ed-muted);">
                Format: offsetX offsetY blur color<br>
                Example: <code style="color:var(--ed-accent)">0 4px 20px rgba(0,0,0,0.8)</code>
            </div>
            <!-- Shadow presets -->
            <div style="padding:0 10px 10px;display:flex;flex-wrap:wrap;gap:5px;">
                <button class="shadow-preset" data-val="">None</button>
                <button class="shadow-preset" data-val="0 2px 8px rgba(0,0,0,0.9)">Dark Drop</button>
                <button class="shadow-preset" data-val="0 0 24px rgba(0,255,136,0.6)">Green Glow</button>
                <button class="shadow-preset" data-val="0 0 32px rgba(56,189,248,0.7)">Blue Glow</button>
                <button class="shadow-preset" data-val="0 0 20px rgba(255,215,0,0.8)">Gold Glow</button>
                <button class="shadow-preset" data-val="2px 2px 0 #000, -2px -2px 0 #000">Hard Outline</button>
            </div>
        </div>

        <!-- VISIBILITY -->
        <div class="prop-group">
            <div class="prop-group-title">Visibility</div>
            <div class="prop-row">
                <label class="prop-toggle">
                    <input type="checkbox" id="prop-visible" ${layer.visible ? 'checked' : ''}>
                    <span class="toggle-track"></span>
                    <span class="prop-toggle-label">Visible on card</span>
                </label>
            </div>
        </div>
    `;

    // Bind all property change events
    _bindPropEvents(layer);
}

function _bindPropEvents(layer) {
    const bind = (id, prop, transform) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', (e) => {
            const val = transform ? transform(e.target.value) : e.target.value;
            layer[prop] = val;
            refreshLayerElement(layer.id);
            markDirty();
            if (id === 'prop-x' || id === 'prop-y') {
                if (elPosInfo()) elPosInfo().textContent = `X: ${layer.x}  Y: ${layer.y}`;
            }
        });
    };

    bind('prop-x',        'x',             Number);
    bind('prop-y',        'y',             Number);
    bind('prop-align',    'textAlign',     null);
    bind('prop-rotation', 'rotation',      Number);
    bind('prop-font',     'fontFamily',    null);
    bind('prop-size',     'fontSize',      Number);
    bind('prop-weight',   'fontWeight',    v => String(v));
    bind('prop-spacing',  'letterSpacing', Number);
    bind('prop-shadow',   'textShadow',    null);

    // Static label text: save to layer.staticText (not a regular data field)
    const staticInp = document.getElementById('prop-static-text');
    if (staticInp) {
        staticInp.addEventListener('input', (e) => {
            layer.staticText = e.target.value;
            refreshLayerElement(layer.id);
            renderLayerList();
            markDirty();
        });
    }

    // Color: sync picker ↔ hex text
    const colorPicker = document.getElementById('prop-color');
    const colorHex    = document.getElementById('prop-color-hex');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            layer.color = e.target.value;
            if (colorHex) colorHex.value = e.target.value;
            refreshLayerElement(layer.id);
            markDirty();
        });
    }
    if (colorHex) {
        colorHex.addEventListener('input', (e) => {
            const v = e.target.value.trim();
            if (/^#[0-9a-f]{3,8}$/i.test(v)) {
                layer.color = v;
                if (colorPicker) colorPicker.value = _normalizeHex(v);
                refreshLayerElement(layer.id);
                markDirty();
            }
        });
    }

    // Opacity: sync range ↔ number
    const opRange = document.getElementById('prop-opacity-range');
    const opNum   = document.getElementById('prop-opacity');
    const syncOp  = (val) => {
        layer.opacity = parseFloat(val);
        if (opRange) opRange.value = val;
        if (opNum)   opNum.value   = val;
        refreshLayerElement(layer.id);
        markDirty();
    };
    if (opRange) opRange.addEventListener('input', e => syncOp(e.target.value));
    if (opNum)   opNum.addEventListener('input',   e => syncOp(e.target.value));

    // Stroke color
    const strokePicker = document.getElementById('prop-stroke-color');
    const strokeHex    = document.getElementById('prop-stroke-hex');
    if (strokePicker) {
        strokePicker.addEventListener('input', (e) => {
            layer.stroke = e.target.value;
            if (strokeHex) strokeHex.value = e.target.value;
            refreshLayerElement(layer.id);
            markDirty();
        });
    }
    if (strokeHex) {
        strokeHex.addEventListener('input', (e) => {
            const v = e.target.value.trim();
            if (/^#[0-9a-f]{3,8}$/i.test(v)) {
                layer.stroke = v;
                if (strokePicker) strokePicker.value = _normalizeHex(v);
                refreshLayerElement(layer.id);
                markDirty();
            }
        });
    }

    bind('prop-stroke-width', 'strokeWidth', Number);

    // Toggle: use profit color
    const useProfit = document.getElementById('prop-use-profit');
    if (useProfit) {
        useProfit.addEventListener('change', (e) => {
            layer.useProfit = e.target.checked;
            refreshLayerElement(layer.id);
            markDirty();
        });
    }

    // Toggle: visible
    const visible = document.getElementById('prop-visible');
    if (visible) {
        visible.addEventListener('change', (e) => {
            layer.visible = e.target.checked;
            refreshLayerElement(layer.id);
            renderLayerList();
            markDirty();
        });
    }

    // Shadow presets
    document.querySelectorAll('.shadow-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            layer.textShadow = val;
            const inp = document.getElementById('prop-shadow');
            if (inp) inp.value = val;
            refreshLayerElement(layer.id);
            markDirty();
        });
    });
}

// ═══════════════════════════════════════════════════════════
//  EVENT SETUP
// ═══════════════════════════════════════════════════════════
function setupEvents() {
    // Window resize → rescale canvas
    window.addEventListener('resize', _debounce(() => {
        updateCanvasScale();
    }, 120));

    // Global mouse move / up for drag
    document.addEventListener('mousemove', (e) => {
        if (!dragState) return;
        const dx = (e.clientX - dragState.startX) / canvasScale;
        const dy = (e.clientY - dragState.startY) / canvasScale;
        const layer = getLayer(dragState.layerId);
        if (!layer) return;
        const snapped = snapLayerPosition(layer, Math.round(dragState.origX + dx), Math.round(dragState.origY + dy));
        layer.x = snapped.x;
        layer.y = snapped.y;
        showAlignmentGuides(snapped.guides);
        refreshLayerElement(dragState.layerId);

        if (elPosInfo()) elPosInfo().textContent = `X: ${layer.x}  Y: ${layer.y}`;

        // Live-update position inputs in panel if visible
        const px = document.getElementById('prop-x');
        const py = document.getElementById('prop-y');
        if (px) px.value = layer.x;
        if (py) py.value = layer.y;

        markDirty();
    });

    document.addEventListener('mouseup', () => {
        if (!dragState) return;
        const el = Array.from(elCanvas()?.querySelectorAll('.canvas-layer') || []).find(node => node.dataset.id === dragState.layerId);
        if (el) el.classList.remove('dragging');
        dragState = null;
        clearAlignmentGuides();
    });

    // Touch drag
    document.addEventListener('touchmove', (e) => {
        if (!dragState) return;
        e.preventDefault();
        const touch = e.touches[0];
        const dx = (touch.clientX - dragState.startX) / canvasScale;
        const dy = (touch.clientY - dragState.startY) / canvasScale;
        const layer = getLayer(dragState.layerId);
        if (!layer) return;
        const snapped = snapLayerPosition(layer, Math.round(dragState.origX + dx), Math.round(dragState.origY + dy));
        layer.x = snapped.x;
        layer.y = snapped.y;
        showAlignmentGuides(snapped.guides);
        refreshLayerElement(dragState.layerId);
        markDirty();
    }, { passive: false });

    document.addEventListener('touchend', () => { dragState = null; clearAlignmentGuides(); });

    // Click on canvas bg (not a layer) → deselect
    elCanvas()?.addEventListener('click', (e) => {
        if (!e.target.closest('.canvas-layer')) {
            selectedLayerId = null;
            elCanvas()?.querySelectorAll('.canvas-layer').forEach(el => el.classList.remove('selected'));
            elLayerList()?.querySelectorAll('.layer-item').forEach(el => el.classList.remove('selected'));
            if (elPropsPlaceholder()) elPropsPlaceholder().style.display = '';
            if (elPropsForm()) elPropsForm().style.display = 'none';
            if (elPropsName()) elPropsName().textContent = 'Properties';
        }
    });

    // ── Toolbar buttons ──
    document.getElementById('btn-back')?.addEventListener('click', () => {
        if (isDirty && !confirm('You have unsaved changes. Leave without saving?')) return;
        window.location.href = 'admin.html';
    });

    // ── Paste Image URL (primary method — 100% quality) ──
    document.getElementById('btn-paste-url')?.addEventListener('click', () => {
        const url = prompt(
            'Paste the direct image URL from Imgur, imgBB, or any image host:\n\n' +
            'Example: https://i.imgur.com/abc123.png\n\n' +
            'Tip: Upload your PNG at imgur.com → right-click image → Copy Image Address'
        );
        if (!url || !url.trim()) return;
        handleImageURL(url.trim());
    });

    // ── Browse File (local preview + auto-converts to data URL) ──
    document.getElementById('btn-upload-bg')?.addEventListener('click', () => {
        document.getElementById('bg-file-input')?.click();
    });

    document.getElementById('bg-file-input')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) handleFileUpload(file);
        e.target.value = '';
    });

    document.getElementById('btn-reset-layers')?.addEventListener('click', () => {
        if (!confirm('Reset all layers to default positions and styles?')) return;
        template.layers = DEFAULT_LAYERS.map(l => ({ ...l }));
        selectedLayerId  = null;
        renderAll();
        if (elPropsPlaceholder()) elPropsPlaceholder().style.display = '';
        if (elPropsForm()) elPropsForm().style.display = 'none';
        if (elPropsName()) elPropsName().textContent = 'Properties';
        showToast('Layers reset to defaults.');
        markDirty();
    });

    // ── Fix Alignment: center dynamic value layers ─────────
    // Sets mul, roi, pStr to textAlign:center at x:800 (card midpoint)
    // so numbers of any length stay centered relative to each other.
    document.getElementById('btn-fix-center')?.addEventListener('click', () => {
        if (!template.layers) return;
        const CENTER_LAYERS = ['mul', 'roi', 'pStr', 'fin'];
        let fixed = 0;
        template.layers.forEach(layer => {
            if (CENTER_LAYERS.includes(layer.id)) {
                layer.textAlign = 'center';
                layer.x = CARD_W / 2; // 800px — horizontal center
                fixed++;
            }
        });
        renderAll();
        showToast(`✅ ${fixed} layers centered at card midpoint. Save to apply.`, 'success');
        markDirty();
    });

    // ── Add Static Label Layer ─────────────────────────────
    document.getElementById('btn-add-static-label')?.addEventListener('click', () => {
        if (!template.layers) return;
        const newId   = 'custom_' + Date.now();
        const newLayer = {
            id:           newId,
            label:        'Custom Label',
            field:        'static_label',
            staticText:   'YOUR TEXT HERE',
            x: 80, y: 450,
            fontSize:     48,
            fontFamily:   "'Outfit', sans-serif",
            fontWeight:   '700',
            color:        '#ffffff',
            opacity:      1,
            textAlign:    'left',
            letterSpacing: 2,
            textShadow:   '',
            stroke:       '#000000',
            strokeWidth:  0,
            rotation:     0,
            visible:      true,
            useProfit:    false,
        };
        template.layers.push(newLayer);
        renderAll();
        selectLayer(newId);
        showToast('Static label added. Type your text in the Properties panel.');
        markDirty();
    });

    document.getElementById('btn-save')?.addEventListener('click', () => {
        saveTemplate();
    });

    // ── Template settings ──
    document.getElementById('tpl-name-input')?.addEventListener('input', (e) => {
        template.name = e.target.value.trim() || 'New PNG Template';
        markDirty();
    });

    document.getElementById('tpl-display')?.addEventListener('change', (e) => {
        template.displayMode = e.target.value;
        renderCanvasLayers(); // update layer visibility preview
        markDirty();
    });

    document.getElementById('tpl-radius')?.addEventListener('input', (e) => {
        template.borderRadius = parseInt(e.target.value) || 0;
        if (elCanvas()) elCanvas().style.borderRadius = template.borderRadius + 'px';
        markDirty();
    });

    document.getElementById('tpl-active')?.addEventListener('change', (e) => {
        template.isActive = e.target.checked;
        markDirty();
    });

    // ── Keyboard shortcuts ──
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveTemplate();
        }
        // Arrow keys to nudge selected layer
        if (selectedLayerId && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
            const layer = getLayer(selectedLayerId);
            if (!layer) return;
            const step = e.shiftKey ? 10 : 1;
            if (e.key === 'ArrowLeft')  layer.x -= step;
            if (e.key === 'ArrowRight') layer.x += step;
            if (e.key === 'ArrowUp')    layer.y -= step;
            if (e.key === 'ArrowDown')  layer.y += step;
            refreshLayerElement(selectedLayerId);
            const px = document.getElementById('prop-x');
            const py = document.getElementById('prop-y');
            if (px) px.value = layer.x;
            if (py) py.value = layer.y;
            if (elPosInfo()) elPosInfo().textContent = `X: ${layer.x}  Y: ${layer.y}`;
            markDirty();
            e.preventDefault();
        }
    });
}

// ═══════════════════════════════════════════════════════════
//  IMAGE INPUT — URL Paste (Primary, 100% quality)
// ═══════════════════════════════════════════════════════════
function handleImageURL(url) {
    showLoading('Loading image from URL…');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        template.bgUrl     = url;          // Original full-quality URL
        template.bgDataUrl = url;          // Use URL directly for preview
        template.bgWidth   = img.naturalWidth;
        template.bgHeight  = img.naturalHeight;

        hideLoading();
        renderCanvasBg();
        markDirty();
        showToast('Background loaded! Remember to Save.', 'success');
    };
    img.onerror = () => {
        hideLoading();
        showToast('Could not load image from URL. Make sure it is a direct image link (e.g. ending in .png or .jpg).', 'error');
    };
    img.src = url;
}

// ═══════════════════════════════════════════════════════════
//  IMAGE INPUT — File Upload (Local preview, converts to data URL)
// ═══════════════════════════════════════════════════════════
function handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a PNG, JPEG, or WebP image.', 'error');
        return;
    }

    showLoading('Loading image…');

    const reader = new FileReader();
    reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const img = new Image();
        img.onload = () => {
            template.bgDataUrl = dataUrl;   // Full-quality data URL for preview
            template.bgUrl     = null;      // No external URL yet
            template.bgWidth   = img.naturalWidth;
            template.bgHeight  = img.naturalHeight;

            hideLoading();
            renderCanvasBg();
            markDirty();
            showToast('Preview loaded! For best quality, also paste the image URL from Imgur/imgBB.', 'success');
        };
        img.onerror = () => {
            hideLoading();
            showToast('Could not read image.', 'error');
        };
        img.src = dataUrl;
    };
    reader.onerror = () => {
        hideLoading();
        showToast('Could not read the file.', 'error');
    };
    reader.readAsDataURL(file);
}

// ═══════════════════════════════════════════════════════════
//  SAVE
// ═══════════════════════════════════════════════════════════
async function saveTemplate() {
    const saveBtn = document.getElementById('btn-save');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

    showLoading('Saving template…');

    try {
        // Generate ID if new
        if (!template.id) {
            template.id = 'pngtpl_' + Date.now();
        }

        // Validate: must have either a URL or a local data URL
        if (!template.bgUrl && !template.bgDataUrl) {
            showToast('Please set a background image first! Use "Paste Image URL" or "Browse File".', 'error');
            hideLoading();
            return;
        }

        // If only local file (no URL), warn but allow save
        if (!template.bgUrl && template.bgDataUrl) {
            // Check if data URL is too large for Firestore (1MB doc limit)
            const sizeKB = Math.round((template.bgDataUrl.length * 0.75) / 1024);
            if (sizeKB > 900) {
                showToast('Image too large for direct save (' + sizeKB + 'KB). Please use "Paste Image URL" with Imgur/imgBB instead.', 'error');
                hideLoading();
                return;
            }
        }

        // Save to Firestore
        const now = new Date().toISOString();
        const data = {
            name:         template.name || 'New PNG Template',
            tiers:        template.tiers || [],
            isActive:     template.isActive || false,
            displayMode:  template.displayMode || 'both',
            borderRadius: template.borderRadius || 0,
            bgUrl:        template.bgUrl || null,       // External URL (full quality)
            bgDataUrl:    template.bgUrl ? null : template.bgDataUrl, // Only store data URL if no external URL
            bgWidth:      template.bgWidth  || CARD_W,
            bgHeight:     template.bgHeight || CARD_H,
            layers:       template.layers.map(l => ({ ...l })),
            updatedAt:    now,
        };

        if (!template.createdAt) {
            data.createdAt   = now;
            template.createdAt = now;
        }

        await setDoc(doc(db, 'png_templates', template.id), data, { merge: true });

        // Update URL without reload so Back button works
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('id', template.id);
        window.history.replaceState({}, '', newUrl.toString());

        isDirty = false;
        hideLoading();
        showToast('Template saved successfully!', 'success');

    } catch (e) {
        hideLoading();
        showToast('Save failed: ' + e.message, 'error');
        console.error('[PNGEditor] Save error:', e);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Template`;
        }
    }
}

// ═══════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════
function showLoading(msg = 'Loading…') {
    const el = elLoading();
    if (el) el.classList.remove('hidden');
    const msgEl = elLoadingMsg();
    if (msgEl) msgEl.textContent = msg;
}

function hideLoading() {
    const el = elLoading();
    if (el) el.classList.add('hidden');
}

function showToast(msg, type = '') {
    const el = elToast();
    if (!el) return;
    el.textContent = msg;
    el.className   = 'editor-toast' + (type ? ' ' + type : '');
    // Force reflow then show
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 3500);
}

function markDirty() {
    isDirty = true;
}

function _debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function _normalizeHex(val) {
    if (!val) return '#000000';
    // Convert shorthand #abc → #aabbcc for color input
    const s = val.replace('#', '');
    if (s.length === 3) return '#' + s.split('').map(c => c + c).join('');
    if (s.length === 6) return '#' + s;
    return val.startsWith('#') ? val : '#000000';
}

function _ext(mimeType) {
    if (mimeType === 'image/jpeg') return 'jpg';
    if (mimeType === 'image/webp') return 'webp';
    return 'png';
}

// Shadow preset button styles (applied after DOM injection)
document.head.insertAdjacentHTML('beforeend', `<style>
.shadow-preset {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    color: #94a3b8;
    border-radius: 5px;
    padding: 3px 8px;
    font-size: 10px;
    cursor: pointer;
    transition: all .15s;
    font-family: 'Inter', sans-serif;
}
.shadow-preset:hover {
    background: rgba(56,189,248,0.15);
    color: #38bdf8;
    border-color: rgba(56,189,248,0.3);
}
</style>`);

// ── Start ──────────────────────────────────────────────────
init();
