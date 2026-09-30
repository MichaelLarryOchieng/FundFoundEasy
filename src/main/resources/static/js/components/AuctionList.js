// components/AuctionList.js

import { api } from '../services/api.js';
import { subscribe } from '../services/ws.js';

let timers = [];
let allAuctions = [];
let filters = {
    tab: 'all',
    minPrice: '',
    maxPrice: '',
    minIncrement: '',
    sort: 'ending',       // ending | newest | price_asc | price_desc | bids
};

function clearTimers() {
    timers.forEach(clearInterval);
    timers = [];
}

export async function renderAuctionList(root, query = '') {
    clearTimers();
    filters = { tab: 'all', minPrice: '', maxPrice: '', minIncrement: '', sort: 'ending' };

    root.innerHTML = `<div class="loading">Loading auctions…</div>`;

    try {
        allAuctions = query
            ? await api.searchAuctions(query)
            : await api.listActiveAuctions();
    } catch (err) {
        root.innerHTML = `<div class="empty-state">Failed to load auctions: ${err.message}</div>`;
        return;
    }

    root.innerHTML = buildLayout(query);
    wireFilters(root);
    applyFilters();

    allAuctions.forEach((a) => {
        subscribe(`/topic/auction/${a.itemId}`, (updated) => {
            const idx = allAuctions.findIndex((x) => x.itemId === updated.itemId);
            if (idx >= 0) allAuctions[idx] = { ...allAuctions[idx], ...updated };
            updateCard(updated);
        });
    });

    startCountdowns();
}

// ============================================================
// LAYOUT
// ============================================================
function buildLayout(query) {
    return `
        <div class="page-header">
            <div>
                <h1>Live Auctions</h1>
                ${query ? `<div class="subtitle">Search results for "${escapeHtml(query)}"</div>` : ''}
            </div>
        </div>

        <div class="marketplace-layout">
            <aside class="filter-sidebar">
                <h3>
                    <span>Filters</span>
                    <button type="button" class="btn btn-secondary btn-sm" id="reset-filters">Reset</button>
                </h3>

                <div class="filter-group">
                    <label>Status</label>
                    <select id="filter-tab">
                        <option value="all">All auctions</option>
                        <option value="live">Live only</option>
                        <option value="ending">Ending soon (&lt; 1h)</option>
                        <option value="ended">Ended</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label>Price range</label>
                    <div class="range-inputs">
                        <input type="number" id="filter-min" placeholder="Min" min="0" step="1" />
                        <input type="number" id="filter-max" placeholder="Max" min="0" step="1" />
                    </div>
                </div>

                <div class="filter-group">
                    <label>Minimum increment</label>
                    <select id="filter-increment">
                        <option value="">Any</option>
                        <option value="1">≥ $1</option>
                        <option value="10">≥ $10</option>
                        <option value="100">≥ $100</option>
                        <option value="1000">≥ $1,000</option>
                    </select>
                </div>
            </aside>

            <section>
                <div class="category-tabs" id="category-tabs">
                    <a class="category-tab active" data-tab="all">All</a>
                    <a class="category-tab" data-tab="live">Live</a>
                    <a class="category-tab" data-tab="ending">Ending soon</a>
                    <a class="category-tab" data-tab="ended">Ended</a>
                </div>

                <div class="toolbar">
                    <div class="result-count" id="result-count">—</div>

                    <div class="sort-wrapper">
                        <span>Sort by</span>
                        <select id="filter-sort">
                            <option value="ending">Ending soonest</option>
                            <option value="newest">Newly listed</option>
                            <option value="price_asc">Price: Low → High</option>
                            <option value="price_desc">Price: High → Low</option>
                            <option value="bids">Most bids</option>
                        </select>
                    </div>
                </div>

                <div class="auction-grid" id="auction-grid"></div>
                <div id="empty-state" style="display:none"></div>
            </section>
        </div>
    `;
}

// ============================================================
// FILTERS
// ============================================================
function wireFilters(root) {
    const tabSelect = document.getElementById('filter-tab');
    tabSelect.value = filters.tab;

    tabSelect.addEventListener('change', (e) => {
        filters.tab = e.target.value;
        syncTabUI(e.target.value);
        applyFilters();
    });

    document.querySelectorAll('#category-tabs .category-tab').forEach((tab) => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            filters.tab = tab.dataset.tab;
            tabSelect.value = filters.tab;
            syncTabUI(filters.tab);
            applyFilters();
        });
    });

    document.getElementById('filter-min').addEventListener('input', (e) => {
        filters.minPrice = e.target.value;
        applyFilters();
    });
    document.getElementById('filter-max').addEventListener('input', (e) => {
        filters.maxPrice = e.target.value;
        applyFilters();
    });

    document.getElementById('filter-increment').addEventListener('change', (e) => {
        filters.minIncrement = e.target.value;
        applyFilters();
    });

    // Sort dropdown
    document.getElementById('filter-sort').addEventListener('change', (e) => {
        filters.sort = e.target.value;
        applyFilters();
    });

    // Reset
    document.getElementById('reset-filters').addEventListener('click', () => {
        filters = { tab: 'all', minPrice: '', maxPrice: '', minIncrement: '', sort: 'ending' };
        document.getElementById('filter-tab').value = 'all';
        document.getElementById('filter-min').value = '';
        document.getElementById('filter-max').value = '';
        document.getElementById('filter-increment').value = '';
        document.getElementById('filter-sort').value = 'ending';
        syncTabUI('all');
        applyFilters();
    });
}

