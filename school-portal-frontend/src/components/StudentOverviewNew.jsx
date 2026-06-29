import React from 'react';
import { termLabels } from '../utils/academicUtils';
import { useTheme } from '../context/ThemeContext';

const StudentOverview = ({ data, onNavigateToTab }) => {
  if (!data) return null;
  const { theme } = useTheme();

  const { profile, academic_summary } = data;

  return (
    <div style={{ color: theme.text, maxWidth: "1000px" }}>
      {/* Welcome Card */}
      <div style={{ padding: "24px", borderRadius: "12px", backgroundColor: theme.card, border: `1px solid ${theme.inputBorder}`, marginBottom: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>
          Welcome back, {profile.full_name.split(' ')[0]}! 👋
        </h2>
        <p className="text-sm" style={{ color: theme.subText, margin: "0" }}>
          You're in <strong>{profile.assigned_class || "Class"}</strong>. Here's your quick summary.
        </p>
      </div>

      {/* Two-Column Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
        
        {/* Attendance Card */}
        <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: theme.card, border: `1px solid ${theme.inputBorder}` }}>
          <div className="text-xs" style={{ fontWeight: "700", color: theme.subText, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            📅 Attendance Rate
          </div>
          <div style={{ fontSize: "2.5rem", fontWeight: "800", marginBottom: "16px", color: "#059669" }}>
            {data.attendance_stats?.summary?.attendance_rate || "N/A"}%
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", paddingTop: "12px", borderTop: `1px solid ${theme.inputBorder}` }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: theme.text }}>{data.attendance_stats?.summary?.present_days}</div>
              <div className="text-xs" style={{ color: theme.subText, fontWeight: "600", marginTop: "4px" }}>Present</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: theme.text }}>{data.attendance_stats?.summary?.late_days}</div>
              <div className="text-xs" style={{ color: theme.subText, fontWeight: "600", marginTop: "4px" }}>Late</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: theme.text }}>{data.attendance_stats?.summary?.absent_days}</div>
              <div className="text-xs" style={{ color: theme.subText, fontWeight: "600", marginTop: "4px" }}>Absent</div>
            </div>
          </div>
        </div>

        {/* Recent Results Card */}
        <div style={{ padding: "20px", borderRadius: "12px", backgroundColor: theme.card, border: `1px solid ${theme.inputBorder}` }}>
          <div className="text-xs" style={{ fontWeight: "700", color: theme.subText, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
            <span>🎓 Recent Results</span>
            <span className="text-xs" style={{ cursor: "pointer", color: theme.accent, fontWeight: "700", textDecoration: "underline" }} onClick={() => onNavigateToTab('results')}>View All →</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {academic_summary && academic_summary.length > 0 ? (
              academic_summary.slice(0, 3).map((res, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px", backgroundColor: theme.inputBg, borderRadius: "8px" }}>
                  <div>
                    <div className="text-xs" style={{ fontWeight: "700", color: theme.text }}>{res.subject}</div>
                    <div className="text-xs" style={{ color: theme.subText, marginTop: "2px" }}>{termLabels[res.term] || `Term ${res.term}`}, {res.year}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="text-xs" style={{ fontWeight: "700", color: theme.text }}>{res.score}%</span>
                    <div className="text-xs" style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "#6366f1", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                      {res.grade_letter}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs" style={{ textAlign: "center", padding: "20px", color: theme.subText }}>No results yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Info Badges */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: theme.card, border: `1px solid ${theme.inputBorder}`, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#dbeafe", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", fontWeight: "700" }}>👤</div>
          <div>
            <div className="text-xs" style={{ fontWeight: "700", color: theme.subText }}>STUDENT ID</div>
            <div className="text-sm" style={{ fontWeight: "800", color: theme.text }}>{profile.school_id}</div>
          </div>
        </div>
        <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: theme.card, border: `1px solid ${theme.inputBorder}`, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", fontWeight: "700" }}>📊</div>
          <div>
            <div className="text-xs" style={{ fontWeight: "700", color: theme.subText }}>CURRENT CLASS</div>
            <div className="text-sm" style={{ fontWeight: "800", color: theme.text }}>{profile.assigned_class || "N/A"}</div>
          </div>
        </div>
        <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: theme.card, border: `1px solid ${theme.inputBorder}`, display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem", fontWeight: "700" }}>⏰</div>
          <div>
            <div className="text-xs" style={{ fontWeight: "700", color: theme.subText }}>ACADEMIC YEAR</div>
            <div className="text-sm" style={{ fontWeight: "800", color: theme.text }}>Year 1</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;
