// components/MyBids.js

import { api, isLoggedIn } from '../services/api.js';

export async function renderMyBids(root) {
    if (!isLoggedIn()) {
        window.location.hash = '#/login';
        return;
    }

    root.innerHTML = `<div class="loading">Loading your bids…</div>`;

    let data;
    try {
        data = await api.myBids();
    } catch (err) {
        root.innerHTML = `<div class="empty-state">Failed to load: ${err.message}</div>`;
        return;
    }

    root.innerHTML = `
        <div class="page-header">
            <div>
                <h1>My Bids</h1>
                <div class="subtitle">Track auctions you're winning, losing, or have won</div>
            </div>
        </div>

        <div class="category-tabs" id="bids-tabs">
            <a class="category-tab active" data-tab="winning">Winning (${data.winning.length})</a>
            <a class="category-tab" data-tab="outbid">Outbid (${data.outbid.length})</a>
            <a class="category-tab" data-tab="won">Won (${data.won.length})</a>
            <a class="category-tab" data-tab="lost">Lost (${data.lost.length})</a>
        </div>

        <div id="bids-content"></div>
    `;

    const tabsEl = document.getElementById('bids-tabs');
    const contentEl = document.getElementById('bids-content');

    function paint(tab) {
        const list = data[tab] || [];
        if (list.length === 0) {
            contentEl.innerHTML = `
                <div class="empty-state">
                    <h2>No auctions here</h2>
                    <p>${emptyMessage(tab)}</p>
                    <a href="#/auctions" class="btn btn-primary mt-2">Browse auctions</a>
                </div>`;
            return;
        }
        contentEl.innerHTML = `<div class="auction-grid" id="my-bids-grid"></div>`;
        const grid = document.getElementById('my-bids-grid');
        list.forEach((a) => grid.appendChild(buildCard(a, tab)));
    }

    tabsEl.querySelectorAll('.category-tab').forEach((tab) => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabsEl.querySelectorAll('.category-tab').forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
            paint(tab.dataset.tab);
        });
    });

    paint('winning');
}

function buildCard(a, tab) {
    const el = document.createElement('div');
    el.className = 'card auction-card';
    el.dataset.id = a.itemId;

    let badge = '';
    if (tab === 'winning') badge = '<span class="winning-badge" style="position:absolute;top:12px;right:12px;z-index:2">Winning</span>';
    else if (tab === 'outbid') badge = '<span class="losing-badge" style="position:absolute;top:12px;right:12px;z-index:2">Outbid</span>';
    else if (tab === 'won') badge = '<span class="badge-active" style="position:absolute;top:12px;right:12px;z-index:2">WON</span>';
    else if (tab === 'lost') badge = '<span class="badge-ended" style="position:absolute;top:12px;right:12px;z-index:2">LOST</span>';

    el.innerHTML = `
        <div class="img-placeholder" style="position:relative">
            ${badge}
            ${a.imageUrl
        ? `<img src="${a.imageUrl}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:8px"/>`
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
            </div>
        </div>
    `;
    el.addEventListener('click', () => {
        window.location.hash = `#/auctions/${a.itemId}`;
    });
    return el;
}

function emptyMessage(tab) {
    switch (tab) {
        case 'winning': return "You're not currently the highest bidder on anything.";
        case 'outbid':  return "You haven't been outbid on any live auctions.";
        case 'won':     return "You haven't won any auctions yet.";
        case 'lost':    return "You haven't lost any auctions.";
        default:        return '';
    }
}

function fmt(n) { return (n == null ? 0 : Number(n)).toFixed(2); }

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}