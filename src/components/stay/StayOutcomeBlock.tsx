import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';

import FormField from '../FormField';
import VerdictPill from './VerdictPill';
import type { OutcomeSegment, StayOutcome, Verdict } from './stayOutcome.types';

import { colors } from '@/src/constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ROOM_LABEL: Record<string, string> = { ac: 'AC', nac: 'Non-AC', NA: 'No room' };
const FLOOR_LABEL: Record<string, string> = { SC: 'Ground floor' };

const shortDate = (d: string) => moment(d).format('D MMM');
const longRange = (start: string, end: string) =>
  start === end
    ? moment(start).format('D MMM YYYY')
    : `${moment(start).format('D MMM')} – ${moment(end).format('D MMM YYYY')}`;

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const roomLine = (roomType?: string, floorType?: string) => {
  const parts: string[] = [];
  if (roomType) parts.push(ROOM_LABEL[roomType] || roomType.toUpperCase());
  if (floorType) parts.push(FLOOR_LABEL[floorType] || 'Any floor');
  return parts.join(' · ');
};

// The nights that drop out run from the previous checkout up to the day before
// the next checkin. Labelling it prevEnd -> nextStart counted the re-entry day as
// a festival night.
const gapLabel = (prevEnd: string, nextStart: string) => {
  const lastGapNight = moment(nextStart).subtract(1, 'days');
  return lastGapNight.isSameOrBefore(prevEnd)
    ? moment(prevEnd).format('D MMM')
    : `${moment(prevEnd).format('D MMM')} – ${lastGapNight.format('D MMM')}`;
};

const nightLabel = (segment: OutcomeSegment) =>
  segment.isDayVisit ? 'Day visit' : `${segment.nights} night${segment.nights === 1 ? '' : 's'}`;

interface StayOutcomeBlockProps {
  outcome: StayOutcome;
  variant?: 'full' | 'recap';
  utsavName?: string;
  reason?: string;
  onChangeReason?: (text: string) => void;
  showReasonError?: boolean;
  containerStyles?: string;
  // Shown as a way out when the dates cannot be booked at all.
  onChangeDates?: () => void;
}

