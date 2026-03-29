// cosmetics.js
// Centralized cosmetic system for EcoFlush demo

import { loadCosmeticsSnapshot, saveCosmeticsSnapshot } from "./storage.js";
export const cosmetics = {
    cowboy_hat: {
        id: "cowboy_hat",
        name: "Chapéu Cowboy",
        description: "Dá um estilo único ao teu mascote!",
        image: "assets/mascot/cosmetics/cowboy_hat.png",
        xpCost: 0,  // free for the Demo
        owned: false,
        equipped: false,
        offsetY: -102.5,   // vertical shift in px (negative moves up)
        scale: 1.75      // 1.0 = same width as mascot; 0.8 = 80% width
    }
};

/**
 * Returns a cosmetic object by ID.
 * @param {string} id
 */
export function getCosmetic(id) {
    return cosmetics[id] || null;
}

/**
 * Buys a cosmetic (demo: no XP cost).
 * @param {string} id
 */
export function buyCosmetic(id) {
    const item = getCosmetic(id);
    if (!item) return;
    item.owned = true;
    saveCosmeticsSnapshot(cosmetics);
}

/**
 * Toggles equip/unequip for a cosmetic.
 * Only one cosmetic can be equipped at a time.
 * @param {string} id
 */
export function toggleEquip(id) {
    const item = getCosmetic(id);
    if (!item || !item.owned) return;

    // Unequip all cosmetics first
    Object.values(cosmetics).forEach(c => c.equipped = false);

    // Equip or unequip the selected one
    item.equipped = !item.equipped;
    saveCosmeticsSnapshot(cosmetics);
}

/**
 * Returns the image of the currently equipped cosmetic.
 * @returns {string|null}
 */
export function getEquippedCosmeticImage() {
    const equipped = Object.values(cosmetics).find(c => c.equipped);
    return equipped ? equipped.image : null;
}

/**
 * Returns all cosmetics as an array (useful for v-for loops).
 */
export function getAllCosmetics() {
    return Object.values(cosmetics);
}

export function loadCosmeticsFromStorage() {
  // merge persisted flags into the in-memory cosmetics object
  const snapshot = loadCosmeticsSnapshot();
  if (!snapshot) return;
  Object.keys(snapshot).forEach(id => {
    if (cosmetics[id]) {
      cosmetics[id].owned = !!snapshot[id].owned;
      cosmetics[id].equipped = !!snapshot[id].equipped;
    }
  });
}

