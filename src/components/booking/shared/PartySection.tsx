import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { AUDIENCE_LABEL, type Audience } from './useBookingParty';

import GuestForm from '@/src/components/GuestForm';
import OtherMumukshuForm from '@/src/components/OtherMumukshuForm';
import { colors } from '@/src/constants';

/**
 * "Who is this for" — identical in every booking type.
 *
 * The audience switch is a segmented control rather than the old chip row,
 * because it is a choice between mutually exclusive modes, and a segmented
 * control is what a phone uses for that. Each segment is a full-height touch
 * target, so it stays usable one-handed.
 */

interface PartySectionProps {
  audiences: Audience[];
  audience: Audience;
  onAudienceChange: (a: Audience) => void;
  guestFormProps: any;
  mumukshuFormProps: any;
  /** Per-row extra inputs, e.g. room type for each guest. */
  renderGuestExtras?: (index: number) => React.ReactNode;
  renderMumukshuExtras?: (index: number) => React.ReactNode;
  /** Shown under the switch when the audience is Myself and nothing else is asked. */
  selfNote?: string;
  className?: string;
}

const PartySection: React.FC<PartySectionProps> = ({
  audiences,
  audience,
  onAudienceChange,
  guestFormProps,
  mumukshuFormProps,
  renderGuestExtras,
  renderMumukshuExtras,
  selfNote,
  className = '',
}) => {
  // A guest card can only book for itself, so there is no choice to present.
  const showSwitch = audiences.length > 1;

  return (
    <View className={className}>
      {showSwitch ? (
        // No label above the control. The segments read "Myself", "Guests" and
        // "Mumukshus", which says who it is for without a heading to say so.
        <View className="mb-4">
          <View className="flex-row rounded-full bg-gray-200 p-1">
            {audiences.map((a) => {
              const active = a === audience;
              return (
                <Pressable
                  key={a}
                  onPress={() => {
                    if (!active) onAudienceChange(a);
                  }}
                  className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${
                    active ? 'bg-white' : ''
                  }`}
                  style={
                    active
                      ? {
                          shadowColor: '#000',
                          shadowOpacity: 0.08,
                          shadowRadius: 3,
                          shadowOffset: { width: 0, height: 1 },
                          elevation: 2,
                        }
                      : undefined
                  }>
                  <Text
                    className="font-pmedium text-sm"
                    style={{ color: active ? colors.gray_900 : colors.gray_500 }}>
                    {AUDIENCE_LABEL[a]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {audience === 'self' && selfNote ? (
        <Text className="px-1 font-pregular text-xs leading-5 text-gray-500">{selfNote}</Text>
      ) : null}

      {audience === 'guest' ? (
        <GuestForm {...guestFormProps}>
          {renderGuestExtras ? (index: number) => renderGuestExtras(index) : undefined}
        </GuestForm>
      ) : null}

      {audience === 'mumukshu' ? (
        <OtherMumukshuForm {...mumukshuFormProps}>
          {renderMumukshuExtras ? (index: number) => renderMumukshuExtras(index) : undefined}
        </OtherMumukshuForm>
      ) : null}
    </View>
  );
};

export default PartySection;