const StayOutcomeBlock: React.FC<StayOutcomeBlockProps> = ({
  outcome,
  variant = 'full',
  utsavName = 'Utsav',
  reason = '',
  onChangeReason,
  showReasonError = false,
  containerStyles = '',
  onChangeDates,
}) => {
  const [expanded, setExpanded] = useState(variant === 'full');

  // `variant` seeds the initial value, so it must also drive it on change —
  // otherwise a switched variant keeps the previous expansion.
  useEffect(() => {
    setExpanded(variant === 'full');
  }, [variant]);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const allConfirmed = outcome.overall === 'confirmed';
  // A reason for extra nights is collected in this block, so it has to render
  // even when every night is available.
  const anyNeedsReason = outcome.segments.some((seg) =>
    seg.groups.some((g) => g.people.some((p) => p.requiresExtraStayReason))
  );
  // Any row that cannot be booked drives the whole block, because the member has
  // to change the dates before anything else on the screen matters.
  const hasUnavailable = outcome.segments.some((seg) =>
    seg.groups.some((g) => g.verdict === 'unavailable')
  );
  const headRange = longRange(
    outcome.segments[0].start,
    outcome.segments[outcome.segments.length - 1].end
  );

  // Nothing to say. Each booking card already carries an "Available" pill, so a
  // banner repeating it is noise.
  if (allConfirmed && !outcome.isSplit && !anyNeedsReason) return null;

  const counts = outcome.segments
    .flatMap((s) => s.groups.flatMap((g) => g.people.map(() => g.verdict)))
    .reduce<Record<string, number>>((acc, v) => ({ ...acc, [v]: (acc[v] || 0) + 1 }), {});

  const renderPeopleGroup = (
    verdict: Verdict,
    people: OutcomeSegment['groups'][number]['people'],
    isLast: boolean
  ) => {
    const first = people[0];
    const charge = people.reduce((sum, p) => sum + p.charge, 0);
    const needsReason = people.some((p) => p.requiresExtraStayReason);

    return (
      <View
        key={`${verdict}-${first.cardno}`}
        className={isLast ? '' : 'mb-3 border-b border-dashed border-gray-200 pb-3'}>
        <View className="flex-row items-start justify-between gap-x-3">
          <View className="flex-1 gap-y-1.5">
            {/* A group of one is the trivial case; the pill only earns a number
                when it stands for several people. */}
            <VerdictPill verdict={verdict} count={people.length > 1 ? people.length : undefined} />
            <Text className="font-pmedium text-sm text-gray-800">
              {people.map((p) => p.name).join(', ')}
            </Text>
            {roomLine(first.roomType, first.floorType) ? (
              <Text className="font-pregular text-xs text-gray-500">
                {roomLine(first.roomType, first.floorType)}
                {/* Room numbers only when the whole row shares one room. With
                    several people the assignment differs per person, so naming
                    one room here would be wrong for the others. */}
                {people.length === 1 && first.roomno ? ` · Room ${first.roomno}` : ''}
              </Text>
            ) : null}
          </View>

          <View className="items-end">
            {verdict === 'confirmed' && charge > 0 && (
              <Text className="font-pmedium text-base text-gray-900">{money(charge)}</Text>
            )}
            {verdict === 'confirmed' && charge === 0 && (
              <Text className="font-pregular text-xs text-gray-500">No charge</Text>
            )}
            {verdict === 'waitlist' && (
              <Text className="font-pregular text-xs text-gray-500">Nothing to pay yet</Text>
            )}
          </View>
        </View>

        {first.reasonMessage && (
          <Text className="mt-2 font-pregular text-xs leading-5 text-gray-600">
            {first.reasonMessage}
          </Text>
        )}

        {first.windowNights != null && first.windowLimit != null && (
          <Text className="mt-1.5 font-pregular text-xs text-gray-500">
            <Text className="font-psemibold text-gray-700">{first.windowNights} nights</Text> in 30
            days · limit <Text className="font-psemibold text-gray-700">{first.windowLimit}</Text>
          </Text>
        )}

        {needsReason && onChangeReason && (variant === 'full' || !reason.trim()) && (
          <View className="mt-3">
            <FormField
              text="Why do you need the extra nights? *"
              value={reason}
              handleChangeText={onChangeReason}
              placeholder="e.g. Attending shibir with family"
              multiline
              numberOfLines={2}
              error={showReasonError}
              errorMessage="Add a reason so an admin can review this stay."
            />
          </View>
        )}

        {needsReason && variant === 'recap' && reason.trim() && (
          <View className="mt-2 rounded-xl bg-gray-50 p-3">
            <Text className="font-pregular text-xs text-gray-500">Your reason</Text>
            <Text className="mt-0.5 font-pregular text-sm text-gray-800">{reason}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSegment = (segment: OutcomeSegment, index: number) => (
    <View key={`${segment.start}-${segment.end}`}>
      {index > 0 && (
        <View className="flex-row items-stretch gap-x-3 py-2.5 pl-5">
          <View className="w-px bg-gray-300" />
          <View className="flex-1 py-1">
            <Text className="font-pmedium text-xs text-gray-700">
              {utsavName} · {gapLabel(outcome.segments[index - 1].end, segment.start)}
            </Text>
            <Text className="mt-0.5 font-pregular text-xs text-gray-500">
              Not part of this stay
            </Text>
          </View>
        </View>
      )}

      <View className="rounded-2xl border border-gray-200 bg-white p-4">
        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="font-psemibold text-base text-gray-900">
            {segment.isDayVisit
              ? moment(segment.start).format('D MMM')
              : `${shortDate(segment.start)} → ${shortDate(segment.end)}`}
          </Text>
          <Text className="font-pregular text-xs text-gray-500">{nightLabel(segment)}</Text>
        </View>

        {segment.groups.map((group, i) =>
          renderPeopleGroup(group.verdict, group.people, i === segment.groups.length - 1)
        )}
      </View>
    </View>
  );

  return (
    <View className={containerStyles}>
      <TouchableOpacity
        activeOpacity={variant === 'recap' ? 0.7 : 1}
        onPress={variant === 'recap' ? toggle : undefined}
        className="mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-psemibold text-lg text-gray-900">
              {hasUnavailable
                ? outcome.overall === 'unavailable'
                  ? 'These dates cannot be booked'
                  : 'Some of this cannot be booked'
                : 'Your stay'}
            </Text>
            <Text className="mt-0.5 font-pregular text-xs text-gray-500">
              {headRange}
              {outcome.peopleCount > 1 ? ` · ${outcome.peopleCount} people` : ''}
              {outcome.isSplit ? ` · ${outcome.segments.length} bookings` : ''}
            </Text>
          </View>

          {variant === 'recap' && (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.gray_400}
            />
          )}
        </View>

        {/* Pills get their own row. Inline, they squeezed the date line onto two. */}
        {variant === 'recap' && (
          <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
            {(['unavailable', 'waitlist', 'confirmed'] as Verdict[])
              .filter((v) => counts[v])
              .map((v) => (
                <VerdictPill
                  key={v}
                  verdict={v}
                  count={counts[v] > 1 ? counts[v] : undefined}
                  size="sm"
                />
              ))}
          </View>
        )}
      </TouchableOpacity>

      {expanded && <View className="gap-y-0">{outcome.segments.map(renderSegment)}</View>}

      {expanded && outcome.overall === 'mixed' && (
        <Text className="mt-3 font-pregular text-xs leading-5 text-gray-500">
          You pay only for the available nights now. Waitlisted nights cost nothing until an admin
          approves them. You will get a WhatsApp link to pay if that happens.
        </Text>
      )}

      {expanded && outcome.overall === 'waitlist' && (
        <Text className="mt-3 font-pregular text-xs leading-5 text-gray-500">
          Nothing is charged for a waitlisted stay. You will get a WhatsApp link to pay if an admin
          confirms it.
        </Text>
      )}

      {expanded && hasUnavailable && (
        <View className="mt-3">
          <Text className="font-pregular text-xs leading-5 text-gray-500">
            A date that cannot be booked never goes on the waitlist, because nothing would ever
            promote it. Pick different dates.
          </Text>
          {onChangeDates && (
            <TouchableOpacity onPress={onChangeDates} className="mt-2.5 self-start">
              <Text className="font-pmedium text-sm text-secondary-200">Change dates</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default StayOutcomeBlock;