function syncTabUI(activeTab) {
    document.querySelectorAll('#category-tabs .category-tab').forEach((tab) => {
        tab.classList.toggle('active', tab.dataset.tab === activeTab);
    });
}

function applyFilters() {
    const now = Date.now();
    const min = parseFloat(filters.minPrice);
    const max = parseFloat(filters.maxPrice);
    const inc = parseFloat(filters.minIncrement);

    let filtered = allAuctions.filter((a) => {
        const end = new Date(a.endTime).getTime();
        const diff = end - now;

        if (filters.tab === 'live' && (!a.active || diff <= 0)) return false;
        if (filters.tab === 'ending' && (!a.active || diff <= 0 || diff > 3600000)) return false;
        if (filters.tab === 'ended' && a.active && diff > 0) return false;

        const price = a.currentBid || 0;
        if (!isNaN(min) && price < min) return false;
        if (!isNaN(max) && price > max) return false;

        if (!isNaN(inc) && (a.minIncrement || 0) < inc) return false;

        return true;
    });

    // ---------- SORT ----------
    filtered = sortAuctions(filtered);

    // ---------- RENDER ----------
    const grid = document.getElementById('auction-grid');
    const empty = document.getElementById('empty-state');
    const count = document.getElementById('result-count');

    count.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        empty.innerHTML = `
            <div class="empty-state">
                <h2>No matches</h2>
                <p>Try adjusting your filters.</p>
            </div>
        `;
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';
    grid.innerHTML = '';
    filtered.forEach((a) => grid.appendChild(buildCard(a)));
}

function sortAuctions(list) {
    const copy = [...list];

    switch (filters.sort) {
        case 'newest':
            // Higher itemId = more recently created
            copy.sort((a, b) => (b.itemId || 0) - (a.itemId || 0));
            break;

        case 'price_asc':
            copy.sort((a, b) => (a.currentBid || 0) - (b.currentBid || 0));
            break;

        case 'price_desc':
            copy.sort((a, b) => (b.currentBid || 0) - (a.currentBid || 0));
            break;

        case 'bids':
            // We don't have bid count on the entity — approximate with proxy bid / leader presence
            // Once we add bidCount to the DTO, this becomes exact
            copy.sort((a, b) => {
                const aHasBids = a.highestBidder ? 1 : 0;
                const bHasBids = b.highestBidder ? 1 : 0;
                if (aHasBids !== bHasBids) return bHasBids - aHasBids;
                return (b.currentBid || 0) - (a.currentBid || 0);
            });
            break;

        case 'ending':
        default:
            copy.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
            break;
    }

    return copy;
}

// ============================================================
// CARD
// ============================================================
function buildCard(a) {
    const el = document.createElement('div');
    el.className = 'card auction-card';
    el.dataset.id = a.itemId;
    el.innerHTML = `
        <div class="img-placeholder">
            ${a.imageUrl
        ? `<img src="${a.imageUrl}" alt="${escapeHtml(a.title)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>`
        : 'No image'}
        </div>
        <div class="title">${escapeHtml(a.title)}</div>
        <div class="desc">${escapeHtml(a.description || '')}</div>
        <div class="meta">
            <div>
                <div class="price-label">Current bid</div>
                <div class="price">$${fmt(a.currentBid)}</div>
            </div>
            <div style="text-align:right">
                <div class="countdown" data-end="${a.endTime}">…</div>
                <span class="${a.active ? 'badge-active' : 'badge-ended'}">${a.active ? 'LIVE' : 'ENDED'}</span>
            </div>
        </div>
    `;
    el.addEventListener('click', () => {
        window.location.hash = `#/auctions/${a.itemId}`;
    });
    return el;
}

function updateCard(a) {
    const card = document.querySelector(`.auction-card[data-id="${a.itemId}"]`);
    if (!card) return;
    const priceEl = card.querySelector('.price');
    if (priceEl) priceEl.textContent = `$${fmt(a.currentBid)}`;
    const cd = card.querySelector('.countdown');
    if (cd) cd.dataset.end = a.endTime;
}

// ============================================================
// COUNTDOWNS
// ============================================================
function startCountdowns() {
    const tick = () => {
        document.querySelectorAll('.countdown').forEach((el) => {
            const end = new Date(el.dataset.end).getTime();
            const diff = end - Date.now();
            if (diff <= 0) {
                el.textContent = 'Ended';
                el.className = 'countdown ended';
                return;
            }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            let txt = '';
            if (d > 0)      txt = `${d}d ${h}h`;
            else if (h > 0) txt = `${h}h ${m}m`;
            else if (m > 0) txt = `${m}m ${s}s`;
            else            txt = `${s}s`;
            el.textContent = txt;
            el.className = 'countdown' + (diff < 120000 ? ' ending-soon' : '');
        });
    };
    tick();
    timers.push(setInterval(tick, 1000));
}

function fmt(n) {
    return (n == null ? 0 : Number(n)).toFixed(2);
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}