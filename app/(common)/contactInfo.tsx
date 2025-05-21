import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppColors from '../../constants/colors';
import { MaterialIcons } from '@expo/vector-icons';
import PageHeader from '~/components/PageHeader';

interface ContactPerson {
  name: string;
  phone: string;
}

interface DepartmentContact {
  id: string;
  name: string;
  contactPeople: ContactPerson[];
}

const departments: DepartmentContact[] = [
  {
    id: '1',
    name: 'Room / Adhyayan Inquiry',
    contactPeople: [{ name: 'Research Centre Office', phone: '9920108012' }],
  },
  {
    id: '2',
    name: 'Food Inquiry',
    contactPeople: [{ name: 'Kitchen Office', phone: '9004273512' }],
  },
  {
    id: '3',
    name: 'Travel Inquiry',
    contactPeople: [
      { name: 'Virag Shah', phone: '9769644960' },
      { name: 'Siddhi Shah', phone: '9831632801' },
    ],
  },
  {
    id: '4',
    name: 'Events Inquiry',
    contactPeople: [{ name: 'Pranav Karnavat', phone: '7666844433' }],
  },
  {
    id: '5',
    name: 'Payments Inquiry',
    contactPeople: [{ name: 'Research Centre Office', phone: '9373532700' }],
  },
  {
    id: '6',
    name: 'Wifi Inquiry',
    contactPeople: [{ name: 'Research Centre Office', phone: '9920108012' }],
  },
  {
    id: '7',
    name: 'Maintenance Inquiry',
    contactPeople: [
      { name: 'Niket Dhami', phone: '9036477655' },
      { name: 'Monica Gupta', phone: '9765240614' },
    ],
  },
  {
    id: '8',
    name: 'Smilestones Inquiry',
    contactPeople: [
      { name: 'Anjal Jain', phone: '9036477655' },
      { name: 'Natasha Jain', phone: '9765240614' },
    ],
  },
  {
    id: '9',
    name: 'Satshrut Inquiry',
    contactPeople: [
      { name: 'Purvit Shah', phone: '9871595449' },
      { name: 'Darshan Soni', phone: '7227047615' },
    ],
  },
];

const ContactInfoScreen = () => {
  const handlePhonePress = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <SafeAreaView className="h-full bg-white" edges={['right', 'top', 'left']}>
      <ScrollView style={styles.container}>
        <PageHeader title="Contact Information" />
        {departments.map((dept) => (
          <View key={dept.id} style={styles.departmentCard}>
            <Text style={styles.departmentName}>{dept.name}</Text>

            {dept.contactPeople &&
              dept.contactPeople.map((person, index) => (
                <View key={index} style={styles.contactPersonEntry}>
                  <View style={styles.personNameContainer}>
                    <MaterialIcons
                      name="person"
                      size={18}
                      color={AppColors.black_100 || '#333333'}
                      style={styles.iconStyle}
                    />
                    <Text style={styles.contactPersonName}>{person.name}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handlePhonePress(person.phone)}
                    style={styles.contactDetailEntry}
                    activeOpacity={0.7}>
                    <MaterialIcons
                      name="phone"
                      size={16}
                      color={AppColors.orange || '#F1AC09'}
                      style={styles.iconStyle}
                    />
                    <Text style={styles.contactValueLink}>{person.phone}</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  departmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F1F1',
  },
  departmentName: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.black_100 || '#333333',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  contactPersonEntry: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  personNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  contactPersonName: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.black_100 || '#333333',
  },
  contactDetailEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 26, // To align with the person name
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(241, 172, 9, 0.08)', // Light orange background
    alignSelf: 'flex-start', // Make it only as wide as the content
  },
  iconStyle: {
    marginRight: 8,
  },
  contactValueLink: {
    fontSize: 14,
    color: AppColors.orange || '#F1AC09',
    fontWeight: '500',
  },
  contactEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
});

export default ContactInfoScreen;
