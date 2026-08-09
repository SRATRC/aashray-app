import { isShibirFull, isUtsavFull, seatsLeftLabel, waitlistCountOf } from './catalogueStatus';

import type { CatalogueMeta } from './CatalogueCard';

/**
 * How a shibir and an utsav describe themselves on a card.
 *
 * Shared by the catalogue list, the step 2 recap and the deep-linked detail
 * screen, so the same item cannot be described three different ways depending
 * on how you arrived at it.
 */

export const adhyayanCardProps = (item: any) => ({
  title: item?.name,
  startDate: item?.start_date,
  endDate: item?.end_date,
  isWaitlist: isShibirFull(item),
  waitlistCount: waitlistCountOf(item),
  note: seatsLeftLabel(item),
  meta: [
    { icon: 'person-outline', label: 'Swadhyay Karta', value: item?.speaker },
    ...(item?.location
      ? [{ icon: 'location-outline' as const, label: 'Location', value: item.location }]
      : []),
    { icon: 'card-outline', label: 'Charges', value: `₹${item?.amount}` },
  ] as CatalogueMeta[],
});

export const utsavCardProps = (item: any) => ({
  title: item?.utsav_name,
  startDate: item?.utsav_start,
  endDate: item?.utsav_end,
  isWaitlist: isUtsavFull(item),
  meta: [
    {
      icon: 'location-outline',
      label: 'Location',
      value: item?.utsav_location || 'Not available',
    },
    {
      icon: 'pricetags-outline',
      label: 'Packages',
      value: `${item?.packages?.length ?? 0} available`,
    },
  ] as CatalogueMeta[],
});
