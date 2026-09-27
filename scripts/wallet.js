// ═══════════════════════════════════════════════════════════
//  Wallet Analytics — Frontend Controller
//  Calls our own /api/wallet/* serverless endpoints.
//  Never contacts Alchemy directly from the browser.
// ═══════════════════════════════════════════════════════════

const EVM_RE = /^0x[0-9a-fA-F]{40}$/;

// ── State ─────────────────────────────────────────────────
let _walletState = {
  address: '',
  network: 'all',
  allTokens: [],      // flat list, post-price enrichment
  allActivity: [],    // flat list
  filter: 'all',      // 'all' | 'native' | 'erc20' | 'valuable'
  showDust: false,
  loading: false,
  loadingActivity: false,
};

// Session cache to avoid repeated identical requests
const _tokenCache = new Map();   // key → {ts, data}
const CACHE_TTL   = 30_000;      // 30 seconds

// ── Helpers ───────────────────────────────────────────────
function _fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3)  return '$' + (n / 1e3).toFixed(2) + 'K';
  return '$' + n.toFixed(decimals);
}

function _fmtBal(bal, symbol) {
  if (bal == null) return '—';
  let s;
  if (bal >= 1e6)       s = (bal / 1e6).toFixed(2) + 'M';
  else if (bal >= 1e3)  s = (bal / 1e3).toFixed(2) + 'K';
  else if (bal >= 1)    s = bal.toFixed(4);
  else if (bal >= 1e-4) s = bal.toFixed(6);
  else                  s = bal.toExponential(2);
  return s + (symbol ? ' ' + symbol : '');
}

