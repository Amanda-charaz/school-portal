import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';

const TeacherAttendanceReport = () => {
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendanceTrends = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/attendance/teacher-trends', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch attendance trends.');
        }

        const data = await response.json();
        setTrends(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceTrends();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZW', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700/50 overflow-hidden transition-all">
      {/* Dynamic Header Block */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <TrendingUp className="text-purple-600 dark:text-purple-400" size={22} /> 
          Last 30 Days Attendance Trends
        </h2>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="p-8 text-center text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">
            Compiling statistical trends...
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl text-sm font-medium border bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-300">
            Error: {error}
          </div>
        ) : trends.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 dark:text-gray-500 font-medium my-2">
            No attendance data available for your classes in the last 30 days.
          </div>
        ) : (
          /* Styled Ledger Wrapper Box */
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/60">
                  <tr>
                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1.5">
                        <CheckCircle size={14} className="text-green-600 dark:text-green-400" /> 
                        <span>Present</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1.5">
                        <XCircle size={14} className="text-red-600 dark:text-red-400" /> 
                        <span>Absent</span>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock size={14} className="text-yellow-600 dark:text-yellow-400" /> 
                        <span>Late</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {trends.map((dayTrend) => (
                    <tr key={dayTrend._id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-200">
                        {formatDate(dayTrend._id)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-600 dark:text-green-400">
                        <span className="px-2.5 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          {dayTrend.present}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-red-600 dark:text-red-400">
                        <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          {dayTrend.absent}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-yellow-600 dark:text-yellow-500">
                        <span className="px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                          {dayTrend.late}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherAttendanceReport;