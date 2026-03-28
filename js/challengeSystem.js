// challengeSystem.js
// Single source of truth for daily challenges: active set, completions, and claimed XP.
// All mutations and persistence happen here; UI should call these functions and read getChallengeState().

import { goodPractices, alwaysActiveChallenges, getPracticeXP } from "./goodPractices.js";

const CHALLENGE_COUNT = 2;
const STORAGE_KEY = "challengeSystem:v1";

// runtime state (kept in memory and persisted to localStorage)
let activeChallenges = [];           // array of practice objects for today's active challenges
let completedChallenges = new Set(); // IDs of practices the user marked as completed
let claimedChallenges = new Set();   // IDs of practices for which XP has already been claimed
let lastGeneratedDate = null;

// Persist runtime state to localStorage so it survives reloads
function saveState() {
  const payload = {
    activeIds: activeChallenges.map(c => c.id),
    completedIds: Array.from(completedChallenges),
    claimedIds: Array.from(claimedChallenges),
    lastGeneratedDate
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save challenge state", e);
  }
}

// Load persisted state from localStorage into runtime variables
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    lastGeneratedDate = p.lastGeneratedDate || null;
    completedChallenges = new Set(p.completedIds || []);
    claimedChallenges = new Set(p.claimedIds || []);
    const ids = p.activeIds || [];
    // restore activeChallenges objects from goodPractices catalog
    activeChallenges = ids
      .map(id => goodPractices.find(g => g.id === id))
      .filter(Boolean);
  } catch (e) {
    console.warn("Failed to load challenge state", e);
  }
}

// Utility: pick N random unique practices excluding always-active ones
function pickRandomPractices(n) {
  const pool = goodPractices.filter(p => !alwaysActiveChallenges.includes(p.id));
  const target = Math.min(n, pool.length);
  const result = [];
  const copy = pool.slice();
  while (result.length < target && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/**
 * generateDailyChallenges
 * - Ensures we have exactly CHALLENGE_COUNT active challenges for today.
 * - If the day changed (or active set is missing/corrupt), pick new ones.
 * - Resets completed and claimed sets for the new day.
 * - Returns the active challenge objects.
 */
export function generateDailyChallenges() {
  loadState();

  const today = new Date().toDateString();
  const needsNew =
    lastGeneratedDate !== today || activeChallenges.length !== CHALLENGE_COUNT;

  if (!needsNew) {
    return activeChallenges;
  }

  // pick new unique challenges
  activeChallenges = pickRandomPractices(CHALLENGE_COUNT);

  // reset completions and claims for the new day
  completedChallenges.clear();
  claimedChallenges.clear();
  lastGeneratedDate = today;
  saveState();

  return activeChallenges;
}

/**
 * completeChallenge(id)
 * - Mark a practice as completed (UI can show progress).
 * - Does NOT award XP; the user must call claimChallengeXP to receive XP.
 * - Returns true on success, false if id is invalid.
 */
export function completeChallenge(id) {
  const existsInCatalog = goodPractices.some(p => p.id === id);
  if (!existsInCatalog) return false;

  completedChallenges.add(id);
  saveState();
  return true;
}

/**
 * claimChallengeXP(id)
 * - Awards XP for a completed challenge, but only once.
 * - Prevents double-claiming by tracking claimedChallenges.
 * - Always-active challenges (e.g., half_flush, short_shower) are allowed even if not in today's active set.
 * - Returns the XP awarded (0 if none).
 */
export function claimChallengeXP(id) {
  // must be completed first
  if (!completedChallenges.has(id)) return 0;

  // prevent double-claim
  if (claimedChallenges.has(id)) return 0;

  // Always-active challenges are allowed even if not in activeChallenges
  const alwaysActive = ["half_flush", "short_shower"];

  // if not always-active, ensure it's one of today's active challenges
  if (!alwaysActive.includes(id)) {
    const isActive = activeChallenges.some(c => c.id === id);
    if (!isActive) return 0;
  }

  const xp = getPracticeXP(id);

  // mark as claimed so it can't be claimed again
  claimedChallenges.add(id);

  // Optionally you can remove from completedChallenges here if you prefer the UI to show "claimed" instead of "completed".
  // Keeping completedChallenges allows the UI to show both "completed" and "claimed" states if desired.
  // completedChallenges.delete(id);

  saveState();
  return xp;
}

/**
 * getChallengeState()
 * - Returns a UI-friendly snapshot of the current challenge state.
 * - The returned arrays are copies (not the internal Sets) so callers can safely read them.
 */
export function getChallengeState() {
  loadState();
  return {
    active: activeChallenges,
    completed: Array.from(completedChallenges),
    claimed: Array.from(claimedChallenges)
  };
}
