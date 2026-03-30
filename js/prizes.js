// prizes.js
// Demo prize data for the Shop tab
export const realPrizes = [
    {
        id: "spotify",
        title: "Spotify Premium",
        description: "Desfruta de música sem anúncios durante um mês inteiro!",
        image: "assets/logos/spotify.svg",
        xpRequired: 5000, // demo value
        demoMessage: `
            Nesta demo não é possível reclamar prémios reais.<br>
            Mas adoramos ver o teu empenho em poupar água! 💙
        `
    },
    {
        id: "cinema",
        title: "Bilhetes de Cinema",
        description: "Vê o teu filme favorito com metade do preço!",
        image: "assets/logos/cinemas_nos.svg",
        xpRequired: 3000, // demo value
        demoMessage: `
            Nesta demo não é possível reclamar prémios reais.<br>
            Mas adoramos ver o teu empenho em poupar água! 💙
        `
    }
];

/**
 * Returns a prize object by its ID.
 * @param {string} id - Prize ID
 */
export function getPrizeById(id) {
    return realPrizes.find(p => p.id === id) || null;
}

/**
 * Opens the demo modal for a prize.
 * Your main Vue app should define:
 *   realPrizeModal.visible
 *   realPrizeModal.title
 *   realPrizeModal.message
 *   realPrizeModal.image
 */
export function openPrizeDemoModal(app, prizeId) {
    const prize = getPrizeById(prizeId);
    if (!prize) return;

    app.realPrizeModal = {
        visible: true,
        title: prize.title,
        message: prize.demoMessage,
        image: prize.image
    };
}
