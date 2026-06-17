import React, { useState, useEffect } from 'react';
import { LogOut, Sun, Moon, BookOpen, Award, CalendarDays, LayoutDashboard, DollarSign, Settings } from 'lucide-react';
import { getUserInfo, logout } from '../utils/authUtils';
import api from '../api/axios';
import StudentResultsView from '../components/StudentResultsView';
// Assuming you'll create these components for other tabs
import StudentOverview from '../components/StudentOverview'; 
import StudentAttendanceLog from '../components/StudentAttendanceLog';
import StudentFeesView from '../components/StudentFeesView';
import ProfileSettings from '../components/ProfileSettings';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [darkMode, setDarkMode] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = getUserInfo();
    setUserInfo(user);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDarkMode(true);
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

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const handleLogout = () => {
    logout();
  };

  const theme = {
    bg: darkMode ? "#111827" : "#f3f4f6",
    card: darkMode ? "#1f2937" : "#ffffff",
    text: darkMode ? "#f9fafb" : "#111827",
    subText: darkMode ? "#9ca3af" : "#6b7280",
    inputBg: darkMode ? "#374151" : "#ffffff",
    inputBorder: darkMode ? "#4b5563" : "#d1d5db",
    tableHeader: darkMode ? "#111827" : "#f8fafc",
    accent: "#003DA5" // Shifted to Brand Blue
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
      fontWeight: "700",
      fontSize: "16px",
      transition: "0.2s",
      flexShrink: 0,
      whiteSpace: "nowrap"
    }
  };

  return (
    <div className="px-4 sm:px-10 py-8 min-h-screen transition-colors duration-500 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-x-hidden text-[19px] lg:text-[17px]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto gap-4 mb-10 no-print">
        <h1 className="flex items-center gap-3 text-3xl font-black tracking-tighter text-gray-900 dark:text-white">
          <BookOpen size={28} className="text-indigo-600 dark:text-indigo-400" /> 
          Student Portal
        </h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mr-1">{userInfo.full_name}</span>
          
          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-xl border transition-all bg-white text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700/50 shadow-sm"
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={handleLogout} 
            className="bg-red-50 hover:bg-red-100 text-school-red dark:bg-school-red-dark/20 dark:hover:bg-school-red-dark/40 dark:text-school-red-light px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shadow-sm"
          >
            <LogOut size={16} /> 
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 max-w-6xl mx-auto mb-10 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar scroll-smooth no-print">
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            ...styles.tabButton,
            color: activeTab === "overview" ? theme.accent : theme.subText,
            borderBottom: activeTab === "overview" ? `3px solid ${theme.accent}` : "none",
            transform: activeTab === "overview" ? 'translateY(1px)' : 'none'
          }}
        >
          <LayoutDashboard size={18} /> Overview
        </button>
        <button
          onClick={() => setActiveTab("results")}
          style={{
            ...styles.tabButton,
            color: activeTab === "results" ? theme.accent : theme.subText,
            borderBottom: activeTab === "results" ? `3px solid ${theme.accent}` : "none",
            transform: activeTab === "results" ? 'translateY(1px)' : 'none'
          }}
        >
          <Award size={18} /> My Results
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          style={{
            ...styles.tabButton,
            color: activeTab === "attendance" ? theme.accent : theme.subText,
            borderBottom: activeTab === "attendance" ? `3px solid ${theme.accent}` : "none",
            transform: activeTab === "attendance" ? 'translateY(1px)' : 'none'
          }}
        >
          <CalendarDays size={18} /> My Attendance
        </button>
        <button
          onClick={() => setActiveTab("fees")}
          style={{
            ...styles.tabButton,
            color: activeTab === "fees" ? theme.accent : theme.subText,
            borderBottom: activeTab === "fees" ? `3px solid ${theme.accent}` : "none",
            transform: activeTab === "fees" ? 'translateY(1px)' : 'none'
          }}
        >
          <DollarSign size={18} /> My Fees
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            ...styles.tabButton,
            color: activeTab === "settings" ? theme.accent : theme.subText,
            borderBottom: activeTab === "settings" ? `3px solid ${theme.accent}` : "none",
            transform: activeTab === "settings" ? 'translateY(1px)' : 'none'
          }}
        >
          <Settings size={18} /> Settings
        </button>
      </div>

      <main className="max-w-6xl mx-auto w-full min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {loading ? (
          <div className="p-20 text-center animate-pulse font-black text-gray-400 uppercase tracking-widest text-xs">Syncing Portal Data...</div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40 font-bold text-sm">{error}</div>
        ) : (
          <div className="flex flex-col gap-6 w-full">
            {activeTab === "overview" && <StudentOverview theme={theme} data={dashboardData} onNavigateToTab={setActiveTab} />}
            {activeTab === "results" && <StudentResultsView theme={theme} />}
            {activeTab === "attendance" && <StudentAttendanceLog theme={theme} />}
            {activeTab === "fees" && <StudentFeesView theme={theme} />}
            {activeTab === "settings" && <ProfileSettings theme={theme} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;