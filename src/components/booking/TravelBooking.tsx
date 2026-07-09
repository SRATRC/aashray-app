import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { types, dropdowns, status } from '@/src/constants';
import { useAuthStore, useBookingStore } from '@/src/stores';
import { useUtsavDate } from '@/src/hooks/useUtsavDate';
import { useTabBarPadding } from '@/src/hooks/useTabBarPadding';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CustomButton from '../CustomButton';
import CustomCalender from '../CustomCalender';
import Callout from '../Callout';
import FormField from '../FormField';
import CustomModal from '../CustomModal';
import CustomChipGroup from '../CustomChipGroup';
import OtherMumukshuForm from '../OtherMumukshuForm';
import FormDisplayField from '../FormDisplayField';
import CustomSelectBottomSheet from '../CustomSelectBottomSheet';
import GuestForm from '../GuestForm';
import TravelReturnDetails from '../TravelReturnDetails';
import type { ReturnGroup } from '../TravelReturnGroups';
import handleAPICall from '@/src/utils/HandleApiCall';
import moment from 'moment';

let CHIPS = ['Self', 'Mumukshus', 'Guest'];

interface Traveler {
  index: string;
  issuedto: string;
  cardno?: string;
}

// The onward equivalent of a ReturnGroup: a route + who's on it, before it's reversed for
// the return leg. `travelerIndices` refers to positions in the active `travelers` array.
interface OnwardGroup {
  pickup: string;
  drop: string;
  type: string;
  luggage: string[];
  arrival_time: string;
  special_request: string;
  total_people: number | null;
  travelerIndices: string[];
}

const INITIAL_GUEST_TRAVEL_FORM = {
  date: '',
  guests: [
    {
      name: '',
      gender: '',
      mobno: '',
      type: '',
      pickup: '',
      drop: '',
      luggage: [],
      travelType: dropdowns.BOOKING_TYPE_LIST[0].value,
      arrival_time: '',
      special_request: '',
      total_people: null,
    },
  ],
};

const INITIAL_MUMUKSHU_FORM = {
  date: '',
  mumukshus: [
    {
      cardno: '',
      mobno: '',
      pickup: '',
      drop: '',
      luggage: [],
      type: dropdowns.BOOKING_TYPE_LIST[0].value,
      total_people: null,
      special_request: '',
      arrival_time: '',
    },
  ],
};

