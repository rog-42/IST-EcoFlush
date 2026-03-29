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

export function getTodayKey() {
    return new Date().toISOString().split("T")[0];
}

export function getYesterdayKey() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}
