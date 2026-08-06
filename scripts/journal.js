// ─── Trade Journal — IndexedDB + Logic ─────────────────────────────────
// Storage key: mccalc_journal (array of token groups)
// Token group: { id, tokenName, trades: [{id, type, mc, mcUnit, amount, date, note}] }

import { Storage } from '../utils/storage.js';
import { formatNumber } from '../utils/formatters.js';

const JOURNAL_KEY = 'journal_tokens';

// ── DB Helpers ──────────────────────────────────────────────────────────
const getTokens = () => Storage.get(JOURNAL_KEY, []);
const saveTokens = (tokens) => Storage.set(JOURNAL_KEY, tokens);

const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ── Parse MC with unit ─────────────────────────────────────────────────
const parseMCWithUnit = (val, unit) => parseFloat(val || 0) * (parseFloat(unit) || 1);

// ── DCA Calculations ────────────────────────────────────────────────────
export const calcDCA = (trades) => {
    const entries = trades.filter(t => t.type === 'entry');
    const exits   = trades.filter(t => t.type === 'exit');

    // Weighted average MC = Σ(mc_real * amount) / Σ(amount)
    let totalEntryAmount = 0, weightedEntryMC = 0;
    entries.forEach(e => {
        const mc = parseMCWithUnit(e.mc, e.mcUnit);
        const amt = parseFloat(e.amount) || 0;
        weightedEntryMC += mc * amt;
        totalEntryAmount += amt;
    });

    let totalExitAmount = 0, weightedExitMC = 0;
    exits.forEach(e => {
        const mc = parseMCWithUnit(e.mc, e.mcUnit);
        const amt = parseFloat(e.amount) || 0;
        weightedExitMC += mc * amt;
        totalExitAmount += amt;
    });

    const avgEntryMC = totalEntryAmount > 0 ? weightedEntryMC / totalEntryAmount : 0;
    const avgExitMC  = totalExitAmount  > 0 ? weightedExitMC  / totalExitAmount  : 0;
    const multiplier = avgEntryMC > 0 && avgExitMC > 0 ? avgExitMC / avgEntryMC : 0;
    const holdAmount = totalEntryAmount - totalExitAmount;
    const holdValue  = holdAmount > 0 && avgEntryMC > 0 ? holdAmount * (avgExitMC || avgEntryMC) / avgEntryMC * (totalEntryAmount > 0 ? avgEntryMC : 1) : holdAmount;

    // Realized P&L = totalExited - cost_basis_of_exits
    const costBasisOfExits = avgEntryMC > 0 && totalExitAmount > 0
        ? totalExitAmount * (avgEntryMC / (avgEntryMC || 1)) // simplified: exits proportion
        : 0;
    
    // Accurate realized PnL
    // If avg entry MC and avg exit MC known: realized P&L = exitAmount * (exitMC/entryMC - 1)
    const realizedPnL = avgEntryMC > 0 && avgExitMC > 0
        ? totalExitAmount * (avgExitMC / avgEntryMC - 1)
        : 0;
    const roi = totalEntryAmount > 0 ? (realizedPnL / totalEntryAmount) * 100 : 0;
    const holdROI = avgEntryMC > 0 && avgExitMC > 0 ? (avgExitMC / avgEntryMC - 1) * 100 : 0;

    return {
        entries,
        exits,
        totalEntryAmount,
        totalExitAmount,
        holdAmount: Math.max(0, holdAmount),
        avgEntryMC,
        avgExitMC,
        multiplier,
        realizedPnL,
        roi,
        holdROI,
        entryCount: entries.length,
        exitCount: exits.length,
    };
};

