import moment from 'moment';
import React from 'react';
import { View, Text } from 'react-native';

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
}

/**
 * Whether this block would render anything at all — a plain, unsplit, fully
 * confirmed stay has nothing to add to the card's own verdict pill above it.
 * Exported so a caller can decide, before this ever renders, whether that
 * pill is still the only place the verdict is said (and so must stay) or
 * whether this block is about to say it again in more detail (and so the
 * pill above should step aside instead of repeating it).
 */
export const outcomeHasDetail = (outcome: StayOutcome | null | undefined): boolean => {
  if (!outcome) return false;
  const allConfirmed = outcome.overall === 'confirmed';
  const anyNeedsReason = outcome.segments.some((seg) =>
    seg.groups.some((g) => g.people.some((p) => p.requiresExtraStayReason))
  );
  return !(allConfirmed && !outcome.isSplit && !anyNeedsReason);
};

const StayOutcomeBlock: React.FC<StayOutcomeBlockProps> = ({
  outcome,
  utsavName = 'Utsav',
  reason = '',
  onChangeReason,
  showReasonError = false,
  containerStyles = '',
}) => {
  // Nothing to say. The card already carries an "Available" pill, so a block
  // repeating it is noise.
  if (!outcomeHasDetail(outcome)) return null;

  // A reason for extra nights is collected here, so it has to render even when
  // every night is available.
  const anyNeedsReason = outcome.segments.some((seg) =>
    seg.groups.some((g) => g.people.some((p) => p.requiresExtraStayReason))
  );
  // Only a split stay has segments that differ, and only then does naming each
  // one tell you anything the card above has not.
  const isSplit = outcome.segments.length > 1;
  // With one person, "who" is a second word for "you"; the card's pill already
  // said the verdict. With a party it is the point.
  const namesPeople = outcome.peopleCount > 1;

  // The "why" sentence moves out of the segment list and into one shared note
  // below it. Inline, it showed up under some segments and not others (a
  // confirmed segment has nothing to explain), which read as an inconsistency
  // rather than a difference in outcome — and a hold reason repeated across two
  // segments (two single-night boundary stays, say) said the same thing twice.
  const reasonMessages: string[] = [];
  const seenReasons = new Set<string>();
  for (const segment of outcome.segments) {
    for (const group of segment.groups) {
      const message = group.people[0]?.reasonMessage;
      if (message && !seenReasons.has(message)) {
        seenReasons.add(message);
        reasonMessages.push(message);
      }
    }
  }

  const renderPeopleGroup = (
    verdict: Verdict,
    people: OutcomeSegment['groups'][number]['people'],
    showBadge: boolean,
    isLast: boolean
  ) => {
    const first = people[0];

    return (
      <View
        key={`${verdict}-${first.cardno}`}
        className={isLast ? '' : 'mb-2 border-b border-dashed border-gray-200 pb-2'}>
        <View className="flex-row items-center gap-x-2">
          {showBadge && (
            <VerdictPill
              verdict={verdict}
              count={people.length > 1 ? people.length : undefined}
              size="sm"
            />
          )}
          {namesPeople && (
            <Text className="flex-1 font-pmedium text-sm text-gray-800" numberOfLines={1}>
              {people.map((p) => p.name).join(', ')}
            </Text>
          )}
        </View>

        {first.windowNights != null && first.windowLimit != null && (
          <Text className="mt-1.5 font-pregular text-xs text-gray-500">
            <Text className="font-psemibold text-gray-700">{first.windowNights} nights</Text> in 30
            days · limit <Text className="font-psemibold text-gray-700">{first.windowLimit}</Text>
          </Text>
        )}
      </View>
    );
  };

  const renderSegment = (segment: OutcomeSegment, index: number) => {
    // A segment usually carries one verdict. Only a mixed party (some
    // confirmed, some waitlisted, same dates) has more than one — then the
    // header names every verdict present instead of just the first.
    const verdicts = Array.from(new Set(segment.groups.map((g) => g.verdict)));

    return (
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
          <View className="mb-2 flex-row items-center justify-between gap-x-2">
            <Text className="font-psemibold text-base text-gray-900">
              {segment.isDayVisit
                ? moment(segment.start).format('D MMM')
                : `${shortDate(segment.start)} → ${shortDate(segment.end)} · ${segment.nights} night${segment.nights === 1 ? '' : 's'}`}
            </Text>
            <View className="flex-row items-center gap-x-1.5">
              {verdicts.map((v) => (
                <VerdictPill key={v} verdict={v} size="sm" />
              ))}
            </View>
          </View>
        ) : null}

        {segment.groups.map((group, i) =>
          renderPeopleGroup(
            group.verdict,
            group.people,
            // The header just showed every verdict in this segment, so a
            // second badge per group below it would repeat it — unless the
            // segment isn't split (no header to carry it) or it holds more
            // than one verdict (the header's pills alone don't say which
            // names go with which one).
            !isSplit || segment.groups.length > 1,
            i === segment.groups.length - 1
          )
        )}
      </View>
    );
  };

  return (
    <View className={containerStyles}>
      {outcome.segments.map(renderSegment)}

      {reasonMessages.length > 0 && (
        <View className="mt-3 gap-y-1.5">
          {reasonMessages.map((message) => (
            <Text key={message} className="font-pregular text-xs leading-5 text-gray-600">
              {message}
            </Text>
          ))}
        </View>
      )}

      {anyNeedsReason && onChangeReason && (
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

export default StayOutcomeBlock;
