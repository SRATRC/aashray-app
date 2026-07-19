export const cleanPhoneNumber = (input: string): string => {
  // Check if the input contains formatting characters (spaces, +, -, brackets)
  // indicating a pasted or pre-formatted number.
  const isFormattedOrPasted = /[\s+\-()]/g.test(input);

  // Remove all non-numeric characters (spaces, +, -, etc.)
  const numbersOnly = input.replace(/\D/g, '');
  
  // If empty, return empty
  if (!numbersOnly) return '';
  
  // Remove common country codes and take last 10 digits
  let cleaned = numbersOnly;
  
  // Handle various country code scenarios
  if (cleaned.length > 10) {
    // India: +91 (2 digits)
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      cleaned = cleaned.slice(2);
    }
    // US/Canada: +1 (1 digit)
    else if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = cleaned.slice(1);
    }
    // UK: +44 (2 digits)
    else if (cleaned.startsWith('44') && cleaned.length === 12) {
      cleaned = cleaned.slice(2);
    }
    // Fallback:
    // If it was formatted/pasted, take the last 10 digits (likely has a country code).
    // Otherwise, if it was manually typed, keep the first 10 digits (acting like maxLength=10).
    else {
      cleaned = isFormattedOrPasted ? cleaned.slice(-10) : cleaned.slice(0, 10);
    }
  }
  
  // Ensure we don't exceed 10 digits
  return cleaned.slice(0, 10);
};