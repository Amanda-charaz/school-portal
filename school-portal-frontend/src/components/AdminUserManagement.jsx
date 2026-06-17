import React, { useState, useEffect } from "react";
import axios from "axios";
import { subjectOptions } from "../utils/academicUtils";
import { UserPlus, RefreshCw, BookOpen, Sparkles, Trash2 } from "lucide-react";

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [formData, setFormData] = useState({
    full_name: "",
    role: "student",
    assigned_subjects: []
  });

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = filterRole === "all" ? "/api/admin/users" : `/api/admin/users/role/${filterRole}`;
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Error pulling system accounts:", err);
    }
  };

  const handleSubjectCheckbox = (subject) => {
    const current = [...formData.assigned_subjects];
    if (current.includes(subject)) {
      setFormData({ ...formData, assigned_subjects: current.filter(s => s !== subject) });
    } else {
      setFormData({ ...formData, assigned_subjects: [...current, subject] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const token = localStorage.getItem('token');
      // Hits the backend automated creation logic (generates S1, T1, etc.)
      const response = await axios.post("/api/admin/users", formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(`🎉 Successfully created ${response.data.user.full_name}! ID assigned: ${response.data.user.school_id}`);
      setFormData({ full_name: "", role: "student", assigned_subjects: [] });
      fetchUsers();
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage("");
      }, 2000);
    } catch (err) {
      setMessage("❌ Failed to create user: " + (err.response?.data?.message || "Internal error"));
    }
  };

  const resetPassword = async (userId) => {
    if (!window.confirm("Are you sure you want to revert this user's password to '1234'?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/admin/users/${userId}/reset-password`, { newPassword: "1234" }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("🔄 Password successfully reset to the factory default: 1234");
    } catch (err) {
      alert("Error issuing credential adjustment.");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to permanently delete this account? This action cannot be undone.")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("🗑️ User account deleted successfully.");
      fetchUsers(); // Refresh the list
    } catch (err) {
      console.error("Delete failed:", err);
      alert("❌ Failed to delete user: " + (err.response?.data?.message || "Internal error"));
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 className="text-2xl font-bold">System Account Controls</h2>
        <button style={styles.addBtn} onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} /> Add Automatically Generated Account
        </button>
      </div>

      {/* --- Role Filter Tabs --- */}
      <div style={styles.filterBar}>
        {["all", "student", "teacher", "admin"].map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            style={{
              ...styles.filterTab,
              backgroundColor: filterRole === role ? "#2563eb" : "#e2e8f0",
              color: filterRole === role ? "white" : "#334155"
            }}
          >
            {role.toUpperCase()}S
          </button>
        ))}
      </div>

      {/* --- Users Table Layout --- */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th className="p-3 text-sm font-semibold tracking-wide text-left">System ID</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-left">Full Name</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-left">Login Username Address</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-left">Role Badge</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-left">Assigned Class / Subjects</th>
              <th className="p-3 text-sm font-semibold tracking-wide text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={styles.tr}>
                <td className="p-3 text-sm font-bold text-blue-600">{user.school_id}</td>
                <td className="p-3 text-sm text-gray-700">{user.full_name}</td>
                <td className="p-3 text-sm text-gray-700">{user.email}</td>
                <td className="p-3 text-sm">
                  <span style={{
                    ...styles.badge,
                    backgroundColor: user.role === "admin" ? "#ef4444" : user.role === "teacher" ? "#3b82f6" : "#10b981"
                  }}>
                    {user.role}
                  </span>
                </td>
                <td className="p-3 text-sm text-gray-700">
                  {user.role === "teacher" 
                    ? user.assigned_subjects?.join(", ") || "No subjects assigned" 
                    : user.assigned_class || "N/A"}
                </td>
                <td className="p-3 text-sm">
                  <button style={{ ...styles.iconBtn, color: "#f59e0b" }} onClick={() => resetPassword(user._id)} title="Reset to Default (1234)">
                    <RefreshCw size={16} />
                  </button>
                  <button style={{ ...styles.iconBtn, color: "#ef4444", marginLeft: "12px" }} onClick={() => handleDelete(user._id)} title="Delete User Account">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Account Provisioning Modal --- */}
      {isModalOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Provision New Core Account</h3>
            {message && <div style={styles.alert}>{message}</div>}
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label className="text-sm font-semibold text-gray-600">Full Legal Name</label>
                <input
                  className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g., Alima Charamanda"
                />
              </div>

              <div style={styles.inputGroup}>
                <label className="text-sm font-semibold text-gray-600">Portal Privilege Level</label>
                <select
                  className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, assigned_subjects: [] })}
                >
                  <option value="student">🎓 Student Account</option>
                  <option value="teacher">📝 Teacher Account</option>
                  <option value="admin">🛡️ System Administrator</option>
                </select>
              </div>

              {formData.role === "teacher" && (
                <div style={styles.subjectBox}>
                  <span style={styles.subjectHeading}>
                    <BookOpen size={16} /> Assign Teaching Subjects (Curriculum Authorization)
                  </span>
                  <div style={styles.gridContainer}>
                    {subjectOptions.map(sub => (
                      <label key={sub} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.assigned_subjects.includes(sub)}
                          onChange={() => handleSubjectCheckbox(sub)}
                          style={styles.checkbox}
                        />
                        <span>{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.infoBanner}>
                <Sparkles size={16} color="#2563eb" />
                <span>
                  <b>Automated Fields Active:</b> School IDs (S1, T1), emails (1@s.com), and the default password (<b>1234</b>) will generate dynamically upon submission.
                </span>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Commit Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: "24px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  addBtn: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#2563eb", color: "white", padding: "10px 16px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  filterBar: { display: "flex", gap: "10px", marginBottom: "20px" },
  filterTab: { padding: "8px 16px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left" },
  thRow: { backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0" },
  tr: { borderBottom: "1px solid #edf2f7", transition: "background-color 0.2s" },
  badge: { padding: "4px 8px", color: "white", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" },
  overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 },
  modal: { backgroundColor: "white", padding: "28px", borderRadius: "10px", width: "520px", maxHeight: "85vh", overflowY: "auto" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  subjectBox: { backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" },
  subjectHeading: { display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "#1e3a8a", marginBottom: "12px" },
  gridContainer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#475569", cursor: "pointer" },
  checkbox: { width: "16px", height: "16px", cursor: "pointer" },
  infoBanner: { display: "flex", gap: "10px", alignItems: "flex-start", padding: "12px", backgroundColor: "#eff6ff", borderRadius: "6px", fontSize: "12px", color: "#1e40af", lineHeight: "1.5" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" },
  cancelBtn: { padding: "8px 16px", backgroundColor: "#e2e8f0", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "500" },
  saveBtn: { padding: "8px 16px", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" },
  alert: { padding: "10px", backgroundColor: "#ecfdf5", color: "#065f46", textAlign: "center", borderRadius: "6px", fontWeight: "500", marginBottom: "12px", border: "1px solid #10b981" }
};

export default AdminUserManagement;