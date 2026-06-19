import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CalendarDays, FileText, Filter, Download, AlertCircle } from 'lucide-react';

const StudentAttendanceLog = ({ theme }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      
      const response = await api.get('/attendance/my-attendance', { params });
      setRecords(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = {};
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const response = await api.get('/attendance/export-report', { 
        params,
        responseType: 'blob' 
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Error exporting PDF: " + (err.response?.data?.message || err.message));
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Present': return { bg: '#ecfdf5', text: '#10b981' };
      case 'Absent': return { bg: '#fee2e2', text: '#ef4444' };
      case 'Late': return { bg: '#fffbeb', text: '#f59e0b' };
      default: return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  return (
    <div className="w-full space-y-6" style={{ color: theme.text }}>
      <div className="p-6 rounded-2xl shadow-md border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <CalendarDays size={28} color={theme.accent} />
            <h2 className="text-2xl font-extrabold tracking-tight">Attendance History</h2>
          </div>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all active:scale-95 text-sm shadow-lg"
          >
            <Download size={18} /> Export PDF Report
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl" style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
          <div className="flex items-center gap-2">
            <Filter size={16} className="opacity-50" />
            <span className="text-xs font-bold uppercase tracking-wider">Date Range:</span>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="date" 
              value={dateRange.start} 
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="p-2 text-xs rounded-lg border outline-none font-bold"
              style={{ backgroundColor: theme.card, borderColor: theme.inputBorder, color: theme.text }}
            />
            <span className="opacity-50 text-xs font-bold">TO</span>
            <input 
              type="date" 
              value={dateRange.end} 
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="p-2 text-xs rounded-lg border outline-none font-bold"
              style={{ backgroundColor: theme.card, borderColor: theme.inputBorder, color: theme.text }}
            />
            <button 
              onClick={fetchAttendance}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-extrabold hover:bg-blue-600 transition-colors uppercase"
            >
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center opacity-60 font-medium">Synchronizing academic records...</div>
        ) : records.length === 0 ? (
          <div className="py-20 text-center space-y-4 opacity-40">
            <FileText size={64} className="mx-auto" strokeWidth={1} />
            <p className="text-sm font-bold uppercase tracking-widest">{error || "No records found for this period"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.inputBorder}` }}>
                  <th className="p-4 text-xs font-black uppercase opacity-50">Log Date</th>
                  <th className="p-4 text-xs font-black uppercase opacity-50">Class/Group</th>
                  <th className="p-4 text-xs font-black uppercase opacity-50 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const style = getStatusStyle(rec.status);
                  return (
                    <tr key={rec._id} style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                      <td className="p-4 font-bold text-sm">
                        {new Date(rec.date).toLocaleDateString('en-GB', { 
                          day: '2-digit', 
                          month: 'short', 
                          year: 'numeric',
                          timeZone: 'UTC' 
                        })}
                      </td>
                      <td className="p-4 text-sm font-medium opacity-70">{rec.class_name || "General"}</td>
                      <td className="p-4 text-center">
                        <span style={{ 
                          backgroundColor: `${style.bg}`, 
                          color: style.text,
                          padding: '6px 16px',
                          borderRadius: '12px',
                          fontSize: '0.6875rem',
                          fontWeight: '900',
                          textTransform: 'uppercase',
                          border: `1px solid ${style.text}20`
                        }}>
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAttendanceLog;