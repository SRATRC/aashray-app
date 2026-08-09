import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import BookingBodySkeleton from './BookingBodySkeleton';

import CustomButton from '@/src/components/CustomButton';
import useDelayedFlag from '@/src/hooks/useDelayedFlag';
import { colors } from '@/src/constants';
import { useBottomTabOverflow } from '@/src/components/TabBarBackground';

/**
 * The frame every booking screen sits in, for every booking type and every
 * audience. Only the body changes.
 *
 * Three things it guarantees, which the old screens each solved differently:
 *
 * 1. The primary action is pinned in the thumb zone, above the home indicator,
 *    and never scrolls away. Previously a member scrolled a long form to reach
 *    "Book Now" at the bottom of the content.
 * 2. A reason the action is unavailable is stated next to it, so a disabled
 *    button is never silent.
 * 3. The keyboard never covers the action or the field being typed into.
 */

export interface BookingShellProps {
  title: string;
  /** e.g. "Step 2 of 4" or "Raj Sharan". Sits under the title. */
  caption?: string;
  /** Omit for single-screen bookings; the bar only appears for real sequences. */
  progress?: { current: number; total: number };
  onBack?: () => void;
  children: React.ReactNode;

  /** Primary action. Omit to render no footer at all. */
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  /** Secondary action shown beside the primary, e.g. "Pay Later". */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /**
   * Why the primary action cannot be used, or what happens if it is. Rendered
   * directly above the button so a blocked action always explains itself.
   */
  footerNote?: string;
  /**
   * Content pinned in the bottom sheet directly above the actions, e.g. the
   * charges. Supplying it also pins the sheet instead of letting it scroll.
   */
  /** Replaces the whole body with a spinner (validation in flight). */
  isBusy?: boolean;
  /**
   * Set false when the body is itself a list. A list nested in a ScrollView
   * never fires onEndReached and cannot pull to refresh, so it has to own the
   * scrolling.
   */
  scrollBody?: boolean;
  /**
   * True when the shell is hosted inside a tab rather than pushed as its own
   * screen. It then skips the top safe-area inset and the back chevron, because
   * the tab already provides both.
   */
  embedded?: boolean;
  /** Force the action to stay pinned at the bottom. Defaults to pinning when the
   * body does not scroll, or when the footer carries extra content. */
  pinFooter?: boolean;
}

interface FooterProps {
  primaryLabel: string;
  onPrimary?: () => void;
  primaryDisabled: boolean;
  primaryLoading: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  footerNote?: string;
  /**
   * Puts Back beside the primary action instead of in a row of its own. Both
   * controls then sit in the thumb zone, and a whole row is not spent on one
   * chevron.
   */
  onFooterBack?: () => void;
}

const FooterBody: React.FC<FooterProps & { pinned?: boolean }> = ({
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
  secondaryLabel,
  onSecondary,
  footerNote,
  onFooterBack,
  pinned = false,
}) => (
  <View className={pinned ? 'bg-white px-4 pb-3 pt-4' : 'px-4 pb-2 pt-6'}>
    {footerNote ? (
      <Text className="mb-2.5 font-pregular text-xs leading-5 text-gray-600">{footerNote}</Text>
    ) : null}

    <View className="flex-row gap-x-3">
      {onFooterBack ? (
        <Pressable
          onPress={onFooterBack}
          accessibilityLabel="Go back"
          className="h-[52px] w-[52px] items-center justify-center rounded-xl border border-gray-200 bg-white">
          <FontAwesome5 name="chevron-left" size={18} color={colors.black} />
        </Pressable>
      ) : null}

      <CustomButton
        text={primaryLabel}
        handlePress={onPrimary}
        containerStyles="flex-1 min-h-[52px]"
        isDisabled={primaryDisabled}
        isLoading={primaryLoading}
        variant="solid"
      />

      {secondaryLabel ? (
        <CustomButton
          text={secondaryLabel}
          handlePress={onSecondary}
          containerStyles="flex-1 min-h-[52px]"
          isDisabled={primaryDisabled}
          isLoading={primaryLoading}
          variant="outline"
        />
      ) : null}
    </View>
  </View>
);

/**
 * Inside a tab: clear the tab bar AND the raised QR button, which is a 56pt ring
 * shifted 20pt upward and so overhangs the bar. Without the extra clearance it
 * sits on top of a full-width action.
 */
const QR_OVERHANG = 30;

/**
 * Trailing space inside the scroll content, so the action does not come to rest
 * under the tab bar or the home indicator.
 *
 * Two components rather than one, because `useBottomTabBarHeight` reads a
 * navigator context a pushed screen does not have, and a hook cannot be called
 * conditionally.
 */
const EmbeddedTailSpace: React.FC = () => {
  const tabBarHeight = useBottomTabOverflow();
  return <View style={{ height: Math.max(tabBarHeight, 12) + QR_OVERHANG }} />;
};

const PushedTailSpace: React.FC = () => {
  const insets = useSafeAreaInsets();
  return <View style={{ height: Math.max(insets.bottom, 12) + 12 }} />;
};

