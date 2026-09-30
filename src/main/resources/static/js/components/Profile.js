// components/Profile.js

import { api, isLoggedIn, getUser, setSession, getToken } from '../services/api.js';

export async function renderProfile(root) {
    if (!isLoggedIn()) {
        window.location.hash = '#/login';
        return;
    }

    root.innerHTML = `<div class="loading">Loading profile…</div>`;

    let profile;
    try {
        profile = await api.getProfile();
    } catch (err) {
        root.innerHTML = `<div class="empty-state">Failed to load profile: ${err.message}</div>`;
        return;
    }

    root.innerHTML = `
        <div class="page-header">
            <div>
                <h1>My Profile</h1>
                <div class="subtitle">Manage your account</div>
            </div>
        </div>

        <div class="detail-grid">
            <!-- ---------- Account info ---------- -->
            <div class="card">
                <h2>Account</h2>

                <div class="form-group">
                    <label>Username</label>
                    <input type="text" value="${escapeAttr(profile.username)}" disabled />
                </div>

                <div class="form-group">
                    <label>Role</label>
                    <input type="text" value="${escapeAttr(profile.role)}" disabled />
                </div>

                <form id="profile-form">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" id="profile-email" required value="${escapeAttr(profile.email)}" />
                    </div>
                    <div id="profile-msg" class="error-msg"></div>
                    <button type="submit" class="btn btn-primary">Save changes</button>
                </form>
            </div>

            <!-- ---------- Password ---------- -->
            <div class="card">
                <h2>Change Password</h2>
                <form id="password-form">
                    <div class="form-group">
                        <label>Current Password</label>
                        <input type="password" id="current-password" required />
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" id="new-password" required minlength="6" />
                        <p class="hint" style="margin-top:0.4rem">At least 6 characters.</p>
                    </div>
                    <div class="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" id="confirm-password" required minlength="6" />
                    </div>
                    <div id="password-msg" class="error-msg"></div>
                    <button type="submit" class="btn btn-primary">Change password</button>
                </form>
            </div>
        </div>
    `;

    // ---------- Save email ----------
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('profile-msg');
        errEl.textContent = '';
        errEl.style.color = 'var(--danger)';

        const email = document.getElementById('profile-email').value.trim();

        try {
            const res = await api.updateProfile(email);
            window.toast(res.message || 'Profile updated.', 'success');

            // Refresh session user
            const u = getUser();
            setSession(getToken(), { ...u, email });
        } catch (err) {
            errEl.textContent = err.message || 'Update failed.';
        }
    });

    // ---------- Change password ----------
    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('password-msg');
        errEl.textContent = '';
        errEl.style.color = 'var(--danger)';

        const currentPassword = document.getElementById('current-password').value;
        const newPassword     = document.getElementById('new-password').value;
        const confirm         = document.getElementById('confirm-password').value;

        if (newPassword !== confirm) {
            errEl.textContent = 'New passwords do not match.';
            return;
        }

        try {
            const res = await api.changePassword(currentPassword, newPassword);
            window.toast(res.message || 'Password changed.', 'success');
            document.getElementById('password-form').reset();
        } catch (err) {
            errEl.textContent = err.message || 'Password change failed.';
        }
    });
}

function escapeAttr(s) { return String(s ?? '').replace(/"/g, '&quot;'); }