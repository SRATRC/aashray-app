import { dropdowns } from '@/src/constants';

const DEFAULT_LEAVING_POST_ADHYAYAN = dropdowns.TRAVEL_ADHYAYAN_ASK_LIST[1].value;

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
    adhyayan: DEFAULT_LEAVING_POST_ADHYAYAN,
    travelerIndices: (g[indicesKey] || []).map(String),
  }));

// "Leaving post Adhyayan?" only applies to a leg that departs the Research Centre. The backend
// reads it from leaving_post_adhyayan on that leg; every other leg is sent as 'No' (0) so the
// answer given for one leg can never be copied onto another.
export const leavingPostAdhyayanFor = (group: { pickup?: string; adhyayan?: string }) =>
  group.pickup === 'Research Centre' ? group.adhyayan || DEFAULT_LEAVING_POST_ADHYAYAN : 'No';

// True when an edited return is not bookable: a group missing a field the onward form also
// requires, or a traveler left out of every group (they would be silently dropped from the
// return). allIndices are the onward travelers' indices (as strings).
export const isReturnIncomplete = (groups: any[], allIndices: string[], otherLocation?: string) => {
  if (!groups?.length) return false;
  const assigned = new Set<string>();
  for (const g of groups) {
    if (!g.pickup || !g.drop || !g.type || !(g.luggage?.length > 0)) return true;
    if (!g.travelerIndices?.length) return true;
    const fromRC = g.pickup === 'Research Centre';
    const toRC = g.drop === 'Research Centre';
    if (fromRC === toRC) return true;
    if (g.type === dropdowns.BOOKING_TYPE_LIST[1].value && !g.total_people) return true;
    if (
      otherLocation &&
      (g.pickup === otherLocation || g.drop === otherLocation) &&
      !(g.comments || '').trim()
    )
      return true;
    g.travelerIndices.forEach((i: string) => assigned.add(String(i)));
  }
  return allIndices.some((i) => !assigned.has(String(i)));
};
