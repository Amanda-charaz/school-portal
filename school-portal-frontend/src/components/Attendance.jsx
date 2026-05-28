import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Save, 
  Users, 
  Calendar, 
  Search,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

const Attendance = ({ theme }) => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA')); // 📅 Ensures local YYYY-MM-DD for the teacher
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalStudents: 0, attendanceRate: 0 });
  const [selectedClass, setSelectedClass] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [trends, setTrends] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [date, selectedClass]); // 📅 Re-syncs when date OR class selection changes

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch Students assigned to this teacher from StudentController
      const studentsRes = await api.get('/student/teacher/students');
      const studentList = studentsRes.data || [];
      setStudents(studentList);

      const classes = [...new Set(studentList.map(s => s.assigned_class).filter(Boolean))];
      setAvailableClasses(classes);
      if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);


      // 🔄 Fetch existing attendance records for the selected date
      const existingRes = await api.get('/attendance/all', { params: { date } });
      
      const mergedData = {};
      // Set UI defaults (Present) for all students first
      (studentsRes.data || []).forEach(s => {
        mergedData[s._id] = 'Present';
      });

      // Overwrite defaults with actual data saved in the database
      (existingRes.data || []).forEach(record => {
        const sid = record.student_id?._id || record.student_id;
        if (mergedData[sid]) {
          mergedData[sid] = record.status;
        }
      });

      setAttendanceData(mergedData);

      // Fetch Daily Summary from AttendanceController
      const summaryRes = await api.get('/attendance/class-summary');
      setStats(summaryRes.data); // Set stats directly, backend handles empty state

      // Fetch 30-Day Trends from AttendanceController
      const trendsRes = await api.get('/attendance/teacher-trends');
      setTrends(Array.isArray(trendsRes.data) ? trendsRes.data : []); // Ensure trends is an array

    } catch (err) {
      console.error("Fetch Error:", err);
      // If you receive HTML (<!doctype html>), it means the route was not found 
      // on the backend and fell back to the frontend index.html.
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status) => {
    const updated = {};
    students
      .filter(s => !selectedClass || s.assigned_class === selectedClass)
      .forEach(s => updated[s._id] = status);
    setAttendanceData(updated);
  };

  const submitAttendance = async () => {
    const payload = {
      date,
      students: Object.entries(attendanceData).map(([id, status]) => ({
        student_id: id,
        status
      })),
      class_name: selectedClass || "General"
    };

    try {
      // Path matches attendanceRoutes.js definition
      await api.post('/attendance/add', payload);
      alert(`✅ Success: Attendance for ${selectedClass || "the class"} has been synchronized.`);
      fetchInitialData();
    } catch (err) {
      alert("Error saving: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredStudents = students.filter(s => 
    (s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.school_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (selectedClass ? s.assigned_class === selectedClass : true)
  );

  if (loading) return <div className="p-8 text-center" style={{ color: theme.text }}>Loading Attendance System...</div>;

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards with Tailwind */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-float">
        <div className="glass p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <Users size={18} className="text-school-blue" /> Total Students
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white">{stats.totalStudents}</div>
        </div>
        <div className="glass p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center gap-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <TrendingUp size={18} className="text-emerald-500" /> Today's Presence Rate
          </div>
          <div className="text-3xl font-black text-emerald-500">{stats.attendanceRate}%</div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-400 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
          <AlertCircle size={20} />
          <span>System Notice: {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Attendance Form Card */}
        <div className="lg:col-span-2 glass-blue rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tighter text-school-blue">
              <Calendar size={22} className="text-indigo-500" /> Mark Attendance
            </h3>
            <div className="flex items-center gap-3">
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              {availableClasses.length > 1 && (
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {availableClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>
              )}
              <button 
                onClick={() => markAll('Present')}
                className="px-4 py-2 text-[10px] font-black rounded-xl bg-school-blue text-white hover:bg-school-blue-dark transition-all active:scale-95 uppercase tracking-widest shadow-md"
              >
                Mark All Present
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search class roster by name or ID..." 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="py-20 text-center opacity-40 italic text-sm font-bold tracking-tight">No active student records found.</div>
              ) : (
                filteredStudents.map(student => (
                  <div 
                    key={student._id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 bg-white dark:bg-gray-800/50 hover:shadow-md transition-all group animate-float"
                  >
                    <div className="mb-3 sm:mb-0">
                      <div className="font-black text-sm text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-500 transition-colors">{student.full_name}</div>
                      <div className="text-[10px] font-black opacity-40 uppercase font-mono tracking-[0.2em] dark:text-gray-400">{student.school_id}</div>
                    </div>
                    <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-900 rounded-xl gap-1 border border-gray-200/40 dark:border-gray-700/40">
                      {['Present', 'Late', 'Absent'].map((status) => (
                        <button 
                          key={status}
                          onClick={() => handleStatusChange(student._id, status)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider ${
                            attendanceData[student._id] === status 
                              ? `${status === 'Present' ? 'bg-emerald-600' : status === 'Late' ? 'bg-amber-500' : 'bg-school-red'} text-white shadow-sm` 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                          }`}
                        >
                          {status === 'Present' && <CheckCircle size={12} />}
                          {status === 'Late' && <Clock size={12} />}
                          {status === 'Absent' && <XCircle size={12} />}
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={submitAttendance}
              disabled={students.length === 0}
              className="w-full py-4 rounded-2xl bg-school-blue text-white font-black flex items-center justify-center gap-3 shadow-xl hover:bg-school-blue-dark disabled:opacity-50 transition-all active:scale-[0.98] uppercase tracking-[0.2em] text-xs"
            >
              <Save size={18} /> Commit Daily Attendance
            </button>
          </div>
        </div>

        {/* Trends Side Card */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50 flex flex-col justify-center items-center text-center space-y-6">
          <div className="p-6 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
            <TrendingUp size={48} />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">Performance Analytics</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-bold leading-relaxed tracking-tight">
              30-day visual trend analysis is active with {trends.length} historical data points synchronized.
            </p>
          </div>
          <div className="w-full pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 text-left">Recent Activity</div>
            {/* Miniature list for space */}
            <div className="space-y-2">
               {trends.slice(-3).map((t, i) => (
                 <div key={i} className="flex justify-between text-[11px] font-bold">
                   <span className="text-gray-400">{t._id}</span>
                   <span className="text-emerald-500">{t.present} Present</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;