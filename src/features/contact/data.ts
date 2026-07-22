import { MaterialIcons } from '@expo/vector-icons';

export interface ContactPerson {
  name: string;
  phone: string;
}

export interface DepartmentContact {
  id: string;
  name: string;
  description?: string;
  contactPeople: ContactPerson[];
  icon: keyof typeof MaterialIcons.glyphMap;
}

export const departments: DepartmentContact[] = [
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
