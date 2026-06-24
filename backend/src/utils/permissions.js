/**
 * Checks if a teacher is assigned to a specific subject, handling both array and comma-separated string formats.
 * @param {object} teacher - The teacher user object from the database.
 * @param {string} subject - The subject name to check.
 * @returns {boolean} True if the teacher is assigned to the subject.
 */
export const isTeacherAssignedToSubject = (teacher, subject) => {
  if (!teacher || !subject) {
    return false;
  }

  const teacherSubjects = Array.isArray(teacher.assigned_subjects)
    ? teacher.assigned_subjects
    : String(teacher.assigned_subjects || '').split(',').map(s => s.trim());

  const normalizedSubject = subject.trim().toLowerCase();
  return teacherSubjects.some(s => s.trim().toLowerCase() === normalizedSubject);
};