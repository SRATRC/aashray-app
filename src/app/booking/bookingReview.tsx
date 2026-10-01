import React from 'react';

import BookingReviewScreen from '@/src/components/booking/shared/BookingReviewScreen';

/**
 * Review and pay for a self booking. The screen itself is shared; this route
 * only says which audience it is for. Kept as a route so existing pushes, deep
 * links and notification payloads still resolve.
 */
const Review = () => <BookingReviewScreen audience="self" />;

export default Review;
