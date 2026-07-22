import type { BookingSlice, BookingType } from '@/stores/bookingTypes';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

interface RequestUser {
  cardno: string;
}

// Some callers build the booking payload ad hoc (e.g. FoodBooking.tsx) rather
// than pulling it straight from the store, so `primary` may arrive as a
// plain (widened) string instead of the narrower BookingType literal union.
// Accept that here to avoid forcing every call site to annotate/cast.
type BookingSliceInput = Omit<BookingSlice, 'primary'> & { primary?: string };

// ---------------------------------------------------------------------------
// Guest booking — input shapes (loose; store payloads are typed `any` in
// BookingSlice, these describe just the fields this file reads/writes)
// ---------------------------------------------------------------------------

interface GuestPersonRef {
  cardno: string;
}

interface GuestGroupInputItem {
  roomType?: string;
  floorType?: string;
  guests?: GuestPersonRef[];
  meals?: string[];
  spicy?: boolean;
  hightea?: boolean;
}

interface GuestUtsavPerson {
  cardno: string;
  package?: unknown;
  arrival?: unknown;
  volunteer?: unknown;
  carno?: unknown;
  other?: unknown;
}

// ---------------------------------------------------------------------------
// Guest booking — output shapes (must match backend request contract)
// ---------------------------------------------------------------------------

interface GuestGroupTransformed {
  roomType?: string;
  floorType?: string;
  guests?: string[];
  meals?: string[];
  spicy?: boolean;
  high_tea?: boolean;
}

interface GuestRoomDetails {
  checkin_date: string;
  checkout_date: string;
  guestGroup: GuestGroupTransformed[];
}

interface GuestFoodDetails {
  start_date: string;
  end_date: string;
  guestGroup: GuestGroupTransformed[];
}

interface GuestAdhyayanDetails {
  shibir_ids: unknown[];
  guests: string[];
}

interface GuestFlatDetails {
  checkin_date: string;
  checkout_date: string;
  guests: string[];
}

interface GuestUtsavDetailsPerson {
  cardno: string;
  packageid: unknown;
  arrival: unknown;
  volunteer: unknown;
  carno: unknown;
  other: unknown;
}

interface GuestUtsavDetails {
  utsavid: unknown;
  guests: GuestUtsavDetailsPerson[];
}

type GuestBookingDetails =
  | GuestRoomDetails
  | GuestFoodDetails
  | GuestAdhyayanDetails
  | GuestFlatDetails
  | GuestUtsavDetails;

interface GuestBookingRequestItem {
  booking_type: BookingType;
  details: GuestBookingDetails;
}

export interface GuestRequestBody {
  cardno: string;
  primary_booking: GuestBookingRequestItem;
  addons: GuestBookingRequestItem[];
}

// ---------------------------------------------------------------------------
// Mumukshu booking — input shapes
// ---------------------------------------------------------------------------

interface MumukshuMember {
  cardno: string;
  arrival_time?: string;
  adhyayan?: string;
  luggage?: string[];
  type?: string;
  special_request?: string;
  total_people?: number;
}

interface MumukshuGroupInputItem {
  cardno?: string;
  roomType?: string;
  floorType?: string;
  mumukshus?: MumukshuMember[];
  pickup?: string;
  drop?: string;
  arrival_time?: string;
  adhyayan?: string;
  luggage?: string[];
  type?: string;
  special_request?: string;
  meals?: string[];
  spicy?: boolean;
  hightea?: boolean;
  total_people?: number;
}

// ---------------------------------------------------------------------------
// Mumukshu booking — output shapes
// ---------------------------------------------------------------------------

interface MumukshuGroupTransformed {
  roomType?: string;
  floorType?: string;
  mumukshus?: string[];
  arrival_time?: string;
  leaving_post_adhyayan?: 0 | 1;
  luggage?: string;
  type?: string;
  comments?: string;
  meals?: string[];
  spicy?: boolean;
  high_tea?: boolean;
  total_people?: number;
  pickup_point?: string;
  drop_point?: string;
}

// transformMumukshuGroup returns the bare cardno string when the input item
// is just a person reference (`{ cardno }`), otherwise the transformed group.
type MumukshuGroupResultItem = string | MumukshuGroupTransformed;

