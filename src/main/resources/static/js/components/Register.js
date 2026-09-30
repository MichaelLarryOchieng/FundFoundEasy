// components/Register.js

import { api } from '../services/api.js';

export function renderRegister(root) {
    root.innerHTML = `
    <div class="auth-form">
      <h2>Create an account</h2>
      <form id="register-form">
        <div class="form-group">
          <label>Username</label>
          <input type="text" id="username" required minlength="3" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="email" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="password" required minlength="6" />
        </div>
        <div id="register-error" class="error-msg"></div>
        <button type="submit" class="btn btn-primary" style="width:100%">Register</button>
      </form>
      <div class="switch">
        Already have an account? <a href="#/login">Log in</a>
      </div>
    </div>
  `;

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('register-error');
        errEl.textContent = '';

        const username = document.getElementById('username').value.trim();
        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const res = await api.register({ username, email, password });
            window.toast(res.message || 'Registered! Check your email to verify.', 'success');
            window.location.hash = '#/login';
        } catch (err) {
            errEl.textContent = err.message || 'Registration failed.';
        }
    });
}