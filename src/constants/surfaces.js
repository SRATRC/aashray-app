// One definition per surface, so a card looks the same wherever it is used.
// Cards are white on a tinted page; the page tint is what makes them read as
// cards, so the two values belong together.

const PAGE = 'bg-gray-50';

const CARD = 'rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-200';

// A card with no elevation, for use inside another white surface.
const CARD_FLAT = 'rounded-2xl border border-gray-200 bg-white';

export default { PAGE, CARD, CARD_FLAT };
