// components/Login.js

import { api, setSession } from '../services/api.js';

export function renderLogin(root) {
    root.innerHTML = `
    <div class="auth-form">
      <h2>Welcome back</h2>
      <form id="login-form">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="username" required autofocus />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password" required />
        </div>
        <div id="login-error" class="error-msg"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Log in</button>
        <div class="switch" style="margin-top:0.8rem;text-align:right">
          <a href="#/forgot-password" style="font-size:0.85rem">Forgot password?</a>
        </div>

      </form>
      <div class="switch">
        No account? <a href="#/register">Register</a>
      </div>
    </div>
  `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('login-error');
        errEl.textContent = '';

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        try {
            const res = await api.login({ username, password });
            setSession(res.token, {
                username: res.username,
                email: res.email,
                role: res.role,
            });
            window.toast('Logged in successfully!', 'success');
            window.location.hash = '#/auctions';
        } catch (err) {
            errEl.textContent = err.message || 'Login failed.';
        }
    });
}