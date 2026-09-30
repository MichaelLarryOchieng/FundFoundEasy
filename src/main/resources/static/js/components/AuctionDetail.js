// components/AuctionDetail.js

import { api, isLoggedIn, getUser } from '../services/api.js';
import { subscribe } from '../services/ws.js';

let countdownTimer = null;
let wsSub = null;

export async function renderAuctionDetail(root, id) {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = null;
    wsSub = null;

    root.innerHTML = `<div class="loading">Loading auction…</div>`;

    let auction, bids;
    try {
        [auction, bids] = await Promise.all([
            api.getAuction(id),
            api.getBidHistory(id),
        ]);
    } catch (err) {
        root.innerHTML = `<div class="empty-state">Failed to load auction: ${err.message}</div>`;
        return;
    }

    paint(root, auction, bids);

    // Subscribe to live updates for this auction
    subscribe(`/topic/auction/${auction.itemId}`, (updated) => {
        const priceEl = document.getElementById('current-bid');
        const leaderEl = document.getElementById('highest-bidder');
        const countdownEl = document.getElementById('countdown');

        if (priceEl)    priceEl.textContent   = `$${fmt(updated.currentBid)}`;
        if (leaderEl)   leaderEl.innerHTML    = `<strong>${escapeHtml(updated.highestBidder || 'No Bids')}</strong>`;
        if (countdownEl) countdownEl.dataset.end = updated.endTime;

        window.toast(`New bid: $${fmt(updated.currentBid)}`, 'success');
        refreshBids(auction.itemId);
    });
}

function paint(root, auction, bids) {
    const user = getUser();
    const loggedIn = isLoggedIn();
    const endsAt = new Date(auction.endTime);
    const isEnded = endsAt <= new Date() || !auction.active;
    const isSeller = user && user.username === auction.sellerUsername;
    const isLeader = user && user.username === auction.highestBidder;

    const canBid = loggedIn && !isEnded && !isSeller && !isLeader;

    let bidMessage = '';
    if (!loggedIn)      bidMessage = '<p class="hint">Log in to place a bid.</p>';
    else if (isEnded)   bidMessage = '<p class="hint">This auction has ended.</p>';
    else if (isSeller)  bidMessage = '<p class="hint">You cannot bid on your own listing.</p>';
    else if (isLeader)  bidMessage = '<p class="hint">You are the current highest bidder.</p>';

    root.innerHTML = `
    <div class="flex-between mt-2">
      <h1>${escapeHtml(auction.title)}</h1>
      <a href="#/auctions" class="btn btn-secondary btn-sm">← Back to auctions</a>
    </div>

    <div class="detail-grid">
      <div class="card">
        <div class="img-placeholder" style="height:320px">
          ${auction.imageUrl
        ? `<img src="${auction.imageUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:8px" alt="${escapeHtml(auction.title)}"/>`
        : 'No image'}
        </div>
        <p class="mt-2">${escapeHtml(auction.description || 'No description provided.')}</p>
        <p class="hint mt-2">Listed by <strong>${escapeHtml(auction.sellerUsername || 'unknown')}</strong></p>
      </div>

      <div class="card">
        <div class="flex-between">
          <div>
            <div class="price-label">Current Bid</div>
            <div class="price" id="current-bid">$${fmt(auction.currentBid)}</div>
          </div>
          <div style="text-align:right">
            <div class="countdown" id="countdown" data-end="${auction.endTime}">…</div>
            <span class="${auction.active && !isEnded ? 'badge-active' : 'badge-ended'}">
              ${auction.active && !isEnded ? 'LIVE' : 'ENDED'}
            </span>
          </div>
        </div>

        <div class="mt-2">
          <div class="price-label">Highest bidder</div>
          <div id="highest-bidder"><strong>${escapeHtml(auction.highestBidder || 'No Bids')}</strong></div>
        </div>

        <div class="mt-2">
          <div class="price-label">Minimum increment</div>
          <div>$${fmt(auction.minIncrement || 1)}</div>
        </div>

        <hr style="border-color:var(--border);margin:1.2rem 0" />

        <form id="bid-form">
          <div class="form-group">
            <label>Your maximum bid (USD)</label>
            <input type="number" id="bid-amount" min="0" step="0.01" required
                   ${!canBid ? 'disabled' : ''}
                   placeholder="Enter your max bid" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%" ${!canBid ? 'disabled' : ''}>
            Place Bid
          </button>
        </form>

        ${bidMessage}

        <hr style="border-color:var(--border);margin:1.2rem 0" />

        <h3>Bid History</h3>
        <ul class="bid-list" id="bid-list"></ul>
      </div>
    </div>
  `;

    paintBids(bids);
    startCountdown(auction.endTime);

    const form = document.getElementById('bid-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('bid-amount');
        const amount = parseFloat(input.value);
        if (!amount || amount <= 0) {
            window.toast('Enter a valid bid amount.', 'error');
            return;
        }

        const btn = form.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Placing…';

        try {
            await api.placeBid(auction.itemId, amount);
            window.toast('Bid placed!', 'success');
            input.value = '';
            await refreshBids(auction.itemId);
        } catch (err) {
            window.toast(err.message || 'Bid failed.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Place Bid';
        }
    });
}

async function refreshBids(itemId) {
    try {
        const fresh = await api.getBidHistory(itemId);
        paintBids(fresh);
        // Also re-fetch auction in case current bid changed
        const updatedAuction = await api.getAuction(itemId);
        const priceEl = document.getElementById('current-bid');
        const leaderEl = document.getElementById('highest-bidder');
        if (priceEl)  priceEl.textContent  = `$${fmt(updatedAuction.currentBid)}`;
        if (leaderEl) leaderEl.innerHTML   = `<strong>${escapeHtml(updatedAuction.highestBidder || 'No Bids')}</strong>`;
    } catch (err) {
        console.warn('Failed to refresh bids', err);
    }
}

function paintBids(bids) {
    const list = document.getElementById('bid-list');
    if (!list) return;

    if (!bids || bids.length === 0) {
        list.innerHTML = '<li class="hint" style="border:none">No bids yet — be the first!</li>';
        return;
    }

    list.innerHTML = bids.slice(0, 20).map((b) => `
    <li>
      <span><strong>${escapeHtml(b.bidderUsername || 'Anonymous')}</strong></span>
      <span class="price" style="font-size:1rem">$${fmt(b.amount)}</span>
    </li>
  `).join('');
}

function startCountdown(endTimeIso) {
    if (countdownTimer) clearInterval(countdownTimer);

    const tick = () => {
        const el = document.getElementById('countdown');
        if (!el) return;
        const end = new Date(endTimeIso).getTime();
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

        let txt;
        if (d > 0)      txt = `${d}d ${h}h ${m}m`;
        else if (h > 0) txt = `${h}h ${m}m ${s}s`;
        else if (m > 0) txt = `${m}m ${s}s`;
        else            txt = `${s}s`;

        el.textContent = txt;
        el.className = 'countdown' + (diff < 120000 ? ' ending-soon' : '');
    };

    tick();
    countdownTimer = setInterval(tick, 1000);
}

function fmt(n) {
    return (n == null ? 0 : Number(n)).toFixed(2);
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}