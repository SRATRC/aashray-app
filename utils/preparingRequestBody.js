export const prepareSelfRequestBody = (user, data) => {
  const payload = {
    cardno: user.cardno,
  };

  if (data.primary === 'room') {
    payload.primary_booking = {
      booking_type: 'room',
      details: {
        checkin_date: data.room?.startDay,
        checkout_date: data.room?.endDay,
        room_type: data.room?.roomType,
        floor_type: data.room?.floorType,
      },
    };
  } else if (data.primary === 'travel') {
    payload.primary_booking = {
      booking_type: 'travel',
      details: {
        date: data.travel?.date,
        pickup_point: data.travel?.pickup,
        drop_point: data.travel?.drop,
        arrival_time: data.travel?.arrival_time,
        luggage: data.travel?.luggage,
        leaving_post_adhyayan: data.travel?.adhyayan,
        type: data.travel?.type,
        special_request: data.travel?.special_request,
      },
    };
  } else if (data.primary === 'adhyayan') {
    payload.primary_booking = {
      booking_type: 'adhyayan',
      details: {
        shibir_ids: data.adhyayan.map((shibir) => shibir.id),
      },
    };
  }

  const addons = [];
  if (data.primary !== 'room' && data.room) {
    addons.push({
      booking_type: 'room',
      details: {
        checkin_date: data.room?.startDay,
        checkout_date: data.room?.endDay,
        room_type: data.room?.roomType,
        floor_type: data.room?.floorType,
      },
    });
  }
  if (data.primary !== 'food' && data.food) {
    addons.push({
      booking_type: 'food',
      details: {
        start_date: data.food?.startDay,
        end_date: data.food?.endDay,
        breakfast: data.food?.meals.includes('breakfast'),
        lunch: data.food?.meals.includes('lunch'),
        dinner: data.food?.meals.includes('dinner'),
        spicy: data.food?.spicy,
        hightea: data.food?.hightea,
      },
    });
  }
  if (data.primary !== 'travel' && data.travel) {
    addons.push({
      booking_type: 'travel',
      details: {
        date: data.travel?.date,
        pickup_point: data.travel?.pickup,
        drop_point: data.travel?.drop,
        arrival_time: data.travel?.arrival_time,
        luggage: data.travel?.luggage,
        leaving_post_adhyayan: data.travel?.adhyayan,
        type: data.travel?.type,
        comments: data.travel?.special_request,
      },
    });
  }
  if (data.primary !== 'adhyayan' && data.adhyayan) {
    addons.push({
      booking_type: 'adhyayan',
      details: {
        shibir_ids: data.adhyayan.map((shibir) => shibir.id),
      },
    });
  }

  if (addons.length > 0) {
    payload.addons = addons;
  }

  return payload;
};

export const prepareGuestRequestBody = (user, input) => {
  const transformGuestGroup = (guestGroup) =>
    guestGroup.map((group) => {
      const transformed = {};
      if (group.roomType) transformed.roomType = group.roomType;
      if (group.floorType && group.floorType !== 'n') transformed.floorType = group.floorType;
      if (group.guests) transformed.guests = group.guests.map((guest) => guest.id);
      if (group.meals) transformed.meals = group.meals;
      if (group.spicy !== undefined) transformed.spicy = group.spicy;
      if (group.hightea) transformed.high_tea = group.hightea;
      return transformed;
    });

  const primaryBookingDetails = (primaryKey) => {
    const primaryData = input[primaryKey];
    switch (primaryKey) {
      case 'room':
        return {
          booking_type: 'room',
          details: {
            checkin_date: primaryData.startDay,
            checkout_date: primaryData.endDay,
            guestGroup: transformGuestGroup(primaryData.guestGroup),
          },
        };
      case 'food':
        return {
          booking_type: 'food',
          details: {
            start_date: primaryData.startDay,
            end_date: primaryData.endDay,
            guestGroup: transformGuestGroup(primaryData.guestGroup),
          },
        };
      case 'adhyayan':
        return {
          booking_type: 'adhyayan',
          details: {
            shibir_ids: [primaryData.adhyayan.id],
            guests: primaryData.guestGroup.map((guest) => guest.id),
          },
        };
      default:
        throw new Error(`Unsupported primary booking type: ${primaryKey}`);
    }
  };

  const transformAddons = (input) =>
    Object.keys(input)
      .filter((key) => key !== input.primary && key !== 'primary')
      .map((key) => {
        switch (key) {
          case 'room':
            return {
              booking_type: key,
              details: {
                checkin_date: input[key].startDay,
                checkout_date: input[key].endDay,
                guestGroup: transformGuestGroup(input[key].guestGroup),
              },
            };
          case 'food':
            return {
              booking_type: key,
              details: {
                start_date: input[key].startDay,
                end_date: input[key].endDay,
                guestGroup: transformGuestGroup(input[key].guestGroup),
              },
            };
          case 'adhyayan':
            return {
              booking_type: 'adhyayan',
              details: {
                shibir_ids: [input[key].adhyayan.id],
                guests: input[key].guests.map((guest) => guest.id),
              },
            };
          case 'validationData':
            return null;
          default:
            throw new Error(`Unsupported addon type: ${key}`);
        }
      })
      .filter(Boolean);

  return {
    cardno: user.cardno,
    primary_booking: primaryBookingDetails(input.primary),
    addons: transformAddons(input),
  };
};

