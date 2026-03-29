// --- LOCAL STORAGE HELPERS ---

export function loadHistory() {
    return JSON.parse(localStorage.getItem("history")) || {};
}

export function saveHistory(history) {
    localStorage.setItem("history", JSON.stringify(history));
}

export function loadFriends() {
    return JSON.parse(localStorage.getItem("friends")) || [];
}

export function saveFriends(friends) {
    localStorage.setItem("friends", JSON.stringify(friends));
}

// --- COSMETICS PERSISTENCE HELPERS (add to storage.js) ---
export const COSMETICS_STORAGE_KEY = "storage:cosmetics:v1";

export function saveCosmeticsSnapshot(cosmetics) {
  try {
    const snapshot = {};
    Object.values(cosmetics).forEach(c => {
      snapshot[c.id] = { owned: !!c.owned, equipped: !!c.equipped };
    });
    localStorage.setItem(COSMETICS_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (e) {
    console.warn("Failed to save cosmetics snapshot", e);
  }
}

export function loadCosmeticsSnapshot() {
  try {
    const raw = localStorage.getItem(COSMETICS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load cosmetics snapshot", e);
    return null;
  }
}

/**
 * migrateCosmeticsKey
 * - If an older key exists (from a previous implementation), migrate it to the new key.
 * - Call once at app startup before loadCosmeticsSnapshot().
 */
export function migrateCosmeticsKeyIfNeeded() {
  try {
    const oldRaw = localStorage.getItem(COSMETICS_OLD_KEY);
    if (!oldRaw) return;
    // only migrate if new key is empty
    if (!localStorage.getItem(COSMETICS_STORAGE_KEY)) {
      localStorage.setItem(COSMETICS_STORAGE_KEY, oldRaw);
    }
    // optionally remove old key to avoid confusion
    // localStorage.removeItem(COSMETICS_OLD_KEY);
  } catch (e) {
    console.warn("Failed to migrate cosmetics key", e);
  }
}

export function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}

export function getYesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}
