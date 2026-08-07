import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
// @ts-ignore — react-native-razorpay ships no type declarations
import RazorpayCheckout from 'react-native-razorpay';

import BookingShell from './BookingShell';
import BookingSummary from './BookingSummary';
import ChargesCard, { payableNow, totalCreditsIn } from './ChargesCard';
import { AUDIENCE_CONFIG } from './bookingAudience';
import type { Audience } from './useBookingParty';

import CustomModal from '@/src/components/CustomModal';
import InternationalPaymentWarning from '@/src/components/InternationalPaymentWarning';
import StayOutcomeBlock from '@/src/components/stay/StayOutcomeBlock';
import { buildStayOutcome } from '@/src/components/stay/buildStayOutcome';
import { colors } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';
import isInternationalUser from '@/src/utils/isInternationalUser';

/**
 * Review and pay. One screen for every booking type and every audience.
 *
 * This replaces three near-identical screens of roughly 750 lines each. What
 * actually varied between them was the endpoint pair and the payload builder,
 * which now live in AUDIENCE_CONFIG.
 */

interface BookingReviewScreenProps {
  audience: Audience;
}

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const BookingReviewScreen: React.FC<BookingReviewScreenProps> = ({ audience }) => {
  const router = useRouter();
  const user = useAuthStore((s: any) => s.user);
  const config = AUDIENCE_CONFIG[audience];

  const data = useBookingStore((s: any) => s[config.store]);
  const setData = useBookingStore((s: any) =>
    config.store === 'guestData' ? s.setGuestData : s.setMumukshuData
  );
  const guestInfo = useBookingStore((s: any) => s.guestInfo);
  const mumukshuInfo = useBookingStore((s: any) => s.mumukshuInfo);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayLater, setShowPayLater] = useState(false);
  const [showInternational, setShowInternational] = useState(false);
  const [reason, setReason] = useState(
    () => data?.room?.extra_stay_reason || data?.flat?.extra_stay_reason || ''
  );
  const [showReasonError, setShowReasonError] = useState(false);

  const basePayload = useMemo(() => config.buildPayload(user, data), [config, user, data]);

  const payload = useMemo(
    () => ({
      ...basePayload,
      ...(reason.trim() ? { extra_stay_reason: reason.trim() } : {}),
    }),
    [basePayload, reason]
  );

  const {
    data: validationData,
    error: validationError,
    refetch,
    isLoading,
  } = useQuery<any, Error>({
    queryKey: [`review-${audience}`, user?.cardno, JSON.stringify(data)],
    queryFn: () =>
      new Promise((resolve, reject) => {
        handleAPICall(
          'POST',
          config.validateUrl,
          null,
          payload,
          (res: any) => {
            setData((prev: any) => ({ ...prev, validationData: res.data }));
            resolve(res.data);
          },
          () => {},
          (err: any) => reject(new Error(err?.message))
        );
      }),
    retry: false,
    enabled: !!user?.cardno,
  });

  useFocusEffect(
    useCallback(() => {
      if (user?.cardno) refetch();
    }, [user?.cardno, refetch])
  );

  // cardno -> display name, for the per-person stay verdict.
  const names = useMemo(() => {
    const map: Record<string, string> = {};
    if (user?.cardno) map[String(user.cardno)] = 'You';
    for (const e of (guestInfo as any[]) || []) {
      if (e?.cardno) map[String(e.cardno)] = e.name || String(e.cardno);
    }
    for (const e of (mumukshuInfo as any[]) || []) {
      if (e?.cardno) map[String(e.cardno)] = e.name || String(e.cardno);
    }
    return map;
  }, [user?.cardno, guestInfo, mumukshuInfo]);

  const stayOutcome = useMemo(() => {
    const rows = validationData?.roomDetails?.length
      ? validationData.roomDetails
      : validationData?.flatDetails || [];
    const stay = data?.room || data?.flat;
    return buildStayOutcome(
      rows,
      names,
      stay?.startDay ? { start: stay.startDay, end: stay.endDay || stay.startDay } : undefined
    );
  }, [validationData, names, data]);

  const needsReason = Boolean(
    validationData?.roomDetails?.some((r: any) => r.requiresExtraStayReason) ||
      validationData?.flatDetails?.some((f: any) => f.requiresExtraStayReason)
  );
  const reasonMissing = needsReason && !reason.trim();

  const cannotBook = Boolean(
    stayOutcome?.segments.some((s) => s.groups.some((g) => g.verdict === 'unavailable'))
  );
  const allWaitlisted = stayOutcome?.overall === 'waitlist';
  const isMixed = stayOutcome?.overall === 'mixed';
  const due = payableNow(validationData);

  const gate = () => {
    if (cannotBook) return false;
    if (reasonMissing) {
      setShowReasonError(true);
      return false;
    }
    return true;
  };

  const book = async (payLater: boolean) => {
    setIsSubmitting(true);
    await handleAPICall(
      'POST',
      config.bookingUrl,
      null,
      payLater ? { ...payload, pay_later: true } : payload,
      (res: any) => {
        // A booking with nothing left to charge comes back with no order.
        if (payLater || !res?.order?.id) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/bookingConfirmation');
          return;
        }
        RazorpayCheckout.open({
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,
          name: 'Vitraag Vigyaan Aashray',
          image: 'https://vitraagvigyaan.org/img/logo.png',
          description: 'Payment for Vitraag Vigyaan Aashray',
          amount: `${res.order.amount}`,
          currency: 'INR',
          order_id: `${res.order.id}`,
          prefill: { email: user.email, contact: user.mobno, name: user.issuedto },
          theme: { color: colors.orange },
        })
          .then(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/paymentConfirmation');
          })
          .catch(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            router.replace('/paymentFailed');
          });
      },
      () => setIsSubmitting(false)
    );
  };

  const handlePrimary = () => {
    if (!gate()) return;
    if (due > 0 && isInternationalUser(user)) {
      setShowInternational(true);
      return;
    }
    book(false);
  };

  const primaryLabel = cannotBook
    ? 'Cannot be booked'
    : allWaitlisted
      ? 'Join waitlist'
      : due > 0
        ? isMixed
          ? `Pay ${money(due)} now`
          : `Pay ${money(due)}`
        : 'Confirm booking';

  // A waitlisted add-on is stated on its own card and on its charges line, so the
  // footer does not repeat it.
  const footerNote = cannotBook
    ? 'These dates cannot be booked. Go back and pick different dates.'
    : reasonMissing
      ? 'Add a reason for the extra nights above to continue.'
      : allWaitlisted
        ? 'Nothing is charged for a waitlisted stay. A WhatsApp link to pay arrives if an admin confirms it.'
        : undefined;

  return (
    <BookingShell
      title="Review booking"
      caption={validationData ? undefined : 'Checking availability'}
      isBusy={isLoading && !validationData}
      primaryLabel={primaryLabel}
      onPrimary={handlePrimary}
      primaryDisabled={!validationData || cannotBook || reasonMissing}
      primaryLoading={isSubmitting}
      secondaryLabel={due > 0 ? 'Pay later' : undefined}
      onSecondary={() => {
        if (gate()) setShowPayLater(true);
      }}
      footerNote={footerNote}
      // What it costs sits with the button that pays it, in one bottom sheet,
      // so the amount is never scrolled out of view at the moment of paying.
      footerContent={
        validationData ? (
          <>
            <ChargesCard validationData={validationData} names={names} flush />
            {totalCreditsIn(validationData) > 0 ? (
              <Text className="mt-2 px-1 font-pregular text-xs leading-5 text-gray-500">
                Your credits have been applied automatically.
              </Text>
            ) : null}
          </>
        ) : null
      }>
      <View className="gap-y-6 px-4">
        {stayOutcome ? (
          <StayOutcomeBlock
            outcome={stayOutcome}
            variant="recap"
            reason={reason}
            onChangeReason={(t) => {
              setReason(t);
              if (t.trim()) setShowReasonError(false);
            }}
            showReasonError={showReasonError}
          />
        ) : null}

        <BookingSummary data={data} audience={audience} validationData={validationData} />
      </View>

      {validationError ? (
        <CustomModal
          visible
          onClose={() => router.back()}
          message={validationError.message}
          btnText="Okay"
        />
      ) : null}

      <CustomModal
        visible={showPayLater}
        onClose={() => setShowPayLater(false)}
        title="Pay later"
        message="Your booking is held for 24 hours. If payment does not arrive by then, it is cancelled automatically."
        btnText="I understand, proceed"
        btnOnPress={() => {
          setShowPayLater(false);
          book(true);
        }}
      />

      <InternationalPaymentWarning
        visible={showInternational}
        country={user?.country}
        onClose={() => setShowInternational(false)}
        onProceed={() => {
          setShowInternational(false);
          book(false);
        }}
      />
    </BookingShell>
  );
};

export default BookingReviewScreen;
