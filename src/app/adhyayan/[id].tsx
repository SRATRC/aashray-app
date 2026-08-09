import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import moment from 'moment';
import React from 'react';
import { View, Pressable, Share } from 'react-native';

import BookingShell from '@/src/components/booking/shared/BookingShell';
import CatalogueCard from '@/src/components/booking/shared/CatalogueCard';
import PartySection from '@/src/components/booking/shared/PartySection';
import { adhyayanCardProps } from '@/src/components/booking/shared/catalogueCards';
import { isShibirFull } from '@/src/components/booking/shared/catalogueStatus';
import useBookingParty from '@/src/components/booking/shared/useBookingParty';
import useBookingSubmit from '@/src/components/booking/shared/useBookingSubmit';
import CustomEmptyMessage from '@/src/components/CustomEmptyMessage';
import { colors, types } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';

/**
 * One shibir, opened from a deep link or a notification.
 *
 * This is step 2 of Raj Adhyayan with the shibir already chosen, so it is built
 * from the same pieces: the shell, the same card the catalogue shows, and the
 * same party section. It used to be its own ~980-line copy of the booking flow
 * — its own chip group, its own guest and mumukshu forms, its own submit path
 * per audience — which is why a shibir looked and behaved differently depending
 * on whether you tapped a link or browsed to it.
 */

const AdhyayanDetails = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const user = useAuthStore((state: any) => state.user);

  const party = useBookingParty();
  const { submit, isSubmitting } = useBookingSubmit();

  const fetchAdhyayan = () =>
    new Promise((resolve, reject) => {
      handleAPICall(
        'GET',
        `/adhyayan/${id}`,
        { cardno: user?.cardno },
        null,
        (res: any) => resolve(res.data),
        () => {},
        () => reject(new Error('Failed to fetch adhyayan details'))
      );
    });

  const {
    data: adhyayan,
    isLoading,
    isError,
  }: any = useQuery({
    queryKey: ['adhyayan', id, user?.cardno],
    queryFn: fetchAdhyayan,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
    enabled: !!id && !!user?.cardno,
  });

  const isFull = isShibirFull(adhyayan);

  const share = () => {
    if (!adhyayan) return;
    const dates = moment(adhyayan.start_date).isSame(moment(adhyayan.end_date), 'day')
      ? moment(adhyayan.start_date).format('D MMM YYYY')
      : `${moment(adhyayan.start_date).format('D MMM')} – ${moment(adhyayan.end_date).format('D MMM YYYY')}`;
    Share.share({
      title: adhyayan.name,
      message: `${adhyayan.name}\n${dates} · ${adhyayan.location}\n\nhttps://aashray.vitraagvigyaan.org/adhyayan/${adhyayan.id}`,
    }).catch(() => {});
  };

  const handleConfirm = () =>
    submit({
      bookingType: types.ADHYAYAN_DETAILS_TYPE,
      audience: party.audience,
      form: party.form,
      buildPayload: (f) =>
        party.audience === 'guest'
          ? {
              adhyayan,
              guestGroup: f.guests.map((g: any) => ({
                cardno: g.cardno,
                issuedto: g.issuedto || g.name,
              })),
            }
          : {
              adhyayan,
              mumukshuGroup:
                party.audience === 'mumukshu'
                  ? f.mumukshus
                  : [
                      {
                        cardno: user.cardno,
                        mobno: user.mobno,
                        issuedto: user.name,
                        gender: user.gender,
                        res_status: user.res_status,
                      },
                    ],
            },
      // An off-site shibir has no room or food to add, so it skips the add-on
      // step. Same rule as the catalogue flow.
      onDone:
        adhyayan?.location !== 'Research Centre'
          ? () => {
              const stack =
                party.audience === 'guest'
                  ? 'guestBooking'
                  : party.audience === 'mumukshu'
                    ? 'mumukshuBooking'
                    : 'booking';
              router.push(`/${stack}/bookingReview`);
            }
          : undefined,
    });

  return (
    <BookingShell
      title={types.booking_type_adhyayan}
      caption={adhyayan?.name}
      isBusy={isLoading}
      headerRight={
        adhyayan ? (
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
      primaryDisabled={!adhyayan || !party.isPartyValid}
      primaryLoading={isSubmitting}
      footerNote={
        isFull
          ? 'This shibir is full. You can still book, and you will be confirmed if a seat frees up.'
          : !party.isPartyValid
            ? party.audience === 'guest'
              ? 'Fill in each guest’s details to continue.'
              : 'Fill in each mumukshu’s details to continue.'
            : undefined
      }
      pinFooter>
      <View className="px-4">
        {isError || (!isLoading && !adhyayan) ? (
          <View className="items-center justify-center pt-24">
            <CustomEmptyMessage message="Could not load this shibir. Go back and try again." />
          </View>
        ) : adhyayan ? (
          <>
            <CatalogueCard {...adhyayanCardProps(adhyayan)} className="mb-5" />

            <PartySection
              audiences={party.audiences}
              audience={party.audience}
              onAudienceChange={party.setAudience}
              guestFormProps={party.guestFormProps}
              mumukshuFormProps={party.mumukshuFormProps}
            />
          </>
        ) : null}
      </View>
    </BookingShell>
  );
};

export default AdhyayanDetails;
