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
