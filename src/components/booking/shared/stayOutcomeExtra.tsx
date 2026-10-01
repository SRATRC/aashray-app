import React from 'react';

import StayOutcomeBlock, { outcomeHasDetail } from '@/src/components/stay/StayOutcomeBlock';
import type { StayOutcome } from '@/src/components/stay/stayOutcome.types';

/**
 * Puts the stay outcome inside the stay card, for `BookingSummary`'s `extras`.
 *
 * Four screens need this — the review screen and the three add-on screens by
 * audience — and each used to spell it out by hand: the same key rule, the same
 * divider and padding, the same reason handlers. `extras` is keyed by booking
 * type and typed loosely, so a wrong key renders nothing and says nothing about
 * it. Deciding the key in one place is what stops that being a silent bug.
 */

interface StayOutcomeExtraArgs {
  /** The booking store slice, read only to tell a flat stay from a room stay. */
  data: any;
  outcome?: StayOutcome | null;
  reason?: string;
  onChangeReason?: (text: string) => void;
  showReasonError?: boolean;
}

export interface StayOutcomeExtraResult {
  extras: Record<string, React.ReactNode>;
  /** Pass straight through to `BookingSummary`'s `hideVerdictFor`. This block
   * is about to say the same verdict in more detail, so the card's own pill
   * stepping aside is part of the same decision, not a second one. */
  hideVerdictFor: string[];
}

export default function stayOutcomeExtra({
  data,
  outcome,
  reason,
  onChangeReason,
  showReasonError,
}: StayOutcomeExtraArgs): StayOutcomeExtraResult | undefined {
  if (!outcome) return undefined;

  const key = data?.flat ? 'flat' : 'room';

  return {
    extras: {
      [key]: (
        <StayOutcomeBlock
          outcome={outcome}
          containerStyles="border-t border-gray-200 px-4 py-3"
          reason={reason}
          onChangeReason={onChangeReason}
          showReasonError={showReasonError}
        />
      ),
    },
    hideVerdictFor: outcomeHasDetail(outcome) ? [key] : [],
  };
}
