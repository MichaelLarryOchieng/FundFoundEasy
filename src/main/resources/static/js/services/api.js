const TOKEN_KEY = 'ffe_token';
const USER_KEY  = 'ffe_user';

export function getToken()  { return localStorage.getItem(TOKEN_KEY); }
export function getUser()   {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
}

export function setSession(jwt, user) {
    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function isLoggedIn() { return !!getToken(); }
export function isAdmin() {
    const u = getUser();
    return u && u.role === 'ROLE_ADMIN';
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = 'Bearer ' + token;
    }

    const res = await fetch(path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401 || res.status === 403) {
        if (auth && getToken()) {
            clearSession();
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
    }

    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
        const msg = (data && (data.message || data.error)) || res.statusText || 'Request failed';
        const err = new Error(msg);
        err.status = res.status;
        throw err;
    }
    return data;
}

export const api = {
    // ---------- AUTH ----------
    register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
    login:    (payload) => request('/api/auth/login',    { method: 'POST', body: payload }),
    me:       ()        => request('/api/auth/me',       { auth: true }),

    // ---------- PASSWORD RESET ----------
    forgotPassword: (email) =>
        request('/api/auth/forgot-password', { method: 'POST', body: { email } }),

    resetPassword: (token, newPassword) =>
        request('/api/auth/reset-password', { method: 'POST', body: { token, newPassword } }),

    // ---------- PUBLIC AUCTIONS ----------
    listActiveAuctions: ()     => request('/api/auctions'),
    searchAuctions:     (q)    => request(`/api/auctions?q=${encodeURIComponent(q)}`),
    getAuction:        (id)   => request(`/api/auctions/${id}`),
    getBidHistory:     (id)   => request(`/api/auctions/${id}/bids`),

    placeBid: (itemId, bidAmount) =>
        request('/api/auctions/bid', { method: 'POST', body: { itemId, bidAmount }, auth: true }),


    getProfile:   ()              => request('/api/user/profile',  { auth: true }),
    updateProfile: (email)        => request('/api/user/profile',  { method: 'PUT', body: { email }, auth: true }),
    changePassword: (currentPassword, newPassword) =>
        request('/api/user/password', { method: 'PUT', body: { currentPassword, newPassword }, auth: true }),
    myBids:       ()              => request('/api/user/my-bids',  { auth: true }),

    adminListAuctions: ()           => request('/api/admin/auctions', { auth: true }),
    adminCreateAuction: (payload)   => request('/api/admin/auctions', { method: 'POST',   body: payload, auth: true }),
    adminUpdateAuction: (id, payload) => request(`/api/admin/auctions/${id}`, { method: 'PUT', body: payload, auth: true }),
    adminDeleteAuction: (id)        => request(`/api/admin/auctions/${id}`, { method: 'DELETE', auth: true }),
    adminListUsers:     ()          => request('/api/admin/users', { auth: true }),
    adminChangeRole: (id, role)     =>
        request(`/api/admin/users/${id}/role?role=${encodeURIComponent(role)}`, { method: 'PUT', auth: true }),
};