// ── Render Journal ──────────────────────────────────────────────────────
export const initJournal = () => {
    const journalContainer = document.getElementById('journal-container');
    if (!journalContainer) return;
    renderJournal();

    const addTokenBtn = document.getElementById('add-token-btn');
    if (addTokenBtn) {
        addTokenBtn.addEventListener('click', () => {
            const modal = document.getElementById('new-token-modal');
            if (modal) modal.classList.add('active');
            const inp = document.getElementById('new-token-name');
            if (inp) { inp.value = ''; inp.focus(); }
        });
    }

    const newTokenCancel = document.getElementById('new-token-cancel');
    if (newTokenCancel) {
        newTokenCancel.addEventListener('click', () => {
            document.getElementById('new-token-modal').classList.remove('active');
        });
    }

    const newTokenConfirm = document.getElementById('new-token-confirm');
    if (newTokenConfirm) {
        newTokenConfirm.addEventListener('click', () => {
            const inp = document.getElementById('new-token-name');
            const name = inp ? inp.value.trim().toUpperCase() : '';
            if (!name) { inp && inp.focus(); return; }
            const tokens = getTokens();
            // Prevent duplicates
            if (tokens.find(t => t.tokenName === name)) {
                alert(`Token "${name}" already exists.`);
                return;
            }
            tokens.push({ id: genId(), tokenName: name, trades: [] });
            saveTokens(tokens);
            document.getElementById('new-token-modal').classList.remove('active');
            renderJournal();
        });
    }

    // Enter key confirm
    const newTokenNameInp = document.getElementById('new-token-name');
    if (newTokenNameInp) {
        newTokenNameInp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('new-token-confirm').click();
        });
    }
};

const renderJournal = () => {
    const container = document.getElementById('journal-container');
    if (!container) return;
    const tokens = getTokens();

    if (tokens.length === 0) {
        container.innerHTML = `
        <div class="journal-empty">
            <div class="journal-empty-icon">📊</div>
            <div class="journal-empty-title">No Trades Yet</div>
            <div class="journal-empty-sub">Click "+ New Token" to start tracking your trades</div>
        </div>`;
        return;
    }

    container.innerHTML = tokens.map(token => renderTokenCard(token)).join('');
    bindTokenEvents();
};

const renderTokenCard = (token) => {
    const dca = calcDCA(token.trades);
    const hasExits = dca.exitCount > 0;
    const hasTrades = token.trades.length > 0;

    return `
    <div class="token-card" data-token-id="${token.id}">
        <div class="token-card-header">
            <div class="token-card-name">
                <span class="token-symbol">${token.tokenName}</span>
                <span class="token-trade-count">${token.trades.length} trade${token.trades.length !== 1 ? 's' : ''}</span>
            </div>
            <div class="token-card-actions">
                <button class="token-analyze-btn btn-sm" data-id="${token.id}" ${!hasTrades ? 'disabled' : ''}>
                    📊 Analysis
                </button>
                <button class="token-delete-btn icon-btn-sm" data-id="${token.id}" title="Delete Token">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z"/></svg>
                </button>
            </div>
        </div>

        <div class="token-trades-list">
            ${token.trades.length === 0 ? `<div class="no-trades-hint">Add your first entry or exit below</div>` : 
                token.trades.map(t => renderTradeRow(t)).join('')}
        </div>

        <div class="token-add-btns">
            <button class="add-trade-btn entry-btn" data-id="${token.id}" data-type="entry">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
                Add Entry
            </button>
            <button class="add-trade-btn exit-btn" data-id="${token.id}" data-type="exit">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
                Add Exit
            </button>
        </div>

        ${hasTrades ? `
        <div class="token-summary-mini">
            ${dca.entryCount > 0 ? `<span class="summary-chip entry-chip">Avg Entry: ${_fmtMC(dca.avgEntryMC)}</span>` : ''}
            ${dca.exitCount > 0 ? `<span class="summary-chip exit-chip">Avg Exit: ${_fmtMC(dca.avgExitMC)}</span>` : ''}
            ${dca.totalEntryAmount > 0 ? `<span class="summary-chip">Invested: $${formatNumber(dca.totalEntryAmount)}</span>` : ''}
        </div>` : ''}
    </div>`;
};

const renderTradeRow = (trade) => {
    const mcReal = parseMCWithUnit(trade.mc, trade.mcUnit);
    const unitLabel = _unitLabel(trade.mcUnit);
    const isEntry = trade.type === 'entry';
    const dateStr = trade.date ? `<span class="trade-date">${trade.date}</span>` : '';

    return `
    <div class="trade-row ${isEntry ? 'trade-entry' : 'trade-exit'}" data-trade-id="${trade.id}">
        <span class="trade-type-badge ${isEntry ? 'badge-entry' : 'badge-exit'}">${isEntry ? 'BUY' : 'SELL'}</span>
        <span class="trade-mc">${formatNumber(trade.mc, 0)}${unitLabel}</span>
        <span class="trade-amount">$${formatNumber(trade.amount)}</span>
        ${dateStr}
        <button class="trade-delete-btn" data-trade-id="${trade.id}" title="Delete">×</button>
    </div>`;
};

