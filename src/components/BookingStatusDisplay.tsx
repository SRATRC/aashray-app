import React from 'react';
import { View } from 'react-native';

import CustomTag from './CustomTag';
import { status } from '../constants';

interface BookingStatusDisplayProps {
  bookingStatus: string;
  transactionStatus?: string;
  containerStyles?: string;
  holdReason?: string | null;
}

const BookingStatusDisplay: React.FC<BookingStatusDisplayProps> = ({
  bookingStatus,
  containerStyles = '',
  holdReason,
}) => {
  // Over-cap holds: status is still 'waiting', flagged via hold_reason (no separate status).
  const isRollingWindowHold =
    bookingStatus === status.STATUS_WAITING &&
    holdReason === status.HOLD_REASON_ROLLING_WINDOW_LIMIT;

  // A waitlist is ONE state with one color, whatever put it there. The reason is
  // a sentence next to the pill, not a second color — a member cannot be taught
  // that amber and orange mean two different kinds of waiting.
  const getBookingStatusStyles = (item_status: string) => {
    const isCancelled =
      item_status === status.STATUS_CANCELLED || item_status === status.STATUS_ADMIN_CANCELLED;
    const isConfirmed =
      item_status === status.STATUS_CONFIRMED || item_status === status.STATUS_AVAILABLE;

    if (isCancelled) {
      return {
        textStyles: 'text-red-200',
        containerStyles: 'bg-red-100',
      };
    }

    if (isConfirmed) {
      return {
        textStyles: 'text-green-200',
        containerStyles: 'bg-green-100',
      };
    }

    return {
      textStyles: 'text-secondary-200',
      containerStyles: 'bg-secondary-50',
    };
  };

  const bookingStyles = getBookingStatusStyles(bookingStatus);
  // Keep the pill to a short status word — never the full sentence. The long
  // explanation (hold_reason_message) is surfaced as a dedicated note in the
  // expanded card body so it doesn't wrap/clip inside a status pill.
  //
  // 'waiting' is a database word. A member reads 'Waitlist'. The 9-night hold
  // keeps its own wording because that one genuinely waits on a person, not on a
  // free bed.
  const bookingStatusText = isRollingWindowHold
    ? 'Awaiting approval'
    : bookingStatus === status.STATUS_WAITING
      ? 'Waitlist'
      : bookingStatus === status.STATUS_AVAILABLE
        ? 'Confirmed'
        : bookingStatus;

  return (
    <View className={`flex flex-row ${containerStyles}`}>
      <CustomTag
        text={bookingStatusText}
        textStyles={bookingStyles.textStyles}
        containerStyles={bookingStyles.containerStyles}
      />
    </View>
  );
};

export default BookingStatusDisplay;
