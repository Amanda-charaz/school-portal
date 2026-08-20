import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CalendarDays, User, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TeacherAttendanceForm = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { studentId: { status: 'Present' } }
  const [teacherClass, setTeacherClass] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await api.get('/student/teacher/students');
        const data = response.data;
        setStudents(Array.isArray(data) ? data : []);

        // Extract unique classes from the list of students
        const studentList = Array.isArray(data) ? data : [];
        const classList = [...new Set(studentList.map(s => s.assigned_class).filter(Boolean))];
        setAvailableClasses(classList);

        // Initialize attendance records for all fetched students as 'Present'
        const initialAttendance = {};
        studentList.forEach(student => {
          initialAttendance[student._id] = { status: 'Present' };
        });
        
        setAttendanceRecords(initialAttendance);
        if (classList.length > 0 && !teacherClass) {
          setTeacherClass(classList[0]);
        }
      } catch (err) {
        setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch students.' });
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleStatusChange = (studentId, status) => {
    setAttendanceRecords(prevRecords => ({
      ...prevRecords,
      [studentId]: { status }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const studentsInClass = students.filter(s => s.assigned_class === teacherClass);
    const attendanceData = studentsInClass.map(student => ({
      student_id: student._id,
      status: attendanceRecords[student._id]?.status || 'Present'
    }));

    try {
      await api.post('/attendance/add', {
        date: selectedDate,
        students: attendanceData,
        class_name: teacherClass
      });
      setMessage({ type: 'success', text: 'Attendance recorded successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to record attendance.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkAllPresent = () => {
    const studentsInClass = students.filter(s => s.assigned_class === teacherClass);
    const updatedRecords = { ...attendanceRecords };
    studentsInClass.forEach(student => {
      updatedRecords[student._id] = { status: 'Present' };
    });
    setAttendanceRecords(updatedRecords);
    setMessage({ type: 'info', text: `All students in ${teacherClass} marked as Present.` });
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (teacherClass ? student.assigned_class === teacherClass : true)
  );

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden transition-all">
      {/* Sub-Header Banner */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
          <CalendarDays className="text-blue-600 dark:text-blue-400" size={22} /> 
          Mark Daily Attendance
        </h2>
      </div>

      <div className="p-6">
        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-semibold uppercase tracking-wide mb-6 border transition-all ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800/50 dark:text-green-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Controls Meta Grid Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700/60">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">Select Log Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none font-bold text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-2">Active Class Group</label>
              <select
                value={teacherClass}
                onChange={(e) => setTeacherClass(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-sm outline-none font-bold text-sm"
              >
                {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
              </select>
            </div>
          </div>

          {/* Table Toolbar section */}
          <div className="pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">Class Roster</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="text-gray-400 dark:text-gray-500" size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-60 pl-9 pr-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  disabled={submitting || filteredStudents.length === 0}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide shadow-sm shrink-0 ${
                    submitting || filteredStudents.length === 0 
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 shadow-none' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <CheckCircle size={15} /> Mark All Present
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center text-sm font-bold opacity-50 animate-pulse text-gray-500 dark:text-gray-400">Syncing roster...</div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto w-full">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/60">
                      <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        <th scope="col" className="px-6 py-3.5 text-left">Student Profile</th>
                        <th scope="col" className="px-6 py-3.5 text-center">Attendance Status Toggle</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan="2" className="px-6 py-8 text-center text-sm font-medium text-gray-400 dark:text-gray-500">
                            No active students found matching criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map(student => (
                          <tr key={student._id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-400">
                                  <User size={16} />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight">{student.full_name}</div>
                                  <div className="text-xs font-semibold font-mono text-blue-600 dark:text-blue-400 uppercase tracking-wide">{student.school_id || 'N/A'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl gap-1 border border-gray-200/40 dark:border-gray-700/40">
                                {['Present', 'Late', 'Absent'].map(status => {
                                  const isActive = attendanceRecords[student._id]?.status === status;
                                  return (
                                    <button
                                      key={status}
                                      type="button"
                                      onClick={() => handleStatusChange(student._id, status)}
                                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all uppercase tracking-wide ${
                                        isActive
                                          ? `${status === 'Present' ? 'bg-green-600' : status === 'Late' ? 'bg-amber-500' : 'bg-red-600'} text-white shadow-sm`
                                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                      }`}
                                    >
                                      {status}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || filteredStudents.length === 0}
            className={`w-full p-4 font-semibold text-white rounded-2xl shadow-md transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] ${
              submitting || filteredStudents.length === 0 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'
            }`}
          >
            {submitting ? 'Committing Logs...' : 'Commit Daily Attendance'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherAttendanceForm;