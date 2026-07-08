import { create } from 'zustand';

import type { BookingSlice, BookingStoreState, BookingType, PersonInfo } from './bookingTypes';

// Helper utilities for booking logic
const cleanStateSlice = (
  prev: BookingSlice,
  bookingType: BookingType,
  item: unknown
): BookingSlice => {
  try {
    // Ensure prev is an object, default to empty object if null/undefined
    const prevData = prev && typeof prev === 'object' ? prev : {};

    // Ensure item is properly handled (can be object, array, or primitive)
    const itemData = item !== null && item !== undefined ? item : null;

    const updated: Record<string, unknown> = {
      ...prevData,
      [bookingType]: itemData,
      primary: bookingType,
    };

    // Clean up other booking types
    ['room', 'travel', 'food', 'adhyayan', 'utsav', 'flat', 'validationData']
      .filter((key) => key !== bookingType)
      .forEach((key) => delete updated[key]);

    return updated as BookingSlice;
  } catch (error) {
    console.error('Error in cleanStateSlice:', error);
    return { [bookingType]: item, primary: bookingType } as BookingSlice;
  }
};

// Helper to validate booking type
const isValidBookingType = (bookingType: unknown): bookingType is BookingType => {
  const validTypes = ['room', 'travel', 'food', 'adhyayan', 'utsav', 'flat'];
  return typeof bookingType === 'string' && validTypes.includes(bookingType);
};

export const useBookingStore = create<BookingStoreState>()((set) => ({
  /* ---------- Booking State ---------- */
  guestData: {}, // Guest booking data
  mumukshuData: {}, // Mumukshu booking data
  guestInfo: [], // Array to store guest information (cardno, name/issuedto)
  mumukshuInfo: [],

  /* ---------- Booking Actions ---------- */

  // Generic setter for guest data
  setGuestData: (updater) => {
    try {
      if (typeof updater === 'function') {
        set((state) => ({
          guestData: updater(state.guestData),
        }));
      } else if (updater && typeof updater === 'object') {
        set({ guestData: updater });
      } else {
        console.warn('setGuestData expects a function or object');
      }
    } catch (error) {
      console.error('Error in setGuestData:', error);
    }
  },

  // Generic setter for mumukshu data
  setMumukshuData: (updater) => {
    try {
      if (typeof updater === 'function') {
        set((state) => ({
          mumukshuData: updater(state.mumukshuData),
        }));
      } else if (updater && typeof updater === 'object') {
        set({ mumukshuData: updater });
      } else {
        console.warn('setMumukshuData expects a function or object');
      }
    } catch (error) {
      console.error('Error in setMumukshuData:', error);
    }
  },

  // Setter for guest info
  setGuestInfo: (guestInfo: PersonInfo[]) => {
    try {
      if (Array.isArray(guestInfo)) {
        set({ guestInfo });
      } else {
        console.warn('setGuestInfo expects an array');
      }
    } catch (error) {
      console.error('Error in setGuestInfo:', error);
    }
  },

  // Setter for mumukshu info
  setMumukshuInfo: (mumukshuInfo: PersonInfo[]) => {
    try {
      if (Array.isArray(mumukshuInfo)) {
        set({ mumukshuInfo });
      } else {
        console.warn('setMumukshuInfo expects an array');
      }
    } catch (error) {
      console.error('Error in setMumukshuInfo:', error);
    }
  },

  // Update guest booking data
  updateGuestBooking: (bookingType, item) => {
    try {
      if (!isValidBookingType(bookingType)) {
        console.warn(`Invalid booking type: ${bookingType}`);
        return;
      }

      set((state) => ({
        guestData: cleanStateSlice(state.guestData, bookingType, item),
      }));
    } catch (error) {
      console.error('Error updating guest booking:', error);
    }
  },

  // Update mumukshu booking data
  updateMumukshuBooking: (bookingType, item) => {
    try {
      if (!isValidBookingType(bookingType)) {
        console.warn(`Invalid booking type: ${bookingType}`);
        return;
      }

      set((state) => ({
        mumukshuData: cleanStateSlice(state.mumukshuData, bookingType, item),
      }));
    } catch (error) {
      console.error('Error updating mumukshu booking:', error);
    }
  },
}));
