import React from 'react';
import { View } from 'react-native';
import Shimmer from '@/src/components/Shimmer';

export const SteppedFeedbackShimmer: React.FC = () => (
  <View className="flex-1 bg-white">
    <Shimmer.Line width="20%" height={2} />

    <Shimmer.Container className="flex-1 px-7">
      <View className="flex-1 justify-center">
        <Shimmer.Line width={48} height={13} className="mb-4" />
        <Shimmer.Line width="85%" height={28} className="mb-2" />
        <Shimmer.Line width="55%" height={28} />
      </View>

      <View className="pb-10">
        <View className="mb-3 flex-row gap-x-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <View key={n} className="flex-1">
              <Shimmer.Box height={58} borderRadius={16} />
            </View>
          ))}
        </View>
        <View className="mb-5 flex-row justify-between">
          <Shimmer.Line width={32} height={11} />
          <Shimmer.Line width={52} height={11} />
        </View>
        <Shimmer.Box height={56} borderRadius={28} />
      </View>
    </Shimmer.Container>
  </View>
);
