// components/ForgotPassword.js

import { api } from '../services/api.js';

export function renderForgotPassword(root) {
    root.innerHTML = `
    <div class="auth-form">
      <h2>Reset your password</h2>
      <p class="hint" style="text-align:center;margin-bottom:1.2rem">
        Enter your email and we'll send you a link to reset it.
      </p>
      <form id="forgot-form">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" required autofocus />
        </div>
        <div id="forgot-error" class="error-msg"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">
          Send reset link
        </button>
      </form>
      <div class="switch" style="margin-top:1rem">
        Remembered it? <a href="#/login">Back to login</a>
      </div>
    </div>
  `;

    document.getElementById('forgot-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('forgot-error');
        errEl.textContent = '';

        const email = document.getElementById('email').value.trim();
        const btn = e.target.querySelector('button');
        btn.disabled = true;
        btn.textContent = 'Sending…';

        try {
            const res = await api.forgotPassword(email);
            window.toast(res.message || 'Check your email for the reset link.', 'success');
            // Don't reveal whether the email exists — always redirect to login
            window.location.hash = '#/login';
        } catch (err) {
            errEl.textContent = err.message || 'Something went wrong.';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send reset link';
        }
    });
}