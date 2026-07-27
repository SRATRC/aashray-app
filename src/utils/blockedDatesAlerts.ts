import CustomAlert from '@/src/components/CustomAlert';

// Blocked = unavailable, never waitlisted. `blockedAction === 'reject'` means
// these dates cannot be booked (a centre block, or an Utsav the member isn't
// attending) — dismiss-only, no Proceed/waitlist option.
export const showBlockedRejectAlert = (
  blockedPeriods: string[] | undefined,
  onDismiss: () => void
) => {
  const periodsInfo = blockedPeriods && blockedPeriods.length ? blockedPeriods.join('\n') : '';
  CustomAlert.alert(
    'Dates Unavailable',
    `The following dates cannot be booked:\n${periodsInfo}\n\nPlease choose different dates.`,
    [
      {
        text: 'OK',
        onPress: onDismiss,
      },
    ]
  );
};

// `blockedAction === 'split'` means the member attends the overlapping Utsav —
// the booking auto-splits pre/post the festival gap and can proceed.
export const showBlockedSplitAlert = (
  blockedPeriods: string[] | undefined,
  onProceed: () => void,
  onCancel: () => void
) => {
  const periodsInfo = blockedPeriods && blockedPeriods.length ? blockedPeriods.join('\n') : '';
  CustomAlert.alert(
    'Booking Split Around Utsav',
    `The Research Centre is blocked for an Utsav during:\n${periodsInfo}\n\nYour booking will be split into two parts — one before and one after the event dates. Would you like to proceed?`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Proceed',
        onPress: onProceed,
      },
    ]
  );
};
