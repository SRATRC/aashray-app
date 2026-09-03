import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import moment from 'moment';
import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';

import { nextStayQuery } from '@/src/components/home/NextStayCard';
import { colors, status, surfaces } from '@/src/constants';
import { useAuthStore } from '@/src/stores';
import handleAPICall from '@/src/utils/HandleApiCall';
import shouldShowRoomNumberRule from '@/src/utils/shouldShowRoomNumber';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = 16;

interface StatusPillConfig {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
  text: string;
}

const getStatusPill = (bookingStatus: string): StatusPillConfig => {
  if (
    bookingStatus === status.STATUS_CANCELLED ||
    bookingStatus === status.STATUS_ADMIN_CANCELLED
  ) {
    return {
      label: 'Cancelled',
      icon: 'close-circle',
      tint: '#DC2626',
      bg: 'bg-red-100',
      text: 'text-red-200',
    };
  }

  if (bookingStatus === status.STATUS_WAITING) {
    return {
      label: 'Waitlist',
      icon: 'time',
      tint: '#FF8E01',
      bg: 'bg-secondary-50',
      text: 'text-secondary-200',
    };
  }

  if (bookingStatus === status.STATUS_CONFIRMED || bookingStatus === status.STATUS_AVAILABLE) {
    return {
      label: 'Confirmed',
      icon: 'checkmark-circle',
      tint: '#05B617',
      bg: 'bg-green-100',
      text: 'text-green-200',
    };
  }

  return {
    label: bookingStatus,
    icon: 'information-circle',
    tint: '#6B7280',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
  };
};

const StatusPill: React.FC<{ status: string }> = ({ status: bookingStatus }) => {
  const style = getStatusPill(bookingStatus);
  return (
    <View
      className={`flex-row items-center gap-x-1 self-start rounded-full px-2 py-0.5 ${style.bg}`}>
      <Ionicons name={style.icon} size={12} color={style.tint} />
      <Text className={`font-pmedium text-xs ${style.text}`}>{style.label}</Text>
    </View>
  );
};

interface UpcomingBooking {
  id: string;
  type: 'room' | 'flat' | 'shibir' | 'travel' | 'event';
  whenLabel: string;
  title: string;
  subtitle: string;
  detail: string;
  detailIcon: keyof typeof Ionicons.glyphMap;
  status: string;
  transactionStatus?: string;
  sortDate: moment.Moment;
}

const fetchAdhyayans = (cardno: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/adhyayan/getbooked',
      { cardno, page: 1, upcoming: true },
      null,
      (res: any) => resolve(Array.isArray(res?.data) ? res.data : []),
      () => {},
      () => reject(new Error('Failed to fetch adhyayans')),
      false
    );
  });

const fetchTravels = (cardno: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/travel/booking',
      { cardno, page: 1, upcoming: true },
      null,
      (res: any) => resolve(Array.isArray(res?.data) ? res.data : []),
      () => {},
      () => reject(new Error('Failed to fetch travels')),
      false
    );
  });

const fetchUtsavs = (cardno: string): Promise<any[]> =>
  new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/utsav/booking',
      { cardno, page: 1, upcoming: true },
      null,
      (res: any) => resolve(Array.isArray(res?.data) ? res.data : []),
      () => {},
      () => reject(new Error('Failed to fetch utsavs')),
      false
    );
  });

const isActive = (item: any) => {
  const itemStatus = item.status?.toLowerCase();
  return (
    itemStatus !== status.STATUS_CANCELLED.toLowerCase() &&
    itemStatus !== status.STATUS_ADMIN_CANCELLED.toLowerCase()
  );
};

const formatDateRange = (start: string, end?: string) => {
  const s = moment(start);
  const e = end ? moment(end) : s;
  if (s.isSame(e, 'day')) return s.format('D MMM');
  return `${s.format('D MMM')} – ${e.format('D MMM')}`;
};

const ROOM_LABEL: Record<string, string> = { ac: 'AC room', nac: 'Non-AC room', NA: 'Day visit' };

const stayWhenLabel = (checkin: string, checkout: string) => {
  const today = moment().startOf('day');
  const days = moment(checkin).startOf('day').diff(today, 'days');
  if (days < 0 && moment(checkout).startOf('day').isSameOrAfter(today)) return 'Staying now';
  if (days === 0) return 'Checking in today';
  if (days === 1) return 'Checking in tomorrow';
  return `Checking in in ${days} days`;
};

