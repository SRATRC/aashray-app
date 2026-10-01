const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const monthNameFromNumber = (value) => {
  const monthNumber = Number(value);
  return Number.isInteger(monthNumber) && monthNumber >= 1 && monthNumber <= 12
    ? MONTH_NAMES[monthNumber - 1]
    : null;
};

const monthNameFromDate = (value) => {
  if (!value) return null;

  const text = String(value).trim();
  const isoMonth = /^(?:\d{4})[-/](\d{1,2})/.exec(text)?.[1];
  if (isoMonth) return monthNameFromNumber(isoMonth);

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : MONTH_NAMES[date.getUTCMonth()];
};

const monthNameFromText = (value) =>
  MONTH_NAMES.find((month) => new RegExp(`\\b${month}\\b`, 'i').test(value)) || null;

const formatSectionMonth = (title, firstItemDate) => {
  const fromDate = monthNameFromDate(firstItemDate);
  if (fromDate) return fromDate;

  const titleText = String(title ?? '').trim();
  const numericTitle = /(?:^|[-/])(\d{1,2})(?:$|[-/])/.exec(titleText)?.[1];
  return (
    monthNameFromNumber(titleText) ||
    monthNameFromNumber(numericTitle) ||
    monthNameFromText(titleText) ||
    titleText
  );
};

module.exports = { formatSectionMonth };
