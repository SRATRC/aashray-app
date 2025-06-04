import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BeautifulFilterCardProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap; // Type for Ionicons name
  isActive: boolean;
  displayText: string;
  onPress: () => void;
}

const BeautifulFilterCard: React.FC<BeautifulFilterCardProps> = ({
  title,
  icon,
  isActive,
  displayText,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7} // Provides visual feedback on press
      style={[
        styles.cardContainer,
        isActive ? styles.cardContainerActive : styles.cardContainerInactive,
      ]}>
      {/* Icon Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrapper,
            isActive ? styles.iconWrapperActive : styles.iconWrapperInactive,
          ]}>
          {/* Icon color adjusted for better contrast in inactive state */}
          <Ionicons name={icon} size={18} color={isActive ? '#FFFFFF' : '#334155'} />
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, isActive ? styles.titleActive : styles.titleInactive]}
            numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[
              styles.displayText,
              isActive ? styles.displayTextActive : styles.displayTextInactive,
            ]}
            numberOfLines={1}>
            {displayText}
          </Text>
        </View>
        <Ionicons
          name="chevron-down-circle-outline" // Changed to outline for softer look
          size={22} // Slightly smaller
          color={isActive ? '#F1AC09' : '#9CA3AF'}
        />
      </View>

      {/* Selection Indicator */}
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    // Base shadow for both states (softer, more consistent)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3, // Base elevation for Android
  },
  cardContainerActive: {
    backgroundColor: '#FFFBEB', // Lighter active background yellow
    borderWidth: 1.5,
    borderColor: '#F1AC09',
    shadowOffset: { width: 0, height: 4 }, // More prominent shadow when active
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6, // Higher elevation when active
  },
  cardContainerInactive: {
    backgroundColor: '#F8FAFC', // Same as before
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  iconWrapper: {
    width: 36, // Slightly larger icon container for a bolder look
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapperActive: {
    backgroundColor: '#F1AC09', // Primary active color
  },
  iconWrapperInactive: {
    backgroundColor: '#E2E8F0', // Lighter, neutral background for inactive icon
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleActive: {
    color: '#D97706', // A slightly warmer, deeper gold for active title
  },
  titleInactive: {
    color: '#64748B', // Standard inactive title color
  },
  displayText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  displayTextActive: {
    color: '#1F2937', // Darker text for active state
  },
  displayTextInactive: {
    color: '#374151', // Slightly lighter text for inactive state
  },
  activeIndicator: {
    backgroundColor: '#F1AC09',
    height: 3, // Slightly thinner indicator
    marginHorizontal: 16,
    borderRadius: 1.5,
    marginBottom: 10, // Adjusted bottom margin
  },
});

export default BeautifulFilterCard;