interface MumukshuRoomDetails {
  checkin_date: string;
  checkout_date: string;
  mumukshuGroup: MumukshuGroupResultItem[];
}

interface MumukshuFoodDetails {
  start_date: string;
  end_date: string;
  mumukshuGroup: MumukshuGroupResultItem[];
}

interface MumukshuAdhyayanDetails {
  shibir_ids: unknown[];
  mumukshus: MumukshuGroupResultItem[];
}

interface MumukshuTravelDetails {
  date: unknown;
  mumukshuGroup: MumukshuGroupResultItem[];
}

interface MumukshuFlatDetails {
  checkin_date: string;
  checkout_date: string;
  mumukshus: MumukshuGroupResultItem[];
}

interface MumukshuUtsavInputPerson {
  cardno: string;
  package?: unknown;
  arrival?: unknown;
  volunteer?: unknown;
  carno?: unknown;
  other?: unknown;
}

interface MumukshuUtsavDetailsPerson {
  cardno: string;
  packageid: unknown;
  arrival: unknown;
  volunteer: unknown;
  carno: unknown;
  other: unknown;
}

interface MumukshuUtsavDetails {
  utsavid: unknown;
  mumukshus: MumukshuUtsavDetailsPerson[];
}

type MumukshuBookingDetails =
  | MumukshuRoomDetails
  | MumukshuFoodDetails
  | MumukshuAdhyayanDetails
  | MumukshuTravelDetails
  | MumukshuFlatDetails
  | MumukshuUtsavDetails;

interface MumukshuBookingRequestItem {
  booking_type: BookingType;
  details: MumukshuBookingDetails;
}

export interface MumukshuRequestBody {
  cardno: string;
  primary_booking: MumukshuBookingRequestItem;
  addons: MumukshuBookingRequestItem[];
}

// ---------------------------------------------------------------------------
// Guest builder
// ---------------------------------------------------------------------------

export const prepareGuestRequestBody = (
  user: RequestUser,
  guestData: BookingSliceInput
): GuestRequestBody => {
  const transformGuestGroup = (guestGroup: GuestGroupInputItem[]): GuestGroupTransformed[] =>
    guestGroup.map((group) => {
      const transformed: GuestGroupTransformed = {};
      if (group.roomType) transformed.roomType = group.roomType;
      if (group.floorType && group.floorType !== 'n') transformed.floorType = group.floorType;
      if (group.guests) transformed.guests = group.guests.map((guest) => guest.cardno);
      if (group.meals) transformed.meals = group.meals;
      if (group.spicy !== undefined) transformed.spicy = group.spicy;
      if (group.hightea) transformed.high_tea = group.hightea;
      return transformed;
    });

  const data = guestData as Record<string, any>;

  const primaryBookingDetails = (primaryKey: string): GuestBookingRequestItem => {
    const primaryData = data[primaryKey];
    switch (primaryKey) {
      case 'room':
        return {
          booking_type: 'room',
          details: {
            checkin_date: primaryData.startDay,
            checkout_date: primaryData.endDay,
            guestGroup: transformGuestGroup(primaryData.guestGroup),
          },
        };
      case 'food':
        return {
          booking_type: 'food',
          details: {
            start_date: primaryData.startDay,
            end_date: primaryData.endDay,
            guestGroup: transformGuestGroup(primaryData.guestGroup),
          },
        };
      case 'adhyayan':
        return {
          booking_type: 'adhyayan',
          details: {
            shibir_ids: [primaryData.adhyayan.id],
            guests: primaryData.guestGroup.map((guest: GuestPersonRef) => guest.cardno),
          },
        };
      case 'flat':
        return {
          booking_type: 'flat',
          details: {
            checkin_date: primaryData.startDay,
            checkout_date: primaryData.endDay,
            guests: primaryData.guests,
          },
        };
      case 'utsav':
        return {
          booking_type: 'utsav',
          details: {
            utsavid: primaryData.utsav.utsav_id,
            guests: primaryData.guests.map((guest: GuestUtsavPerson) => {
              return {
                cardno: guest.cardno,
                packageid: guest.package,
                arrival: guest.arrival,
                volunteer: guest.volunteer,
                carno: guest.carno,
                other: guest.other,
              };
            }),
          },
        };
      default:
        throw new Error(`Unsupported primary booking type: ${primaryKey}`);
    }
  };

  const transformAddons = (input: Record<string, any>): GuestBookingRequestItem[] =>
    Object.keys(input)
      .filter((key) => key !== input.primary && key !== 'primary')
      .map((key): GuestBookingRequestItem | null => {
        switch (key) {
          case 'room':
            return {
              booking_type: key,
              details: {
                checkin_date: input[key].startDay,
                checkout_date: input[key].endDay,
                guestGroup: transformGuestGroup(input[key].guestGroup),
              },
            };
          case 'food':
            return {
              booking_type: key,
              details: {
                start_date: input[key].startDay,
                end_date: input[key].endDay,
                guestGroup: transformGuestGroup(input[key].guestGroup),
              },
            };
          case 'adhyayan':
            return {
              booking_type: key,
              details: {
                shibir_ids: [input[key].adhyayan.id],
                guests: input[key].guests.map((guest: GuestPersonRef) => guest.cardno),
              },
            };
          case 'validationData':
            return null;
          default:
            throw new Error(`Unsupported addon type: ${key}`);
        }
      })
      .filter((item): item is GuestBookingRequestItem => item !== null);

  return {
    cardno: user.cardno,
    primary_booking: primaryBookingDetails(data.primary),
    addons: transformAddons(data),
  };
};

