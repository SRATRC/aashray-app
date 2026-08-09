import moment from 'moment';
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import FormField from '../FormField';
import VerdictPill from './VerdictPill';
import type { OutcomeSegment, StayOutcome, Verdict } from './stayOutcome.types';

/**
 * Why a stay is not a plain yes — and nothing else.
 *
 * This lives inside the stay card on the review and add-on screens, so it says
 * only what that card does not: which policy fired, the numbers behind it, and
 * the reason field an admin needs. The card above already carries the dates, the
 * verdict pill and the room type, and the footer already says a waitlisted stay
 * costs nothing yet. It used to own a heading, a collapsible chevron and a
 * duplicate of all three, which made one stay read as three.
 *
 * It renders nothing at all when there is nothing to add.
 */

const shortDate = (d: string) => moment(d).format('D MMM');

// The nights that drop out run from the previous checkout up to the day before
// the next checkin. Labelling it prevEnd -> nextStart counted the re-entry day as
// a festival night.
const gapLabel = (prevEnd: string, nextStart: string) => {
  const lastGapNight = moment(nextStart).subtract(1, 'days');
  return lastGapNight.isSameOrBefore(prevEnd)
    ? moment(prevEnd).format('D MMM')
    : `${moment(prevEnd).format('D MMM')} – ${lastGapNight.format('D MMM')}`;
};

interface StayOutcomeBlockProps {
  outcome: StayOutcome;
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
  utsavName = 'Utsav',
  reason = '',
  onChangeReason,
  showReasonError = false,
  containerStyles = '',
  onChangeDates,
}) => {
  const allConfirmed = outcome.overall === 'confirmed';
  // A reason for extra nights is collected here, so it has to render even when
  // every night is available.
  const anyNeedsReason = outcome.segments.some((seg) =>
    seg.groups.some((g) => g.people.some((p) => p.requiresExtraStayReason))
  );
  // Any row that cannot be booked drives the whole block, because the member has
  // to change the dates before anything else on the screen matters.
  const hasUnavailable = outcome.segments.some((seg) =>
    seg.groups.some((g) => g.verdict === 'unavailable')
  );

  // Nothing to say. The card already carries an "Available" pill, so a block
  // repeating it is noise.
  if (allConfirmed && !outcome.isSplit && !anyNeedsReason) return null;

  // Only a split stay has segments that differ, and only then does naming each
  // one tell you anything the card above has not.
  const isSplit = outcome.segments.length > 1;
  // With one person, "who" is a second word for "you"; the card's pill already
  // said the verdict. With a party it is the point.
  const namesPeople = outcome.peopleCount > 1;

  const renderPeopleGroup = (
    verdict: Verdict,
    people: OutcomeSegment['groups'][number]['people'],
    isLast: boolean
  ) => {
    const first = people[0];
    const needsReason = people.some((p) => p.requiresExtraStayReason);

    return (
      <View
        key={`${verdict}-${first.cardno}`}
        className={isLast ? '' : 'mb-3 border-b border-dashed border-gray-200 pb-3'}>
        {namesPeople ? (
          <View className="mb-1.5 flex-row items-center gap-x-2">
            <VerdictPill
              verdict={verdict}
              count={people.length > 1 ? people.length : undefined}
              size="sm"
            />
            <Text className="flex-1 font-pmedium text-sm text-gray-800" numberOfLines={1}>
              {people.map((p) => p.name).join(', ')}
            </Text>
          </View>
        ) : null}

        {first.reasonMessage && (
          <Text className="font-pregular text-xs leading-5 text-gray-600">
            {first.reasonMessage}
          </Text>
        )}

        {first.windowNights != null && first.windowLimit != null && (
          <Text className="mt-1.5 font-pregular text-xs text-gray-500">
            <Text className="font-psemibold text-gray-700">{first.windowNights} nights</Text> in 30
            days · limit <Text className="font-psemibold text-gray-700">{first.windowLimit}</Text>
          </Text>
        )}

        {needsReason && onChangeReason && (
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

      {isSplit ? (
        <Text className="mb-3 font-psemibold text-base text-gray-900">
          {segment.isDayVisit
            ? moment(segment.start).format('D MMM')
            : `${shortDate(segment.start)} → ${shortDate(segment.end)}`}
        </Text>
      ) : null}

      {segment.groups.map((group, i) =>
        renderPeopleGroup(group.verdict, group.people, i === segment.groups.length - 1)
      )}
    </View>
  );

  return (
    <View className={containerStyles}>
      {outcome.segments.map(renderSegment)}

      {outcome.overall === 'mixed' && (
        <Text className="mt-3 font-pregular text-xs leading-5 text-gray-500">
          You pay only for the available nights now. Waitlisted nights cost nothing until an admin
          approves them. You will get a WhatsApp link to pay if that happens.
        </Text>
      )}

      {hasUnavailable && (
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
