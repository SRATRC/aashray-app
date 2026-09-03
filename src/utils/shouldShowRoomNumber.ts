import moment from 'moment';

/** A booked room/flat number is withheld until payment clears and check-in is
 * within 24h, so a payment that later fails can't have leaked a room assignment
 * early. Flats and events skip that wait since their number is assigned up front. */
const shouldShowRoomNumber = (params: {
  alwaysShow: boolean;
  isPaid: boolean;
  checkinDate: string | null | undefined;
}): boolean => {
  const { alwaysShow, isPaid, checkinDate } = params;
  if (alwaysShow) return true;
  if (!isPaid || !checkinDate) return false;

  const checkin = moment(checkinDate);
  return (
    moment().isAfter(checkin) ||
    moment().isBetween(checkin.clone().subtract(24, 'hours'), checkin, null, '[]')
  );
};

export default shouldShowRoomNumber;