const TravelBooking = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateMumukshuBooking = useBookingStore((state) => state.updateMumukshuBooking);
  const setMumukshuInfo = useBookingStore((state) => state.setMumukshuInfo);
  const updateGuestBooking = useBookingStore((state) => state.updateGuestBooking);
  const setGuestInfo = useBookingStore((state) => state.setGuestInfo);
  const tabBarPadding = useTabBarPadding();

  const otherLocation = dropdowns.LOCATION_LIST.find((loc) => loc.key === 'other');

  // Helper function to check if pickup or drop location requires arrival time
  const requiresArrivalTime = (pickup: string, drop: string) => {
    return Boolean(
      (pickup &&
        dropdowns.LOCATION_LIST.find(
          (loc) =>
            loc.value === pickup &&
            (loc.key.toLowerCase().includes('railway') || loc.key.toLowerCase().includes('airport'))
        )) ||
        (drop &&
          dropdowns.LOCATION_LIST.find(
            (loc) =>
              loc.value === drop &&
              (loc.key.toLowerCase().includes('railway') ||
                loc.key.toLowerCase().includes('airport'))
          ))
    );
  };

  if (user.res_status == status.STATUS_GUEST) {
    CHIPS = ['Self'];
  }

  useEffect(
    useCallback(() => {
      setIsSubmitting(false);
    }, [])
  );

  const [selectedChip, setSelectedChip] = useState('Self');
  const handleChipClick = (chip: any) => {
    setSelectedChip(chip);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [activeMumukshuIndex, setActiveMumukshuIndex] = useState(null);
  const [activeGuestTravelIndex, setActiveGuestTravelIndex] = useState<number | null>(null);

  // Round trip = a date RANGE (like room booking): the calendar's start day is the onward
  // date and the end day is the return date. A single date (no end day) is one-way; when an
  // end day is chosen the return leg defaults to the reverse of the onward route on that date,
  // and can be edited independently via TravelReturnDetails.
  const [returnDate, setReturnDate] = useState<string>('');
  const [returnGroups, setReturnGroups] = useState<ReturnGroup[]>([]);
  const [returnEdited, setReturnEdited] = useState(false);

  // Reverse each onward group into its return-leg equivalent: pickup/drop swap, same
  // vehicle type/luggage/people, arrival time and comments reset for the return trip, and
  // the same travelers (by index) carried over. This is the default when the return leg
  // hasn't been edited yet.
  const reverseGroups = (onwardGroups: OnwardGroup[], travelers: Traveler[]): ReturnGroup[] =>
    onwardGroups.map((g) => ({
      pickup: g.drop,
      drop: g.pickup,
      type: g.type,
      luggage: g.luggage || [],
      arrival_time: '',
      comments: g.special_request || '',
      total_people: g.total_people ?? null,
      travelerIndices: g.travelerIndices.filter((i) => travelers[Number(i)] !== undefined),
    }));

  const [travelForm, setTravelForm] = useState({
    date: '',
    pickup: '',
    drop: '',
    arrival_time: '',
    luggage: [],
    type: dropdowns.BOOKING_TYPE_LIST[0].value,
    total_people: null,
    special_request: '',
  });

  // One-way (no return date) is always valid; a chosen return date must be on/after onward.
  // Any return group whose route touches an airport/railway must also carry a flight/train
  // time before the round trip can be booked, same rule as the onward leg.
  const isReturnLegValid = () => {
    if (!returnDate) return true;
    if (moment(returnDate).isBefore(moment(travelForm.date), 'day')) return false;
    return returnGroups.every((g) => !requiresArrivalTime(g.pickup, g.drop) || !!g.arrival_time);
  };

  const isSelfFormValid = () => {
    const requiresTime = requiresArrivalTime(travelForm.pickup, travelForm.drop);

    if (travelForm.type == dropdowns.BOOKING_TYPE_LIST[1].value && !travelForm.total_people) {
      return false;
    }

    const requiresSpecialRequest =
      travelForm.pickup === otherLocation?.value || travelForm.drop === otherLocation?.value;

    return (
      travelForm.date &&
      travelForm.pickup &&
      travelForm.drop &&
      travelForm.luggage.length > 0 &&
      travelForm.type &&
      (!requiresTime || (requiresTime && travelForm.arrival_time)) &&
      (!requiresSpecialRequest ||
        (requiresSpecialRequest && travelForm.special_request.trim() !== '')) &&
      !(
        (travelForm.pickup == dropdowns.LOCATION_LIST[0].value &&
          travelForm.drop == dropdowns.LOCATION_LIST[0].value) ||
        (travelForm.pickup != dropdowns.LOCATION_LIST[0].value &&
          travelForm.drop != dropdowns.LOCATION_LIST[0].value)
      ) &&
      isReturnLegValid()
    );
  };

  const [mumukshuForm, setMumukshuForm] = useState(INITIAL_MUMUKSHU_FORM);

  const addMumukshuForm = () => {
    setMumukshuForm((prev) => {
      // Prefill route/vehicle/luggage from the last traveler so repeat trips do not require
      // re-selecting the same dropdowns; identity and comments start empty.
      const last = prev.mumukshus[prev.mumukshus.length - 1] || ({} as any);
      return {
        ...prev,
        mumukshus: [
          ...prev.mumukshus,
          {
            cardno: '',
            mobno: '',
            pickup: last.pickup || '',
            drop: last.drop || '',
            luggage: last.luggage || [],
            type: last.type || dropdowns.BOOKING_TYPE_LIST[0].value,
            total_people: last.total_people ?? null,
            special_request: '',
            arrival_time: '',
          },
        ],
      };
    });
  };

  const removeMumukshuForm = (indexToRemove: any) => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleMumukshuFormChange = (index: any, key: any, value: any) => {
    setMumukshuForm((prev) => ({
      ...prev,
      mumukshus: prev.mumukshus.map((mumukshu, i) => {
        if (i !== index) return mumukshu;

        const updated = { ...mumukshu, [key]: value } as any;

        if (key === 'pickup') {
          if (value == 'Research Centre') {
            updated.drop = mumukshu.drop === 'Research Centre' ? '' : mumukshu.drop;
          } else {
            updated.drop = 'Research Centre';
          }
        }
        if (key === 'drop') {
          if (value === 'Research Centre') {
            updated.pickup = mumukshu.pickup === 'Research Centre' ? '' : mumukshu.pickup;
          } else {
            updated.pickup = 'Research Centre';
          }
        }
        return updated;
      }),
    }));
  };

  const isMumukshuFormValid = () => {
    return (
      mumukshuForm.date &&
      mumukshuForm.mumukshus.every((mumukshu) => {
        const requiresTime = requiresArrivalTime(mumukshu.pickup, mumukshu.drop);

        if (mumukshu.type == dropdowns.BOOKING_TYPE_LIST[1].value && !mumukshu.total_people) {
          return false;
        }

        const requiresSpecialRequest =
          mumukshu.pickup === otherLocation?.value || mumukshu.drop === otherLocation?.value;

        return (
          mumukshu.mobno?.length === 10 &&
          mumukshu.cardno &&
          mumukshu.pickup &&
          mumukshu.drop &&
          mumukshu.luggage.length > 0 &&
          mumukshu.type &&
          (!requiresTime || (requiresTime && mumukshu.arrival_time)) &&
          (!requiresSpecialRequest ||
            (requiresSpecialRequest && mumukshu.special_request.trim() !== '')) &&
          !(
            (mumukshu.pickup === dropdowns.LOCATION_LIST[0].value &&
              mumukshu.drop === dropdowns.LOCATION_LIST[0].value) ||
            (mumukshu.pickup !== dropdowns.LOCATION_LIST[0].value &&
              mumukshu.drop !== dropdowns.LOCATION_LIST[0].value)
          )
        );
      }) &&
      isReturnLegValid()
    );
  };

  const [guestTravelForm, setGuestTravelForm] = useState(INITIAL_GUEST_TRAVEL_FORM);

  const addGuestTravelForm = () => {
    setGuestTravelForm((prev) => {
      // Prefill route/vehicle/luggage from the last guest so repeat trips do not require
      // re-selecting the same dropdowns; identity and comments start empty.
      const last = prev.guests[prev.guests.length - 1] || ({} as any);
      return {
        ...prev,
        guests: [
          ...prev.guests,
          {
            name: '',
            gender: '',
            mobno: '',
            type: '',
            pickup: last.pickup || '',
            drop: last.drop || '',
            luggage: last.luggage || [],
            travelType: last.travelType || dropdowns.BOOKING_TYPE_LIST[0].value,
            arrival_time: '',
            special_request: '',
            total_people: last.total_people ?? null,
          },
        ],
      };
    });
  };

  const removeGuestTravelForm = (indexToRemove: any) => {
    setGuestTravelForm((prev) => ({
      ...prev,
      guests: prev.guests.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleGuestTravelFormChange = (index: any, field: any, value: any) => {
    setGuestTravelForm((prev) => ({
      ...prev,
      guests: prev.guests.map((guest, i) => {
        if (i !== index) return guest;

        const updated = { ...guest, [field]: value } as any;

        if (field === 'pickup') {
          if (value == 'Research Centre') {
            updated.drop = guest.drop === 'Research Centre' ? '' : guest.drop;
          } else {
            updated.drop = 'Research Centre';
          }
          if (!requiresArrivalTime(value, updated.drop)) updated.arrival_time = '';
        }
        if (field === 'drop') {
          if (value === 'Research Centre') {
            updated.pickup = guest.pickup === 'Research Centre' ? '' : guest.pickup;
          } else {
            updated.pickup = 'Research Centre';
          }
          if (!requiresArrivalTime(updated.pickup, value)) updated.arrival_time = '';
        }
        return updated;
      }),
    }));
  };

  const isGuestTravelFormValid = () => {
    return (
      guestTravelForm.date &&
      guestTravelForm.guests.every((guest: any) => {
        const requiresTime = requiresArrivalTime(guest.pickup, guest.drop);

        if (guest.travelType == dropdowns.BOOKING_TYPE_LIST[1].value && !guest.total_people) {
          return false;
        }

        const requiresSpecialRequest =
          guest.pickup === otherLocation?.value || guest.drop === otherLocation?.value;

        const hasGuestIdentity = guest.cardno
          ? guest.mobno?.length === 10
          : guest.name && guest.gender && guest.type && guest.mobno?.length === 10;

        return (
          hasGuestIdentity &&
          guest.pickup &&
          guest.drop &&
          guest.luggage.length > 0 &&
          guest.travelType &&
          (!requiresTime || (requiresTime && guest.arrival_time)) &&
          (!requiresSpecialRequest ||
            (requiresSpecialRequest && guest.special_request.trim() !== '')) &&
          !(
            (guest.pickup === dropdowns.LOCATION_LIST[0].value &&
              guest.drop === dropdowns.LOCATION_LIST[0].value) ||
            (guest.pickup !== dropdowns.LOCATION_LIST[0].value &&
              guest.drop !== dropdowns.LOCATION_LIST[0].value)
          )
        );
      }) &&
      isReturnLegValid()
    );
  };

  // The first human-readable reason the active form can't be submitted, or null when it is
  // ready. Shown inline by the Book Now button so a disabled button always explains itself.
  const legBlockingReason = (leg: any, isGuest = false): string | null => {
    if (isGuest) {
      const hasIdentity = leg.cardno
        ? leg.mobno?.length === 10
        : leg.name && leg.gender && leg.type && leg.mobno?.length === 10;
      if (!hasIdentity)
        return "Complete each guest's name, gender, type and a 10 digit mobile number";
    } else if (leg.mobno !== undefined) {
      if (leg.mobno?.length !== 10 || !leg.cardno)
        return "Complete each traveler's details";
    }
    if (!leg.pickup || !leg.drop) return 'Select a pickup and drop location';
    const bothRC = leg.pickup === 'Research Centre' && leg.drop === 'Research Centre';
    const neitherRC = leg.pickup !== 'Research Centre' && leg.drop !== 'Research Centre';
    if (bothRC || neitherRC) return 'One of pickup or drop must be the Research Centre';
    if (
      (leg.pickup === otherLocation?.value || leg.drop === otherLocation?.value) &&
      !(leg.special_request || '').trim()
    )
      return "Add a comment describing the 'Other' location";
    if (!leg.luggage || leg.luggage.length === 0) return 'Select luggage';
    const type = isGuest ? leg.travelType : leg.type;
    if (!type) return 'Select a booking type';
    if (type === dropdowns.BOOKING_TYPE_LIST[1].value && !leg.total_people)
      return 'Enter the total number of people for the full car';
    if (requiresArrivalTime(leg.pickup, leg.drop) && !leg.arrival_time)
      return 'Add the onward flight/train time';
    return null;
  };

  const returnBlockingReason = (): string | null => {
    if (!returnDate) return null;
    if (moment(returnDate).isBefore(moment(travelForm.date), 'day'))
      return 'The return date must be on or after the onward date';
    if (returnGroups.some((g) => requiresArrivalTime(g.pickup, g.drop) && !g.arrival_time))
      return 'Add the return flight/train time. Tap Edit on the return card.';
    return null;
  };

  const getBlockingReason = (): string | null => {
    if (selectedChip === CHIPS[0]) {
      if (!travelForm.date) return 'Select a travel date';
      return legBlockingReason(travelForm) || returnBlockingReason();
    }
    if (selectedChip === CHIPS[1]) {
      if (!mumukshuForm.date) return 'Select a travel date';
      if (mumukshuForm.mumukshus.length === 0) return 'Add at least one traveler';
      for (const m of mumukshuForm.mumukshus) {
        const r = legBlockingReason(m);
        if (r) return r;
      }
      return returnBlockingReason();
    }
    if (!guestTravelForm.date) return 'Select a travel date';
    if (guestTravelForm.guests.length === 0) return 'Add at least one guest';
    for (const g of guestTravelForm.guests) {
      const r = legBlockingReason(g, true);
      if (r) return r;
    }
    return returnBlockingReason();
  };

  // The active onward travelers, selected by which chip (Self/Mumukshus/Guest) is active.
  // Index positions here are what ReturnGroup.travelerIndices and OnwardGroup.travelerIndices
  // refer to.
  const activeTravelers = useMemo<Traveler[]>(() => {
    if (selectedChip === 'Mumukshus') {
      return mumukshuForm.mumukshus.map((m: any, i: number) => ({
        index: String(i),
        issuedto: m.issuedto || '',
        cardno: m.cardno,
      }));
    }
    if (selectedChip === 'Guest') {
      return guestTravelForm.guests.map((g: any, i: number) => ({
        index: String(i),
        issuedto: g.issuedto || g.name || '',
        cardno: g.cardno,
      }));
    }
    return [{ index: '0', issuedto: user.name, cardno: user.cardno }];
  }, [selectedChip, mumukshuForm.mumukshus, guestTravelForm.guests, user.name, user.cardno]);

  // The active onward groups, selected by which chip is active. Mumukshus/Guest are grouped
  // by pickup-drop-type-total_people the same way transformMumukshuData/transformGuestTravelData
  // group them for the request body, so the return-leg grouping mirrors the onward grouping.
  const activeOnwardGroups = useMemo<OnwardGroup[]>(() => {
    if (selectedChip === 'Mumukshus') {
      const groups: Record<string, OnwardGroup> = {};
      const order: string[] = [];
      mumukshuForm.mumukshus.forEach((m: any, i: number) => {
        const key = `${m.pickup}-${m.drop}-${m.type}-${m.total_people || 'none'}`;
        if (!groups[key]) {
          groups[key] = {
            pickup: m.pickup,
            drop: m.drop,
            type: m.type,
            luggage: m.luggage || [],
            arrival_time: m.arrival_time || '',
            special_request: m.special_request || '',
            total_people: m.total_people ?? null,
            travelerIndices: [],
          };
          order.push(key);
        }
        groups[key].travelerIndices.push(String(i));
      });
      return order.map((k) => groups[k]);
    }
    if (selectedChip === 'Guest') {
      const groups: Record<string, OnwardGroup> = {};
      const order: string[] = [];
      guestTravelForm.guests.forEach((g: any, i: number) => {
        const key = `${g.pickup}-${g.drop}-${g.travelType}-${g.total_people || 'none'}`;
        if (!groups[key]) {
          groups[key] = {
            pickup: g.pickup,
            drop: g.drop,
            type: g.travelType,
            luggage: g.luggage || [],
            arrival_time: g.arrival_time || '',
            special_request: g.special_request || '',
            total_people: g.total_people ?? null,
            travelerIndices: [],
          };
          order.push(key);
        }
        groups[key].travelerIndices.push(String(i));
      });
      return order.map((k) => groups[k]);
    }
    return [
      {
        pickup: travelForm.pickup,
        drop: travelForm.drop,
        type: travelForm.type,
        luggage: travelForm.luggage,
        arrival_time: travelForm.arrival_time,
        special_request: travelForm.special_request,
        total_people: travelForm.total_people,
        travelerIndices: ['0'],
      },
    ];
  }, [
    selectedChip,
    mumukshuForm.mumukshus,
    guestTravelForm.guests,
    travelForm.pickup,
    travelForm.drop,
    travelForm.type,
    travelForm.luggage,
    travelForm.arrival_time,
    travelForm.special_request,
    travelForm.total_people,
  ]);

  const activeOnwardDate =
    selectedChip === 'Mumukshus'
      ? mumukshuForm.date
      : selectedChip === 'Guest'
        ? guestTravelForm.date
        : travelForm.date;

  // An untouched return leg always mirrors the current onward groups. Once the user edits it
  // via "Edit return details", it stops auto-syncing until the return date is cleared.
  useEffect(() => {
    if (returnDate && !returnEdited) {
      setReturnGroups(reverseGroups(activeOnwardGroups, activeTravelers));
    }
  }, [returnDate, returnEdited, selectedChip, activeOnwardGroups, activeTravelers]);

  const { isUtsavDate } = useUtsavDate();

  const getLocationOptions = useCallback(
    (selectedDate: string) => {
      if (isUtsavDate(selectedDate)) {
        return dropdowns.EVENT_LOCATION_LIST;
      }
      return dropdowns.LOCATION_LIST;
    },
    [isUtsavDate]
  );

  // A round trip books a second leg using the (editable) return groups, each with its own
  // route/type/luggage/time and travelers. An untouched return leg equals the reverse of the
  // onward groups, so the default behavior is unchanged. Return groups carry travelers via the
  // same key the onward groups use (mumukshus/guests) so preparingRequestBody's existing
  // transformMumukshuGroup/transformGuestGroup map them to cardnos identically.
  const attachReturnLeg = (temp: any) => {
    if (!returnDate) return temp;

    const isMumukshuPath = Boolean(temp.mumukshuGroup);
    const isGuestPath = Boolean(temp.guestGroup);
    if (!isMumukshuPath && !isGuestPath) return temp;

    const returnGroupPayload = returnGroups.map((rg) => {
      const groupTravelers = rg.travelerIndices
        .map((i) => activeTravelers[Number(i)])
        .filter(Boolean);

      const base = {
        pickup: rg.pickup,
        drop: rg.drop,
        type: rg.type,
        luggage: rg.luggage || [],
        arrival_time: rg.arrival_time || '',
        special_request: rg.comments || '',
        total_people: rg.total_people,
      };

      if (isMumukshuPath) {
        return {
          ...base,
          mumukshus: groupTravelers.map((t) => ({ cardno: t.cardno })),
        };
      }
      return {
        ...base,
        guests: groupTravelers.map((t) => ({ issuedto: t.issuedto, cardno: t.cardno })),
      };
    });

    const result = { ...temp, return_date: returnDate };
    if (isMumukshuPath) {
      result.returnMumukshuGroup = returnGroupPayload;
    } else {
      result.returnGuestGroup = returnGroupPayload;
    }
    return result;
  };

  return (
    <View className="mt-3 w-full flex-1">
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: tabBarPadding + 20,
        }}
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical={false}
        keyboardShouldPersistTaps="handled">
        <Callout
          variant="warning"
          message="For a round trip, add a return date. The return copies your onward trip reversed; tap Edit on the return card to change it."
        />
        <CustomCalender
          type={'period'}
          startDay={travelForm.date}
          setStartDay={(day: any) => {
            setTravelForm((prev) => ({ ...prev, date: day }));
            setMumukshuForm((prev) => ({ ...prev, date: day }));
            setGuestTravelForm((prev) => ({ ...prev, date: day }));
            setReturnDate('');
            setReturnEdited(false);
          }}
          endDay={returnDate}
          setEndDay={(day: any) => {
            if (!day) {
              setReturnDate('');
              setReturnEdited(false);
              return;
            }
            // A tap before the onward date restarts the range at that day (no invalid
            // return-before-onward state), mirroring setStartDay.
            if (moment(day).isBefore(moment(travelForm.date), 'day')) {
              setTravelForm((prev) => ({ ...prev, date: day }));
              setMumukshuForm((prev) => ({ ...prev, date: day }));
              setGuestTravelForm((prev) => ({ ...prev, date: day }));
              setReturnDate('');
              setReturnEdited(false);
              return;
            }
            setReturnDate(day);
          }}
          minDate={moment(new Date()).format('YYYY-MM-DD')}
        />

        <View className="mt-7 flex w-full flex-col">
          <Text className="font-pmedium text-base text-gray-600">Book for</Text>
          <CustomChipGroup
            chips={CHIPS}
            selectedChip={selectedChip}
            handleChipPress={handleChipClick}
            containerStyles={'mt-1'}
            chipContainerStyles={'py-2'}
            textStyles={'text-sm'}
          />
        </View>

        {selectedChip == CHIPS[0] && (
          <View>
            <CustomSelectBottomSheet
              className="mt-7"
              label="Booking Type"
              placeholder="Booking Type"
              options={dropdowns.BOOKING_TYPE_LIST}
              selectedValue={travelForm.type}
              onValueChange={(val: any) => setTravelForm({ ...travelForm, type: val })}
              saveKeyInsteadOfValue={false}
            />

            {travelForm.type == dropdowns.BOOKING_TYPE_LIST[1].value && (
              <FormField
                text="Total People"
                value={travelForm.total_people}
                handleChangeText={(e: any) => setTravelForm({ ...travelForm, total_people: e })}
                otherStyles="mt-7"
                containerStyles="bg-gray-100"
                keyboardType="number-pad"
                placeholder="please specify total people here..."
                inputStyles={'font-pmedium text-black text-lg'}
              />
            )}

            <CustomSelectBottomSheet
              className="mt-7"
              label="Pickup Location"
              placeholder="Select Pickup Location"
              options={getLocationOptions(travelForm.date)}
              selectedValue={travelForm.pickup}
              onValueChange={(val: any) => {
                let newDrop = travelForm.drop;
                if (val === 'Research Centre') {
                  // If selecting Research Centre as pickup, drop must be something else
                  newDrop = travelForm.drop === 'Research Centre' ? '' : travelForm.drop;
                } else {
                  // If selecting anything else as pickup, drop must be Research Centre
                  newDrop = 'Research Centre';
                }

                setTravelForm({
                  ...travelForm,
                  pickup: val,
                  drop: newDrop,
                  // Clear arrival_time if the new pickup/drop combination doesn't require it
                  arrival_time: requiresArrivalTime(val, newDrop) ? travelForm.arrival_time : '',
                });
              }}
              saveKeyInsteadOfValue={false}
            />

            <CustomSelectBottomSheet
              className="mt-7"
              label="Drop Location"
              placeholder="Select Drop Location"
              options={getLocationOptions(travelForm.date)}
              selectedValue={travelForm.drop}
              onValueChange={(val: any) => {
                let newPickup = travelForm.pickup;
                if (val === 'Research Centre') {
                  // If selecting Research Centre as drop, pickup must be something else
                  newPickup = travelForm.pickup === 'Research Centre' ? '' : travelForm.pickup;
                } else {
                  // If selecting anything else as drop, pickup must be Research Centre
                  newPickup = 'Research Centre';
                }

                setTravelForm({
                  ...travelForm,
                  drop: val,
                  pickup: newPickup,
                  // Clear arrival_time if the new pickup/drop combination doesn't require it
                  arrival_time: requiresArrivalTime(newPickup, val) ? travelForm.arrival_time : '',
                });
              }}
              saveKeyInsteadOfValue={false}
            />

            {requiresArrivalTime(travelForm.pickup, travelForm.drop) ? (
              <>
                <FormDisplayField
                  text="Flight/Train Time"
                  value={
                    travelForm.arrival_time
                      ? moment(travelForm.arrival_time, 'HH:mm').format('h:mm a')
                      : ''
                  }
                  placeholder="Flight/Train Time"
                  otherStyles="mt-5"
                  inputStyles="font-pmedium text-black text-lg"
                  backgroundColor="bg-gray-100"
                  onPress={() => setDatePickerVisibility(true)}
                />
                <DateTimePickerModal
                  isVisible={isDatePickerVisible}
                  mode="time"
                  date={
                    travelForm.arrival_time
                      ? moment(travelForm.arrival_time, 'HH:mm').toDate()
                      : new Date()
                  }
                  onConfirm={(date: Date) => {
                    const timeOnly = moment(date).format('HH:mm');
                    setTravelForm((prev) => ({
                      ...prev,
                      arrival_time: timeOnly,
                    }));
                    setDatePickerVisibility(false);
                  }}
                  onCancel={() => setDatePickerVisibility(false)}
                />
              </>
            ) : null}

            <CustomSelectBottomSheet
              className="mt-7"
              label="Luggage"
              placeholder="Select any Luggage"
              options={dropdowns.LUGGAGE_LIST}
              selectedValues={travelForm.luggage}
              onValuesChange={(val: any) => setTravelForm({ ...travelForm, luggage: val })}
              saveKeyInsteadOfValue={false}
              multiSelect={true}
              confirmButtonText="Select"
              maxSelectedDisplay={3}
            />

            <FormField
              text="Comments"
              value={travelForm.special_request}
              handleChangeText={(e: any) => setTravelForm({ ...travelForm, special_request: e })}
              otherStyles="mt-7"
              containerStyles="bg-gray-100"
              keyboardType="default"
              inputStyles={'font-pmedium text-black text-lg'}
              placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
              multiline={true}
              numberOfLines={2}
            />
          </View>
        )}

        {selectedChip == CHIPS[1] && (
          <View>
            <OtherMumukshuForm
              mumukshuForm={mumukshuForm}
              setMumukshuForm={setMumukshuForm}
              handleMumukshuFormChange={handleMumukshuFormChange}
              addMumukshuForm={addMumukshuForm}
              removeMumukshuForm={removeMumukshuForm}>
              {(index: any) => (
                <>
                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Booking Type"
                    placeholder="Select Booking Type"
                    options={dropdowns.BOOKING_TYPE_LIST}
                    selectedValue={mumukshuForm.mumukshus[index].type}
                    onValueChange={(val: any) => handleMumukshuFormChange(index, 'type', val)}
                    saveKeyInsteadOfValue={false}
                  />

                  {mumukshuForm.mumukshus[index].type == dropdowns.BOOKING_TYPE_LIST[1].value && (
                    <FormField
                      text="Total People"
                      value={mumukshuForm.mumukshus[index].total_people}
                      handleChangeText={(e: any) =>
                        handleMumukshuFormChange(index, 'total_people', e)
                      }
                      otherStyles="mt-7"
                      containerStyles="bg-gray-100"
                      keyboardType="number-pad"
                      placeholder="please specify total people here..."
                      inputStyles={'font-pmedium text-black text-lg'}
                    />
                  )}

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Pickup Location"
                    placeholder="Select Pickup Location"
                    options={getLocationOptions(mumukshuForm.date)}
                    selectedValue={mumukshuForm.mumukshus[index].pickup}
                    onValueChange={(val: any) => {
                      handleMumukshuFormChange(index, 'pickup', val);
                      // Clear arrival_time if the new pickup/drop combination doesn't require it
                      if (!requiresArrivalTime(val, mumukshuForm.mumukshus[index].drop)) {
                        handleMumukshuFormChange(index, 'arrival_time', '');
                      }
                    }}
                    saveKeyInsteadOfValue={false}
                  />

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Drop Location"
                    placeholder="Select Drop Location"
                    options={getLocationOptions(mumukshuForm.date)}
                    selectedValue={mumukshuForm.mumukshus[index].drop}
                    onValueChange={(val: any) => {
                      handleMumukshuFormChange(index, 'drop', val);
                      // Clear arrival_time if the new pickup/drop combination doesn't require it
                      if (!requiresArrivalTime(mumukshuForm.mumukshus[index].pickup, val)) {
                        handleMumukshuFormChange(index, 'arrival_time', '');
                      }
                    }}
                    saveKeyInsteadOfValue={false}
                  />

                  {requiresArrivalTime(
                    mumukshuForm.mumukshus[index].pickup,
                    mumukshuForm.mumukshus[index].drop
                  ) ? (
                    <>
                      <FormDisplayField
                        text="Flight/Train Time"
                        value={
                          mumukshuForm.mumukshus[index].arrival_time
                            ? moment(mumukshuForm.mumukshus[index].arrival_time, 'HH:mm').format(
                                'h:mm a'
                              )
                            : ''
                        }
                        placeholder="Flight/Train Time"
                        otherStyles="mt-5"
                        inputStyles="font-pmedium text-black text-lg"
                        backgroundColor="bg-gray-100"
                        onPress={() => {
                          setDatePickerVisibility(true);
                          setActiveMumukshuIndex(index);
                        }}
                      />
                      <DateTimePickerModal
                        isVisible={isDatePickerVisible && activeMumukshuIndex === index}
                        mode="time"
                        date={
                          mumukshuForm.mumukshus[index].arrival_time
                            ? moment(mumukshuForm.mumukshus[index].arrival_time, 'HH:mm').toDate()
                            : new Date()
                        }
                        onConfirm={(date: Date) => {
                          const timeOnly = moment(date).format('HH:mm');
                          handleMumukshuFormChange(index, 'arrival_time', timeOnly);
                          setDatePickerVisibility(false);
                        }}
                        onCancel={() => setDatePickerVisibility(false)}
                      />
                    </>
                  ) : null}

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Luggage"
                    placeholder="Select any luggage"
                    options={dropdowns.LUGGAGE_LIST}
                    selectedValues={mumukshuForm.mumukshus[index].luggage}
                    onValuesChange={(val: any) => handleMumukshuFormChange(index, 'luggage', val)}
                    saveKeyInsteadOfValue={false}
                    multiSelect={true}
                    confirmButtonText="Select"
                    maxSelectedDisplay={3}
                  />

                  <FormField
                    text="Comments"
                    value={mumukshuForm.mumukshus[index].special_request}
                    handleChangeText={(e: any) =>
                      handleMumukshuFormChange(index, 'special_request', e)
                    }
                    otherStyles="mt-7"
                    containerStyles="bg-gray-100"
                    keyboardType="default"
                    inputStyles={'font-pmedium text-black text-lg'}
                    placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
                    multiline={true}
                    numberOfLines={2}
                  />
                </>
              )}
            </OtherMumukshuForm>
          </View>
        )}

        {selectedChip == 'Guest' && (
          <View>
            <GuestForm
              guestForm={guestTravelForm}
              setGuestForm={setGuestTravelForm}
              handleGuestFormChange={handleGuestTravelFormChange}
              addGuestForm={addGuestTravelForm}
              removeGuestForm={removeGuestTravelForm}>
              {(index: any) => (
                <>
                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Booking Type"
                    placeholder="Select Booking Type"
                    options={dropdowns.BOOKING_TYPE_LIST}
                    selectedValue={guestTravelForm.guests[index].travelType}
                    onValueChange={(val: any) =>
                      handleGuestTravelFormChange(index, 'travelType', val)
                    }
                    saveKeyInsteadOfValue={false}
                  />

                  {guestTravelForm.guests[index].travelType ==
                    dropdowns.BOOKING_TYPE_LIST[1].value && (
                    <FormField
                      text="Total People"
                      value={guestTravelForm.guests[index].total_people}
                      handleChangeText={(e: any) =>
                        handleGuestTravelFormChange(index, 'total_people', e)
                      }
                      otherStyles="mt-7"
                      containerStyles="bg-gray-100"
                      keyboardType="number-pad"
                      placeholder="please specify total people here..."
                      inputStyles={'font-pmedium text-black text-lg'}
                    />
                  )}

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Pickup Location"
                    placeholder="Select Pickup Location"
                    options={getLocationOptions(guestTravelForm.date)}
                    selectedValue={guestTravelForm.guests[index].pickup}
                    onValueChange={(val: any) =>
                      handleGuestTravelFormChange(index, 'pickup', val)
                    }
                    saveKeyInsteadOfValue={false}
                  />

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Drop Location"
                    placeholder="Select Drop Location"
                    options={getLocationOptions(guestTravelForm.date)}
                    selectedValue={guestTravelForm.guests[index].drop}
                    onValueChange={(val: any) => handleGuestTravelFormChange(index, 'drop', val)}
                    saveKeyInsteadOfValue={false}
                  />

                  {requiresArrivalTime(
                    guestTravelForm.guests[index].pickup,
                    guestTravelForm.guests[index].drop
                  ) ? (
                    <>
                      <FormDisplayField
                        text="Flight/Train Time"
                        value={
                          guestTravelForm.guests[index].arrival_time
                            ? moment(guestTravelForm.guests[index].arrival_time, 'HH:mm').format(
                                'h:mm a'
                              )
                            : ''
                        }
                        placeholder="Flight/Train Time"
                        otherStyles="mt-5"
                        inputStyles="font-pmedium text-black text-lg"
                        backgroundColor="bg-gray-100"
                        onPress={() => {
                          setDatePickerVisibility(true);
                          setActiveGuestTravelIndex(index);
                        }}
                      />
                      <DateTimePickerModal
                        isVisible={isDatePickerVisible && activeGuestTravelIndex === index}
                        mode="time"
                        date={
                          guestTravelForm.guests[index].arrival_time
                            ? moment(guestTravelForm.guests[index].arrival_time, 'HH:mm').toDate()
                            : new Date()
                        }
                        onConfirm={(date: Date) => {
                          const timeOnly = moment(date).format('HH:mm');
                          handleGuestTravelFormChange(index, 'arrival_time', timeOnly);
                          setDatePickerVisibility(false);
                        }}
                        onCancel={() => setDatePickerVisibility(false)}
                      />
                    </>
                  ) : null}

                  <CustomSelectBottomSheet
                    className="mt-7"
                    label="Luggage"
                    placeholder="Select any luggage"
                    options={dropdowns.LUGGAGE_LIST}
                    selectedValues={guestTravelForm.guests[index].luggage}
                    onValuesChange={(val: any) =>
                      handleGuestTravelFormChange(index, 'luggage', val)
                    }
                    saveKeyInsteadOfValue={false}
                    multiSelect={true}
                    confirmButtonText="Select"
                    maxSelectedDisplay={3}
                  />

                  <FormField
                    text="Comments"
                    value={guestTravelForm.guests[index].special_request}
                    handleChangeText={(e: any) =>
                      handleGuestTravelFormChange(index, 'special_request', e)
                    }
                    otherStyles="mt-7"
                    containerStyles="bg-gray-100"
                    keyboardType="default"
                    inputStyles={'font-pmedium text-black text-lg'}
                    placeholder="Please specify a location if 'Other' is selected, or provide any additional requests here..."
                    multiline={true}
                    numberOfLines={2}
                  />
                </>
              )}
            </GuestForm>
          </View>
        )}

        <TravelReturnDetails
          showDatePicker={false}
          variant={selectedChip === 'Self' ? 'flat' : 'grouped'}
          returnDate={returnDate}
          onwardDate={activeOnwardDate}
          travelers={activeTravelers}
          returnGroups={returnGroups}
          onChangeReturnGroups={(g) => {
            setReturnGroups(g);
            setReturnEdited(true);
          }}
          onClearReturnDate={() => {
            setReturnDate('');
            setReturnEdited(false);
          }}
          onPickReturnDate={() => {}}
          locationOptions={getLocationOptions(returnDate || activeOnwardDate)}
          requiresArrivalTime={requiresArrivalTime}
        />

        {(() => {
          const reason = getBlockingReason();
          return reason ? (
            <View className="mt-7 flex-row items-start gap-x-2 rounded-lg bg-orange-50 px-3 py-2.5">
              <Ionicons name="alert-circle" size={16} color="#EA580C" style={{ marginTop: 1 }} />
              <Text className="flex-1 font-pregular text-sm text-orange-700">{reason}</Text>
            </View>
          ) : null;
        })()}

        <CustomButton
          text="Book Now"
          handlePress={async () => {
            setIsSubmitting(true);
            if (selectedChip == CHIPS[0]) {
              if (!isSelfFormValid()) {
                setModalVisible(true);
                setModalMessage('Please fill all fields');
                setIsSubmitting(false);
                return;
              }

              const temp = transformMumukshuData({
                date: travelForm.date,
                mumukshus: [
                  {
                    cardno: user.cardno,
                    mobno: user.mobno,
                    pickup: travelForm.pickup,
                    drop: travelForm.drop,
                    luggage: travelForm.luggage,
                    type: travelForm.type,
                    total_people: travelForm.total_people,
                    special_request: travelForm.special_request,
                    arrival_time: travelForm.arrival_time,
                  },
                ],
              });

              await updateMumukshuBooking('travel', attachReturnLeg(temp));
              router.push(`/booking/${types.TRAVEL_DETAILS_TYPE}`);
            }
            if (selectedChip == CHIPS[1]) {
              if (!isMumukshuFormValid()) {
                setModalVisible(true);
                setModalMessage('Please fill all fields');
                setIsSubmitting(false);
                return;
              }
              const mumukshuInfoArray = mumukshuForm.mumukshus.map((mumukshu: any) => ({
                cardno: mumukshu.cardno,
                name: mumukshu.issuedto,
              }));
              setMumukshuInfo(mumukshuInfoArray);
              const temp = transformMumukshuData(mumukshuForm);
              await updateMumukshuBooking('travel', attachReturnLeg(temp));
              router.push(`/mumukshuBooking/${types.TRAVEL_DETAILS_TYPE}`);
            }
            if (selectedChip == 'Guest') {
              if (!isGuestTravelFormValid()) {
                setModalVisible(true);
                setModalMessage('Please fill all fields');
                setIsSubmitting(false);
                return;
              }

              await handleAPICall(
                'POST',
                '/guest',
                null,
                {
                  cardno: user.cardno,
                  guests: guestTravelForm.guests,
                },
                async (res: any) => {
                  const guestInfoArray = res.guests.map((apiGuest: any) => ({
                    cardno: apiGuest.cardno,
                    name: apiGuest.issuedto || apiGuest.name,
                  }));
                  setGuestInfo(guestInfoArray);

                  const updatedGuests = guestTravelForm.guests.map((formGuest) => {
                    const matchingApiGuest = res.guests.find(
                      (apiGuest: any) => apiGuest.issuedto === formGuest.name
                    );
                    return matchingApiGuest
                      ? { ...formGuest, cardno: matchingApiGuest.cardno }
                      : formGuest;
                  });

                  const temp = transformGuestTravelData({
                    date: guestTravelForm.date,
                    guests: updatedGuests,
                  });

                  updateGuestBooking('travel', attachReturnLeg(temp));
                  setIsSubmitting(false);
                  setGuestTravelForm(INITIAL_GUEST_TRAVEL_FORM);
                  router.push(`/guestBooking/${types.TRAVEL_DETAILS_TYPE}`);
                },
                () => {
                  setIsSubmitting(false);
                }
              );
            }
          }}
          containerStyles="mt-7 w-full px-1 min-h-[62px]"
          isLoading={isSubmitting}
          isDisabled={
            selectedChip == CHIPS[0]
              ? !isSelfFormValid()
              : selectedChip == 'Guest'
                ? !isGuestTravelFormValid()
                : !isMumukshuFormValid()
          }
        />
      </KeyboardAwareScrollView>
      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        message={modalMessage}
        btnText={'Okay'}
      />
    </View>
  );
};

function transformMumukshuData(inputData: any) {
  const { date, mumukshus } = inputData;

  const groupedMumukshus = mumukshus.reduce((acc: any, mumukshu: any) => {
    const key = `${mumukshu.pickup}-${mumukshu.drop}-${mumukshu.type}-${mumukshu.total_people || 'none'}`;
    if (!acc[key]) {
      acc[key] = {
        pickup: mumukshu.pickup,
        drop: mumukshu.drop,
        type: mumukshu.type,
        arrival_time: mumukshu.arrival_time,
        luggage: mumukshu.luggage,
        special_request: mumukshu.special_request,
        total_people: mumukshu.total_people,
        mumukshus: [],
      };
    }
    acc[key].mumukshus.push(mumukshu);

    return acc;
  }, {});

  const mumukshuGroup = Object.values(groupedMumukshus);

  return {
    date: date,
    mumukshuGroup: mumukshuGroup,
  };
}

function transformGuestTravelData(inputData: any) {
  const { date, guests } = inputData;

  const groupedGuests = guests.reduce((acc: any, guest: any) => {
    const key = `${guest.pickup}-${guest.drop}-${guest.travelType}-${guest.total_people || 'none'}`;
    if (!acc[key]) {
      acc[key] = {
        pickup: guest.pickup,
        drop: guest.drop,
        type: guest.travelType,
        arrival_time: guest.arrival_time,
        luggage: guest.luggage,
        special_request: guest.special_request,
        total_people: guest.total_people,
        guests: [],
      };
    }
    acc[key].guests.push({
      issuedto: guest.issuedto || guest.name,
      cardno: guest.cardno,
    });

    return acc;
  }, {});

  const guestGroup = Object.values(groupedGuests);

  return {
    date: date,
    guestGroup: guestGroup,
  };
}

export default TravelBooking;