const bindTokenEvents = () => {
    // Add trade buttons
    document.querySelectorAll('.add-trade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openTradeModal(btn.dataset.id, btn.dataset.type);
        });
    });

    // Delete trade buttons
    document.querySelectorAll('.trade-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tradeId = btn.dataset.tradeId;
            if (!confirm('Delete this trade?')) return;
            const tokens = getTokens();
            tokens.forEach(t => {
                t.trades = t.trades.filter(tr => tr.id !== tradeId);
            });
            saveTokens(tokens);
            renderJournal();
        });
    });

    // Analyze button
    document.querySelectorAll('.token-analyze-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showAnalysis(btn.dataset.id);
        });
    });

    // Delete token
    document.querySelectorAll('.token-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tokenId = btn.dataset.id;
            const tokens = getTokens();
            const token = tokens.find(t => t.id === tokenId);
            if (!token) return;
            if (!confirm(`Delete "${token.tokenName}" and all its trades?`)) return;
            saveTokens(tokens.filter(t => t.id !== tokenId));
            renderJournal();
        });
    });
};

// ── Trade Modal ─────────────────────────────────────────────────────────
let _tradeModalTarget = null;

const openTradeModal = (tokenId, type) => {
    _tradeModalTarget = { tokenId, type };
    const modal = document.getElementById('add-trade-modal');
    const title = document.getElementById('add-trade-title');
    if (title) title.textContent = type === 'entry' ? '📈 Add Buy Entry' : '📉 Add Sell Exit';
    const badge = document.getElementById('add-trade-type-badge');
    if (badge) {
        badge.textContent = type === 'entry' ? 'BUY' : 'SELL';
        badge.className = 'type-badge ' + (type === 'entry' ? 'badge-entry' : 'badge-exit');
    }
    // Reset form
    ['trade-mc-val','trade-amount-val','trade-date-val','trade-note-val'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    // Set default date
    const dateEl = document.getElementById('trade-date-val');
    if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
    if (modal) modal.classList.add('active');
    const mcInp = document.getElementById('trade-mc-val');
    if (mcInp) setTimeout(() => mcInp.focus(), 50);
};

export const bindTradeModal = () => {
    const confirmBtn = document.getElementById('add-trade-confirm');
    const cancelBtn = document.getElementById('add-trade-cancel');
    const modal = document.getElementById('add-trade-modal');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => modal && modal.classList.remove('active'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (!_tradeModalTarget) return;
            const mcVal = document.getElementById('trade-mc-val')?.value;
            const mcUnit = document.getElementById('trade-mc-unit')?.value || '1000';
            const amount = document.getElementById('trade-amount-val')?.value;
            const date = document.getElementById('trade-date-val')?.value || '';
            const note = document.getElementById('trade-note-val')?.value?.trim() || '';

            if (!mcVal || !amount || parseFloat(mcVal) <= 0 || parseFloat(amount) <= 0) {
                alert('Please enter valid Market Cap and Amount values.');
                return;
            }

            const tokens = getTokens();
            const token = tokens.find(t => t.id === _tradeModalTarget.tokenId);
            if (!token) return;

            token.trades.push({
                id: genId(),
                type: _tradeModalTarget.type,
                mc: parseFloat(mcVal),
                mcUnit: parseFloat(mcUnit),
                amount: parseFloat(amount),
                date,
                note,
            });

            saveTokens(tokens);
            modal.classList.remove('active');
            renderJournal();
        });
    }
};

