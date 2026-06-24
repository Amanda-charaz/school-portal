import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { subjectOptions } from "../utils/academicUtils";
import { Edit, Trash2, BookOpen, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const TeacherSubjectManagement = () => {
  const { theme } = useTheme();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [editFormData, setEditFormData] = useState({ assigned_subjects: [] });

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/users/role/teacher");
      console.log("Fetched teachers data:", response.data);
      setTeachers(response.data);
    } catch (err) {
      setMessage("❌ Failed to load teachers: " + (err.response?.data?.message || "Server error"));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (teacher) => {
    setSelectedTeacher(teacher);
    setEditFormData({ assigned_subjects: [...(teacher.assigned_subjects || [])] });
    setMessage("");
  };

  const handleSubjectCheckbox = (subject) => {
    const current = editFormData.assigned_subjects;
    if (current.includes(subject)) {
      setEditFormData({
        assigned_subjects: current.filter(s => s !== subject)
      });
    } else {
      setEditFormData({
        assigned_subjects: [...current, subject]
      });
    }
  };

  const handleSaveSubjects = async () => {
    if (!selectedTeacher) return;
    console.log("Saving subjects:", editFormData.assigned_subjects);
    try {
      const response = await api.put(`/admin/users/${selectedTeacher._id}`, {
        assigned_subjects: editFormData.assigned_subjects
      });
      console.log("Update response:", response.data);
      setMessage("✅ Subjects updated successfully!");
      setTimeout(() => {
        setSelectedTeacher(null);
        setMessage("");
        fetchTeachers();
      }, 1500);
    } catch (err) {
      console.error("Save error:", err);
      setMessage("❌ " + (err.response?.data?.message || "Failed to update subjects"));
    }
  };

  const handleCloseModal = () => {
    setSelectedTeacher(null);
    setMessage("");
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm("Are you sure you want to permanently delete this teacher? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete(`/admin/users/${teacherId}`);
      setMessage("✅ Teacher deleted successfully!");
      setTimeout(() => {
        setMessage("");
        fetchTeachers();
      }, 1500);
    } catch (err) {
      setMessage("❌ Failed to delete teacher: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ ...styles.container, backgroundColor: theme.card }}>
      <div style={styles.header}>
        <h2 style={{ color: theme.text, display: "flex", alignItems: "center", gap: "8px" }}>
          <BookOpen size={24} /> Manage Teacher Subjects
        </h2>
        <button
          onClick={fetchTeachers}
          style={{
            backgroundColor: theme.accent,
            color: "white",
            padding: "8px 12px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600"
          }}
        >
          Refresh
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: "12px",
            marginBottom: "16px",
            borderRadius: "6px",
            backgroundColor: message.includes("✅") ? "#ecfdf5" : "#fee2e2",
            color: message.includes("✅") ? "#065f46" : "#991b1b",
            fontSize: "14px",
            fontWeight: "500",
            border: `1px solid ${message.includes("✅") ? "#10b981" : "#fca5a5"}`
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: theme.subText }}>
          Loading teachers...
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr style={{ backgroundColor: theme.tableHeader }}>
                <th style={{ ...styles.th, color: theme.subText }}>School ID</th>
                <th style={{ ...styles.th, color: theme.subText }}>Full Name</th>
                <th style={{ ...styles.th, color: theme.subText }}>Email</th>
                <th style={{ ...styles.th, color: theme.subText }}>Assigned Subjects</th>
                <th style={{ ...styles.th, color: theme.subText }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <tr key={teacher._id} style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                    <td style={{ ...styles.td, color: theme.text, fontWeight: "bold" }}>{teacher.school_id}</td>
                    <td style={{ ...styles.td, color: theme.text }}>{teacher.full_name}</td>
                    <td style={{ ...styles.td, color: theme.text, fontSize: "12px" }}>{teacher.email}</td>
                    <td style={{ ...styles.td, color: theme.text }}>
                      {teacher.assigned_subjects && teacher.assigned_subjects.length > 0
                        ? teacher.assigned_subjects.join(", ")
                        : "No subjects assigned"}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleEditClick(teacher)}
                        style={{ ...styles.iconBtn, color: theme.accent, marginRight: "8px" }}
                        title="Edit Subjects"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTeacher(teacher._id)}
                        style={{ ...styles.iconBtn, color: "#ef4444" }}
                        title="Delete Teacher"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ ...styles.td, textAlign: "center", color: theme.subText, padding: "40px" }}>
                    No teachers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {selectedTeacher && (
        <div style={styles.overlay}>
          <div style={{ ...styles.modal, backgroundColor: theme.card, borderColor: theme.inputBorder }}>
            <div style={styles.modalHeader}>
              <h3 style={{ ...styles.modalTitle, color: theme.text }}>
                Edit Subjects for {selectedTeacher.full_name}
              </h3>
              <button onClick={handleCloseModal} style={styles.closeBtn}>
                <X size={20} color={theme.text} />
              </button>
            </div>

            {message && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "16px",
                  borderRadius: "6px",
                  backgroundColor: message.includes("✅") ? "#ecfdf5" : "#fee2e2",
                  color: message.includes("✅") ? "#065f46" : "#991b1b",
                  fontSize: "13px",
                  fontWeight: "500"
                }}
              >
                {message}
              </div>
            )}

            <div style={styles.subjectBox}>
              <span style={{ ...styles.subjectHeading, color: theme.text }}>
                <BookOpen size={16} /> Select Teaching Subjects
              </span>
              <div style={styles.gridContainer}>
                {subjectOptions.map((sub) => (
                  <label key={sub} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={editFormData.assigned_subjects.includes(sub)}
                      onChange={() => handleSubjectCheckbox(sub)}
                      style={styles.checkbox}
                    />
                    <span style={{ color: theme.text }}>{sub}</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={handleCloseModal}
                style={{
                  ...styles.button,
                  backgroundColor: theme.inputBg,
                  color: theme.text,
                  border: `1px solid ${theme.inputBorder}`
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubjects}
                style={{
                  ...styles.button,
                  backgroundColor: theme.accent,
                  color: "white"
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  th: {
    padding: "12px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  td: {
    padding: "12px",
    fontSize: "14px"
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center"
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000
  },
  modal: {
    padding: "28px",
    borderRadius: "10px",
    width: "520px",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    border: "1px solid"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },
  modalTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "700"
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center"
  },
  subjectBox: {
    padding: "16px",
    marginBottom: "20px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc"
  },
  subjectHeading: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "12px"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    cursor: "pointer"
  },
  checkbox: {
    width: "16px",
    height: "16px",
    cursor: "pointer"
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "20px"
  },
  button: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    transition: "all 0.2s"
  }
};

export default TeacherSubjectManagement;