function _shortAddr(addr) {
  if (!addr || addr.length < 12) return addr ?? '—';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function _tsAgo(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function _showToast(msg, type = 'error') {
  // Reuse the existing app toast if present
  if (typeof window._showAppToast === 'function') {
    window._showAppToast(msg, type);
    return;
  }
  let container = document.getElementById('card-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'card-toast-container';
    container.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:none;width:90%;max-width:420px;`;
    document.body.appendChild(container);
  }
  const colors = {
    error:   { border: '#ff4b4b', icon: '⚠️' },
    info:    { border: '#38bdf8', icon: 'ℹ️' },
    warning: { border: '#f59e0b', icon: '⚡' },
    success: { border: '#10b981', icon: '✅' },
  };
  const c = colors[type] || colors.error;
  const toast = document.createElement('div');
  toast.style.cssText = `background:#1e1e2e;border:1px solid ${c.border};border-radius:12px;padding:14px 20px;color:#fff;font-size:14px;font-family:'Inter',sans-serif;line-height:1.5;box-shadow:0 8px 32px rgba(0,0,0,.4);display:flex;align-items:flex-start;gap:10px;pointer-events:all;opacity:0;transition:opacity .25s ease;width:100%;box-sizing:border-box;`;
  toast.innerHTML = `<span style="font-size:18px;flex-shrink:0">${c.icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

// ── DOM Refs ──────────────────────────────────────────────
let _els = {};
function _bind() {
  _els = {
    addrInput:      document.getElementById('wallet-addr-input'),
    clearBtn:       document.getElementById('wallet-clear-btn'),
    networkSelect:  document.getElementById('wallet-network-select'),
    analyzeBtn:     document.getElementById('wallet-analyze-btn'),
    resultsArea:    document.getElementById('wallet-results-area'),
    activityArea:   document.getElementById('wallet-activity-area'),
    filterBar:      document.getElementById('wallet-filter-bar'),
    spamToggle:     document.getElementById('wallet-spam-toggle'),
  };
}

// ── Fetch from our own API ────────────────────────────────
async function _apiFetch(path, body) {
  const resp = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    let errMsg = `Request failed (${resp.status})`;
    try { const j = await resp.json(); errMsg = j.error || errMsg; } catch (_) {}
    throw new Error(errMsg);
  }
  return resp.json();
}

// ── Prices enrichment ─────────────────────────────────────
async function _enrichPrices(tokens) {
  if (tokens.length === 0) return tokens;

  const payload = tokens.map(t => ({
    type: t.type,
    contractAddress: t.contractAddress ?? null,
    network: t.network,
  }));

  try {
    const data = await _apiFetch('/api/wallet/prices', { tokens: payload });
    const lookup = new Map();
    (data.prices ?? []).forEach(p => {
      const k = p.type === 'native'
        ? `native:${p.network}`
        : `${p.network}:${(p.contractAddress ?? '').toLowerCase()}`;
      if (p.usdPrice != null) lookup.set(k, p.usdPrice);
    });

    return tokens.map(t => {
      const k = t.type === 'native'
        ? `native:${t.network}`
        : `${t.network}:${(t.contractAddress ?? '').toLowerCase()}`;
      const price = lookup.get(k) ?? null;
      return {
        ...t,
        usdPrice: price,
        usdValue: price != null ? price * t.balance : null,
      };
    });
  } catch (e) {
    console.warn('[wallet] Price enrichment failed:', e.message);
    return tokens; // Return without prices — not fatal
  }
}

// ── Main Analyze ──────────────────────────────────────────
let _analyzeDebounce = null;

async function analyzeWallet() {
  if (_walletState.loading) return;

  const address = (_els.addrInput?.value ?? '').trim();
  const network = _els.networkSelect?.value ?? 'all';

  if (!EVM_RE.test(address)) {
    _showToast('Please enter a valid EVM wallet address (0x… 42 chars)', 'warning');
    _els.addrInput?.focus();
    return;
  }

  _walletState.address = address;
  _walletState.network = network;
  _walletState.loading = true;
  _walletState.allTokens = [];
  _walletState.allActivity = [];

  // Save to sessionStorage so reload restores it
  try { sessionStorage.setItem('walletAddr', address); sessionStorage.setItem('walletNet', network); } catch (_) {}

  _renderLoading();
  _setAnalyzeBtn(true);

  // Cache key
  const cacheKey = `${address}:${network}`;
  const cached = _tokenCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    _walletState.allTokens = cached.data;
    _walletState.loading   = false;
    _setAnalyzeBtn(false);
    _renderResults();
    _loadActivity();
    return;
  }

  try {
    const data = await _apiFetch('/api/wallet/tokens', { address, network });

    // Flatten tokens from all chains
    let tokens = [];
    (data.succeeded ?? []).forEach(chain => {
      tokens = tokens.concat(chain.tokens ?? []);
    });

    // Enrich with prices
    tokens = await _enrichPrices(tokens);

    // Sort by USD value desc (nulls last)
    tokens.sort((a, b) => {
      const av = a.usdValue ?? -1;
      const bv = b.usdValue ?? -1;
      return bv - av;
    });

    _walletState.allTokens = tokens;
    _walletState.failedNetworks = data.failed ?? [];

    _tokenCache.set(cacheKey, { ts: Date.now(), data: tokens });

    _renderResults();

    if ((data.failed ?? []).length > 0) {
      _renderFailedNetworksBanner(data.failed);
    }

    // Load activity in background
    _loadActivity();

  } catch (err) {
    console.error('[wallet] analyzeWallet error:', err);
    _renderError(err.message);
  } finally {
    _walletState.loading = false;
    _setAnalyzeBtn(false);
  }
}

async function _loadActivity() {
  if (_walletState.loadingActivity) return;
  _walletState.loadingActivity = true;
  _renderActivityLoading();

  try {
    const data = await _apiFetch('/api/wallet/activity', {
      address: _walletState.address,
      network: _walletState.network,
    });

    let all = [];
    (data.succeeded ?? []).forEach(chain => {
      all = all.concat(chain.transfers ?? []);
    });

    // Sort by timestamp desc
    all.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    _walletState.allActivity = all;
    _renderActivity();
  } catch (e) {
    console.warn('[wallet] Activity load failed:', e.message);
    _renderActivityError();
  } finally {
    _walletState.loadingActivity = false;
  }
}

// ── Filtering ─────────────────────────────────────────────
function _getFilteredTokens() {
  let tokens = _walletState.allTokens;

  // Spam filter (< $1 USD value) — off when showDust is true
  if (!_walletState.showDust) {
    tokens = tokens.filter(t => {
      if (t.usdValue == null) return false;  // hide unknowns by default
      return t.usdValue >= 1;
    });
  }

  // Type filter
  if (_walletState.filter === 'native') {
    tokens = tokens.filter(t => t.type === 'native');
  } else if (_walletState.filter === 'erc20') {
    tokens = tokens.filter(t => t.type === 'erc20');
  } else if (_walletState.filter === 'valuable') {
    tokens = tokens.filter(t => t.usdValue != null && t.usdValue >= 10);
  }

  return tokens;
}

// ── Render Functions ──────────────────────────────────────
function _setAnalyzeBtn(loading) {
  if (!_els.analyzeBtn) return;
  _els.analyzeBtn.disabled = loading;
  _els.analyzeBtn.innerHTML = loading
    ? `<span class="wallet-spinner" style="width:20px;height:20px;border-width:2px;"></span> Analyzing…`
    : `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg> Analyze Wallet`;
}

function _renderLoading() {
  if (!_els.resultsArea) return;
  _els.resultsArea.innerHTML = `
    <div class="wallet-loading">
      <div class="wallet-spinner"></div>
      <div>Fetching token balances…</div>
    </div>`;
  if (_els.activityArea) _els.activityArea.innerHTML = '';
  if (_els.filterBar)    _els.filterBar.innerHTML    = '';
}

function _renderError(msg) {
  if (!_els.resultsArea) return;
  _els.resultsArea.innerHTML = `<div class="wallet-error-box">⚠️ ${_escHtml(msg)}</div>`;
}

function _renderActivityLoading() {
  if (!_els.activityArea) return;
  _els.activityArea.innerHTML = `
    <div class="section-title">Activity</div>
    <div class="wallet-loading" style="padding:1.5rem 1rem">
      <div class="wallet-spinner" style="width:28px;height:28px;border-width:2px;"></div>
      <div style="font-size:0.8rem">Loading transfer history…</div>
    </div>`;
}

function _renderActivityError() {
  if (!_els.activityArea) return;
  _els.activityArea.innerHTML = `
    <div class="section-title">Activity</div>
    <div class="wallet-error-box" style="font-size:0.82rem">⚠️ Could not load transfer history. Try again later.</div>`;
}

function _renderFailedNetworksBanner(failed) {
  if (!_els.resultsArea || !failed?.length) return;
  const existing = _els.resultsArea.querySelector('.failed-networks-banner');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.className = 'failed-networks-banner';
  div.innerHTML = `<strong>⚠️ Some networks failed to load:</strong>` +
    failed.map(f => `<span>${_escHtml(f.networkLabel)}: ${_escHtml(f.error)}</span>`).join('');
  _els.resultsArea.prepend(div);
}

function _renderFilterBar(tokens) {
  if (!_els.filterBar) return;
  const nativeCount   = tokens.filter(t => t.type === 'native').length;
  const erc20Count    = tokens.filter(t => t.type === 'erc20').length;
  const valuableCount = tokens.filter(t => t.usdValue != null && t.usdValue >= 10).length;
  const active = _walletState.filter;

  _els.filterBar.innerHTML = `
    <button class="filter-chip ${active === 'all' ? 'active' : ''}" data-filter="all">All (${tokens.length})</button>
    <button class="filter-chip ${active === 'native' ? 'active' : ''}" data-filter="native">Native (${nativeCount})</button>
    <button class="filter-chip ${active === 'erc20' ? 'active' : ''}" data-filter="erc20">Tokens (${erc20Count})</button>
    <button class="filter-chip ${active === 'valuable' ? 'active' : ''}" data-filter="valuable">≥ $10 (${valuableCount})</button>
    <label class="spam-toggle-row" title="Show tokens under $1">
      <input type="checkbox" id="wallet-spam-toggle" ${_walletState.showDust ? 'checked' : ''} style="display:none">
      <span class="toggle-switch-mini"></span>
      Show dust
    </label>`;

  _els.filterBar.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      _walletState.filter = btn.dataset.filter;
      _renderResults();
    });
  });

  const spamT = _els.filterBar.querySelector('#wallet-spam-toggle');
  if (spamT) {
    spamT.addEventListener('change', () => {
      _walletState.showDust = spamT.checked;
      _renderResults();
    });
  }
}

function _renderResults() {
  if (!_els.resultsArea) return;

  const all = _walletState.allTokens;
  const filtered = _getFilteredTokens();

  // Address badge + summary
  const totalValue = all.reduce((s, t) => s + (t.usdValue ?? 0), 0);
  const filteredValue = filtered.reduce((s, t) => s + (t.usdValue ?? 0), 0);

  _renderFilterBar(all);

  if (all.length === 0) {
    _els.resultsArea.innerHTML = `
      <div class="wallet-empty">
        <div class="wallet-empty-icon">🔍</div>
        <div class="wallet-empty-msg">No tokens found</div>
        <div class="wallet-empty-sub">This wallet has no assets on the selected network(s).</div>
      </div>`;
    return;
  }

  if (filtered.length === 0) {
    _els.resultsArea.innerHTML = `
      <div class="wallet-empty">
        <div class="wallet-empty-icon">🧹</div>
        <div class="wallet-empty-msg">No tokens match the current filter</div>
        <div class="wallet-empty-sub">Enable "Show dust" or select a different filter.</div>
      </div>`;
    return;
  }

  // Portfolio summary
  let html = `
    <div class="portfolio-summary">
      <div class="portfolio-total-label">Portfolio Value</div>
      <div class="portfolio-total-value">${_fmt(filteredValue)}</div>
      <div class="portfolio-token-count">${filtered.length} asset${filtered.length !== 1 ? 's' : ''} shown · ${_shortAddr(_walletState.address)}</div>
    </div>`;

  // Group by network
  const byNetwork = {};
  filtered.forEach(t => {
    const key = t.networkLabel ?? t.network;
    if (!byNetwork[key]) byNetwork[key] = [];
    byNetwork[key].push(t);
  });

  Object.entries(byNetwork).forEach(([netLabel, netTokens]) => {
    const netVal = netTokens.reduce((s, t) => s + (t.usdValue ?? 0), 0);
    html += `
      <div class="network-group">
        <div class="network-group-header">
          <div class="network-group-dot"></div>
          <div class="network-group-name">${_escHtml(netLabel)}</div>
          <div class="network-group-value">${_fmt(netVal)}</div>
        </div>
        ${netTokens.map(t => {
          const idx = filtered.indexOf(t);
          return _tokenRowHtml(t, idx);
        }).join('')}
      </div>`;
  });

  _els.resultsArea.innerHTML = html;

  // Bind "Generate Card" buttons
  _els.resultsArea.querySelectorAll('.btn-gen-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.tokenIdx, 10);
      _openCardGenerator(filtered[idx]);
    });
  });
}

function _tokenRowHtml(token, idx) {
  const logoHtml = token.logo
    ? `<img class="token-logo" src="${_escHtml(token.logo)}" alt="${_escHtml(token.symbol)}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const placeholder = `<div class="token-logo-placeholder" ${token.logo ? 'style="display:none"' : ''}>${(token.symbol ?? '?').slice(0, 2)}</div>`;

  const usdVal = token.usdValue != null ? _fmt(token.usdValue) : '<span style="color:var(--text-secondary);font-size:0.8rem">Price unavailable</span>';

  return `
    <div class="token-row">
      ${logoHtml}${placeholder}
      <div class="token-info">
        <div class="token-name">${_escHtml(token.name ?? token.symbol ?? '—')}<span class="token-network-badge">${_escHtml(token.networkLabel ?? '')}</span></div>
        <div class="token-symbol">${_escHtml(token.symbol ?? '—')}</div>
      </div>
      <div class="token-values">
        <div class="token-usd-value">${usdVal}</div>
        <div class="token-balance-display">${_fmtBal(token.balance, token.symbol)}</div>
      </div>
      <button class="btn-gen-card" data-token-idx="${idx}" title="Generate PnL Card">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z"/><path d="M3.265 10.602l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13-9.06 4.878a.75.75 0 01-.71 0l-9.06-4.877zM3.265 14.102l7.668 4.129a2.25 2.25 0 002.134 0l7.668-4.13-9.06 4.878a.75.75 0 01-.71 0l-9.06-4.877z"/></svg>
        Card
      </button>
    </div>`;
}

// Re-render with per-item index matching filtered array
function _rerenderTokenRows() {
  const filtered = _getFilteredTokens();
  const container = _els.resultsArea;
  if (!container) return;
  container.querySelectorAll('.token-row').forEach((row, idx) => {
    const btn = row.querySelector('.btn-gen-card');
    if (btn) btn.dataset.tokenIdx = idx;
  });
}

function _renderActivity() {
  if (!_els.activityArea) return;
  const transfers = _walletState.allActivity;

  if (transfers.length === 0) {
    _els.activityArea.innerHTML = `
      <div class="section-title">Activity <span class="section-badge">0</span></div>
      <div class="wallet-empty" style="padding:1.5rem 1rem">
        <div class="wallet-empty-icon">📭</div>
        <div class="wallet-empty-msg">No transfers found</div>
        <div class="wallet-empty-sub">No recent on-chain activity detected.</div>
      </div>`;
    return;
  }

  const shown = transfers.slice(0, 40);
  let html = `<div class="section-title">Activity <span class="section-badge">${transfers.length}${transfers.length >= 40 ? '+' : ''}</span></div>
    <div class="activity-section">`;

  shown.forEach(t => {
    const dirClass  = t.direction === 'received' ? 'direction-received' : 'direction-sent';
    const dirLabel  = t.direction === 'received' ? 'Received' : 'Sent';
    const amount    = t.value != null ? _fmtBal(t.value, t.asset ?? '') : '—';
    const counterparty = t.direction === 'received'
      ? `From: <span class="activity-addr">${_escHtml(_shortAddr(t.from))}</span>`
      : `To: <span class="activity-addr">${_escHtml(_shortAddr(t.to))}</span>`;

    html += `
      <div class="activity-row">
        <div class="activity-row-header">
          <span class="activity-asset">${_escHtml(t.asset ?? t.category ?? 'Transfer')}</span>
          <span class="direction-badge ${dirClass}">${dirLabel}</span>
        </div>
        <div class="activity-amount">${_escHtml(amount)}</div>
        <div class="activity-meta">
          ${counterparty}
          <span>·</span>
          <span>${_escHtml(t.networkLabel ?? '')}</span>
          <span>·</span>
          <span>${_tsAgo(t.timestamp)}</span>
          ${t.explorerUrl ? `<span>·</span><a href="${_escHtml(t.explorerUrl)}" target="_blank" rel="noopener noreferrer">View ↗</a>` : ''}
        </div>
      </div>`;
  });

  html += `</div>`;
  _els.activityArea.innerHTML = html;
}

// ── Card Generator Integration ────────────────────────────
function _openCardGenerator(token) {
  // Build data for the existing card engine
  // Since we don't have historical price data, we pass what we reliably know.
  const cardData = {
    tokenName:  token.symbol ?? token.name ?? 'Unknown',
    userName:   '',               // user hasn't entered name via wallet flow
    // We cannot reliably determine cost basis from wallet balance alone
    initMC:     0,                // signals "unavailable" to the card
    targetMC:   0,
    inv:        token.usdValue ?? 0,
    finalValue: token.usdValue ?? 0,
    profit:     null,             // unavailable
    roi:        null,
    multiplier: null,
    // Wallet-specific extras passed for display
    _walletMode: true,
    _tokenBalance: token.balance,
    _tokenSymbol:  token.symbol,
    _tokenLogo:    token.logo,
    _network:      token.networkLabel,
    _usdPrice:     token.usdPrice,
    _usdValue:     token.usdValue,
    showBdt:    false,
    bdtRate:    115,
  };

  // Fire existing journal-generate-card event so Calculator tab pre-fills
  const evt = new CustomEvent('wallet-generate-card', { detail: { cardData, token } });
  window.dispatchEvent(evt);

  // Also switch to calculator tab and pre-fill token name as a convenience
  _switchToCalculatorTab(token);
}

function _switchToCalculatorTab(token) {
  const tabBtns   = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach(b => b.classList.remove('active'));
  tabPanels.forEach(p => p.classList.remove('active'));

  const calcBtn = document.querySelector('[data-tab="calculator"]');
  const calcPanel = document.getElementById('tab-calculator');
  if (calcBtn)   calcBtn.classList.add('active');
  if (calcPanel) calcPanel.classList.add('active');

  // Pre-fill token name
  const tokenInput = document.getElementById('token-name');
  if (tokenInput) {
    tokenInput.value = token.symbol ?? token.name ?? '';
    tokenInput.dispatchEvent(new Event('input'));
  }

  _showToast(`Switched to Calculator — fill in your entry & target MC for ${token.symbol ?? 'this token'} to generate a card.`, 'info');
}

// ── HTML escape ───────────────────────────────────────────
function _escHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Init ──────────────────────────────────────────────────
export function initWallet() {
  _bind();
  if (!_els.addrInput) return; // Tab not in DOM

  // Restore from session
  try {
    const savedAddr = sessionStorage.getItem('walletAddr');
    const savedNet  = sessionStorage.getItem('walletNet');
    if (savedAddr && EVM_RE.test(savedAddr)) {
      if (_els.addrInput)     _els.addrInput.value   = savedAddr;
      if (_els.networkSelect && savedNet) _els.networkSelect.value = savedNet;
    }
  } catch (_) {}

  // Clear button
  _els.clearBtn?.addEventListener('click', () => {
    if (_els.addrInput) _els.addrInput.value = '';
    if (_els.resultsArea) _els.resultsArea.innerHTML = '';
    if (_els.activityArea) _els.activityArea.innerHTML = '';
    if (_els.filterBar)   _els.filterBar.innerHTML = '';
    _walletState.allTokens = [];
    _walletState.allActivity = [];
    try { sessionStorage.removeItem('walletAddr'); sessionStorage.removeItem('walletNet'); } catch (_) {}
  });

  // Enter key on address input
  _els.addrInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') analyzeWallet();
  });

  // Analyze button
  _els.analyzeBtn?.addEventListener('click', () => {
    // Debounce: prevent double-click spam
    if (_analyzeDebounce) return;
    _analyzeDebounce = setTimeout(() => { _analyzeDebounce = null; }, 1500);
    analyzeWallet();
  });
}
