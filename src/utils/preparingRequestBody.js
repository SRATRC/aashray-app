export const prepareGuestRequestBody = (user, input) => {
  const transformGuestGroup = (guestGroup) =>
    guestGroup.map((group) => {
      const transformed = {};

      // Travel groups carry pickup/drop and map to a distinct wire shape (mirrors
      // mumukshu travel groups so normalizeGuestTravelDetails on the backend can
      // treat guest and mumukshu travel groups uniformly).
      if (group.pickup !== undefined || group.drop !== undefined) {
        if (group.pickup) transformed.pickup_point = group.pickup;
        if (group.drop) transformed.drop_point = group.drop;
        if (group.arrival_time) transformed.arrival_time = group.arrival_time;
        if (group.luggage) {
          transformed.luggage = group.luggage.length > 0 ? group.luggage.join(', ') : '';
        }
        if (group.type) transformed.type = group.type;
        if (group.special_request) transformed.comments = group.special_request;
        if (group.total_people) transformed.total_people = group.total_people;
        if (group.guests) transformed.mumukshus = group.guests.map((guest) => guest.cardno);
        return transformed;
      }

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
            guests: primaryData.guestGroup.map((guest) => guest.cardno),
          },
        };
      case 'flat':
        return {
          booking_type: 'flat',
          details: {
            checkin_date: primaryData.startDay,
            checkout_date: primaryData.endDay,
            guests: primaryData.guests,
          },
        };
      case 'utsav':
        return {
          booking_type: 'utsav',
          details: {
            utsavid: primaryData.utsav.utsav_id,
            guests: primaryData.guests.map((guest) => {
              return {
                cardno: guest.cardno,
                packageid: guest.package,
                arrival: guest.arrival,
                volunteer: guest.volunteer,
                carno: guest.carno,
                other: guest.other,
              };
            }),
          },
        };
      case 'travel': {
        const details = {
          date: primaryData.date,
          guestGroup: transformGuestGroup(primaryData.guestGroup),
        };
        if (primaryData.return_date && primaryData.returnGuestGroup) {
          details.return_date = primaryData.return_date;
          details.returnGuestGroup = transformGuestGroup(primaryData.returnGuestGroup);
        }
        return {
          booking_type: 'travel',
          details,
        };
      }
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
              booking_type: key,
              details: {
                shibir_ids: [input[key].adhyayan.id],
                guests: input[key].guests.map((guest) => guest.cardno),
              },
            };
          case 'travel': {
            const onwardGroup = transformGuestGroup(input[key].guestGroup);
            const travelDetails = {
              date: input[key].date,
              guestGroup: onwardGroup,
            };
            // A return date turns this into a round trip. The return is a full set of groups
            // (same shape as the onward), defaulting to the reversed onward but fully editable
            // via the return editor. The addon form supplies the resolved returnGuestGroup.
            if (input[key].return_date) {
              travelDetails.return_date = input[key].return_date;
              if (input[key].returnGuestGroup) {
                travelDetails.returnGuestGroup = transformGuestGroup(input[key].returnGuestGroup);
              }
            }
            return {
              booking_type: key,
              details: travelDetails,
            };
          }
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
  const metadataFields = [
    'validationData',
    'dismissedValidationError',
    'errorAlreadyShown',
    'errorMessage',
  ];
  const bookingInput = { ...input };
  metadataFields.forEach((field) => {
    if (bookingInput[field]) delete bookingInput[field];
  });

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
        if (!group.luggage) {
          const mumukshuWithLuggage = group.mumukshus.find((m) => m.luggage);
          if (mumukshuWithLuggage)
            transformed.luggage =
              mumukshuWithLuggage.luggage.length > 0 ? mumukshuWithLuggage.luggage.join(', ') : '';
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
        if (!group.total_people) {
          const mumukshuWithTotalPeople = group.mumukshus.find((m) => m.total_people);
          if (mumukshuWithTotalPeople)
            transformed.total_people = mumukshuWithTotalPeople.total_people;
        }
      }
      if (group.pickup) transformed.pickup_point = group.pickup;
      if (group.drop) transformed.drop_point = group.drop;
      if (group.arrival_time) transformed.arrival_time = group.arrival_time;
      if (group.luggage) {
        transformed.luggage = group.luggage.length > 0 ? group.luggage.join(', ') : '';
      }
      if (group.type) transformed.type = group.type;
      if (group.special_request) transformed.comments = group.special_request;
      if (group.meals) transformed.meals = group.meals;
      if (group.spicy !== undefined) transformed.spicy = group.spicy;
      if (group.hightea) transformed.high_tea = group.hightea;
      if (group.total_people) transformed.total_people = group.total_people;

      return transformed;
    });

  const primaryBookingDetails = (primaryKey) => {
    const primaryData = bookingInput[primaryKey];

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
      case 'travel': {
        const travelDetails = {
          date: primaryData.date,
          mumukshuGroup: transformMumukshuGroup(primaryData.mumukshuGroup),
        };
        if (primaryData.return_date && primaryData.returnMumukshuGroup) {
          travelDetails.return_date = primaryData.return_date;
          travelDetails.returnMumukshuGroup = transformMumukshuGroup(
            primaryData.returnMumukshuGroup
          );
        }
        return {
          booking_type: 'travel',
          details: travelDetails,
        };
      }
      case 'flat':
        return {
          booking_type: 'flat',
          details: {
            checkin_date: primaryData.startDay,
            checkout_date: primaryData.endDay,
            mumukshus: transformMumukshuGroup(primaryData.mumukshuGroup),
          },
        };
      case 'utsav':
        return {
          booking_type: 'utsav',
          details: {
            utsavid: primaryData.utsav.utsav_id,
            mumukshus: primaryData.mumukshus.map((mumukshu) => {
              return {
                cardno: mumukshu.cardno,
                packageid: mumukshu.package,
                arrival: mumukshu.arrival,
                volunteer: mumukshu.volunteer,
                carno: mumukshu.carno,
                other: mumukshu.other,
              };
            }),
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
          case 'travel': {
            const onwardGroup = transformMumukshuGroup(input[key].mumukshuGroup);
            const travelDetails = {
              date: input[key].date,
              mumukshuGroup: onwardGroup,
            };
            // A return date turns this into a round trip. The return is a full set of groups
            // (same shape as the onward), defaulting to the reversed onward but fully editable
            // via the return editor. The addon form supplies the resolved returnMumukshuGroup.
            if (input[key].return_date) {
              travelDetails.return_date = input[key].return_date;
              if (input[key].returnMumukshuGroup) {
                travelDetails.returnMumukshuGroup = transformMumukshuGroup(
                  input[key].returnMumukshuGroup
                );
              }
            }
            return {
              booking_type: key,
              details: travelDetails,
            };
          }
          case 'flat':
            return {
              booking_type: key,
              details: {
                checkin_date: input[key].startDay,
                checkout_date: input[key].endDay,
                mumukshus: input[key].mumukshus.map((mumukshu) => mumukshu.cardno),
              },
            };
          case 'validationData':
          case 'dismissedValidationError':
          case 'errorAlreadyShown':
          case 'errorMessage':
            return null;
          default:
            console.log('input', input);
            throw new Error(`Unsupported mumukshu addon type: ${key}`);
        }
      })
      .filter(Boolean);
  return {
    cardno: user.cardno,
    primary_booking: primaryBookingDetails(bookingInput.primary),
    addons: transformAddons(bookingInput),
  };
};
