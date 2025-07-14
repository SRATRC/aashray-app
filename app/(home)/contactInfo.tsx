import React from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import AppColors from '@/constants/colors';
import PageHeader from '@/components/PageHeader';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

interface ContactPerson {
  name: string;
  phone: string;
}

interface DepartmentContact {
  id: string;
  name: string;
  description?: string;
  contactPeople: ContactPerson[];
  icon: keyof typeof MaterialIcons.glyphMap;
}

const departments: DepartmentContact[] = [
  {
    id: '1',
    name: 'Room & Adhyayan Inquiries',
    description: 'Accommodation and study space booking',
    icon: 'hotel',
    contactPeople: [{ name: 'Research Centre Office', phone: '7875432613' }],
  },
  {
    id: '2',
    name: 'Food Services',
    description: 'Meal plans and dining arrangements',
    icon: 'restaurant',
    contactPeople: [{ name: 'Kitchen Office', phone: '9004273512' }],
  },
  {
    id: '3',
    name: 'Travel Arrangements',
    description: 'Transportation and travel planning',
    icon: 'directions-car',
    contactPeople: [
      { name: 'Virag Shah', phone: '9769644960' },
      { name: 'Siddhi Shah', phone: '9831632801' },
    ],
  },
  {
    id: '4',
    name: 'Events & Programs',
    description: 'Event coordination and scheduling',
    icon: 'event',
    contactPeople: [{ name: 'Pranav Karnavat', phone: '7666844433' }],
  },
  {
    id: '5',
    name: 'Payment Support',
    description: 'Billing and payment assistance',
    icon: 'payment',
    contactPeople: [{ name: 'Research Centre Office', phone: '7875432613' }],
  },
  {
    id: '6',
    name: 'WiFi Support',
    description: 'WiFi assistance',
    icon: 'wifi',
    contactPeople: [{ name: 'Research Centre Office', phone: '7875432613' }],
  },
  {
    id: '7',
    name: 'Maintenance',
    description: 'Facility maintenance and repairs',
    icon: 'build',
    contactPeople: [
      { name: 'Bikram Thappa', phone: '9004866057' },
      { name: 'Monica Gupta', phone: '9765240614' },
      { name: 'Hanumanta Kapre', phone: '9158755524' },
    ],
  },
  {
    id: '8',
    name: 'Smilestones',
    description: 'Converting milestone to a smilestone',
    icon: 'celebration',
    contactPeople: [
      { name: 'Anjal Jain', phone: '9892936357' },
      { name: 'Natasha Jain', phone: '9820994054' },
    ],
  },
  {
    id: '9',
    name: 'Satshrut Services',
    description: 'Community and spiritual programs',
    icon: 'group',
    contactPeople: [
      { name: 'Purvit Shah', phone: '9871595449' },
      { name: 'Darshan Soni', phone: '7227047615' },
    ],
  },
];

const ContactInfoScreen = () => {
  const handleLongPress = async (phoneNumber: string) => {
    await Clipboard.setStringAsync(phoneNumber);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Toast.show({
      type: 'info',
      text1: 'Phone number copied to clipboard',
      swipeable: false,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['right', 'top', 'left']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <PageHeader title="Contact Information" />

        <View style={styles.headerSection}>
          <Text style={styles.subtitle}>
            For inquiries, you can reach out during business hours (9:30 AM - 5:30 PM).
          </Text>
        </View>

        <View style={styles.departmentsContainer}>
          {departments.map((dept, index) => (
            <View
              key={dept.id}
              style={[styles.departmentCard, index === departments.length - 1 && styles.lastCard]}>
              <View style={styles.departmentHeader}>
                <View style={styles.iconContainer}>
                  <MaterialIcons name={dept.icon} size={24} color={AppColors.orange || '#F1AC09'} />
                </View>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.departmentName}>{dept.name}</Text>
                  {dept.description && (
                    <Text style={styles.departmentDescription}>{dept.description}</Text>
                  )}
                </View>
              </View>

              <View style={styles.contactsContainer}>
                {dept.contactPeople.map((person, contactIndex) => (
                  <TouchableOpacity
                    key={contactIndex}
                    onPress={() => Linking.openURL(`tel:${person.phone}`)}
                    onLongPress={() => handleLongPress(person.phone)}
                    style={[
                      styles.contactPersonRow,
                      contactIndex === dept.contactPeople.length - 1 && styles.lastContact,
                    ]}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${person.name} at ${person.phone}`}
                    accessibilityHint="Tap to call, long press to copy number">
                    <View style={styles.contactInfo}>
                      <View style={styles.avatarContainer}>
                        <MaterialIcons
                          name="person"
                          size={20}
                          color={AppColors.black_100 || '#6B7280'}
                        />
                      </View>
                      <View style={styles.contactDetails}>
                        <Text style={styles.contactName}>{person.name}</Text>
                        <View style={styles.phoneContainer}>
                          <MaterialIcons
                            name="phone"
                            size={16}
                            color={AppColors.orange || '#F1AC09'}
                          />
                          <Text style={styles.phoneNumber}>{person.phone}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.callButton}>
                      <MaterialIcons name="call" size={20} color={AppColors.orange || '#F1AC09'} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '400',
  },
  departmentsContainer: {
    paddingHorizontal: 16,
  },
  departmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  lastCard: {
    marginBottom: 8,
  },
  departmentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 172, 9, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
    paddingTop: 4,
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 24,
  },
  departmentDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontWeight: '400',
  },
  contactsContainer: {
    paddingTop: 0,
  },
  contactPersonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lastContact: {
    paddingBottom: 20,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 20,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneNumber: {
    fontSize: 14,
    color: '#F1AC09',
    fontWeight: '500',
    marginLeft: 6,
    lineHeight: 20,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(241, 172, 9, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContactInfoScreen;
