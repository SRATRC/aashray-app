import { create } from 'zustand';

// Helper utilities for booking logic
const cleanStateSlice = (prev, bookingType, item) => {
  try {
    // Ensure prev is an object, default to empty object if null/undefined
    const prevData = prev && typeof prev === 'object' ? prev : {};

    // Ensure item is properly handled (can be object, array, or primitive)
    const itemData = item !== null && item !== undefined ? item : null;

    const updated = { ...prevData, [bookingType]: itemData, primary: bookingType };

    // Clean up other booking types
    ['room', 'travel', 'food', 'adhyayan', 'utsav', 'flat', 'validationData']
      .filter((key) => key !== bookingType)
      .forEach((key) => delete updated[key]);

    return updated;
  } catch (error) {
    console.error('Error in cleanStateSlice:', error);
    return { [bookingType]: item, primary: bookingType };
  }
};

const stripKeys = (obj, keys) => {
  try {
    // Handle null/undefined objects
    if (!obj || typeof obj !== 'object') {
      return {};
    }

    const copy = { ...obj };
    keys.forEach((k) => {
      if (k in copy) {
        delete copy[k];
      }
    });
    return copy;
  } catch (error) {
    console.error('Error in stripKeys:', error);
    return obj || {};
  }
};

// Helper to safely merge objects
const safeObjectMerge = (target, source) => {
  try {
    if (!target || typeof target !== 'object') target = {};
    if (!source || typeof source !== 'object') return target;

    return { ...target, ...source };
  } catch (error) {
    console.error('Error in safeObjectMerge:', error);
    return target || {};
  }
};

// Helper to validate booking type
const isValidBookingType = (bookingType) => {
  const validTypes = ['room', 'travel', 'food', 'adhyayan', 'utsav', 'flat'];
  return typeof bookingType === 'string' && validTypes.includes(bookingType);
};

