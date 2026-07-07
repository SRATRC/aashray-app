import { status } from '@/constants';

export const getStatusColor = (ticketStatus: string) => {
  switch (ticketStatus) {
    case status.STATUS_OPEN:
      return { text: 'text-green-600', bg: 'bg-green-100' };
    case status.STATUS_IN_PROGRESS:
      return { text: 'text-orange-600', bg: 'bg-orange-100' };
    case status.STATUS_RESOLVED:
      return { text: 'text-blue-600', bg: 'bg-blue-100' };
    case status.STATUS_CLOSED:
      return { text: 'text-gray-600', bg: 'bg-gray-100' };
    default:
      return { text: 'text-gray-600', bg: 'bg-gray-100' };
  }
};
