import React, { useState, useEffect } from 'react';
import { LogOut, Sun, Moon, BookOpen, Award, CalendarDays, LayoutDashboard, DollarSign, Settings } from 'lucide-react';
import { getUserInfo, logout } from '../utils/authUtils';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';
import StudentResultsView from '../components/StudentResultsView';
// Assuming you'll create these components for other tabs
import StudentOverview from '../components/StudentOverview'; 
import StudentAttendanceLog from '../components/StudentAttendanceLog';
import StudentFeesView from '../components/StudentFeesView';
import ProfileSettings from '../components/ProfileSettings';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { theme, darkMode, toggleTheme } = useTheme();
  const [userInfo, setUserInfo] = useState({});
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadFreshUserInfo = async () => {
      try {
        const response = await api.get("/auth/me");
        setUserInfo(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (err) {
        console.error("Failed to fetch user info", err);
        setUserInfo(getUserInfo());
      }
    };

    loadFreshUserInfo();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/student/dashboard");
        setDashboardData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const styles = {
    tabButton: { 
      background: "none",
      border: "none", 
      padding: "12px 16px", 
      cursor: "pointer",
      display: "flex", 
      alignItems: "center", 
      gap: "8px", 
      fontWeight: "500",
      fontSize: "14px",
      lineHeight: "1.4",
      transition: "0.2s",
      flexShrink: 0,
      whiteSpace: "nowrap"
    }
  };

  return (
    <div className="px-4 sm:px-10 py-8 min-h-screen transition-colors duration-500 bg-school-beige text-school-text dark:bg-school-beige-dark dark:text-school-text-dark overflow-x-hidden">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto gap-4 mb-10 no-print">
        <h1 className="flex items-center gap-3 text-xl font-bold tracking-tight text-school-text dark:text-school-text-dark leading-tight">
          <BookOpen size={28} className="text-school-blue dark:text-blue-400" />
          Student Portal
        </h1>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-sm font-medium text-school-muted dark:text-school-muted-dark mr-1">{userInfo.full_name}</span>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border transition-all bg-school-cream text-school-text border-school-border hover:bg-school-beige dark:bg-school-cream-dark dark:text-school-text-dark dark:border-school-border-dark dark:hover:bg-school-beige-dark shadow-sm"
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          <button
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-school-red dark:bg-school-red-dark/20 dark:hover:bg-school-red-dark/40 dark:text-school-red-light px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-semibold text-sm shadow-sm"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 max-w-6xl mx-auto mb-10 border-b border-school-border dark:border-school-border-dark overflow-x-auto no-scrollbar scroll-smooth no-print">
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            ...styles.tabButton,
            color: activeTab === "overview" ? theme.accentBlue : theme.subText,
            borderBottom: activeTab === "overview" ? `3px solid ${theme.accentBlue}` : "none",
            transform: activeTab === "overview" ? 'translateY(1px)' : 'none'
          }}
        >
          <LayoutDashboard size={18} /> Overview
        </button>
        <button
          onClick={() => setActiveTab("results")}
          style={{
            ...styles.tabButton,
            color: activeTab === "results" ? theme.accentBlue : theme.subText,
            borderBottom: activeTab === "results" ? `3px solid ${theme.accentBlue}` : "none",
            transform: activeTab === "results" ? 'translateY(1px)' : 'none'
          }}
        >
          <Award size={18} /> My Results
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          style={{
            ...styles.tabButton,
            color: activeTab === "attendance" ? theme.accentBlue : theme.subText,
            borderBottom: activeTab === "attendance" ? `3px solid ${theme.accentBlue}` : "none",
            transform: activeTab === "attendance" ? 'translateY(1px)' : 'none'
          }}
        >
          <CalendarDays size={18} /> My Attendance
        </button>
        <button
          onClick={() => setActiveTab("fees")}
          style={{
            ...styles.tabButton,
            color: activeTab === "fees" ? theme.accentBlue : theme.subText,
            borderBottom: activeTab === "fees" ? `3px solid ${theme.accentBlue}` : "none",
            transform: activeTab === "fees" ? 'translateY(1px)' : 'none'
          }}
        >
          <DollarSign size={18} /> My Fees
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            ...styles.tabButton,
            color: activeTab === "settings" ? theme.accentBlue : theme.subText,
            borderBottom: activeTab === "settings" ? `3px solid ${theme.accentBlue}` : "none",
            transform: activeTab === "settings" ? 'translateY(1px)' : 'none'
          }}
        >
          <Settings size={18} /> Settings
        </button>
      </div>

      <main className="max-w-6xl mx-auto w-full min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {loading ? (
          <div className="p-20 text-center animate-pulse font-black text-gray-400 uppercase tracking-wide text-xs">Syncing Portal Data...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40 font-bold text-sm">{error}</div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {activeTab === "overview" && <StudentOverview theme={theme} data={dashboardData} onNavigateToTab={setActiveTab} />}
            {activeTab === "results" && <StudentResultsView />}
            {activeTab === "attendance" && <StudentAttendanceLog />}
            {activeTab === "fees" && <StudentFeesView />}
            {activeTab === "settings" && <ProfileSettings />}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;