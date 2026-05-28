import React, { useEffect, useState } from "react";
import api from "../api/axios";
import { User, GraduationCap, LogOut, Shield } from "lucide-react";
import StudentAttendanceView from "../components/StudentAttendanceView"; // Import the attendance component
import { getUserInfo, logout } from "../utils/authUtils";

const Dashboard = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get("/result/my-results");
        setResults(response.data);
      } catch (err) {
        console.error("Failed to fetch results", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    const user = getUserInfo();
    setUserInfo(user);
    fetchResults();
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <div style={styles.logo}>SchoolPortal</div>
        <div style={styles.roleIndicator}>
          <Shield size={16} /> {(userInfo.role || 'student').toUpperCase()}
        </div>
        <div style={styles.navItem}><User size={20} /> {userInfo.full_name || 'Profile'}</div>
        <div style={styles.navItem}><GraduationCap size={20} /> My Grades</div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} /> Logout
        </button>
      </nav>

      <main style={styles.content}>
        <header style={styles.header}>
          <h1 style={{ color: "#1e293b", margin: 0 }}>Student Dashboard</h1>
          <p style={{ color: "#64748b" }}>Welcome back, {userInfo.full_name}</p>
        </header>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">My Academic Results</h2>
          <div style={styles.grid}>
            {loading ? (
              <p className="text-gray-500">Loading your results...</p>
            ) : results.length > 0 ? (
              results.map((result) => (
                <div key={result._id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <h3 style={styles.subjectText}>{result.subject_name || "Untitled Subject"}</h3>
                    <span style={styles.gradeBadge}>{result.grade || "N/A"}</span>
                  </div>

                  <div style={styles.cardBody}>
                    <p><strong>Term:</strong> {result.term || "Final"}</p>
                    <p><strong>Score:</strong> {result.score ?? 0}%</p>
                  </div>

                  <div style={styles.progressBarContainer}>
                    <div style={{...styles.progressBar, width: `${result.score}%`}}></div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: "#64748b" }}>No results found for your account.</p>
            )}
          </div>
        </section>

        {/* Student Attendance View Section */}
        <section>
          <StudentAttendanceView />
        </section>
      </main>
    </div>
  );
};

const styles = {
  container: { display: "flex", minHeight: "100vh", backgroundColor: "#f9fafb" },
  sidebar: { width: "250px", backgroundColor: "#1e293b", color: "white", padding: "20px", display: "flex", flexDirection: "column" },
  logo: { fontSize: "24px", fontWeight: "bold", marginBottom: "20px", color: "#6366f1" },
  roleIndicator: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "600", color: "#a5f3fc", marginBottom: "20px", padding: "8px", backgroundColor: "#0c4a6e", borderRadius: "6px" },
  navItem: { display: "flex", alignItems: "center", gap: "10px", padding: "12px", cursor: "pointer", borderRadius: "8px", marginBottom: "8px" },
  content: { flex: 1, padding: "40px" },
  header: { marginBottom: "30px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" },
  card: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  subjectText: { fontSize: "18px", margin: 0, color: "#1e293b", fontWeight: "600" },
  gradeBadge: { backgroundColor: "#e0e7ff", color: "#4338ca", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" },
  cardBody: { fontSize: "14px", color: "#4b5563", marginBottom: "15px" },
  progressBarContainer: { height: "8px", backgroundColor: "#e5e7eb", borderRadius: "4px", overflow: "hidden" },
  progressBar: { height: "100%", backgroundColor: "#6366f1", transition: "width 0.5s ease" },
  logoutBtn: { marginTop: "auto", display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "#f87171", cursor: "pointer", padding: "12px", fontWeight: "600" },
};

export default Dashboard;