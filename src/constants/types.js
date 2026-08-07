const booking_type_room = 'Raj Sharan';
const booking_type_flat = 'Flat';
const booking_type_travel = 'Raj Pravas';
const booking_type_food = 'Raj Prasad';
const booking_type_adhyayan = 'Raj Adhyayan';
const booking_type_event = 'Raj Utsav';

const SINGLE_DAY_ROOM_TYPE = 'Single Day Room';
const ROOM_DETAILS_TYPE = 'room';
const FLAT_DETAILS_TYPE = 'flat';
const TRAVEL_DETAILS_TYPE = 'travel';
const ADHYAYAN_DETAILS_TYPE = 'adhyayan';
const EVENT_DETAILS_TYPE = 'utsav';
// Food is bookable on its own, so it is a primary booking type and not only an
// add-on. The add-on screens rely on this to avoid deleting their own booking.
const FOOD_DETAILS_TYPE = 'food';
const BREAKFAST_DETAILS_TYPE = 'breakfast';
const LUNCH_DETAILS_TYPE = 'lunch';
const DINNER_DETAILS_TYPE = 'dinner';

const MAINTENANCE_TYPE_ALL = 'All';
const MAINTENANCE_TYPE_OPEN = 'Open';
const MAINTENANCE_TYPE_CLOSED = 'Closed';

export default {
  booking_type_room,
  booking_type_flat,
  booking_type_travel,
  booking_type_food,
  booking_type_adhyayan,
  booking_type_event,
  SINGLE_DAY_ROOM_TYPE,
  ROOM_DETAILS_TYPE,
  FLAT_DETAILS_TYPE,
  TRAVEL_DETAILS_TYPE,
  ADHYAYAN_DETAILS_TYPE,
  EVENT_DETAILS_TYPE,
  FOOD_DETAILS_TYPE,
  BREAKFAST_DETAILS_TYPE,
  LUNCH_DETAILS_TYPE,
  DINNER_DETAILS_TYPE,
  MAINTENANCE_TYPE_ALL,
  MAINTENANCE_TYPE_OPEN,
  MAINTENANCE_TYPE_CLOSED,
};
