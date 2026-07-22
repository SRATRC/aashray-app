export type BookingType = 'room' | 'travel' | 'food' | 'adhyayan' | 'utsav' | 'flat';

// Per-type form payloads are intentionally loose here (the precise per-type
// shapes are enforced in preparingRequestBody's input types); the store just
// holds "the current selection per booking type + which is primary".
export interface BookingSlice {
  primary?: BookingType;
  // Per-type payloads stay `any`: existing consumers deep-access nested
  // fields (e.g. `data.travel.travelDetails`) without narrowing, and this
  // slice is intentionally the loose "current selection" bag described above.
  room?: any;
  travel?: any;
  food?: any;
  adhyayan?: any;
  utsav?: any;
  flat?: any;
  validationData?: any;
}

export interface PersonInfo {
  cardno: string;
  name?: string;
  issuedto?: string;
}

export interface BookingStoreState {
  guestData: BookingSlice;
  mumukshuData: BookingSlice;
  guestInfo: PersonInfo[];
  mumukshuInfo: PersonInfo[];
  setGuestData: (updater: BookingSlice | ((prev: BookingSlice) => BookingSlice)) => void;
  setMumukshuData: (updater: BookingSlice | ((prev: BookingSlice) => BookingSlice)) => void;
  setGuestInfo: (info: PersonInfo[]) => void;
  setMumukshuInfo: (info: PersonInfo[]) => void;
  updateGuestBooking: (bookingType: BookingType, item: unknown) => void;
  updateMumukshuBooking: (bookingType: BookingType, item: unknown) => void;
}
