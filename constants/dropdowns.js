const GENDER_LIST = [
  { key: 'M', value: 'Male' },
  { key: 'F', value: 'Female' },
];

const ROOM_TYPE_LIST = [
  { key: 'nac', value: 'Non AC' },
  { key: 'ac', value: 'AC' },
];

const FLOOR_TYPE_LIST = [
  { key: 'n', value: 'Any Floor' },
  { key: 'SC', value: 'Only Ground Floor' },
];

const FOOD_TYPE_LIST = [
  { key: 'breakfast', value: 'Breakfast' },
  { key: 'lunch', value: 'Lunch' },
  { key: 'dinner', value: 'Dinner' },
];

const SPICE_LIST = [
  { key: 1, value: 'Regular' },
  { key: 0, value: 'Non Spicy' },
];

const HIGHTEA_LIST = [
  { key: 'TEA', value: 'Tea' },
  { key: 'COFFEE', value: 'Coffee' },
  { key: 'NONE', value: 'None' },
];

const LOCATION_LIST = [
  { key: 'rc', value: 'Research Centre' },
  { key: 'dadar', value: 'Dadar (Swaminarayan Temple)' },
  { key: 'amar mahar', value: 'Amar Mahal' },
  { key: 'airoli', value: 'Airoli' },
  { key: 'vile parle', value: 'Vile Parle (Sahara Star)' },
  { key: 'airport t1', value: 'Airport Terminal 1' },
  { key: 'airport t2', value: 'Airport Terminal 2' },
  { key: 'bandra railway station', value: 'Railway Station (Bandra Terminus)' },
  { key: 'kurla railway station', value: 'Railway Station (Kurla Terminus)' },
  { key: 'csmt railway station', value: 'Railway Station (CSMT)' },
  { key: 'mumbai central rrailway station', value: 'Railway Station (Mumbai Central)' },
];

const LUGGAGE_LIST = [
  { key: 'cabin1', value: '1 Cabin Bag' },
  { key: 'cabin2', value: '2 Cabin Bags' },
  { key: 'suitcase1', value: '1 Suitcase' },
  { key: 'suitcase2', value: '2 Suitcases' },
  { key: 'none', value: 'NONE' },
];

const BOOKING_TYPE_LIST = [
  { key: 'regular', value: 'Regular' },
  { key: 'full', value: 'Full Car' },
];

const TRAVEL_ADHYAYAN_ASK_LIST = [
  { key: 1, value: 'Yes' },
  { key: 0, value: 'No' },
];

const GUEST_TYPE_LIST = [
  { key: 'driver', value: 'Driver' },
  { key: 'vip', value: 'VIP' },
  { key: 'friend', value: 'Friend' },
  { key: 'family', value: 'Family' },
];

const GUEST_FOOD_TYPE_LIST = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

const GUEST_SPICE_LIST = [
  { value: 1, label: 'Regular' },
  { value: 0, label: 'Non Spicy' },
];

const GUEST_HIGHTEA_LIST = [
  { value: 'TEA', label: 'Tea' },
  { value: 'COFFEE', label: 'Coffee' },
  { value: 'NONE', label: 'None' },
];

export default {
  GENDER_LIST,
  ROOM_TYPE_LIST,
  FLOOR_TYPE_LIST,
  FOOD_TYPE_LIST,
  SPICE_LIST,
  HIGHTEA_LIST,
  LOCATION_LIST,
  LUGGAGE_LIST,
  BOOKING_TYPE_LIST,
  TRAVEL_ADHYAYAN_ASK_LIST,
  GUEST_TYPE_LIST,
  GUEST_FOOD_TYPE_LIST,
  GUEST_SPICE_LIST,
  GUEST_HIGHTEA_LIST,
};
