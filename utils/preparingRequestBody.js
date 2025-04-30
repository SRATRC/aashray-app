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
    // Handle different travel data structures for primary booking
    if (
      data.travel?.toResearchCentre !== undefined ||
      data.travel?.fromResearchCentre !== undefined
    ) {
      // New structure with potentially two separate journeys
      // For primary booking, include both directions if they're active

      // First, create the primary booking with basic structure
      payload.primary_booking = {
        booking_type: 'travel',
        details: {
          bidirectional:
            data.travel.toResearchCentre?.active && data.travel.fromResearchCentre?.active ? 1 : 0,
        },
      };

      // Then add the active journeys to the details
      if (data.travel.toResearchCentre?.active) {
        // Add To Research Centre journey details
        payload.primary_booking.details.to_rc = {
          date: data.travel.toResearchCentre.date,
          pickup_point: data.travel.toResearchCentre.pickup,
          drop_point: data.travel.toResearchCentre.drop,
          arrival_time: data.travel.toResearchCentre.arrival_time || '',
          luggage: data.travel.toResearchCentre.luggage,
          type: data.travel.toResearchCentre.type,
          special_request: data.travel.toResearchCentre.special_request || '',
        };
      }

      if (data.travel.fromResearchCentre?.active) {
        // Add From Research Centre journey details
        payload.primary_booking.details.from_rc = {
          date: data.travel.fromResearchCentre.date,
          pickup_point: data.travel.fromResearchCentre.pickup,
          drop_point: data.travel.fromResearchCentre.drop,
          arrival_time: data.travel.fromResearchCentre.arrival_time || '',
          luggage: data.travel.fromResearchCentre.luggage,
          leaving_post_adhyayan: data.travel.fromResearchCentre.adhyayan === 'No' ? 0 : 1,
          type: data.travel.fromResearchCentre.type,
          special_request: data.travel.fromResearchCentre.special_request || '',
        };
      }
    } else if (data.travel?.outbound) {
      // Outbound/return structure
      payload.primary_booking = {
        booking_type: 'travel',
        details: {
          date: data.travel.outbound.date,
          pickup_point: data.travel.outbound.pickup,
          drop_point: data.travel.outbound.drop,
          arrival_time: data.travel.outbound.arrival_time || '',
          luggage: data.travel.outbound.luggage,
          leaving_post_adhyayan: data.travel.adhyayan === 'No' ? 0 : 1,
          type: data.travel.outbound.type,
          special_request: data.travel.special_request || '',
          has_return: data.travel.needsReturn ? 1 : 0,
        },
      };

      // If return journey is needed, add return details
      if (data.travel.needsReturn && data.travel.return) {
        payload.primary_booking.details.return_date = data.travel.return.date;
        payload.primary_booking.details.return_pickup_point = data.travel.return.pickup;
        payload.primary_booking.details.return_drop_point = data.travel.return.drop;
        payload.primary_booking.details.return_arrival_time = data.travel.return.arrival_time || '';
        payload.primary_booking.details.return_luggage = data.travel.return.luggage;
        payload.primary_booking.details.return_type = data.travel.return.type;
      }
    }
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
    // Handle different travel data structures for addon
    if (
      data.travel?.toResearchCentre !== undefined ||
      data.travel?.fromResearchCentre !== undefined
    ) {
      // New structure with potentially two separate journeys

      // Create a single travel addon if both directions are active
      if (data.travel.toResearchCentre?.active && data.travel.fromResearchCentre?.active) {
        // Create bidirectional addon
        const travelAddon = {
          booking_type: 'travel',
          details: {
            bidirectional: 1,
          },
        };

        // Add To Research Centre journey details
        travelAddon.details.to_rc = {
          date: data.travel.toResearchCentre.date,
          pickup_point: data.travel.toResearchCentre.pickup,
          drop_point: data.travel.toResearchCentre.drop,
          arrival_time: data.travel.toResearchCentre.arrival_time || '',
          luggage: data.travel.toResearchCentre.luggage,
          type: data.travel.toResearchCentre.type,
          special_request: data.travel.toResearchCentre.special_request || '',
        };

        // Add From Research Centre journey details
        travelAddon.details.from_rc = {
          date: data.travel.fromResearchCentre.date,
          pickup_point: data.travel.fromResearchCentre.pickup,
          drop_point: data.travel.fromResearchCentre.drop,
          arrival_time: data.travel.fromResearchCentre.arrival_time || '',
          luggage: data.travel.fromResearchCentre.luggage,
          leaving_post_adhyayan: data.travel.fromResearchCentre.adhyayan === 'No' ? 0 : 1,
          type: data.travel.fromResearchCentre.type,
          special_request: data.travel.fromResearchCentre.special_request || '',
        };

        addons.push(travelAddon);
      } else {
        // Add individual journeys if only one direction is active
        if (data.travel.toResearchCentre?.active) {
          // Add To Research Centre journey
          addons.push({
            booking_type: 'travel',
            details: {
              date: data.travel.toResearchCentre.date,
              pickup_point: data.travel.toResearchCentre.pickup,
              drop_point: data.travel.toResearchCentre.drop,
              arrival_time: data.travel.toResearchCentre.arrival_time || '',
              luggage: data.travel.toResearchCentre.luggage,
              leaving_post_adhyayan: 0, // Not applicable for To RC journey
              type: data.travel.toResearchCentre.type,
              special_request: data.travel.toResearchCentre.special_request || '',
              direction: 'to_rc',
            },
          });
        }

        if (data.travel.fromResearchCentre?.active) {
          // Add From Research Centre journey
          addons.push({
            booking_type: 'travel',
            details: {
              date: data.travel.fromResearchCentre.date,
              pickup_point: data.travel.fromResearchCentre.pickup,
              drop_point: data.travel.fromResearchCentre.drop,
              arrival_time: data.travel.fromResearchCentre.arrival_time || '',
              luggage: data.travel.fromResearchCentre.luggage,
              leaving_post_adhyayan: data.travel.fromResearchCentre.adhyayan === 'No' ? 0 : 1,
              type: data.travel.fromResearchCentre.type,
              special_request: data.travel.fromResearchCentre.special_request || '',
              direction: 'from_rc',
            },
          });
        }
      }
    } else if (data.travel?.outbound) {
      // Outbound/return structure
      const travelAddon = {
        booking_type: 'travel',
        details: {
          date: data.travel.outbound.date,
          pickup_point: data.travel.outbound.pickup,
          drop_point: data.travel.outbound.drop,
          arrival_time: data.travel.outbound.arrival_time || '',
          luggage: data.travel.outbound.luggage,
          leaving_post_adhyayan: data.travel.adhyayan === 'No' ? 0 : 1,
          type: data.travel.outbound.type,
          special_request: data.travel.special_request || '',
          has_return: data.travel.needsReturn ? 1 : 0,
        },
      };

      // If return journey is needed, add return details
      if (data.travel.needsReturn && data.travel.return) {
        travelAddon.details.return_date = data.travel.return.date;
        travelAddon.details.return_pickup_point = data.travel.return.pickup;
        travelAddon.details.return_drop_point = data.travel.return.drop;
        travelAddon.details.return_arrival_time = data.travel.return.arrival_time || '';
        travelAddon.details.return_luggage = data.travel.return.luggage;
        travelAddon.details.return_type = data.travel.return.type;
      }

      addons.push(travelAddon);
    } else {
      // Legacy structure
      addons.push({
        booking_type: 'travel',
        details: {
          date: data.travel?.date,
          pickup_point: data.travel?.pickup,
          drop_point: data.travel?.drop,
          arrival_time: data.travel?.arrival_time || '',
          luggage: data.travel?.luggage,
          leaving_post_adhyayan: data.travel?.adhyayan === 'No' ? 0 : 1,
          type: data.travel?.type,
          special_request: data.travel?.special_request || '',
        },
      });
    }
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
      if (group.guests) transformed.guests = group.guests.map((guest) => guest.cardno);
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
      if (group.adhyayan)
        group.adhyayan == 'No'
          ? (transformed.leaving_post_adhyayan = 0)
          : (transformed.leaving_post_adhyayan = 1);
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
