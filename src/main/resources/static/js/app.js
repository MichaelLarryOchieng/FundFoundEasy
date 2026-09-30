// app.js — router + bootstrap

import { isLoggedIn, isAdmin, getUser, clearSession } from './services/api.js';
import { connectWS } from './services/ws.js';
import { renderNavbar } from './components/Navbar.js';
import { renderLogin } from './components/Login.js';
import { renderRegister } from './components/Register.js';
import { renderForgotPassword } from './components/ForgotPassword.js';
import { renderResetPassword } from './components/ResetPassword.js';
import { renderAuctionList } from './components/AuctionList.js';
import { renderAuctionDetail } from './components/AuctionDetail.js';
import { renderAdminDashboard } from './components/AdminDashboard.js';
import { renderMyBids } from './components/MyBids.js';
import { renderProfile } from './components/Profile.js';
import { renderHowItWorks } from './components/HowItWorks.js';
import { renderAbout } from './components/About.js';

const app = document.getElementById('app');

window.toast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
};

function parseRoute() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const [pathPart, queryPart] = raw.split('?');
    const parts = pathPart.split('/').filter(Boolean);
    return { path: pathPart, query: queryPart || '', parts };
}

async function render() {
    renderNavbar();
    const { parts } = parseRoute();
    const root = parts[0] || 'auctions';

    // Auth
    if (root === 'login')            return renderLogin(app);
    if (root === 'register')         return renderRegister(app);
    if (root === 'forgot-password')  return renderForgotPassword(app);
    if (root === 'reset-password')   return renderResetPassword(app);

    // Info pages
    if (root === 'how-it-works')     return renderHowItWorks(app);
    if (root === 'about')            return renderAbout(app);

    // User pages (require login)
    if (root === 'my-bids') {
        if (!isLoggedIn()) { window.location.hash = '#/login'; return; }
        return renderMyBids(app);
    }
    if (root === 'profile') {
        if (!isLoggedIn()) { window.location.hash = '#/login'; return; }
        return renderProfile(app);
    }

    // Admin
    if (root === 'admin') {
        if (!isAdmin()) {
            window.location.hash = '#/login';
            window.toast('Admin access only.', 'error');
            return;
        }
        return renderAdminDashboard(app);
    }

    // Auction detail
    if (root === 'auctions' && parts[1]) {
        return renderAuctionDetail(app, parts[1]);
    }

    // Default: auction list
    const hash = window.location.hash.replace(/^#/, '') || '/';
    const [, queryPart] = hash.split('?');
    const searchParams = new URLSearchParams(queryPart || '');
    const q = searchParams.get('q') || '';

    return renderAuctionList(app, q);
}

window.addEventListener('auth:logout', () => {
    renderNavbar();
    window.location.hash = '#/login';
    window.toast('Session expired. Please log in again.', 'warning');
});

window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', () => {
    connectWS();
    if (!window.location.hash) window.location.hash = '#/auctions';
    render();
});

window.appRouter = { go: (path) => { window.location.hash = path; } };
window.appAuth = { isLoggedIn, isAdmin, getUser, clearSession };