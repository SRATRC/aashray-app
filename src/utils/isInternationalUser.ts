// Mirrors the backend's check (helpers/whatsapp.helper.js): trimmed and
// case-insensitive, and a missing country is NOT treated as international so a
// half-filled profile does not trigger the payment warning.
const isInternationalUser = (user?: { country?: string | null }): boolean => {
  const country = user?.country;
  if (!country) return false;
  return String(country).trim().toLowerCase() !== 'india';
};

export default isInternationalUser;