/**
 * The pinned bottom sheet: a raised white surface with rounded top corners that
 * holds the actions and, on the review screen, the charges above them. What a
 * member is about to pay and the button that pays it belong in one place.
 */
const SHEET = 'rounded-t-3xl border-t border-gray-200 bg-white';
const SHEET_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: -3 },
  elevation: 12,
};

const EmbeddedPinnedFooter: React.FC<FooterProps> = (props) => {
  const tabBarHeight = useBottomTabOverflow();
  return (
    <View
      className={SHEET}
      style={{ ...SHEET_SHADOW, paddingBottom: Math.max(tabBarHeight, 12) + QR_OVERHANG }}>
      <FooterBody {...props} pinned />
    </View>
  );
};

const PushedPinnedFooter: React.FC<FooterProps> = (props) => {
  const insets = useSafeAreaInsets();
  return (
    <View className={SHEET} style={{ ...SHEET_SHADOW, paddingBottom: Math.max(insets.bottom, 12) }}>
      <FooterBody {...props} pinned />
    </View>
  );
};

const BookingShell: React.FC<BookingShellProps> = ({
  title,
  caption,
  progress,
  onBack,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
  footerNote,
  isBusy = false,
  scrollBody = true,
  embedded = false,
  pinFooter,
}) => {
  const router = useRouter();

  const footerProps: FooterProps = {
    primaryLabel: primaryLabel ?? '',
    onPrimary,
    primaryDisabled,
    primaryLoading,
    secondaryLabel,
    onSecondary,
    footerNote,
    // Embedded, Back rides with the primary action. A pushed screen keeps its
    // chevron in the header, beside the title it belongs to.
    onFooterBack: embedded ? onBack : undefined,
  };

  // Charges pinned beside the button they pay for cannot scroll out of sight.
  // Pinning used to be inferred from whether the footer carried extra content,
  // which was never the real intent — moving the review screen's charges into
  // the body silently unpinned its Pay button. Callers say so directly now.
  // The skeleton waits; the footer does not. Gating both on the delayed flag
  // would render the footer, then take it away when the skeleton arrived, then
  // bring it back — motion in place of a flicker. The footer stays hidden for
  // the whole load either way.
  const showSkeleton = useDelayedFlag(isBusy);

  const shouldPinFooter = pinFooter ?? !scrollBody;

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={embedded ? ['left', 'right'] : ['top', 'left', 'right']}>
      {/* Embedded, the type picker directly above already names the booking, and
          Back sits with the primary action, so there is no header row at all. */}
      {embedded ? null : (
        <View className="flex-row items-center gap-x-1 px-2 pb-3 pt-2">
          <Pressable
            onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
            hitSlop={12}
            // 44pt minimum touch target.
            className="h-11 w-11 items-center justify-center">
            <FontAwesome5 name="chevron-left" size={20} color={colors.black} />
          </Pressable>
          <View className="flex-1 pr-2">
            <Text className="font-psemibold text-2xl" numberOfLines={1}>
              {title}
            </Text>
            {caption ? (
              <Text className="mt-0.5 font-pregular text-xs text-gray-400">{caption}</Text>
            ) : null}
          </View>
        </View>
      )}

      {progress && progress.total > 1 ? (
        <View className="mb-1 flex-row gap-x-1 px-4">
          {Array.from({ length: progress.total }).map((_, i) => (
            <View
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < progress.current ? 'bg-secondary' : 'bg-gray-200'
              }`}
            />
          ))}
        </View>
      ) : null}

      {isBusy ? (
        // Nothing during the delay window. Rendering the real body there built
        // a scroll view and its cards with no data, only to tear them down when
        // the skeleton arrived and build them a third time when it landed.
        showSkeleton ? (
          BookingBodySkeleton
        ) : null
      ) : scrollBody ? (
        // The action is the last thing in the content, so it reads as the end of
        // the form rather than a bar floating over it.
        <KeyboardAwareScrollView
          style={{ flex: 1 }}
          bottomOffset={24}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // flexGrow lets the spacer below push the action down when the content
          // is shorter than the screen, so it does not sit stranded in the
          // middle. With long content the spacer collapses to nothing.
          contentContainerStyle={{ paddingTop: 8, flexGrow: 1 }}>
          {children}
          {primaryLabel && !shouldPinFooter ? <View className="flex-1" /> : null}
          {primaryLabel && !shouldPinFooter ? <FooterBody {...footerProps} /> : null}
          {embedded ? <EmbeddedTailSpace /> : <PushedTailSpace />}
        </KeyboardAwareScrollView>
      ) : (
        <View className="flex-1 pt-2">{children}</View>
      )}

      {/* A list body owns its own scrolling, and a sheet carrying charges must
          stay in view, so both keep the action pinned. */}
      {shouldPinFooter && !isBusy && primaryLabel ? (
        embedded ? (
          <EmbeddedPinnedFooter {...footerProps} />
        ) : (
          <PushedPinnedFooter {...footerProps} />
        )
      ) : null}
    </SafeAreaView>
  );
};

export default BookingShell;
