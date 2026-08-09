import React from 'react';
import { View } from 'react-native';

import { Shimmer, ShimmerCircle, ShimmerLine, ShimmerContainer } from '@/src/components/Shimmer';
import { surfaces } from '@/src/constants';

/**
 * The shape of a booking body while it loads.
 *
 * A centred spinner said "something is happening" and nothing else, then the
 * real content appeared and shoved the screen into a different layout. This
 * traces what actually arrives — a card per booking type, each with an icon, a
 * title, a date line, a verdict pill and its rows — so the page is the right
 * height before the data lands and nothing jumps when it does.
 *
 * It takes no props and holds no state, so the whole tree is built once at
 * module scope: re-rendering it can never produce anything different.
 */

/** Matches BookingSummary's rows exactly — same divider, same `py-3`. A taller
 * placeholder would reintroduce the jump this exists to prevent. */
const RowsSkeleton: React.FC<{ rows: number; labelWidth: string; valueWidth: string }> = ({
  rows,
  labelWidth,
  valueWidth,
}) => (
  <View className="border-t border-gray-200">
    {Array.from({ length: rows }).map((_, i) => (
      <View key={i}>
        {i > 0 ? <View className="ml-4 h-px bg-gray-200" /> : null}
        <View className="flex-row items-center justify-between gap-x-3 px-4 py-3">
          <ShimmerLine width={labelWidth} height={13} />
          <ShimmerLine width={valueWidth} height={13} />
        </View>
      </View>
    ))}
  </View>
);

const SummaryCardSkeleton: React.FC<{ rows: number }> = ({ rows }) => (
  <View className={`overflow-hidden ${surfaces.CARD_FLAT}`}>
    <View className="flex-row items-center gap-x-3 px-4 pb-3 pt-4">
      <ShimmerCircle size={48} />
      <View className="flex-1 gap-y-2">
        <ShimmerLine width="60%" height={15} />
        <ShimmerLine width="42%" height={11} />
      </View>
      {/* The verdict pill, which is the widest thing on the row after the title. */}
      <Shimmer width={84} height={22} borderRadius={999} />
    </View>
    <RowsSkeleton rows={rows} labelWidth="30%" valueWidth="38%" />
  </View>
);

const BookingBodySkeleton = (
  <ShimmerContainer className="gap-y-6 px-4 pt-2">
    <View className="gap-y-3">
      {/* Two cards, not one: a stay almost always arrives with at least one
          add-on, so one card would still leave the page growing underneath. */}
      <SummaryCardSkeleton rows={2} />
      <SummaryCardSkeleton rows={3} />
    </View>

    <View>
      <ShimmerLine width={72} height={11} className="mb-2 ml-1" />
      <View className={`overflow-hidden ${surfaces.CARD_FLAT}`}>
        <RowsSkeleton rows={2} labelWidth="34%" valueWidth="20%" />
      </View>
    </View>
  </ShimmerContainer>
);

export default BookingBodySkeleton;
