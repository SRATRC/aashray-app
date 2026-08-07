import React, { useEffect, useRef, useState } from 'react';
import { Text, Pressable, ScrollView } from 'react-native';

import { colors } from '@/src/constants';

/**
 * The booking-type picker, shared by Book Now and Bookings.
 *
 * Both screens list the same six types and must look and behave the same.
 *
 * Scrolling the selected chip into view is only worth doing when it is actually
 * out of view. Doing it unconditionally, and pinning the chip to the left edge,
 * meant arriving on Raj Sharan hid Raj Adhyayan completely — so a member sent
 * here from the home screen could not tell there were types before it.
 */

interface BookingTypeTabsProps {
  types: string[];
  selected: string;
  onSelect: (t: string) => void;
  className?: string;
}

interface Rect {
  x: number;
  width: number;
}

const BookingTypeTabs: React.FC<BookingTypeTabsProps> = ({
  types,
  selected,
  onSelect,
  className = '',
}) => {
  const scroller = useRef<ScrollView>(null);
  const rects = useRef<Record<string, Rect>>({});
  const scrollX = useRef(0);
  const contentWidth = useRef(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const chip = rects.current[selected];
    if (!chip || viewportWidth === 0) return;

    // Leave a chip's worth of margin, so "already visible" also means "not
    // jammed against an edge".
    const EDGE = 24;
    const visibleStart = scrollX.current + EDGE;
    const visibleEnd = scrollX.current + viewportWidth - EDGE;

    if (chip.x >= visibleStart && chip.x + chip.width <= visibleEnd) return;

    // When it does need moving, centre it rather than pinning it left, so the
    // chips on both sides stay discoverable.
    const centred = chip.x + chip.width / 2 - viewportWidth / 2;
    const maxScroll = Math.max(0, contentWidth.current - viewportWidth);
    scroller.current?.scrollTo({
      x: Math.min(Math.max(centred, 0), maxScroll),
      animated: true,
    });
  }, [selected, viewportWidth]);

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      className={className}
      // A horizontal ScrollView fills its parent's height unless told not to.
      // Without this it stretches the chips down the whole screen wherever the
      // parent is a flex column.
      style={{ flexGrow: 0, flexShrink: 0 }}
      scrollEventThrottle={16}
      onScroll={(e) => {
        scrollX.current = e.nativeEvent.contentOffset.x;
      }}
      onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
      onContentSizeChange={(w) => {
        contentWidth.current = w;
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
        alignItems: 'center',
      }}>
      {types.map((t) => {
        const active = t === selected;
        return (
          <Pressable
            key={t}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              rects.current[t] = { x, width };
            }}
            onPress={() => onSelect(t)}
            // An unselected chip keeps its own surface. It used to be gray-100,
            // which vanished once the page behind it became gray-50.
            className={`min-h-[40px] justify-center rounded-full px-4 ${
              active ? 'bg-secondary' : 'border border-gray-200 bg-white'
            }`}>
            <Text
              className="font-pmedium text-sm"
              style={{ color: active ? colors.white : colors.gray_600 }}>
              {t}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

export default BookingTypeTabs;
