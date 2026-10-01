import React from 'react';
import { View, Text } from 'react-native';

/**
 * The label above a group of cards.
 *
 * One style for every section, so "Add-ons" and "Charges" do not shout at
 * different volumes. A quiet uppercase label lets the cards below it carry the
 * weight, which is how a grouped list reads on a phone.
 */

interface SectionHeaderProps {
  title: string;
  /** One line on what the section is for. Skip it when the title is obvious. */
  subtitle?: string;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, className = '' }) => (
  <View className={`px-1 ${className}`}>
    <Text className="font-pmedium text-xs uppercase tracking-widest text-gray-400">{title}</Text>
    {subtitle ? (
      <Text className="mt-1 font-pregular text-xs leading-5 text-gray-500">{subtitle}</Text>
    ) : null}
  </View>
);

export default SectionHeader;