export const prepareMumukshuRequestBody = (user, input) => {
  const transformMumukshuGroup = (mumukshuGroup) =>
    mumukshuGroup.map((group) => {
      const transformed = {};
      if (group.cardno) return group.cardno;
      if (group.roomType) transformed.roomType = group.roomType;
      if (group.floorType && group.floorType !== 'n') transformed.floorType = group.floorType;
      if (group.mumukshus) {
        transformed.mumukshus = group.mumukshus.map((mumukshu) => mumukshu.cardno);

        if (!group.arrival_time) {
          const mumukshuWithArrivalTime = group.mumukshus.find((m) => m.arrival_time);
          if (mumukshuWithArrivalTime)
            transformed.arrival_time = mumukshuWithArrivalTime.arrival_time;
        }
        if (!group.adhyayan) {
          const mumukshuWithAdhyayan = group.mumukshus.find((m) => m.adhyayan);
          if (mumukshuWithAdhyayan)
            transformed.leaving_post_adhyayan = mumukshuWithAdhyayan.adhyayan;
        }
        if (!group.luggage) {
          const mumukshuWithLuggage = group.mumukshus.find((m) => m.luggage);
          if (mumukshuWithLuggage) transformed.luggage = mumukshuWithLuggage.luggage;
        }
        if (!group.type) {
          const mumukshuWithType = group.mumukshus.find((m) => m.type);
          if (mumukshuWithType) transformed.type = mumukshuWithType.type;
        }
        if (!group.special_request) {
          const mumukshuWithSpecialRequest = group.mumukshus.find((m) => m.special_request);
          if (mumukshuWithSpecialRequest)
            transformed.comments = mumukshuWithSpecialRequest.special_request;
        }
      }
      if (group.pickup) transformed.pickup_point = group.pickup;
      if (group.drop) transformed.drop_point = group.drop;
      if (group.arrival_time) transformed.arrival_time = group.arrival_time;
      if (group.adhyayan) transformed.leaving_post_adhyayan = group.adhyayan;
      if (group.luggage) transformed.luggage = group.luggage;
      if (group.type) transformed.type = group.type;
      if (group.special_request) transformed.comments = group.special_request;
      if (group.meals) transformed.meals = group.meals;
      if (group.spicy !== undefined) transformed.spicy = group.spicy;
      if (group.hightea) transformed.high_tea = group.hightea;
      return transformed;
    });

  const primaryBookingDetails = (primaryKey) => {
    const primaryData = input[primaryKey];

    switch (primaryKey) {
      case 'room':
        return {
          booking_type: 'room',
          details: {
            checkin_date: primaryData.startDay,
            checkout_date: primaryData.endDay,
            mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'food':
        return {
          booking_type: 'food',
          details: {
            start_date: primaryData.startDay,
            end_date: primaryData.endDay,
            mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'adhyayan':
        return {
          booking_type: 'adhyayan',
          details: {
            shibir_ids: [primaryData.adhyayan.id],
            mumukshus: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'travel':
        return {
          booking_type: 'travel',
          details: {
            date: primaryData.date,
            mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      default:
        throw new Error(`Unsupported primary booking type: ${primaryKey}`);
    }
  };

  const transformAddons = (input) =>
    Object.keys(input)
      .filter((key) => key !== input.primary && key !== 'primary')
      .map((key) => {
        switch (key) {
          case 'room':
            return {
              booking_type: key,
              details: {
                checkin_date: input[key].startDay,
                checkout_date: input[key].endDay,
                mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
              },
            };
          case 'food':
            return {
              booking_type: key,
              details: {
                start_date: input[key].startDay,
                end_date: input[key].endDay,
                mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
              },
            };
          case 'adhyayan':
            return {
              booking_type: key,
              details: {
                shibir_ids: [input[key].adhyayan.id],
                mumukshus: input[key].mumukshus.map((mumukshu) => mumukshu.cardno),
              },
            };
          case 'travel':
            return {
              booking_type: key,
              details: {
                date: input[key].date,
                mumukshuGroup: transformMumukshuGroup(input[key].mumukshuGroup),
              },
            };
          case 'validationData':
            return null;
          default:
            throw new Error(`Unsupported addon type: ${key}`);
        }
      })
      .filter(Boolean);
  return {
    cardno: user.cardno,
    primary_booking: primaryBookingDetails(input.primary),
    addons: transformAddons(input),
  };
};
