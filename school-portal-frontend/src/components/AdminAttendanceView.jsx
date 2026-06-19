import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { termLabels } from '../utils/academicUtils';
import { 
  CalendarDays, 
  User, 
  Search, 
  XCircle, 
  BarChart2, 
  TrendingUp,
  Users, 
  CheckCircle,
  Download,
  Printer
 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminAttendanceView = ({ theme }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [classes, setClasses] = useState([]);
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterClass) params.class_name = filterClass;

      const response = await api.get('/attendance/all', { params });
      setAttendanceRecords(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterClass]);

  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/admin/classes');
      setClasses(response.data);
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err.response?.data?.message || 'Failed to load class list.');
    }
  }, []);

  const fetchSummaryAndTrends = useCallback(async () => {
    try {
      const [statsRes, trendsRes] = await Promise.all([
        api.get('/attendance/class-summary'),
        api.get('/attendance/teacher-trends')
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError(err.response?.data?.message || 'Failed to load attendance trends.');
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
    fetchClasses();
    fetchSummaryAndTrends();
  }, [fetchAttendance, fetchClasses, fetchSummaryAndTrends]);

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (filterDate) params.date = filterDate;
      if (filterClass) params.class_name = filterClass;

      const response = await api.get('/attendance/export-csv', { 
        params, 
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Export failed: " + err.message);
    }
  };

  const handleDownloadTermReport = async () => {
    try {
      const response = await api.get(`/attendance/term-report`, {
        params: { 
          term: selectedTerm, 
          year: selectedYear, 
          class_name: filterClass 
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const termLabel = selectedTerm === 'all' ? 'Annual_Attendance' : `Attendance_Term_${selectedTerm}`;
      link.setAttribute('download', `${termLabel}_${selectedYear}_${filterClass || 'All_Classes'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download term attendance report: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleClearFilters = () => {
    setFilterDate('');
    setFilterClass('');
    setSelectedTerm('all');
    setSelectedYear(new Date().getFullYear().toString());
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'Absent': return 'bg-red-50 text-school-red dark:bg-school-red-dark/20 dark:text-school-red-light';
      case 'Late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    // Split the date string to prevent timezone shifts (Midnight UTC to Local)
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-ZW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 rounded-2xl shadow-xl border" style={{ backgroundColor: theme?.card || '#fff', borderColor: theme?.inputBorder || '#eee' }}>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              background: white !important;
              color: black !important;
            }
            .p-6 {
              padding: 0 !important;
            }
            .shadow-xl, .shadow-sm {
              box-shadow: none !important;
            }
            .border {
              border: none !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              color: black !important;
            }
            th, td {
              border: 1px solid #eee !important;
              color: black !important;
            }
            .dark table, .dark th, .dark td, .dark .text-gray-900, .dark .text-gray-500, .dark .text-white {
              color: black !important;
            }
          }
        `}
      </style>
      <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2 tracking-tighter">
        <BarChart2 className="text-school-blue" size={28} /> All Attendance Records
      </h2>
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
        <div className="p-6 rounded-2xl border flex flex-col justify-center glass animate-float" style={{ backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder }}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            <Users size={16} className="text-blue-500" /> Total Enrollment
          </div>
          <div className="text-3xl font-black" style={{ color: theme?.text }}>{stats.totalStudents}</div>
        </div>
        <div className="p-6 rounded-2xl border flex flex-col justify-center glass animate-float" style={{ backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder }}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            <CheckCircle size={16} className="text-emerald-500" /> Today's Presence Rate
          </div>
          <div className="text-3xl font-black text-emerald-500">{stats.attendanceRate}%</div>
        </div>
        <div className="md:col-span-1 p-6 rounded-2xl border glass animate-float" style={{ backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder }}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            <TrendingUp size={16} className="text-school-blue" /> 30-Day Snapshot
          </div>
          <div className="h-[60px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <Area type="monotone" dataKey="present" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Main Trend Chart Analysis */}
      <div className="mb-10 p-6 rounded-2xl border shadow-sm no-print" style={{ backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder }}>
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
          <TrendingUp size={18} /> Detailed Attendance Trends
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme?.inputBorder} opacity={0.5} />
              <XAxis 
                dataKey="_id" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: theme?.subText }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: theme?.subText }} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: theme?.card, 
                  borderColor: theme?.inputBorder, 
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: theme?.text
                }} 
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
              <Area name="Present" type="monotone" dataKey="present" stroke="#10b981" fillOpacity={1} fill="url(#colorPresent)" strokeWidth={3} />
              <Area name="Absent" type="monotone" dataKey="absent" stroke="#ef4444" fillOpacity={1} fill="url(#colorAbsent)" strokeWidth={3} />
              <Area name="Late" type="monotone" dataKey="late" stroke="#f59e0b" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-end gap-4 mb-6 p-4 rounded-xl shadow-sm no-print" style={{ backgroundColor: theme?.inputBg || '#f9f9f9' }}>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Year:
          </label>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="p-2.5 rounded-xl border font-bold text-sm outline-none w-24"
            style={{ backgroundColor: theme?.card, borderColor: theme?.inputBorder, color: theme?.text }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Term Window:
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="p-2.5 rounded-xl border font-bold text-sm outline-none"
            style={{ backgroundColor: theme?.card, borderColor: theme?.inputBorder, color: theme?.text }}
          >
            <option value="all">Full Academic Year</option>
            {Object.entries(termLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filterDate" className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Filter by Date:
          </label>
          <input
            type="date"
            id="filterDate"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="p-2.5 rounded-xl border font-bold text-sm outline-none"
            style={{ backgroundColor: theme?.card, borderColor: theme?.inputBorder, color: theme?.text }}
          />
        </div>
        <div>
          <label htmlFor="filterClass" className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
            Filter by Class:
          </label>
          <select
            id="filterClass"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="p-2.5 rounded-xl border font-bold text-sm outline-none"
            style={{ backgroundColor: theme?.card, borderColor: theme?.inputBorder, color: theme?.text }}
          >
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls.name}>{cls.name}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleDownloadTermReport}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest"
            title="Download Term Report (PDF)"
          >
            <Download size={18} /> {selectedTerm === 'all' ? 'Annual' : 'Term'} PDF
          </button>
          <button
            onClick={handlePrint}
            className="p-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest"
          >
            <Printer size={18} /> Print Report
          </button>
          <button
            onClick={handleExportCSV}
            disabled={attendanceRecords.length === 0}
            className="p-2.5 bg-school-blue hover:bg-school-blue-dark text-white rounded-xl flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest disabled:opacity-50"
          >
            <Download size={18} /> Export CSV
          </button>
        </div>
        <button
          onClick={handleClearFilters}
          className="p-2.5 bg-school-red hover:bg-school-red-dark text-white rounded-xl flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <XCircle size={18} /> Clear Filters
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm font-medium mb-4 border bg-red-50 border-red-100 text-school-red dark:bg-school-red-dark/10 dark:border-school-red-dark/40">
          Error: {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400 animate-pulse text-lg">Loading attendance records...</p>
      ) : attendanceRecords.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-lg">No attendance records found matching your criteria.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Student Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Class
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Marked By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {attendanceRecords.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                    {record.student_id ? `${record.student_id.full_name} (${record.student_id.school_id})` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.class_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {record.marked_by ? record.marked_by.full_name : 'System'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceView;