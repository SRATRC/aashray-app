import React, { useMemo } from 'react';
import { View, Text } from 'react-native';

import { BOOKING_TYPE_TITLE } from './BookingSummary';
import SectionHeader from './SectionHeader';
import { isWaitlistedRow, rowsOf } from './validationVerdict';

/**
 * What the booking costs, for any combination of booking types.
 *
 * /validate answers with one `*Details` key per booking type, each carrying a
 * `charge` and any `availableCredits`. The three review screens each hand-wrote
 * a block per type — five near-identical closures apiece, and adding a type
 * meant editing all three. This walks the descriptor instead.
 */

/** Every line the API can return, in the order a member should read them. */
const LINES: { key: string; type: string }[] = [
  { key: 'roomDetails', type: 'room' },
  { key: 'flatDetails', type: 'flat' },
  { key: 'foodDetails', type: 'food' },
  { key: 'travelDetails', type: 'travel' },
  { key: 'adhyayanDetails', type: 'adhyayan' },
  { key: 'utsavDetails', type: 'utsav' },
];

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const sum = (rows: any[], field: 'charge' | 'availableCredits') =>
  rows.reduce((total, r) => total + (Number(r?.[field]) || 0), 0);

/** Display names of the booking types that would be waitlisted. */
export function waitlistedTypesIn(validationData: any): string[] {
  return LINES.filter((line) => rowsOf(validationData?.[line.key]).some(isWaitlistedRow)).map(
    (line) => BOOKING_TYPE_TITLE[line.type] ?? line.type
  );
}

export interface ChargesCardProps {
  validationData: any;
  /** cardno -> display name, so a multi-person line can break down by person. */
  names?: Record<string, string>;
  /**
   * Drops the card chrome. Used inside the bottom sheet, which already supplies
   * the white surface — a bordered card on it would be a card inside a card.
   */
  className?: string;
}

export function totalCreditsIn(validationData: any) {
  return LINES.reduce(
    (total, line) => total + sum(rowsOf(validationData?.[line.key]), 'availableCredits'),
    0
  );
}

/** What the member owes now: the total minus whatever credit covers it. */
export function payableNow(validationData: any) {
  const total = Number(validationData?.totalCharge) || 0;
  return Math.max(0, total - totalCreditsIn(validationData));
}

/** cardno of the person a row is about, whichever field carries it. */
const cardnoOf = (row: any): string | undefined => {
  const value = row?.mumukshu ?? row?.guest ?? row?.cardno;
  return value == null ? undefined : String(value);
};

const ChargesCard: React.FC<ChargesCardProps> = ({
  validationData,
  names = {},
  className = '',
}) => {
  // Every booking type in the answer gets a line, including the ones that cost
  // nothing. Filtering on `charge > 0` hid a waitlisted add-on completely, so a
  // member who added it saw no trace of it and assumed it had been dropped.
  const lines = useMemo(
    () =>
      LINES.map((line) => {
        const rows = rowsOf(validationData?.[line.key]);
        return {
          ...line,
          label: BOOKING_TYPE_TITLE[line.type] ?? line.type,
          rows,
          charge: sum(rows, 'charge'),
          credits: sum(rows, 'availableCredits'),
          waitlisted: rows.some(isWaitlistedRow),
          // One row per person, so a group booking shows who is being charged
          // what instead of only a combined figure.
          people: rows
            .filter((r) => cardnoOf(r))
            .map((r) => ({
              cardno: cardnoOf(r)!,
              name: names[cardnoOf(r)!] ?? cardnoOf(r)!,
              charge: Number(r?.charge) || 0,
              credits: Number(r?.availableCredits) || 0,
              waitlisted: isWaitlistedRow(r),
            })),
        };
      }).filter((l) => l.rows.length > 0),
    [validationData, names]
  );

  const credits = totalCreditsIn(validationData);
  const total = Number(validationData?.totalCharge) || 0;
  const due = payableNow(validationData);

  if (lines.length === 0) return null;

  return (
    <View className={className}>
      <SectionHeader title="Charges" className="mb-2" />
      <View
        className={
          false
            ? ''
            : 'overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-200'
        }>
        {lines.map((line, i) => (
          <View key={line.key}>
            {i > 0 ? <View className={`ml-4 h-px bg-gray-200`} /> : null}
            <View
              className={`flex-row items-start justify-between ${false ? 'py-2' : 'px-4 py-3.5'}`}>
              <Text className="font-pregular text-base text-gray-700">{line.label}</Text>
              <View className="items-end">
                {/* A zero has to say why it is a zero. A waitlisted seat costs
                    nothing yet; a free booking costs nothing at all. */}
                {line.charge === 0 && line.waitlisted ? (
                  <>
                    <Text className="font-pmedium text-sm text-secondary-200">Waitlist</Text>
                    <Text className="mt-0.5 font-pregular text-xs text-gray-500">
                      Nothing to pay yet
                    </Text>
                  </>
                ) : line.charge === 0 ? (
                  <Text className="font-pregular text-sm text-gray-500">No charge</Text>
                ) : (
                  <>
                    <Text
                      className={`font-pmedium text-base ${
                        line.credits > 0 ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}>
                      {money(line.charge)}
                    </Text>
                    {line.credits > 0 ? (
                      <>
                        <Text className="font-pregular text-xs text-green-200">
                          −{money(line.credits)} credit
                        </Text>
                        <Text className="mt-0.5 font-pmedium text-base text-gray-900">
                          {money(Math.max(0, line.charge - line.credits))}
                        </Text>
                      </>
                    ) : null}
                  </>
                )}
              </View>
            </View>

            {/* Who is being charged what. Only when there is more than one
                person, because a single name repeats the line above it. */}
            {line.people.length > 1 ? (
              <View className={`gap-y-1.5 ${false ? 'pb-2' : 'px-4 pb-3.5'}`}>
                {line.people.map((p) => (
                  <View key={p.cardno} className="flex-row items-center justify-between gap-x-3">
                    <Text className="flex-1 font-pregular text-xs text-gray-500" numberOfLines={1}>
                      {p.name}
                    </Text>
                    {p.waitlisted ? (
                      <Text className="font-pregular text-xs text-secondary-200">Waitlist</Text>
                    ) : (
                      <Text className="font-pmedium text-xs text-gray-700">
                        {money(Math.max(0, p.charge - p.credits))}
                        {p.credits > 0 ? ` (−${money(p.credits)} credit)` : ''}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        <View
          className={
            false
              ? 'mt-1 border-t border-gray-200 pt-3'
              : 'border-t border-gray-200 bg-gray-50 px-4 py-3.5'
          }>
          {credits > 0 ? (
            <>
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="font-pregular text-sm text-gray-500">Subtotal</Text>
                <Text className="font-pregular text-sm text-gray-500">{money(total)}</Text>
              </View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-pregular text-sm text-green-200">Credits applied</Text>
                <Text className="font-pregular text-sm text-green-200">−{money(credits)}</Text>
              </View>
            </>
          ) : null}
          <View className="flex-row items-center justify-between">
            <Text className="font-psemibold text-lg text-gray-800">Total</Text>
            <Text className="font-psemibold text-lg text-secondary-200">{money(due)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChargesCard;
