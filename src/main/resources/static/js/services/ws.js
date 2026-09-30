// services/ws.js — hardened STOMP client (no infinite reconnect loops)

let client = null;
let unavailable = false;
const subscriptions = new Map();

export function connectWS() {
    if (unavailable) return null;
    if (client && (client.connected || client.active)) return client;

    if (typeof SockJS === 'undefined' || typeof StompJs === 'undefined') {
        console.warn('[WS] SockJS/StompJs not loaded — REST-only mode');
        unavailable = true;
        return null;
    }

    try {
        client = new StompJs.Client({
            webSocketFactory: () => new SockJS('/ws'),
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            onConnect: () => {
                console.log('[WS] connected');
                // Resubscribe existing topics once, without re-entering connectWS()
                subscriptions.forEach((handler, topic) => {
                    try {
                        client.subscribe(topic, (msg) => {
                            try { handler(JSON.parse(msg.body)); }
                            catch (e) { console.warn('[WS] bad payload', msg.body); }
                        });
                    } catch (e) {
                        console.warn('[WS] resubscribe failed for', topic, e.message);
                    }
                });
            },
            onStompError: (frame) => console.warn('[WS] STOMP error', frame),
            onWebSocketError: () => { /* silence — SockJS already logs */ },
            onWebSocketClose: () => { /* silence — auto-reconnect handles it */ },
        });
        client.activate();
    } catch (e) {
        console.warn('[WS] init failed:', e.message);
        unavailable = true;
        return null;
    }
    return client;
}

export function subscribe(topic, handler, alreadySubscribed = false) {
    if (!alreadySubscribed) subscriptions.set(topic, handler);
    if (unavailable) return null;

    // Ensure the client exists (but don't block on connection)
    if (!client) connectWS();

    // If not yet connected, the onConnect handler will subscribe for us
    if (!client || !client.connected) return null;

    try {
        return client.subscribe(topic, (msg) => {
            try { handler(JSON.parse(msg.body)); }
            catch (e) { console.warn('[WS] bad payload', msg.body); }
        });
    } catch (e) {
        console.warn('[WS] subscribe failed:', e.message);
        return null;
    }
}

export function unsubscribe(topic) {
    subscriptions.delete(topic);
}