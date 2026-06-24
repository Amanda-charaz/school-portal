/**
 * Calculates the letter grade based on a numeric score.
 * @param {number | string} score - The numeric score.
 * @returns {string} The letter grade (A, B, C, D, E, or U).
 */
export const calculateGrade = (score) => {
  const num = Number(score);
  if (num >= 80) return "A";
  if (num >= 70) return "B";
  if (num >= 60) return "C";
  if (num >= 50) return "D";
  if (num >= 40) return "E";
  return "U";
};