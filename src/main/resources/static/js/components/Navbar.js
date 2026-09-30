// components/Navbar.js

import { isLoggedIn, isAdmin, getUser, clearSession } from '../services/api.js';

export function renderNavbar() {
    const el = document.getElementById('navbar');
    const logged = isLoggedIn();
    const admin = isAdmin();
    const user = getUser();

    const currentHash = window.location.hash;
    const match = currentHash.match(/[?&]q=([^&]*)/);
    const currentQuery = match ? decodeURIComponent(match[1]) : '';

    el.innerHTML = `
        <nav class="navbar">
            <div class="brand" onclick="location.hash='#/auctions'"
                 style="display:flex;align-items:center;gap:0.6rem">
                <img src="/images/icons/gavel.svg" alt=""
                     style="width:22px;height:22px;filter:invert(70%) sepia(50%) saturate(2000%) hue-rotate(180deg)"/>
                <span>FundFoundEasy</span>
            </div>

            <form class="navbar-search" id="navbar-search-form">
                <input type="text" id="navbar-search-input"
                       placeholder="Search auctions…"
                       value="${escapeAttr(currentQuery)}" />
                <span class="search-icon">🔍</span>
            </form>

            <div class="nav-links">
                <a href="#/auctions">Auctions</a>
                <a href="#/how-it-works">How it works</a>
                ${logged ? '<a href="#/my-bids">My Bids</a>' : ''}
                ${admin ? '<a href="#/admin">Admin</a>' : ''}
                <a href="#/about">About</a>

                ${logged
        ? `<a href="#/profile" class="user-info" style="text-decoration:none">${user.username}${admin ? '<span class="badge">ADMIN</span>' : ''}</a>
                       <a href="#" id="logout-link">Logout</a>`
        : `<a href="#/login">Login</a><a href="#/register">Register</a>`}
            </div>
        </nav>
    `;

    const searchForm = document.getElementById('navbar-search-form');
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = document.getElementById('navbar-search-input').value.trim();
        if (q) window.location.hash = `#/auctions?q=${encodeURIComponent(q)}`;
        else   window.location.hash = '#/auctions';
    });

    const logout = document.getElementById('logout-link');
    if (logout) {
        logout.addEventListener('click', (e) => {
            e.preventDefault();
            clearSession();
            window.dispatchEvent(new CustomEvent('auth:logout'));
        });
    }
}

function escapeAttr(s) {
    return String(s ?? '').replace(/"/g, '&quot;');
}