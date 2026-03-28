// challengeSystem.js
import { goodPractices, alwaysActiveChallenges, getPracticeXP } from "./goodPractices.js";

const CHALLENGE_COUNT = 2;
const STORAGE_KEY = "challengeSystem:v1";

// runtime state (kept in memory and persisted to localStorage)
let activeChallenges = [];
let completedChallenges = new Set();
let lastGeneratedDate = null;

// Helpers for persistence so state survives reloads
function saveState() {
  const payload = {
    activeIds: activeChallenges.map(c => c.id),
    completedIds: Array.from(completedChallenges),
    lastGeneratedDate
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Failed to save challenge state", e);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw);
    lastGeneratedDate = p.lastGeneratedDate || null;
    completedChallenges = new Set(p.completedIds || []);
    const ids = p.activeIds || [];
    // restore activeChallenges objects from goodPractices
    activeChallenges = ids
      .map(id => goodPractices.find(g => g.id === id))
      .filter(Boolean);
  } catch (e) {
    console.warn("Failed to load challenge state", e);
  }
}

// pick N random unique practices excluding always-active ones
  function pickRandomPractices(n) {
  // create pool by filtering out always-active practices
  const pool = goodPractices.filter(p => !alwaysActiveChallenges.includes(p.id));

  // defensive: if n is larger than pool length, clamp it
  const target = Math.min(n, pool.length);

  const result = [];
  const copy = pool.slice(); // shallow copy to mutate safely
  while (result.length < target && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

// Ensure we always have exactly CHALLENGE_COUNT active challenges.
// If there are fewer (first run or corrupted state), pick new ones.
// If the day changed, refresh the set.
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

  // reset completions for the new day
  completedChallenges.clear();
  lastGeneratedDate = today;
  saveState();

  return activeChallenges;
}

// Mark a practice as completed. This function will accept any valid practice id.
// It records completion so the UI can show progress. It does NOT automatically award XP.
// The user must call claimChallengeXP to receive XP for an active challenge.
export function completeChallenge(id) {
  // validate id exists in goodPractices
  const existsInCatalog = goodPractices.some(p => p.id === id);
  if (!existsInCatalog) return false;

  completedChallenges.add(id);
  saveState();
  return true;
}

// Claim XP for a completed challenge. Only awards XP if the challenge is currently active.
// This prevents claiming XP for practices that are completed but not part of today's active set.
export function claimChallengeXP(id) {
  // must be completed
  if (!completedChallenges.has(id)) return 0;

  // Always-active challenges
  const alwaysActive = ["half_flush", "short_shower"];

  // must be one of today's active challenges
  if (!alwaysActive.includes(id)) {
    const isActive = activeChallenges.some(c => c.id === id);
    if (!isActive) return 0;
  }

  const xp = getPracticeXP(id);
  // remove from completed so it can't be claimed twice
  completedChallenges.delete(id);
  saveState();
  return xp;
}

// Return UI-friendly state
export function getChallengeState() {
  loadState();
  return {
    active: activeChallenges,
    completed: Array.from(completedChallenges)
  };
}
