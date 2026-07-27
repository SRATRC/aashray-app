import CustomAlert from '@/src/components/CustomAlert';

// Returns true if the booking may proceed. If an extended-stay reason is required
// but empty, shows the alert and returns false. Single source for the 9-night gate.
export function requireExtraStayReason(needsExtraReason: boolean, reason: string): boolean {
  if (needsExtraReason && !reason.trim()) {
    CustomAlert.alert('Reason Required', 'Please enter a reason for your extra stay beyond the 9-night limit.');
    return false;
  }
  return true;
}