// ---------------------------------------------------------------------------
// Mumukshu builder
// ---------------------------------------------------------------------------

export const prepareMumukshuRequestBody = (
  user: RequestUser,
  mumukshuData: BookingSliceInput
): MumukshuRequestBody => {
  const metadataFields = [
    'validationData',
    'dismissedValidationError',
    'errorAlreadyShown',
    'errorMessage',
  ];
  const bookingInput = { ...mumukshuData } as Record<string, any>;
  metadataFields.forEach((field) => {
    if (bookingInput[field]) delete bookingInput[field];
  });

  const transformMumukshuGroup = (
    mumukshuGroup: MumukshuGroupInputItem[]
  ): MumukshuGroupResultItem[] =>
    mumukshuGroup.map((group): MumukshuGroupResultItem => {
      const transformed: MumukshuGroupTransformed = {};
      if (group.cardno) return group.cardno;
      if (group.roomType) transformed.roomType = group.roomType;
      if (group.floorType && group.floorType !== 'n') transformed.floorType = group.floorType;
      if (group.mumukshus) {
        transformed.mumukshus = group.mumukshus.map((mumukshu) => mumukshu.cardno);

        if (!group.arrival_time) {
          const mumukshuWithArrivalTime = group.mumukshus.find((m) => m.arrival_time);
          if (mumukshuWithArrivalTime)
            transformed.arrival_time = mumukshuWithArrivalTime.arrival_time;
        }
        if (!group.adhyayan) {
          const mumukshuWithAdhyayan = group.mumukshus.find((m) => m.adhyayan);
          if (mumukshuWithAdhyayan)
            transformed.leaving_post_adhyayan = mumukshuWithAdhyayan.adhyayan === 'No' ? 0 : 1;
        }
        if (!group.luggage) {
          const mumukshuWithLuggage = group.mumukshus.find((m) => m.luggage);
          if (mumukshuWithLuggage)
            transformed.luggage =
              mumukshuWithLuggage.luggage!.length > 0
                ? mumukshuWithLuggage.luggage!.join(', ')
                : '';
        }
        if (!group.type) {
          const mumukshuWithType = group.mumukshus.find((m) => m.type);
          if (mumukshuWithType) transformed.type = mumukshuWithType.type;
        }
        if (!group.special_request) {
          const mumukshuWithSpecialRequest = group.mumukshus.find((m) => m.special_request);
          if (mumukshuWithSpecialRequest)
            transformed.comments = mumukshuWithSpecialRequest.special_request;
        }
        if (!group.total_people) {
          const mumukshuWithTotalPeople = group.mumukshus.find((m) => m.total_people);
          if (mumukshuWithTotalPeople)
            transformed.total_people = mumukshuWithTotalPeople.total_people;
        }
      }
      if (group.pickup) transformed.pickup_point = group.pickup;
      if (group.drop) transformed.drop_point = group.drop;
      if (group.arrival_time) transformed.arrival_time = group.arrival_time;
      if (group.adhyayan) {
        if (group.adhyayan === 'No') {
          transformed.leaving_post_adhyayan = 0;
        } else {
          transformed.leaving_post_adhyayan = 1;
        }
      }
      if (group.luggage) {
        transformed.luggage = group.luggage.length > 0 ? group.luggage.join(', ') : '';
      }
      if (group.type) transformed.type = group.type;
      if (group.special_request) transformed.comments = group.special_request;
      if (group.meals) transformed.meals = group.meals;
      if (group.spicy !== undefined) transformed.spicy = group.spicy;
      if (group.hightea) transformed.high_tea = group.hightea;
      if (group.total_people) transformed.total_people = group.total_people;

      return transformed;
    });

  const primaryBookingDetails = (primaryKey: string): MumukshuBookingRequestItem => {
    const primaryData = bookingInput[primaryKey];

    switch (primaryKey) {
      case 'room':
        return {
          booking_type: 'room',
          details: {
            checkin_date: primaryData.startDay,
            checkout_date: primaryData.endDay,
            mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'food':
        return {
          booking_type: 'food',
          details: {
            start_date: primaryData.startDay,
            end_date: primaryData.endDay,
            mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'adhyayan':
        return {
          booking_type: 'adhyayan',
          details: {
            shibir_ids: [primaryData.adhyayan.id],
            mumukshus: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'travel':
        return {
          booking_type: 'travel',
          details: {
            date: primaryData.date,
            mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'flat':
        return {
          booking_type: 'flat',
          details: {
            checkin_date: primaryData.startDay,
            checkout_date: primaryData.endDay,
            mumukshus: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'utsav':
        return {
          booking_type: 'utsav',
          details: {
            utsavid: primaryData.utsav.utsav_id,
            mumukshus: primaryData.mumukshus.map((mumukshu: MumukshuUtsavInputPerson) => {
              return {
                cardno: mumukshu.cardno,
                packageid: mumukshu.package,
                arrival: mumukshu.arrival,
                volunteer: mumukshu.volunteer,
                carno: mumukshu.carno,
                other: mumukshu.other,
              };
            }),
          },
        };
      default:
        throw new Error(`Unsupported primary booking type: ${primaryKey}`);
    }
  };

  const transformAddons = (input: Record<string, any>): MumukshuBookingRequestItem[] =>
    Object.keys(input)
      .filter((key) => key !== input.primary && key !== 'primary')
      .map((key): MumukshuBookingRequestItem | null => {
        switch (key) {
          case 'room':
            return {
              booking_type: key,
              details: {
                checkin_date: input[key].startDay,
                checkout_date: input[key].endDay,
                mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
              },
            };
          case 'food':
            return {
              booking_type: key,
              details: {
                start_date: input[key].startDay,
                end_date: input[key].endDay,
                mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
              },
            };
          case 'adhyayan':
            return {
              booking_type: key,
              details: {
                shibir_ids: [input[key].adhyayan.id],
                mumukshus: input[key].mumukshus.map((mumukshu: MumukshuMember) => mumukshu.cardno),
              },
            };
          case 'travel':
            return {
              booking_type: key,
              details: {
                date: input[key].date,
                mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
              },
            };
          case 'flat':
            return {
              booking_type: key,
              details: {
                checkin_date: input[key].startDay,
                checkout_date: input[key].endDay,
                mumukshus: input[key].mumukshus.map((mumukshu: MumukshuMember) => mumukshu.cardno),
              },
            };
          case 'validationData':
          case 'dismissedValidationError':
          case 'errorAlreadyShown':
          case 'errorMessage':
            return null;
          default:
            console.log('input', input);
            throw new Error(`Unsupported mumukshu addon type: ${key}`);
        }
      })
      .filter((item): item is MumukshuBookingRequestItem => item !== null);

  return {
    cardno: user.cardno,
    primary_booking: primaryBookingDetails(bookingInput.primary),
    addons: transformAddons(bookingInput),
  };
};
