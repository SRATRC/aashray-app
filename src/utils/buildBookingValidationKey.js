const buildBookingValidationKey = ({ audience, cardno, data }) => {
  const { validationData: _validationData, ...requestData } = data;

  return [`review-${audience}`, cardno, JSON.stringify(requestData)];
};

module.exports = { buildBookingValidationKey };
