// components/ResetPassword.js

import { api } from '../services/api.js';

export function renderResetPassword(root) {
    // Parse token from URL: #/reset-password?token=abc-123
    const hashParts = window.location.hash.split('?');
    const params = new URLSearchParams(hashParts[1] || '');
    const token = params.get('token') || '';

    root.innerHTML = `
    <div class="auth-form">
      <h2>Set a new password</h2>
      <form id="reset-form">
        <input type="hidden" id="token" value="${escapeAttr(token)}" />
        <div class="form-group">
          <label>New Password</label>
          <input type="password" id="newPassword" required minlength="6" autofocus />
          <p class="hint" style="margin-top:0.4rem">At least 6 characters.</p>
        </div>
        <div id="reset-error" class="error-msg"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">
          Reset password
        </button>
      </form>
      <div class="switch" style="margin-top:1rem">
        <a href="#/login">Back to login</a>
      </div>
    </div>
  `;

    if (!token) {
        document.getElementById('reset-error').textContent =
            'Missing reset token. Please use the link from your email.';
        document.getElementById('reset-form').style.display = 'none';
        return;
    }

    document.getElementById('reset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('reset-error');
        errEl.textContent = '';

        const newPassword = document.getElementById('newPassword').value;
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Resetting…';

        try {
            const res = await api.resetPassword(token, newPassword);
            window.toast(res.message || 'Password reset!', 'success');
            window.location.hash = '#/login';
        } catch (err) {
            errEl.textContent = err.message || 'Reset failed.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Reset password';
        }
    });
}

function escapeAttr(s) {
    return String(s ?? '').replace(/"/g, '&quot;');
}