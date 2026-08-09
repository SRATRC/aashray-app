import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React, { useMemo } from 'react';
import { View, Text, Pressable, Share } from 'react-native';

import BookingShell from '@/src/components/booking/shared/BookingShell';
import CatalogueCard from '@/src/components/booking/shared/CatalogueCard';
import PartySection from '@/src/components/booking/shared/PartySection';
import UtsavAttendeeFields, {
  attendeeValid,
  packageOptions,
} from '@/src/components/booking/shared/UtsavAttendeeFields';
import { utsavCardProps } from '@/src/components/booking/shared/catalogueCards';
import { isUtsavFull } from '@/src/components/booking/shared/catalogueStatus';
import useBookingParty from '@/src/components/booking/shared/useBookingParty';
import useBookingSubmit from '@/src/components/booking/shared/useBookingSubmit';
import CustomEmptyMessage from '@/src/components/CustomEmptyMessage';
import { colors, types } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

/**
 * One Utsav, opened from a deep link or a notification.
 *
 * Step 2 of Raj Utsav with the utsav already chosen, built from the same pieces
 * as the catalogue flow: the shell, the same card, the same party section and
 * the same per-attendee package/arrival/seva fields. It used to be a ~1,300-line
 * copy of the booking flow with its own chip group, forms and submit path.
 */

const UtsavDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state: any) => state.user);

  const party = useBookingParty();
  const { submit, isSubmitting } = useBookingSubmit();
  const { form, audience } = party;

  const fetchUtsav = () =>
    new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        `/utsav/${id}`,
        { cardno: user?.cardno },
        null,
        (res: any) => resolve(res.data),
        () => {},
        () => reject(new Error('Failed to fetch utsav details'))
      );
    });

  const {
    data: utsav,
    isLoading,
    isError,
  }: any = useQuery({
    queryKey: ['utsavdeeplink', id, user?.cardno],
    queryFn: fetchUtsav,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    enabled: !!id && !!user?.cardno,
  });

  const packages = useMemo(() => packageOptions(utsav), [utsav]);
  const isFull = isUtsavFull(utsav);
  // The member fills the same attendee fields as everyone else, so their own
  // row has to pass the same check before Continue means anything.
  const canContinue = party.isPartyValid && (audience !== 'self' || attendeeValid(form));

  const share = () => {
    if (!utsav) return;
    const dates = moment(utsav.utsav_start).isSame(moment(utsav.utsav_end), 'day')
      ? moment(utsav.utsav_start).format('D MMM YYYY')
      : `${moment(utsav.utsav_start).format('D MMM')} – ${moment(utsav.utsav_end).format('D MMM YYYY')}`;
    Share.share({
      title: utsav.utsav_name,
      message: `${utsav.utsav_name}\n${dates} · ${utsav.utsav_location}\n\nhttps://aashray.vitraagvigyaan.org/utsav/${utsav.utsav_id}`,
    }).catch(() => {});
  };

  const handleConfirm = () =>
    submit({
      bookingType: types.EVENT_DETAILS_TYPE,
      audience,
      form,
      buildPayload: (f) =>
        audience === 'guest'
          ? { ...f, utsav }
          : {
              utsav,
              mumukshus:
                audience === 'mumukshu'
                  ? f.mumukshus
                  : [
                      {
                        cardno: user.cardno,
                        mobno: user.mobno,
                        issuedto: user.name,
                        gender: user.gender,
                        res_status: user.res_status,
                        package: f.package,
                        package_name: f.package_name,
                        arrival: f.arrival,
                        carno: f.carno,
                        volunteer: f.volunteer,
                        other: f.other,
                      },
                    ],
            },
      // An off-site utsav has no room or food to add on.
      onDone:
        utsav?.utsav_location !== 'Research Centre'
          ? () => {
              const stack =
                audience === 'guest'
                  ? 'guestBooking'
                  : audience === 'mumukshu'
                    ? 'mumukshuBooking'
                    : 'booking';
              router.push(`/${stack}/bookingReview`);
            }
          : undefined,
    });

  return (
    <BookingShell
      title={types.booking_type_event}
      caption={utsav?.utsav_name}
      isBusy={isLoading}
      headerRight={
        utsav ? (
          <Pressable
            onPress={share}
            hitSlop={12}
            accessibilityLabel="Share"
            className="h-11 w-11 items-center justify-center">
            <Ionicons name="share-outline" size={22} color={colors.gray_600} />
          </Pressable>
        ) : null
      }
      primaryLabel={isFull ? 'Join waitlist' : 'Continue'}
      onPrimary={handleConfirm}
      primaryDisabled={!utsav || !canContinue}
      primaryLoading={isSubmitting}
      footerNote={
        isFull
          ? 'This utsav is full. You can still book, and you will be confirmed if a place frees up.'
          : !canContinue
            ? 'Choose a package and arrival for everyone attending.'
            : undefined
      }
      pinFooter>
      <View className="px-4">
        {isError || (!isLoading && !utsav) ? (
          <View className="items-center justify-center pt-24">
            <CustomEmptyMessage message="Could not load this utsav. Go back and try again." />
          </View>
        ) : utsav ? (
          <>
            <CatalogueCard {...utsavCardProps(utsav)} className="mb-5" />

            <Pressable
              onPress={() => router.push('/utsav/dailySchedule')}
              className="mb-5 flex-row items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
              <View className="flex-row items-center gap-x-2.5">
                <Ionicons name="calendar-outline" size={18} color={colors.gray_400} />
                <Text className="font-pmedium text-sm text-gray-800">Daily schedule</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray_400} />
            </Pressable>

            <PartySection
              audiences={party.audiences}
              audience={audience}
              onAudienceChange={party.setAudience}
              guestFormProps={party.guestFormProps}
              mumukshuFormProps={party.mumukshuFormProps}
              renderGuestExtras={(i) => (
                <UtsavAttendeeFields
                  row={form.guests[i] ?? {}}
                  packages={packages}
                  patch={(field, v) => party.guestFormProps.handleGuestFormChange(i, field, v)}
                />
              )}
              renderMumukshuExtras={(i) => (
                <UtsavAttendeeFields
                  row={form.mumukshus[i] ?? {}}
                  packages={packages}
                  patch={(field, v) =>
                    party.mumukshuFormProps.handleMumukshuFormChange(i, field, v)
                  }
                />
              )}
            />

            {audience === 'self' ? (
              <UtsavAttendeeFields
                row={form}
                packages={packages}
                patch={(field, v) => party.setSharedField(field, v)}
                title="Your details"
              />
            ) : null}
          </>
        ) : null}
      </View>
    </BookingShell>
  );
};

export default UtsavDetails;