// ── Analysis Modal ──────────────────────────────────────────────────────
const showAnalysis = (tokenId) => {
    const tokens = getTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token || token.trades.length === 0) return;

    const dca = calcDCA(token.trades);
    const modal = document.getElementById('analysis-modal');
    const content = document.getElementById('analysis-content');

    if (!content || !modal) return;

    const pnlClass = dca.realizedPnL >= 0 ? 'value-green' : 'value-red';
    const sign = dca.realizedPnL >= 0 ? '+' : '';

    content.innerHTML = `
    <div class="analysis-header">
        <div class="analysis-token-name">${token.tokenName}</div>
        <div class="analysis-subtitle">Trade Analysis Summary</div>
    </div>

    <div class="analysis-grid">
        <div class="analysis-card entry-card">
            <div class="analysis-card-label">ENTRIES (BUY)</div>
            <div class="analysis-card-value">${dca.entryCount} order${dca.entryCount !== 1 ? 's' : ''}</div>
            <div class="analysis-card-sub">Avg Entry: ${_fmtMC(dca.avgEntryMC)}</div>
            <div class="analysis-card-sub">Total Invested: <strong>$${formatNumber(dca.totalEntryAmount)}</strong></div>
        </div>
        <div class="analysis-card exit-card">
            <div class="analysis-card-label">EXITS (SELL)</div>
            <div class="analysis-card-value">${dca.exitCount} order${dca.exitCount !== 1 ? 's' : ''}</div>
            <div class="analysis-card-sub">Avg Exit: ${_fmtMC(dca.avgExitMC)}</div>
            <div class="analysis-card-sub">Total Exited: <strong>$${formatNumber(dca.totalExitAmount)}</strong></div>
        </div>
    </div>

    <div class="analysis-pnl-section">
        <div class="analysis-row">
            <span class="analysis-label">Multiplier</span>
            <span class="analysis-value" style="color:var(--accent-primary)">${dca.multiplier > 0 ? formatNumber(dca.multiplier, 2) + 'x' : '—'}</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">Realized P&L</span>
            <span class="analysis-value ${pnlClass}">${sign}$${formatNumber(Math.abs(dca.realizedPnL))}</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">ROI</span>
            <span class="analysis-value ${pnlClass}">${sign}${formatNumber(dca.roi, 2)}%</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">Still Holding</span>
            <span class="analysis-value">$${formatNumber(Math.max(0, dca.holdAmount))}</span>
        </div>
        <div class="analysis-row">
            <span class="analysis-label">Profit excl. Holdings</span>
            <span class="analysis-value ${pnlClass}">${sign}$${formatNumber(Math.abs(dca.realizedPnL))}</span>
        </div>
    </div>

    <div class="analysis-trades-breakdown">
        <div class="breakdown-title">All Trades</div>
        ${token.trades.map(t => {
            const isEntry = t.type === 'entry';
            return `<div class="breakdown-row ${isEntry ? 'breakdown-entry' : 'breakdown-exit'}">
                <span class="breakdown-badge ${isEntry ? 'badge-entry' : 'badge-exit'}">${isEntry ? 'BUY' : 'SELL'}</span>
                <span>${formatNumber(t.mc, 0)}${_unitLabel(t.mcUnit)}</span>
                <span>$${formatNumber(t.amount)}</span>
                <span style="opacity:0.6">${t.date || ''}</span>
            </div>`;
        }).join('')}
    </div>

    <div class="analysis-generate-section">
        <button class="btn-primary" id="analysis-generate-card" data-token-id="${tokenId}">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z"/></svg>
            Generate Trading Card
        </button>
    </div>`;

    modal.classList.add('active');

    // Bind generate card from analysis
    const genBtn = document.getElementById('analysis-generate-card');
    if (genBtn) {
        genBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            // Switch to calculator tab and pre-fill
            window.dispatchEvent(new CustomEvent('journal-generate-card', { detail: { token, dca } }));
        });
    }
};

export const bindAnalysisModal = () => {
    const modal = document.getElementById('analysis-modal');
    const closeBtn = document.getElementById('close-analysis');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal && modal.classList.remove('active'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }
};

// ── Helpers ─────────────────────────────────────────────────────────────
const _fmtMC = (mc) => {
    if (!mc || mc === 0) return '—';
    if (mc >= 1e9) return '$' + (mc / 1e9).toFixed(2) + 'B';
    if (mc >= 1e6) return '$' + (mc / 1e6).toFixed(2) + 'M';
    if (mc >= 1e3) return '$' + (mc / 1e3).toFixed(2) + 'K';
    return '$' + formatNumber(mc);
};

const _unitLabel = (unit) => {
    const u = parseFloat(unit);
    if (u >= 1e9) return 'B';
    if (u >= 1e6) return 'M';
    if (u >= 1e3) return 'K';
    return '';
};
