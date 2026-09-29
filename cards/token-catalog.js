// Public token catalogue used by the calculator autocomplete.
// Token records are managed from the admin dashboard in Firestore.
import { db } from '../config/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

let catalog = [];
let loadPromise = null;

export function loadTokenCatalog() {
    if (loadPromise) return loadPromise;
    loadPromise = (async () => {
        try {
            const snapshot = await getDocs(collection(db, 'token_catalog'));
            catalog = [];
            snapshot.forEach(record => {
                const token = { id: record.id, ...record.data() };
                if (token.isActive !== false && token.name && token.logoDataUrl) catalog.push(token);
            });
            catalog.sort((a, b) => String(a.name).localeCompare(String(b.name)));
        } catch (error) {
            // The calculator must remain usable if the catalogue is unavailable.
            console.warn('[TokenCatalog] Could not load token suggestions:', error.message);
            catalog = [];
        }
        return catalog;
    })();
    return loadPromise;
}

export function searchTokenCatalog(query, limit = 8) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return [];

    return catalog
        .map(token => ({ token, score: matchScore(token, normalizedQuery) }))
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score || String(a.token.name).localeCompare(String(b.token.name)))
        .slice(0, limit)
        .map(result => result.token);
}

function matchScore(token, query) {
    const name = normalize(token.name);
    const symbol = normalize(token.symbol);
    if (symbol === query) return 1000;
    if (name === query) return 980;
    if (symbol.startsWith(query)) return 900 - symbol.length;
    if (name.startsWith(query)) return 800 - name.length;
    if (name.split(/\s+/).some(word => word.startsWith(query))) return 700;
    if (symbol.includes(query)) return 500;
    if (name.includes(query)) return 400;
    return 0;
}

function normalize(value) {
    return String(value || '')
        .toLocaleLowerCase()
        .replace(/^\$/, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim();
}
