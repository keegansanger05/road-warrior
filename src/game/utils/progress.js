const PROGRESS_KEY = 'roadWarriorProgress';

export function loadProgress() {
    try {
        const raw = localStorage.getItem(PROGRESS_KEY);
        return raw ? JSON.parse(raw) : { currency: 0, unlocks: [] };
    } catch (e) {
        return { currency: 0, unlocks: [] };
    }
}

export function saveProgress(progress) {
    try {
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
        // ignore write errors
    }
}

export function addCurrency(amount) {
    const progress = loadProgress();
    progress.currency += amount;
    saveProgress(progress);
    return progress.currency;
}

export function isUnlocked(id) {
    if (!id) return true;
    const progress = loadProgress();
    return progress.unlocks.includes(id);
}

export function tryUnlock(id, cost) {
    const progress = loadProgress();
    if (progress.unlocks.includes(id)) return { success: true, alreadyUnlocked: true };
    if (progress.currency < cost) return { success: false, reason: 'insufficient-funds', currency: progress.currency };

    progress.currency -= cost;
    progress.unlocks.push(id);
    saveProgress(progress);
    return { success: true, currency: progress.currency };
}

// ====================================================================
// DEMO/PRESENTATION ONLY — safe to delete this whole function later.
// Wipes currency and every unlock back to a fresh-install state.
// ====================================================================
export function resetProgress() {
    const fresh = { currency: 0, unlocks: [] };
    saveProgress(fresh);
    return fresh;
}