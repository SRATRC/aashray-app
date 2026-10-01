import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React from 'react';
import { View, Text, Pressable } from 'react-native';

import VerdictPill from '@/src/components/stay/VerdictPill';
import { colors } from '@/src/constants';

/**
 * One bookable thing in a list — a shibir or an Utsav.
 *
 * The whole card is the tap target rather than a button buried at the bottom of
 * it, which is both easier one-handed and how a phone list behaves. A full
 * event carries the same Waitlist pill used everywhere else in the app, so
 * "you can still book, you may not get confirmed" reads identically here.
 */

export interface CatalogueMeta {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

interface CatalogueCardProps {
  title: string;
  startDate?: string;
  endDate?: string;
  meta?: CatalogueMeta[];
  /** True when the item is closed or full: bookable, but on the waitlist. */
  isWaitlist?: boolean;
  /** How many people are already queued. Rendered inside the pill. */
  waitlistCount?: number;
  /**
   * True where tapping picks the item instead of opening it. A chevron promises
   * a next screen, so a picker shows a checkbox instead.
   */
  selectable?: boolean;
  /** Marks the card as chosen. Only meaningful with `selectable`. */
  selected?: boolean;
  /**
   * Omit to render a recap of an already-made choice: no chevron, no press.
   * Step 2 of a booking leaves it out, so the thing you picked is shown the way
   * it was shown when you picked it rather than as a second, thinner summary
   * that drifts from the list.
   */
  onPress?: () => void;
  className?: string;
}

const dateLabel = (start?: string, end?: string) => {
  if (!start) return null;
  if (!end || moment(start).isSame(moment(end), 'day')) {
    return moment(start).format('D MMM YYYY');
  }
  return `${moment(start).format('D MMM')} – ${moment(end).format('D MMM YYYY')}`;
};

const CatalogueCard: React.FC<CatalogueCardProps> = ({
  title,
  startDate,
  endDate,
  meta = [],
  isWaitlist = false,
  waitlistCount,
  selectable = false,
  selected = false,
  onPress,
  className = '',
}) => {
  const dates = dateLabel(startDate, endDate);

  const body = (
    <>
      <View className="px-4 pb-3 pt-4">
        <View className="mb-2 flex-row items-center justify-between gap-x-2">
          {dates ? (
            <Text className="font-psemibold text-xs uppercase tracking-wide text-secondary-200">
              {dates}
            </Text>
          ) : (
            <View />
          )}
          <View className="flex-row items-center gap-x-2">
            {isWaitlist ? <VerdictPill verdict="waitlist" count={waitlistCount} size="sm" /> : null}
          </View>
        </View>

        <View className="flex-row items-center gap-x-3">
          <Text
            className="flex-1 font-psemibold text-base leading-6 text-gray-900"
            numberOfLines={2}>
            {title}
          </Text>
          {/* Nothing to promise on a recap: the choice is already made, so an
              affordance here would offer a tap that does nothing. */}
          {!onPress ? null : selectable ? (
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={selected ? colors.secondary_200 : colors.gray_300}
            />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.gray_400} />
          )}
        </View>
      </View>

      {meta.length > 0 ? (
        <View className="gap-y-2 border-t border-gray-200 px-4 py-3">
          {meta.map((m) => (
            <View key={m.label} className="flex-row items-center gap-x-2.5">
              <Ionicons name={m.icon} size={15} color={colors.gray_400} />
              <Text className="font-pregular text-xs text-gray-500">{m.label}</Text>
              <Text
                className="flex-1 text-right font-pmedium text-sm text-gray-800"
                numberOfLines={1}>
                {m.value}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );

  const shell = `mb-3 overflow-hidden rounded-2xl border bg-white shadow-sm shadow-gray-200 ${
    selected ? 'border-secondary' : 'border-gray-200'
  } ${className}`;

  if (!onPress) {
    return <View className={shell}>{body}</View>;
  }

  return (
    <Pressable onPress={onPress} android_ripple={{ color: colors.gray_200 }} className={shell}>
      {({ pressed }) => (
        <View style={pressed ? { backgroundColor: colors.gray_100 } : undefined}>{body}</View>
      )}
    </Pressable>
  );
};

export default React.memo(CatalogueCard);
