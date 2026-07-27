import { status } from '@/src/constants';

/**
 * Shared three-way tag-style decision used by all booking-detail cards
 * (Room/Flat x self/Mumukshu/Guest) to color-code a status tag:
 *  - green  -> status is STATUS_AVAILABLE
 *  - amber  -> status is STATUS_WAITING AND at least one booking for that
 *              status is an over-capacity hold (requiresExtraStayReason
 *              or hold_reason === HOLD_REASON_ROLLING_WINDOW_LIMIT)
 *  - red    -> anything else
 *
 * `bookings` should be the full (unfiltered) bookings array for the group/
 * field, matching what each card already passes today — filtering by
 * `statusKey` happens internally, exactly as the original inline logic did.
 */
export const getStatusTagStyle = (statusKey: string, bookings: any[] | undefined | null) => {
  const isAvailable = statusKey == status.STATUS_AVAILABLE;
  const isOverCapHold =
    statusKey == status.STATUS_WAITING &&
    (bookings || []).some(
      (b: any) =>
        b.status == statusKey &&
        (b.requiresExtraStayReason || b.hold_reason === status.HOLD_REASON_ROLLING_WINDOW_LIMIT)
    );

  return {
    textStyles: isAvailable ? 'text-green-200' : isOverCapHold ? 'text-amber-700' : 'text-red-200',
    containerStyles: `${isAvailable ? 'bg-green-100' : isOverCapHold ? 'bg-amber-100' : 'bg-red-100'} mx-1`,
  };
};