export const useBookingStore = create((set, get) => ({
  /* ---------- Booking State ---------- */
  data: {}, // Main booking data
  guestData: {}, // Guest booking data
  mumukshuData: {}, // Mumukshu booking data
  guestInfo: [], // Array to store guest information (cardno, name/issuedto)
  mumukshuInfo: [],

  /* ---------- Booking Actions ---------- */

  // Generic setter for main data (for backward compatibility and complex updates)
  setData: (updater) => {
    try {
      if (typeof updater === 'function') {
        set((state) => ({
          data: updater(state.data),
        }));
      } else if (updater && typeof updater === 'object') {
        set({ data: updater });
      } else {
        console.warn('setData expects a function or object');
      }
    } catch (error) {
      console.error('Error in setData:', error);
    }
  },

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
  setGuestInfo: (guestInfo) => {
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
  setMumukshuInfo: (mumukshuInfo) => {
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

  // Update main booking data
  updateBooking: (bookingType, item) => {
    try {
      if (!isValidBookingType(bookingType)) {
        console.warn(`Invalid booking type: ${bookingType}`);
        return;
      }

      set((state) => ({
        data: cleanStateSlice(state.data, bookingType, item),
      }));
    } catch (error) {
      console.error('Error updating booking:', error);
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

  /* ---------- Advanced Update Actions ---------- */

  // Merge data into existing booking (useful for partial updates)
  mergeBookingData: (bookingType, data) => {
    try {
      set((state) => ({
        data: {
          ...state.data,
          [bookingType]: safeObjectMerge(state.data[bookingType], data),
        },
      }));
    } catch (error) {
      console.error('Error merging booking data:', error);
    }
  },

  // Merge data into existing guest booking
  mergeGuestBookingData: (bookingType, data) => {
    try {
      set((state) => ({
        guestData: {
          ...state.guestData,
          [bookingType]: safeObjectMerge(state.guestData[bookingType], data),
        },
      }));
    } catch (error) {
      console.error('Error merging guest booking data:', error);
    }
  },

  // Merge data into existing mumukshu booking
  mergeMumukshuBookingData: (bookingType, data) => {
    try {
      set((state) => ({
        mumukshuData: {
          ...state.mumukshuData,
          [bookingType]: safeObjectMerge(state.mumukshuData[bookingType], data),
        },
      }));
    } catch (error) {
      console.error('Error merging mumukshu booking data:', error);
    }
  },

  /* ---------- Validation Actions ---------- */

  // Clean up validation-related state
  cleanupValidationState: () => {
    try {
      set((state) => ({
        mumukshuData: stripKeys(state.mumukshuData, ['validationData']),
      }));
    } catch (error) {
      console.error('Error cleaning up validation state:', error);
    }
  },

  // Reset all validation and error states
  resetValidationState: () => {
    try {
      set((state) => ({
        mumukshuData: stripKeys(state.mumukshuData, [
          'validationData',
          'dismissedValidationError',
          'errorAlreadyShown',
          'errorMessage',
        ]),
      }));
    } catch (error) {
      console.error('Error resetting validation state:', error);
    }
  },

  /* ---------- Utility Actions ---------- */

  // Clear all booking data
  clearAllBookingData: () => {
    try {
      set({
        data: {},
        guestData: {},
        mumukshuData: {},
        guestInfo: [],
        mumukshuInfo: [],
      });
    } catch (error) {
      console.error('Error clearing all booking data:', error);
    }
  },

  // Clear specific booking type across all data stores
  clearBookingType: (bookingType) => {
    try {
      if (!isValidBookingType(bookingType)) {
        console.warn(`Invalid booking type: ${bookingType}`);
        return;
      }

      set((state) => ({
        data: stripKeys(state.data, [bookingType, 'primary']),
        guestData: stripKeys(state.guestData, [bookingType, 'primary']),
        mumukshuData: stripKeys(state.mumukshuData, [bookingType, 'primary']),
      }));
    } catch (error) {
      console.error('Error clearing booking type:', error);
    }
  },

  // Set primary booking type manually
  setPrimaryBookingType: (bookingType, dataType = 'data') => {
    try {
      if (!isValidBookingType(bookingType)) {
        console.warn(`Invalid booking type: ${bookingType}`);
        return;
      }

      const validDataTypes = ['data', 'guestData', 'mumukshuData'];
      if (!validDataTypes.includes(dataType)) {
        console.warn(`Invalid data type: ${dataType}`);
        return;
      }

      set((state) => ({
        [dataType]: {
          ...state[dataType],
          primary: bookingType,
        },
      }));
    } catch (error) {
      console.error('Error setting primary booking type:', error);
    }
  },

  /* ---------- Getter Functions ---------- */

  // Get current primary booking type
  getPrimaryBookingType: () => {
    try {
      const state = get();
      return state.data.primary || state.guestData.primary || state.mumukshuData.primary || null;
    } catch (error) {
      console.error('Error getting primary booking type:', error);
      return null;
    }
  },

  // Get specific booking data by type
  getBookingData: (bookingType, dataType = 'data') => {
    try {
      const state = get();
      const validDataTypes = ['data', 'guestData', 'mumukshuData'];

      if (!validDataTypes.includes(dataType)) {
        console.warn(`Invalid data type: ${dataType}`);
        return null;
      }

      return state[dataType][bookingType] || null;
    } catch (error) {
      console.error('Error getting booking data:', error);
      return null;
    }
  },

  // Get all booking data for a specific type (across all data stores)
  getAllBookingDataForType: (bookingType) => {
    try {
      const state = get();
      return {
        main: state.data[bookingType] || null,
        guest: state.guestData[bookingType] || null,
        mumukshu: state.mumukshuData[bookingType] || null,
      };
    } catch (error) {
      console.error('Error getting all booking data for type:', error);
      return { main: null, guest: null, mumukshu: null };
    }
  },

  // Check if any booking data exists
  hasAnyBookingData: () => {
    try {
      const state = get();
      const hasMainData = Object.keys(state.data).length > 0;
      const hasGuestData = Object.keys(state.guestData).length > 0;
      const hasMumukshuData = Object.keys(state.mumukshuData).length > 0;

      return hasMainData || hasGuestData || hasMumukshuData;
    } catch (error) {
      console.error('Error checking for booking data:', error);
      return false;
    }
  },

  // Get current state summary
  getStateSummary: () => {
    try {
      const state = get();
      return {
        primaryBookingType:
          state.data.primary || state.guestData.primary || state.mumukshuData.primary || null,
        mainBookingTypes: Object.keys(state.data).filter((key) => key !== 'primary'),
        guestBookingTypes: Object.keys(state.guestData).filter((key) => key !== 'primary'),
        mumukshuBookingTypes: Object.keys(state.mumukshuData).filter((key) => key !== 'primary'),
        hasData: Object.keys(state.data).length > 0,
        hasGuestData: Object.keys(state.guestData).length > 0,
        hasMumukshuData: Object.keys(state.mumukshuData).length > 0,
      };
    } catch (error) {
      console.error('Error getting state summary:', error);
      return {
        primaryBookingType: null,
        mainBookingTypes: [],
        guestBookingTypes: [],
        mumukshuBookingTypes: [],
        hasData: false,
        hasGuestData: false,
        hasMumukshuData: false,
      };
    }
  },
}));
