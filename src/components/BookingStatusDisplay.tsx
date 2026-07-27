import { View } from 'react-native';
import React from 'react';
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
  transactionStatus,
  containerStyles = '',
  holdReason,
}) => {
  // Over-cap holds: status is still 'waiting', flagged via hold_reason (no separate status).
  const isRollingWindowHold =
    bookingStatus === status.STATUS_WAITING &&
    holdReason === status.HOLD_REASON_ROLLING_WINDOW_LIMIT;

  const getBookingStatusStyles = (item_status: string) => {
    const isCancelled =
      item_status === status.STATUS_CANCELLED || item_status === status.STATUS_ADMIN_CANCELLED;
    const isConfirmed = item_status === status.STATUS_CONFIRMED;

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

    if (isRollingWindowHold) {
      return {
        textStyles: 'text-amber-700',
        containerStyles: 'bg-amber-100',
      };
    }

    return {
      textStyles: 'text-secondary-200',
      containerStyles: 'bg-secondary-50',
    };
  };

  const getTransactionStatusText = (transactionStatus: string) => {
    if (
      transactionStatus === status.STATUS_CANCELLED ||
      transactionStatus === status.STATUS_ADMIN_CANCELLED
    ) {
      return 'Payment Cancelled';
    }

    if (
      transactionStatus === status.STATUS_PAYMENT_PENDING ||
      transactionStatus === status.STATUS_CASH_PENDING ||
      transactionStatus === status.STATUS_FAILED
    ) {
      return 'Payment Due';
    }

    if (transactionStatus === status.STATUS_CREDITED) {
      return 'Credited';
    }

    if (
      transactionStatus === status.STATUS_PAYMENT_COMPLETED ||
      transactionStatus === status.STATUS_CASH_COMPLETED ||
      transactionStatus === status.STATUS_CAPTURED ||
      transactionStatus === status.STATUS_AUTHORIZED
    ) {
      return 'Paid';
    }

    return transactionStatus;
  };

  const getTransactionStatusStyles = (transactionStatus: string) => {
    const isCancelled =
      transactionStatus === status.STATUS_CANCELLED ||
      transactionStatus === status.STATUS_ADMIN_CANCELLED;

    const isCompleted =
      transactionStatus === status.STATUS_PAYMENT_COMPLETED ||
      transactionStatus === status.STATUS_CASH_COMPLETED ||
      transactionStatus === status.STATUS_CAPTURED ||
      transactionStatus === status.STATUS_AUTHORIZED ||
      transactionStatus === status.STATUS_CREDITED;

    if (isCancelled) {
      return {
        textStyles: 'text-red-200',
        containerStyles: 'bg-red-100',
      };
    }

    if (isCompleted) {
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
  // explanation (holdReasonMessage) is surfaced as a dedicated note in the
  // expanded card body so it doesn't wrap/clip inside a status pill.
  const bookingStatusText = isRollingWindowHold ? 'Awaiting approval' : bookingStatus;

  return (
    <View className={`flex flex-row ${containerStyles}`}>
      <CustomTag
        text={bookingStatusText}
        textStyles={bookingStyles.textStyles}
        containerStyles={bookingStyles.containerStyles}
      />

      {transactionStatus && (
        <CustomTag
          text={getTransactionStatusText(transactionStatus)}
          textStyles={getTransactionStatusStyles(transactionStatus).textStyles}
          containerStyles={`${getTransactionStatusStyles(transactionStatus).containerStyles} mx-1`}
        />
      )}
    </View>
  );
};

export default BookingStatusDisplay;