const eventWhenLabel = (start: string) => {
  const today = moment().startOf('day');
  const days = moment(start).startOf('day').diff(today, 'days');
  if (days < 0) return 'Ongoing';
  if (days === 0) return 'Starting today';
  if (days === 1) return 'Starting tomorrow';
  return `Starting in ${days} days`;
};

const shibirWhenLabel = (start: string) => {
  const today = moment().startOf('day');
  const days = moment(start).startOf('day').diff(today, 'days');
  if (days < 0) return 'Ongoing';
  if (days === 0) return 'Starting today';
  if (days === 1) return 'Starting tomorrow';
  return `Starting in ${days} days`;
};

const travelWhenLabel = (date: string) => {
  const today = moment().startOf('day');
  const days = moment(date).startOf('day').diff(today, 'days');
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
};

const shouldShowRoomNumber = (item: any) => {
  if (item.roomtype === 'flat' || item.category === 'flat') return true;
  if (!item.roomno) return false;

  return shouldShowRoomNumberRule({
    alwaysShow: false,
    isPaid:
      item.transaction_status === status.STATUS_PAYMENT_COMPLETED ||
      item.transaction_status === status.STATUS_CASH_COMPLETED ||
      item.status === status.STATUS_PAYMENT_COMPLETED ||
      item.status === status.STATUS_CASH_COMPLETED,
    checkinDate: item.checkin || item.start_day,
  });
};

