// src/features/payments/utils.ts
// Pure formatting helpers extracted from the original `pendingPayments.tsx`,
// unchanged in behavior.
import moment from 'moment';

import type { Transaction } from './types';

import { icons } from '@/constants';

export const getItemTitle = (item: Transaction) => {
  if (item.name) {
    return item.name;
  }

  switch (item.category?.toLowerCase()) {
    case 'room':
      return 'Room Booking';
    case 'flat':
      return 'Flat Booking';
    case 'adhyayan':
      return 'Adhyayan Booking';
    case 'utsav':
      return 'Utsav Booking';
    case 'travel':
      return 'Travel Booking';
    case 'breakfast':
      return 'Breakfast Booking';
    case 'lunch':
      return 'Lunch Booking';
    case 'dinner':
      return 'Dinner Booking';
    default:
      return 'Miscellaneous Booking';
  }
};

export const getDateRange = (startDay: string | null, endDay: string | null) => {
  if (!startDay) {
    return 'Date not specified';
  }

  const start = moment(startDay);
  const end = moment(endDay ? endDay : startDay);

  if (start.isSame(end, 'day')) {
    return start.format('DD MMM YYYY');
  } else {
    return `${start.format('DD MMM')} - ${end.format('DD MMM YYYY')}`;
  }
};

export const getDuration = (startDay: string | null, endDay: string | null) => {
  if (!startDay) {
    return 'Duration not specified';
  }

  const start = moment(startDay);
  const end = moment(endDay ? endDay : startDay);
  const nights = end.diff(start, 'days');

  if (nights === 0) {
    return '1 night';
  } else {
    return `${nights} nights`;
  }
};

export const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'room':
      return icons.room;
    case 'flat':
      return icons.room;
    case 'adhyayan':
      return icons.adhyayan;
    case 'utsav':
      return icons.events;
    case 'travel':
      return icons.travel;
    case 'breakfast':
    case 'lunch':
    case 'dinner':
      return icons.food;
    default:
      return icons.room;
  }
};
