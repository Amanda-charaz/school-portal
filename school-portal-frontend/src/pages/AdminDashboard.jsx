import React, { useState, useEffect } from "react";
import UserManagement from "../components/UserManagement";
import TeacherSubjectManagement from "../components/TeacherSubjectManagement";
import ClassManagement from "../components/ClassManagement";
import AdminAttendanceView from "../components/AdminAttendanceView";
import AccountManagement from "../components/AccountManagement";
import Result from "../components/Result";
import { getGradeColor } from "../utils/academicUtils";
import api from "../api/axios";
import {
  PlusCircle,
  LogOut,
  User,
  BookOpen,
  Users,
  Sun,
  Moon,
  Shield,
  Settings,
  Activity,
  ClipboardList,
  ClipboardCheck,
  Eye, // Used for viewing log details
  X,   // Used for closing modal
  Search, // New icon for search bar
  DollarSign,
  Trash2
} from "lucide-react";
import { getUserInfo, logout } from "../utils/authUtils";
import { useTheme } from "../context/ThemeContext";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("results");
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [logError, setLogError] = useState("");
  const { theme, darkMode, toggleTheme } = useTheme();
  const [userInfo, setUserInfo] = useState({});
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [selectedLog, setSelectedLog] = useState(null);
  const [systemLogSearchTerm, setSystemLogSearchTerm] = useState(""); // New state for search term
  const [deleteConfirm, setDeleteConfirm] = useState(null); // Stores ID of item to delete

  // Toggle function with persistence

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get("/admin/logs");
      setAuditLogs(response.data);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setLogError("Failed to load audit logs. " + (err.response?.data?.message || err.message));
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const response = await api.get("/admin/system-logs");
      setSystemLogs(response.data);
    } catch (err) {
      console.error("Failed to fetch system logs:", err);
      setLogError("Failed to load system logs. " + (err.response?.data?.message || err.message));
    }
  };

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
    fetchAuditLogs();
    fetchSystemLogs();

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const styles = getResponsiveStyles(windowWidth);

  const filteredSystemLogs = systemLogs.filter(log => {
    const searchTermLower = systemLogSearchTerm.toLowerCase();
    return log.actionType.toLowerCase().includes(searchTermLower) ||
           (log.performedBy?.full_name || '').toLowerCase().includes(searchTermLower);
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
      <main className="flex-1 w-full p-4 sm:p-10 overflow-x-hidden flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4 mb-10 no-print">
          <h1 className="flex items-center gap-3 text-[22px] font-black tracking-tighter text-gray-900 dark:text-white">
            <Shield size={28} color={theme.accent} /> Admin Portal
          </h1>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span className="text-sm font-medium" style={{ color: theme.subText }}>{userInfo.full_name}</span>
            <button onClick={toggleTheme} className="p-2.5 rounded-xl border transition-all bg-white text-gray-700 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700/50 shadow-sm">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-school-red dark:bg-school-red-dark/20 dark:hover:bg-school-red-dark/40 dark:text-school-red-light px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shadow-sm">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </div>

        {logError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
            {logError}
          </div>
        )}

        {/* Tabs Switcher */}
        <div className="flex gap-2 w-full mb-10 border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar scroll-smooth no-print">
          <button
            onClick={() => setActiveTab("results")}
            style={{
              ...styles.tabButton,
              color: activeTab === "results" ? theme.accent : theme.subText,
              borderBottom: activeTab === "results" ? `3px solid ${theme.accent}` : "none"
            }}
          >
            <PlusCircle size={18} /> Manage Results
          </button>
        <button
          onClick={() => setActiveTab("users")}
          style={{
            ...styles.tabButton,
            color: activeTab === "users" ? theme.accent : theme.subText,
            borderBottom: activeTab === "users" ? `3px solid ${theme.accent}` : "none"
          }}
        >
          <Users size={18} /> Manage Users
        </button>
        <button
          onClick={() => setActiveTab("teachers")}
          style={{
            ...styles.tabButton,
            color: activeTab === "teachers" ? theme.accent : theme.subText,
            borderBottom: activeTab === "teachers" ? `3px solid ${theme.accent}` : "none"
          }}
        >
          <BookOpen size={18} /> Manage Teachers
        </button>
        <button
          onClick={() => setActiveTab("classes")}
          style={{
            ...styles.tabButton,
            color: activeTab === "classes" ? theme.accent : theme.subText,
            borderBottom: activeTab === "classes" ? `3px solid ${theme.accent}` : "none"
          }}
        >
          <BookOpen size={18} /> Manage Classes
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          style={{
            ...styles.tabButton,
            color: activeTab === "attendance" ? theme.accent : theme.subText,
            borderBottom: activeTab === "attendance" ? `3px solid ${theme.accent}` : "none"
          }}
        >
          <ClipboardCheck size={18} /> Attendance Records
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          style={{
            ...styles.tabButton,
            color: activeTab === "accounts" ? theme.accent : theme.subText,
            borderBottom: activeTab === "accounts" ? `3px solid ${theme.accent}` : "none"
          }}
        >
          <DollarSign size={18} /> Accounts
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          style={{
            ...styles.tabButton,
            color: activeTab === "audit" ? theme.accent : theme.subText,
            borderBottom: activeTab === "audit" ? `3px solid ${theme.accent}` : "none"
          }}
        >
          <Settings size={18} /> User Actions
        </button>
        <button
          onClick={() => setActiveTab("system-logs")}
          style={{
            ...styles.tabButton,
            color: activeTab === "system-logs" ? theme.accent : theme.subText,
            borderBottom: activeTab === "system-logs" ? `3px solid ${theme.accent}` : "none"
          }}
        >
          <Activity size={18} /> System Logs
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            ...styles.tabButton,
            color: activeTab === "settings" ? theme.accent : theme.subText,
            borderBottom: activeTab === "settings" ? `3px solid ${theme.accent}` : "none"
          }}
        >
          <Settings size={18} /> System Settings
        </button>
      </div>

      <div style={styles.mainLayout}>
        {activeTab === "results" ? (
          <div style={{ width: '100%' }}>
            <Result userInfo={userInfo} />
          </div>
        ) : activeTab === "users" ? (
          <div style={{ width: '100%' }}>
            <UserManagement />
          </div>
        ) : activeTab === "teachers" ? (
          <div style={{ width: '100%' }}>
            <TeacherSubjectManagement />
          </div>
        ) : activeTab === "classes" ? (
          <div style={{ width: '100%' }}>
            <ClassManagement />
          </div>
        ) : activeTab === "attendance" ? (
          <div style={{ width: '100%' }}>
            <AdminAttendanceView />
          </div>
        ) : activeTab === "accounts" ? (
          <div style={{ width: '100%' }}>
            <AccountManagement />
          </div>
        ) : activeTab === "audit" ? (
          <div style={{ ...styles.card, backgroundColor: theme.card, width: '100%' }}>
            <h2 style={{ ...styles.subtitle, color: theme.text }}>User Actions Log</h2> {/* Section Heading */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: theme.tableHeader }}>
                    <th style={{ ...styles.th, color: theme.subText }}>Student</th>
                    <th style={{ ...styles.th, color: theme.subText }}>Subject</th>
                    <th style={{ ...styles.th, color: theme.subText }}>Score</th>
                    <th style={{ ...styles.th, color: theme.subText }}>Grade</th>
                    <th style={{ ...styles.th, color: theme.subText }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                        <td style={{ ...styles.td, color: theme.text }}>{log.student?.full_name || "N/A"}</td>
                        <td style={{ ...styles.td, color: theme.text }}>{log.subject}</td>
                        <td style={{ ...styles.td, color: theme.text }}>{log.score}</td>
                        <td style={{ ...styles.td }}>
                          <span style={{ 
                            color: getGradeColor(log.grade), 
                            fontWeight: "bold",
                            backgroundColor: `${getGradeColor(log.grade)}15`,
                            padding: '2px 8px',
                            borderRadius: '4px'
                          }}>{log.grade}</span>
                        </td>
                        <td style={{ ...styles.td, color: theme.subText }}>
                          {new Date(log.updatedAt).toLocaleDateString('en-GB', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric',
                            timeZone: 'UTC' 
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ ...styles.td, textAlign: "center", color: theme.subText, padding: "40px" }}>
                        No user actions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "system-logs" ? (
          <div style={{ ...styles.card, backgroundColor: theme.card, width: '100%' }}>
            <h2 style={{ ...styles.subtitle, color: theme.text }}>System Audit Logs</h2> {/* Section Heading */}
            {/* Search Bar for System Logs */}
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <div style={{ position: 'absolute', insetY: 0, left: '12px', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                <Search size={18} color={theme.subText} />
              </div>
              <input
                type="text"
                placeholder="Search by action type or admin name..."
                value={systemLogSearchTerm}
                onChange={(e) => setSystemLogSearchTerm(e.target.value)}
                style={{ ...styles.input, paddingLeft: '40px', backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: theme.tableHeader }}>
                    <th style={{ ...styles.th, color: theme.subText }}>Action Type</th>
                    <th style={{ ...styles.th, color: theme.subText }}>Performed By</th>
                    <th style={{ ...styles.th, color: theme.subText }}>Target User</th>
                    <th style={{ ...styles.th, color: theme.subText }}>Details</th>
                    <th style={{ ...styles.th, color: theme.subText }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSystemLogs.length > 0 ? (
                    filteredSystemLogs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                        <td style={{ ...styles.td, color: theme.text, fontWeight: "bold" }}>
                          <span className="text-xs uppercase" style={{ padding: "4px 8px", borderRadius: "12px", backgroundColor: theme.inputBg }}>{log.actionType}</span>
                        </td>
                        <td style={{ ...styles.td, color: theme.text }}>{log.performedBy?.full_name} <span className="text-xs" style={{color: theme.subText}}>({log.performedBy?.school_id})</span></td>
                        <td style={{ ...styles.td, color: theme.text }}>{log.targetUser ? `${log.targetUser.full_name} (${log.targetUser.school_id})` : "N/A"}</td>
                        <td 
                          onClick={() => setSelectedLog(log)}
                          style={{ 
                            ...styles.td, 
                            color: theme.accent, 
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Eye size={14} /> View Details
                          </div>
                        </td>
                        <td style={{ ...styles.td, color: theme.subText }}>
                          {new Date(log.timestamp).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC'
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ ...styles.td, textAlign: "center", color: theme.subText, padding: "40px" }}>
                        No system logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ ...styles.card, backgroundColor: theme.card, width: '100%' }}>
            <h2 style={{ ...styles.subtitle, color: theme.text }}>System Settings</h2>
            <div style={{ color: theme.subText }}>
              <p><strong>Database:</strong> MongoDB</p>
              <p><strong>API Server:</strong> http://localhost:3000</p>
              <p><strong>Theme:</strong> {darkMode ? 'Dark' : 'Light'}</p>
              <p><strong>Version:</strong> 1.0.0</p>
            </div>
          </div>
        )}
      </div>
      </main>

      {/* Detail Modal */}
      {selectedLog && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, backgroundColor: theme.card, width: '100%', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: theme.text }}>Action Details: {selectedLog.actionType}</h3>
              <button onClick={() => setSelectedLog(null)} style={styles.iconBtn}><X size={20} color={theme.text} /></button>
            </div>
            <pre style={{ 
              backgroundColor: theme.inputBg, 
              color: theme.text, 
              padding: '15px', 
              borderRadius: '8px', 
              overflowX: 'auto',
              fontSize: '0.75rem',
              border: `1px solid ${theme.inputBorder}`,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            }}>
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedLog(null)} style={{ ...styles.button, width: 'auto', padding: '8px 20px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getResponsiveStyles = (width) => {
  const isMobile = width < 640;
  const isTablet = width < 1024;
  return {
    container: { padding: isMobile ? "16px" : "40px", minHeight: "100vh", transition: "all 0.3s ease" },
    header: { display: "flex", justifyContent: "space-between", width: "100%", margin: "0 0 10px", alignItems: "center" },
    tabContainer: {
      display: "flex",
      gap: "10px",
      width: "100%",
      margin: "0 0 30px",
      borderBottom: "1px solid #ddd",
      overflowX: "auto",
      scrollbarWidth: "none",
      WebkitOverflowScrolling: "touch"
      },
    tabButton: {
      background: "none",
      border: "none",
      padding: isMobile ? "8px 12px" : "10px 20px",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontWeight: "600",
      transition: "0.2s",
      flexShrink: 0,
      whiteSpace: "nowrap",
      fontSize: "14px"
      },
      title: { display: "flex", alignItems: "center", gap: "10px" },
    mainLayout: {
      display: "flex",
      flexDirection: isTablet && !isMobile ? "row" : "column",
      gap: "30px",
      width: "100%",
      boxSizing: "border-box",
      flexWrap: "wrap"
      },
      card: { padding: isMobile ? "16px" : "25px", borderRadius: "16px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", transition: "all 0.3s ease", flex: isTablet && !isMobile ? "1 1 calc(50% - 15px)" : "1" },
    subtitle: { marginBottom: "20px" },
    inputGroup: { marginBottom: "15px" },
    label: { display: "block", marginBottom: "5px", fontSize: "0.75rem", fontWeight: "600" },
    input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid", boxSizing: "border-box" },
    button: { width: "100%", padding: "12px", backgroundColor: "#6366f1", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
    themeBtn: { padding: "10px", borderRadius: "8px", border: "1px solid", cursor: "pointer" },
    logoutBtn: { backgroundColor: "#fee2e2", color: "#B22222", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" },
    th: { padding: isMobile ? "8px 12px" : "12px 16px", textAlign: "left" },
    td: { padding: isMobile ? "12px 16px" : "16px 24px" },
    overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" },
    modal: { padding: isMobile ? "20px" : "30px", borderRadius: "16px", maxHeight: "90vh", overflowY: "auto" },
    iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" },
  };
};

export default AdminDashboard;