/**
 * Formats a date string for display using the en-ZW locale.
 * Prevents timezone shift by splitting the ISO string before constructing the Date.
 *
 * @param {string} dateString - ISO date string
 * @param {Intl.DateTimeFormatOptions} [options] - Intl formatting options
 * @returns {string}
 */
export const formatDate = (dateString, options) => {
  if (!dateString) return 'N/A';
  const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
  const [datePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-ZW', options || defaults);
};

/**
 * Formats a number as USD currency using the en-ZW locale.
 *
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-ZW', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Returns Tailwind CSS class strings for attendance status badges.
 *
 * @param {string} status - 'Present' | 'Absent' | 'Late'
 * @returns {string} Tailwind class string
 */
export const getAttendanceStatusClass = (status) => {
  switch (status) {
    case 'Present':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'Absent':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'Late':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};
