import moment from 'moment';

/** True for a real YYYY-MM-DD date that is not in the future and not before 1900. */
export const isValidDob = (dob?: string | null): boolean => {
  if (!dob) return false;
  const m = moment(dob, 'YYYY-MM-DD', true);
  return m.isValid() && !m.isAfter(moment(), 'day') && !m.isBefore('1900-01-01');
};