const UpcomingBookingsCarousel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const router = useRouter();
  const user = useAuthStore((state: any) => state.user);
  const cardno = user?.cardno;
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const staysQuery = useQuery({
    ...nextStayQuery(cardno, true),
    enabled: Boolean(cardno),
  });

  const adhyayanQuery = useQuery({
    queryKey: ['homeAdhyayans', cardno],
    queryFn: () => fetchAdhyayans(cardno),
    enabled: Boolean(cardno),
  });

  const travelQuery = useQuery({
    queryKey: ['homeTravels', cardno],
    queryFn: () => fetchTravels(cardno),
    enabled: Boolean(cardno),
  });

  const utsavQuery = useQuery({
    queryKey: ['homeUtsavs', cardno],
    queryFn: () => fetchUtsavs(cardno),
    enabled: Boolean(cardno),
  });

  const isLoading =
    staysQuery.isLoading ||
    adhyayanQuery.isLoading ||
    travelQuery.isLoading ||
    utsavQuery.isLoading;

  const bookings = useMemo<UpcomingBooking[]>(() => {
    const today = moment().startOf('day');
    const list: UpcomingBooking[] = [];

    (staysQuery.data ?? [])
      .filter((item) => isActive(item) && moment(item.checkout).isSameOrAfter(today))
      .forEach((item) => {
        const isFlat = item.roomtype === 'flat';
        const nights = Math.max(
          0,
          moment(item.checkout).startOf('day').diff(moment(item.checkin).startOf('day'), 'days')
        );
        const roomLabel = item.roomtype ? ROOM_LABEL[item.roomtype] || item.roomtype : null;
        const showRoom = shouldShowRoomNumber(item);
        const detail = isFlat
          ? item.roomno
            ? `Flat ${item.roomno}`
            : 'Flat given on arrival'
          : showRoom
            ? item.roomno
              ? `Room ${item.roomno}`
              : 'Room given on arrival'
            : 'Room number: shown 24h before check-in';

        list.push({
          id: `room-${item.bookingid}`,
          type: isFlat ? 'flat' : 'room',
          whenLabel: stayWhenLabel(item.checkin, item.checkout),
          title: formatDateRange(item.checkin, item.checkout),
          subtitle: `${nights > 0 ? `${nights} night${nights === 1 ? '' : 's'}` : 'Day visit'}${roomLabel ? ` · ${roomLabel}` : ''}`,
          detail,
          detailIcon: 'key-outline',
          status: item.status ?? '',
          transactionStatus: item.transaction_status,
          sortDate: moment(item.checkin),
        });
      });

    (adhyayanQuery.data ?? [])
      .filter((item) => isActive(item) && moment(item.end_date).isSameOrAfter(today))
      .forEach((item) => {
        list.push({
          id: `shibir-${item.bookingid}`,
          type: 'shibir',
          whenLabel: shibirWhenLabel(item.start_date),
          title: item.shibir_name || 'Shibir Booking',
          subtitle: formatDateRange(item.start_date, item.end_date),
          detail: '',
          detailIcon: 'book-outline',
          status: item.status,
          transactionStatus: item.transaction_status,
          sortDate: moment(item.start_date),
        });
      });

    (travelQuery.data ?? [])
      .filter((item) => isActive(item) && moment(item.date).isSameOrAfter(today))
      .forEach((item) => {
        const routeLabel =
          item.pickup_point === 'Research Centre'
            ? 'Research Centre to Mumbai'
            : 'Mumbai to Research Centre';
        list.push({
          id: `travel-${item.bookingid}`,
          type: 'travel',
          whenLabel: travelWhenLabel(item.date),
          title: routeLabel,
          subtitle: moment(item.date).format('DD MMM YYYY'),
          detail: `${item.pickup_point || ''} to ${item.drop_point || ''}`,
          detailIcon: 'car-outline',
          status: item.status,
          transactionStatus: item.transaction_status,
          sortDate: moment(item.date),
        });
      });

    (utsavQuery.data ?? [])
      .filter(
        (item) =>
          isActive(item) &&
          moment(item.package_end || item.utsav_end_date || item.package_start).isSameOrAfter(today)
      )
      .forEach((item) => {
        const start = item.package_start || item.utsav_start_date;
        const end = item.package_end;
        list.push({
          id: `event-${item.bookingid}`,
          type: 'event',
          whenLabel: eventWhenLabel(start),
          title: item.utsav_name || 'Event Booking',
          subtitle: end ? formatDateRange(start, end) : moment(start).format('DD MMM YYYY'),
          detail: item.stay ? `Room ${item.stay}` : '',
          detailIcon: 'key-outline',
          status: item.status,
          transactionStatus: item.transaction_status,
          sortDate: moment(start),
        });
      });

    return list.sort((a, b) => a.sortDate.valueOf() - b.sortDate.valueOf()).slice(0, 10);
  }, [staysQuery.data, adhyayanQuery.data, travelQuery.data, utsavQuery.data]);

  // Fires once per settled page instead of on every scroll frame, so swiping
  // never queues per-frame setState work on the JS thread.
  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(Math.min(Math.max(index, 0), Math.max(bookings.length - 1, 0)));
  };

  // A refetch can shrink the list while activeIndex still points past its end.
  const clampedIndex = Math.min(activeIndex, Math.max(bookings.length - 1, 0));

  if (isLoading) {
    return (
      <View className={`${surfaces.CARD} items-center justify-center p-6 ${className}`}>
        <ActivityIndicator size="small" color={colors.secondary_200} />
      </View>
    );
  }

  if (bookings.length === 0) return null;

  const getBookingRoute = (item: UpcomingBooking) => {
    const typeMap: Record<string, string> = {
      room: 'room',
      flat: 'room',
      shibir: 'adhyayan',
      travel: 'travel',
      event: 'event',
    };
    return { pathname: '/bookings', params: { type: typeMap[item.type] } };
  };

  const renderItem = ({ item }: { item: UpcomingBooking }) => (
    <View style={{ width: SCREEN_WIDTH, paddingHorizontal: CARD_MARGIN }}>
      <Pressable
        onPress={() => router.push(getBookingRoute(item))}
        className={`${surfaces.CARD} overflow-hidden`}>
        <View className="px-5 pb-4 pt-5">
          <View className="flex-row items-center justify-between gap-x-3">
            <Text className="font-pregular text-xs text-gray-500">{item.whenLabel}</Text>
            <StatusPill status={item.status} />
          </View>

          <Text className="mt-2 font-psemibold text-2xl leading-8 text-gray-900">{item.title}</Text>
          <Text className="mt-1 font-pregular text-sm text-gray-500">{item.subtitle}</Text>
        </View>

        <View className="flex-row items-center justify-between border-t border-gray-200 px-5 py-3.5">
          <View className="flex-row items-center gap-x-2">
            <Ionicons name={item.detailIcon} size={16} color={colors.gray_400} />
            <Text className="font-pregular text-sm text-gray-600">
              {item.detail || 'Booking details'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.gray_400} />
        </View>
      </Pressable>
    </View>
  );

  return (
    <View className={className}>
      <FlatList
        ref={flatListRef}
        data={bookings}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(item) => item.id}
      />

      {bookings.length > 1 && (
        <View className="mt-3 flex-row justify-center gap-x-2">
          {bookings.map((_, index) => (
            <View
              key={index}
              className={`h-2 w-2 rounded-full ${
                index === clampedIndex ? 'bg-secondary' : 'bg-gray-300'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default UpcomingBookingsCarousel;
