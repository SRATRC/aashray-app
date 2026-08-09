import { dropdowns } from '@/src/constants';

/**
 * The rules a Raj Pravas leg has to satisfy.
 *
 * They were previously written twice per screen — once for the member and once
 * inside the per-mumukshu loop — with the two copies phrased differently. A leg
 * is a leg, so the rules live here once and both callers use them.
 */

const RESEARCH_CENTRE = dropdowns.LOCATION_LIST[0].value;
const OTHER_LOCATION = dropdowns.LOCATION_LIST.find((l: any) => l.key === 'other')?.value;
const FULL_CAR = dropdowns.BOOKING_TYPE_LIST[1].value;

export interface TravelLeg {
  pickup?: string;
  drop?: string;
  luggage?: any[];
  type?: string;
  total_people?: any;
  special_request?: string;
  arrival_time?: string;
}

/** A station or airport pickup needs a time, so the bus can meet the train. */
export const requiresArrivalTime = (pickup?: string, drop?: string) => {
  const isTimed = (value?: string) =>
    Boolean(
      value &&
        dropdowns.LOCATION_LIST.some(
          (l: any) =>
            l.value === value &&
            (l.key.toLowerCase().includes('railway') || l.key.toLowerCase().includes('airport'))
        )
    );
  return isTimed(pickup) || isTimed(drop);
};

/** "Other" is not a place, so the member has to describe it. */
export const requiresSpecialRequest = (leg: TravelLeg) =>
  leg.pickup === OTHER_LOCATION || leg.drop === OTHER_LOCATION;

/** A full car is priced per car, so the passenger count is required. */
export const requiresTotalPeople = (leg: TravelLeg) => leg.type === FULL_CAR;

/**
 * Every journey either starts or ends at the Research Centre — never both, never
 * neither. The bus only runs to and from there.
 */
export const hasValidRoute = (leg: TravelLeg) => {
  const fromRc = leg.pickup === RESEARCH_CENTRE;
  const toRc = leg.drop === RESEARCH_CENTRE;
  return Boolean(leg.pickup && leg.drop) && fromRc !== toRc;
};

/** Names the first unmet rule, so the UI can say why it cannot continue. */
export const describeLegProblem = (leg: TravelLeg): string | undefined => {
  if (!leg.pickup || !leg.drop) return 'Choose a pickup and a drop point.';
  if (!hasValidRoute(leg))
    return 'One end of the journey must be the Research Centre, and only one.';
  if (!leg.luggage || leg.luggage.length === 0) return 'Say what luggage is coming along.';
  if (requiresTotalPeople(leg) && !leg.total_people)
    return 'A full car needs the number of people travelling.';
  if (requiresArrivalTime(leg.pickup, leg.drop) && !leg.arrival_time)
    return 'Add the train or flight arrival time.';
  if (requiresSpecialRequest(leg) && !leg.special_request?.trim())
    return 'Describe the other location in the comments.';
  return undefined;
};

export const isLegValid = (leg: TravelLeg) => describeLegProblem(leg) === undefined;

/**
 * Keeps the route legal as the member picks. Choosing a pickup that is not the
 * Research Centre forces the drop to be it, and the other way round. Clears an
 * arrival time that the new pair no longer needs.
 */
export const applyRoutePairing = (leg: TravelLeg, field: 'pickup' | 'drop', value: string) => {
  const next: TravelLeg = { ...leg, [field]: value };

  if (field === 'pickup') {
    next.drop =
      value === RESEARCH_CENTRE ? (leg.drop === RESEARCH_CENTRE ? '' : leg.drop) : RESEARCH_CENTRE;
  } else {
    next.pickup =
      value === RESEARCH_CENTRE
        ? leg.pickup === RESEARCH_CENTRE
          ? ''
          : leg.pickup
        : RESEARCH_CENTRE;
  }

  if (!requiresArrivalTime(next.pickup, next.drop)) next.arrival_time = '';
  return next;
};

export const TRAVEL_CONSTANTS = { RESEARCH_CENTRE, OTHER_LOCATION, FULL_CAR };
