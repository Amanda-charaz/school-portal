import React, { useState, useEffect } from 'react';
import Attendance from '../components/Attendance'; // ✅ Bound to the Active Refined Component
import Result from '../components/Result';
import TeacherPortal from './TeacherPortal';
import ProfileSettings from '../components/ProfileSettings';
import { LogOut, Sun, Moon, BookOpen, ClipboardCheck, PlusCircle, LayoutDashboard, Settings } from "lucide-react";
import { useTheme } from '../context/ThemeContext';
import { getUserInfo, logout } from "../utils/authUtils";
import api from '../api/axios';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { theme, darkMode, toggleTheme } = useTheme();
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const loadFreshUserInfo = async () => {
      try {
        // Fetch latest data from server
        const response = await api.get('/student/profile');
        setUserInfo(response.data);
        
        // Update local storage so other parts of the app have the new data
        const existingToken = localStorage.getItem('token');
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch (err) {
        console.error("Failed to sync user profile:", err);
        // Fallback to local storage if API fails
        setUserInfo(getUserInfo());
      }
    };

    loadFreshUserInfo();
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
      fontWeight: "600",
      fontSize: "14px",
      transition: "0.2s",
      flexShrink: 0,
      whiteSpace: "nowrap"
    }
  };

  return (
    <div className="px-4 sm:px-10 py-8 min-h-screen transition-colors duration-500 bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 overflow-x-hidden text-sm">
      
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row justify-between items-center max-w-6xl mx-auto gap-4 mb-10">
        <h1 className="flex items-center gap-3 text-[22px] font-black tracking-tighter text-gray-900 dark:text-white">
          <BookOpen size={28} className="text-indigo-600 dark:text-indigo-400" /> 
          Teacher Hub
        </h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">{userInfo.full_name}</span>
          
          {/* Dark Mode Switcher */}
          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-xl border transition-all bg-white text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700/50 shadow-sm"
          >
            {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>
          
          {/* Logout Action */}
          <button 
            onClick={handleLogout} 
            className="bg-red-50 hover:bg-red-100 text-school-red dark:bg-school-red-dark/20 dark:hover:bg-school-red-dark/40 dark:text-school-red-light px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shadow-sm"
          >
            <LogOut size={16} /> 
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Tabs Layout Navigation Section */}
      <div className="flex gap-2 max-w-6xl mx-auto mb-10 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveTab("overview")}
          style={{
            ...styles.tabButton,
            color: activeTab === "overview" ? theme.accent : theme.subText,
            borderBottom: activeTab === "overview" ? `3px solid ${theme.accent}` : "none",
            transform: activeTab === "overview" ? 'translateY(1px)' : 'none'
          }}
        >
          <LayoutDashboard size={18} /> 
          Overview
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
          <ClipboardCheck size={18} /> 
          Attendance
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
          <PlusCircle size={18} /> 
          Manage Results
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
          <Settings size={18} /> 
          Settings
        </button>
      </div>

      {/* Main Viewport Routing Frame - Transitions applied for a sleek feel */}
      <main className="max-w-6xl mx-auto w-full min-w-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === "attendance" ? (
          <Attendance />
        ) : activeTab === "results" ? (
          <Result userInfo={userInfo} />
        ) : activeTab === "overview" ? (
          <TeacherPortal setOpen={setActiveTab} />
        ) : activeTab === "settings" ? (
          <ProfileSettings />
        ) : null}
      </main>
    </div>
  );
};

export default TeacherDashboard;