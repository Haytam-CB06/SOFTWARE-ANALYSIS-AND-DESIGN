/**
 * Gets the week identifier for a given date (e.g., "2025-W45")
 */
export const getWeekIdentifier = (date: Date): string => {
  const year = date.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${year}-W${String(weekNumber).padStart(2, '0')}`;
};
