export const cleanPhoneNumber = (input: string): string => {
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
    // Fallback: take last 10 digits
    else {
      cleaned = cleaned.slice(-10);
    }
  }
  
  // Ensure we don't exceed 10 digits
  return cleaned.slice(0, 10);
};