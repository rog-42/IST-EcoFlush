// --- TRACKING LOGIC ---
export function createEmptyDay() {
    return { liters: 0 };
}

export function addLiters(totalLiters, liters) {
    return totalLiters + liters;
}

export function addShowerLiters(totalLiters, minutes, litersPerMinute) {
    return totalLiters + minutes * litersPerMinute;
}

export function estimatePastDays(history, averageDailyConsumption) {
    const today = new Date();
    const dayOfMonth = today.getDate();

    if (dayOfMonth > 1) {
        for (let i = 1; i < dayOfMonth; i++) {
            const d = new Date(today.getFullYear(), today.getMonth(), i);
            const key = d.toISOString().split("T")[0];

            history[key] = { liters: Math.round(averageDailyConsumption) };
        }
    }

    return history;
}
