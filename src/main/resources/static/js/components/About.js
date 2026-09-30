// components/About.js

export function renderAbout(root) {
    root.innerHTML = `
        <div class="page-header">
            <div>
                <h1>About FundFoundEasy</h1>
                <div class="subtitle">A modern auction platform built with Spring Boot &amp; vanilla JS</div>
            </div>
        </div>

        <div class="card">
            <h2>What is FundFoundEasy?</h2>
            <p class="hint">
                FundFoundEasy is a real-time auction platform that combines a classic bidding experience
                with modern features: proxy bidding, live WebSocket updates, anti-sniping protection,
                and a role-based admin dashboard.
            </p>
        </div>

        <div class="card mt-3">
            <h2>Tech Stack</h2>
            <div class="attributes" style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem">
                <span class="attribute">Spring Boot 3.3</span>
                <span class="attribute">Spring Security + JWT</span>
                <span class="attribute">Spring Data JPA</span>
                <span class="attribute">PostgreSQL</span>
                <span class="attribute">Redis</span>
                <span class="attribute">WebSocket / STOMP</span>
                <span class="attribute">Maven</span>
                <span class="attribute">Vanilla JS (ES modules)</span>
                <span class="attribute">Mailtrap (SMTP)</span>
            </div>
        </div>

        <div class="card mt-3">
            <h2>Key Features</h2>
            <ul style="list-style:none;padding-left:0;line-height:2">
                <li>🔨 Real-time bidding via WebSocket</li>
                <li>🤖 Automatic proxy bidding engine</li>
                <li>⏱️ Anti-sniping — auctions extend if bid within final 2 minutes</li>
                <li>🔐 JWT authentication with refresh</li>
                <li>✉️ Email verification &amp; password reset</li>
                <li>🛠️ Admin dashboard for auction &amp; user management</li>
                <li>🖼️ Image management with local file storage</li>
            </ul>
        </div>

        <div class="card mt-3">
            <h2>Contact</h2>
            <p class="hint">
                Built by <strong>Ochieng Michael</strong> as a portfolio project.<br>
                GitHub: <a href="https://github.com/" target="_blank">github.com/…</a>
            </p>
        </div>
    `;
}