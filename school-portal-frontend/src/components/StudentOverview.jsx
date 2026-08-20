import React from 'react';
import { termLabels } from '../utils/academicUtils';
import { useTheme } from '../context/ThemeContext';

const StudentOverview = ({ data, onNavigateToTab }) => {
  if (!data) return null;
  const { theme } = useTheme();

  const { profile, academic_summary } = data;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Welcome Card Container */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white mb-2">
          Welcome back, {profile.full_name ? profile.full_name.split(' ')[0] : 'Student'}! 👋
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          You are currently in <span className="font-bold text-school-blue dark:text-blue-400">{profile.assigned_class || "Unassigned Class"}</span>. Here is your academic overview.
        </p>
      </div>

      {/* Two-Column Matrix Section Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Attendance Statistics Tracker Widget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex flex-col justify-between animate-float">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-4 flex items-center gap-2">
              <span>📅</span> Attendance Summary Rate
            </div>
            <div className="text-4xl font-semibold text-emerald-600 dark:text-emerald-400 mb-6">
              {data.attendance_stats?.summary?.attendance_rate || "0"}%
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100 dark:border-gray-700/60">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {data.attendance_stats?.summary?.present_days ?? 0}
              </div>
              <div className="text-xs uppercase tracking-wide text-gray-400 font-bold mt-1">Present</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                {data.attendance_stats?.summary?.late_days ?? 0}
              </div>
              <div className="text-xs uppercase tracking-wide text-gray-400 font-bold mt-1">Late</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-500 dark:text-red-400">
                {data.attendance_stats?.summary?.absent_days ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Examination Grade Results Feed Widget */}
        <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm animate-float">
          <div className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between tracking-tight">
            <span className="flex items-center gap-2">🎓 Recent Results</span>
            <button 
              onClick={() => onNavigateToTab && onNavigateToTab('results')} 
              className="text-xs font-extrabold text-school-red hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline bg-transparent border-none cursor-pointer"
            >
              View All →
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            {academic_summary && academic_summary.length > 0 ? (
              academic_summary.slice(0, 3).map((res, idx) => (
                <div 
                  key={idx} 
                  className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-gray-900/40 border border-gray-100/50 dark:border-gray-800/40 transition-all"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{res.subject}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{termLabels[res.term] || `Term ${res.term}`}, {res.year}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{res.score}%</span>
                    <div className="w-8 h-8 rounded-lg bg-school-blue text-white font-semibold text-xs flex items-center justify-center shadow-sm">
                      {res.grade_letter}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs font-medium text-gray-400 dark:text-gray-500">
                No official academic report cards generated yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Primary Demographic Metadata Badges Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Badge Metric One */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3 animate-float">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg font-bold shrink-0">
            👤
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Student ID</div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">{profile.school_id}</div>
          </div>
        </div>

        {/* Badge Metric Two */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3 animate-float">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold shrink-0">
            📊
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Stream</div>
            <div className="text-xs font-semibold text-gray-900 dark:text-white truncate">{profile.assigned_class || "Unallocated"}</div>
          </div>
        </div>

        {/* Badge Metric Three */}
        <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-sm flex items-center gap-3 animate-float">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg font-bold shrink-0">
            ⏰
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fees Balance</div>
            <div className={`text-xs font-semibold truncate ${
              data.financial_status?.total_balance > 0 
                ? 'text-school-red' 
                : 'text-gray-900 dark:text-white'
            }`}>
              ${data.financial_status?.total_balance?.toLocaleString() || "0"}
            </div>
            {data.financial_status?.total_balance > 0 && (
              <div className="text-xs font-semibold text-school-red uppercase tracking-tighter bg-red-50 dark:bg-red-900/20 px-1 rounded inline-block">
                Outstanding
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
export default StudentOverview;