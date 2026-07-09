// A pickup or drop at an airport or railway station needs a flight/train time so staff can
// coordinate the transfer. Kept in one place so every travel form and its validation agree on
// when that field is mandatory.
const touchesAirportOrRailway = (loc?: string) => {
  if (!loc) return false;
  const l = loc.toLowerCase();
  return l.includes('airport') || l.includes('railway');
};

export const requiresArrivalTime = (pickup?: string, drop?: string) =>
  touchesAirportOrRailway(pickup) || touchesAirportOrRailway(drop);

// Reverse onward travel groups into default return groups: swap pickup/drop, clear the arrival
// time, carry comments (from special_request) and the same travelers/type/luggage/people.
// indicesKey names the onward group's traveler-index field (mumukshuIndices / guestIndices).
export const reverseOnwardGroups = (groups: any[], indicesKey: string) =>
  (groups || []).map((g: any) => ({
    pickup: g.drop || '',
    drop: g.pickup || '',
    type: g.type || '',
    luggage: g.luggage || [],
    arrival_time: '',
    comments: g.special_request || '',
    total_people: g.total_people ?? null,
    travelerIndices: (g[indicesKey] || []).map(String),
  }));
