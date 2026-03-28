// --- LEADERBOARD HELPERS ---

export function randomMonthConsumption(averageDailyConsumption) {
    const lower = averageDailyConsumption - 17;
    const upper = averageDailyConsumption + 17;

    const now = new Date();
    const progress = (now.getHours() + now.getMinutes() / 60) / 24;

    const rand = (Math.random() + Math.random() + Math.random()) / 3;
    const daily = Math.round(lower + rand * (upper - lower));

    return Math.round(daily * (progress + now.getDate() - 1));
}

export function computeMonthlyTotal(history) {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth() + 1;

    let total = 0;

    for (const date in history) {
        const [y, m] = date.split("-").map(Number);
        if (y === year && m === month) {
            total += history[date].liters;
        }
    }

    return total;
}

export function buildLeaderboard(myTotal, friends) {
    const list = [{ name: "You", liters: myTotal }];

    for (const f of friends) {
        list.push({ name: f.name, liters: f.liters });
    }

    return list.sort((a, b) => a.liters - b.liters);
}
