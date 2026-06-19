import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Info, FileDown, Filter, XCircle as XIcon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { downloadBlob } from '../utils/downloadUtils';
import { getAttendanceStatusClass } from '../utils/formatUtils';

const StudentAttendanceView = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { theme } = useTheme();
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  useEffect(() => {
    const fetchMyAttendance = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        let url = '/api/attendance/my-attendance';
        const params = new URLSearchParams();
        if (filterStartDate) params.append('startDate', filterStartDate);
        if (filterEndDate) params.append('endDate', filterEndDate);
        if (params.toString()) url += `?${params.toString()}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch your attendance history.');
        }

        const data = await response.json();
        setRecords(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyAttendance();
  }, [filterStartDate, filterEndDate]);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      let url = '/api/attendance/export-report';
      const params = new URLSearchParams();
      if (filterStartDate) params.append('startDate', filterStartDate);
      if (filterEndDate) params.append('endDate', filterEndDate);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF report.');
      }

      const blob = await response.blob();
      downloadBlob(blob, `Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("Export error:", err);
      alert("Could not export report: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZW', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const statusIcons = {
    Present: <CheckCircle size={16} className="text-green-600" />,
    Absent: <XCircle size={16} className="text-red-600" />,
    Late: <Clock size={16} className="text-yellow-600" />,
  };

  const getStatusStyles = (status) => ({
    badge: getAttendanceStatusClass(status),
    icon: statusIcons[status] || <Info size={16} />,
  });

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === 'Present').length,
    absent: records.filter(r => r.status === 'Absent').length,
    late: records.filter(r => r.status === 'Late').length,
  };

  if (loading) return <div className="p-6 text-center animate-pulse text-gray-500">Loading your attendance...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="text-blue-600" /> My Attendance History
        </h2>
        <button
          onClick={handleExportPDF}
          // Disable if no records or if currently exporting
          disabled={exporting || records.length === 0}
          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
            exporting || records.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
          }`}
        >
          <FileDown size={18} />
          {exporting ? 'Generating...' : 'Export PDF Report'}
        </button>
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <Filter size={18} />
          <span className="font-semibold">Filter Records:</span>
        </div>
        <div>
          <label htmlFor="filterStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date:
          </label>
          <input
            type="date"
            id="filterStartDate"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="filterEndDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date:
          </label>
          <input
            type="date"
            id="filterEndDate"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="p-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
          className="ml-auto p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <XIcon size={18} /> Clear Filters
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50 dark:bg-gray-700/50">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase font-bold">Total Days</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-green-600 uppercase font-bold">Present</p>
          <p className="text-2xl font-black text-green-600">{stats.present}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-red-600 uppercase font-bold">Absent</p>
          <p className="text-2xl font-black text-red-600">{stats.absent}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-yellow-600 uppercase font-bold">Late</p>
          <p className="text-2xl font-black text-yellow-600">{stats.late}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Class</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {records.length > 0 ? (
              records.map((record) => {
                const { badge, icon } = getStatusStyles(record.status);
                return (
                  <tr key={record._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 font-medium">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {record.class_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge}`}>
                        {icon}
                        {record.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-10 text-center text-gray-500 italic">No attendance records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentAttendanceView;