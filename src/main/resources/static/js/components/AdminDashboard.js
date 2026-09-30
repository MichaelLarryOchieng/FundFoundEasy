import { api } from '../services/api.js';

export async function renderAdminDashboard(root) {
    root.innerHTML = `<div class="loading">Loading admin dashboard…</div>`;

    let auctions, users;
    try {
        [auctions, users] = await Promise.all([
            api.adminListAuctions(),
            api.adminListUsers(),
        ]);
    } catch (err) {
        root.innerHTML = `<div class="empty-state">Failed to load: ${err.message}</div>`;
        return;
    }

    root.innerHTML = `
    <div class="flex-between mt-2">
      <h1>Admin Dashboard</h1>
      <button class="btn btn-primary" id="new-auction-btn">+ New Auction</button>
    </div>

    <h2 class="mt-3">Auctions (${auctions.length})</h2>
    <table class="table" id="auctions-table">
      <thead>
        <tr>
          <th>ID</th><th>Title</th><th>Current Bid</th><th>Leader</th>
          <th>Ends</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>

    <h2 class="mt-3">Users (${users.length})</h2>
    <table class="table" id="users-table">
      <thead>
        <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Enabled</th><th>Actions</th></tr>
      </thead>
      <tbody></tbody>
    </table>

    <div id="modal-root"></div>
  `;

    paintAuctions(auctions);
    paintUsers(users);

    document.getElementById('new-auction-btn').addEventListener('click', () => {
        openAuctionModal();
    });
}
function paintAuctions(auctions) {
    const tbody = document.querySelector('#auctions-table tbody');
    tbody.innerHTML = auctions.map((a) => `
    <tr data-id="${a.itemId}">
      <td>${a.itemId}</td>
      <td>${escapeHtml(a.title)}</td>
      <td><strong>$${fmt(a.currentBid)}</strong></td>
      <td>${escapeHtml(a.highestBidder || '—')}</td>
      <td>${formatDate(a.endTime)}</td>
      <td>
        <span class="${a.active ? 'badge-active' : 'badge-ended'}">
          ${a.active ? 'LIVE' : 'ENDED'}
        </span>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" data-action="edit">Edit</button>
        <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="7" class="hint">No auctions yet.</td></tr>';

    tbody.querySelectorAll('tr[data-id]').forEach((tr) => {
        const id = tr.dataset.id;
        tr.querySelector('[data-action="edit"]').addEventListener('click', async () => {
            const a = await api.getAuction(id);
            openAuctionModal(a);
        });
        tr.querySelector('[data-action="delete"]').addEventListener('click', async () => {
            if (!confirm('Delete this auction? This cannot be undone.')) return;
            try {
                await api.adminDeleteAuction(id);
                window.toast('Auction deleted.', 'success');
                reload();
            } catch (err) {
                window.toast(err.message || 'Delete failed.', 'error');
            }
        });
    });
}
function paintUsers(users) {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = users.map((u) => `
    <tr data-id="${u.id}">
      <td>${u.id}</td>
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${u.role}</td>
      <td>${u.enabled ? '✅' : '❌'}</td>
      <td>
        ${u.role === 'ROLE_ADMIN'
        ? `<button class="btn btn-secondary btn-sm" data-role="ROLE_USER">Make User</button>`
        : `<button class="btn btn-primary btn-sm" data-role="ROLE_ADMIN">Make Admin</button>`}
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="hint">No users.</td></tr>';

    tbody.querySelectorAll('tr[data-id]').forEach((tr) => {
        const id = tr.dataset.id;
        tr.querySelectorAll('[data-role]').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const role = btn.dataset.role;
                try {
                    await api.adminChangeRole(id, role);
                    window.toast(`Role updated to ${role}.`, 'success');
                    reload();
                } catch (err) {
                    window.toast(err.message || 'Role change failed.', 'error');
                }
            });
        });
    });
}
function openAuctionModal(existing = null) {
    const isEdit = !!existing;
    const modal = document.getElementById('modal-root');

    const initialEnd = existing?.endTime
        ? new Date(existing.endTime).toISOString().slice(0, 16)
        : new Date(Date.now() + 86400000).toISOString().slice(0, 16);

    modal.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal">
        <h2>${isEdit ? 'Edit' : 'New'} Auction</h2>
        <form id="auction-form">
          <div class="form-group">
            <label>Title *</label>
            <input type="text" id="f-title" required value="${escapeAttr(existing?.title || '')}" />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="f-description">${escapeHtml(existing?.description || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Image URL</label>
            <input type="text" id="f-imageUrl" placeholder="/images/auctions/watch.jpg" value="${escapeAttr(existing?.imageUrl || '')}" />
          </div>
          <div class="form-group">
            <label>Starting Price (USD) *</label>
            <input type="number" id="f-startingPrice" step="0.01" min="0.01" required
                   value="${existing?.startingPrice ?? existing?.currentBid ?? ''}" />
          </div>
          <div class="form-group">
            <label>Minimum Increment (USD)</label>
            <input type="number" id="f-minIncrement" step="0.01" min="0.01"
                   value="${existing?.minIncrement ?? 1.00}" />
          </div>
          <div class="form-group">
            <label>End Time *</label>
            <input type="datetime-local" id="f-endTime" required value="${initialEnd}" />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="f-active" ${existing?.active !== false ? 'checked' : ''} />
              Active
            </label>
          </div>

          <div id="modal-error" class="error-msg"></div>

          <div style="display:flex;gap:0.5rem;margin-top:1rem">
            <button type="button" class="btn btn-secondary" id="cancel-btn" style="flex:1">Cancel</button>
            <button type="submit" class="btn btn-primary" style="flex:1">
              ${isEdit ? 'Save Changes' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', (e) => {
        if (e.target.id === 'modal-backdrop') closeModal();
    });

    document.getElementById('auction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('modal-error');
        errEl.textContent = '';

        const payload = {
            title:        document.getElementById('f-title').value.trim(),
            description:  document.getElementById('f-description').value.trim(),
            imageUrl:     document.getElementById('f-imageUrl').value.trim() || null,
            startingPrice:parseFloat(document.getElementById('f-startingPrice').value),
            minIncrement: parseFloat(document.getElementById('f-minIncrement').value) || 1.0,
            endTime:      document.getElementById('f-endTime').value + ':00',
            active:       document.getElementById('f-active').checked,
        };

        try {
            if (isEdit) {
                await api.adminUpdateAuction(existing.itemId, payload);
                window.toast('Auction updated.', 'success');
            } else {
                await api.adminCreateAuction(payload);
                window.toast('Auction created.', 'success');
            }
            closeModal();
            reload();
        } catch (err) {
            errEl.textContent = err.message || 'Save failed.';
        }
    });
}

function closeModal() {
    document.getElementById('modal-root').innerHTML = '';
}

// ============================================================
// Utilities
// ============================================================
function reload() {
    const root = document.getElementById('app');
    renderAdminDashboard(root);
}

function fmt(n) { return (n == null ? 0 : Number(n)).toFixed(2); }

function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
}

function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
}