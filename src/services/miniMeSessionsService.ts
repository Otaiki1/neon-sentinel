/**
 * Mini-Me Sessions Service
 *
 * Manages "sessions" for mini-me activation during battle. One activation = one session.
 * Sessions are refilled by: +3 on prestige, or purchase with coins.
 */

const STORAGE_KEY = "neonSentinel_miniMeSessions";
const DEFAULT_SESSIONS = 3;
const PRESTIGE_SESSIONS_GRANT = 3;
const SESSIONS_PACK_SIZE = 3;
const SESSIONS_PACK_COST = 100;

function loadSessions(): number {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored == null) return DEFAULT_SESSIONS;
        const n = parseInt(stored, 10);
        return Number.isFinite(n) && n >= 0 ? n : DEFAULT_SESSIONS;
    } catch {
        return DEFAULT_SESSIONS;
    }
}

function saveSessions(count: number): void {
    try {
        localStorage.setItem(STORAGE_KEY, String(Math.max(0, count)));
    } catch (e) {
        console.error("Error saving mini-me sessions:", e);
    }
}

/**
 * Get number of mini-me sessions available.
 */
export function getMiniMeSessionsAvailable(): number {
    return loadSessions();
}

/**
 * Use one session (for one activation). Returns true if a session was consumed.
 */
export function useMiniMeSession(): boolean {
    const current = loadSessions();
    if (current <= 0) return false;
    saveSessions(current - 1);
    return true;
}

/**
 * Add sessions (e.g. +3 on prestige).
 */
export function addMiniMeSessions(amount: number): number {
    const current = loadSessions();
    const next = Math.max(0, current + amount);
    saveSessions(next);
    return next;
}

/**
 * Buy one pack of sessions with coins. Returns true if purchase succeeded.
 * Deducts coins via the provided spend function; caller should pass coinService.spendCoins or equivalent.
 */
export function buyMiniMeSessionsPack(
    availableCoins: number,
    spendCoinsFn: (amount: number, reason: string) => boolean,
): boolean {
    if (availableCoins < SESSIONS_PACK_COST) return false;
    if (!spendCoinsFn(SESSIONS_PACK_COST, "mini_me_sessions_pack"))
        return false;
    addMiniMeSessions(SESSIONS_PACK_SIZE);
    return true;
}

export const MINI_ME_SESSIONS_PACK_COST = SESSIONS_PACK_COST;
export const MINI_ME_SESSIONS_PACK_SIZE = SESSIONS_PACK_SIZE;
export const MINI_ME_PRESTIGE_SESSIONS_GRANT = PRESTIGE_SESSIONS_GRANT;
