export const termLabels = {
  "1": "First Term (Jan – Apr)",
  "2": "Second Term (May – Aug)",
  "3": "Third Term (Sep – Dec)"
};

export const subjectOptions = [
  "English Language", "Mathematics", "Shona", "Ndebele", "Heritage Studies",
  "Agriculture", "Combined Science", "Computer Science", "Commerce",
  "Principles of Accounts", "Business Studies", "Geography", "History"
];

/**
 * Calculates the ZIMSEC standard O-Level grade letter based on a numeric score.
 */
export const calculateGrade = (score) => {
  const num = Number(score);
  if (!score || isNaN(num)) return "-";
  if (num >= 80) return "A";
  if (num >= 70) return "B";
  if (num >= 60) return "C";
  if (num >= 50) return "D";
  if (num >= 40) return "E";
  return "U";
};

/**
 * Returns the brand hex color associated with a specific grade letter.
 */
export const getGradeColor = (letter) => {
  switch (letter) {
    case 'A': return '#10b981'; // Emerald Green
    case 'B': return '#3b82f6'; // Blue
    case 'C': return '#8b5cf6'; // Violet
    case 'D': return '#f59e0b'; // Amber
    case 'E': return '#6366f1'; // Indigo
    case 'U': return '#ef4444'; // Red
    default: return '#64748b';  // Slate Gray for unknown
  }
};