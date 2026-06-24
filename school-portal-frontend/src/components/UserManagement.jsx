import React, { useState, useEffect } from "react";
import api from "../api/axios";
import { subjectOptions } from "../utils/academicUtils";
import { UserPlus, RefreshCw, BookOpen, Sparkles, X, UserX } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const UserManagement = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [formData, setFormData] = useState({
    full_name: "",
    role: "student",
    assigned_class: "",
    assigned_subjects: []
  });

  useEffect(() => {
    fetchUsers();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      const endpoint = filterRole === "all" ? "/admin/users" : `/admin/users/role/${filterRole}`;
      const response = await api.get(endpoint);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error pulling system accounts:", err);
      setMessage("Failed to load users: " + (err.response?.data?.message || err.message));
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
      // Hits the backend automated creation logic
      const response = await api.post("/admin/users", formData);
      setMessage(`🎉 Successfully created ${response.data.user?.full_name || 'user'}! ID: ${response.data.user?.school_id || 'N/A'}`);
      setFormData({ full_name: "", role: "student", assigned_class: "", assigned_subjects: [] }); // Reset form data
      fetchUsers();
      setTimeout(() => {
        setIsModalOpen(false);
        setMessage("");
      }, 2000);
    } catch (err) {
      setMessage("❌ Failed to create user: " + (err.response?.data?.message || "Internal error"));
    }
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm("Are you sure you want to deactivate this account? The user will no longer be able to log in.")) return;
    try {
      await api.post(`/admin/users/${userId}/deactivate`, {});
      alert("🔒 User account deactivated successfully.");
      fetchUsers();
    } catch (err) {
      alert("Error deactivating user: " + (err.response?.data?.message || "Internal error"));
    }
  };

  const resetPassword = async (userId) => {
    if (!window.confirm("Are you sure you want to revert this user's password to '1234'?")) return;
    try {
      await api.post(`/admin/users/${userId}/reset-password`, { newPassword: "1234" });
      alert("🔄 Password successfully reset to the factory default: 1234");
    } catch (err) {
      alert("Error resetting password: " + (err.response?.data?.message || "Internal error"));
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700/50">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h2 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white">System Account Controls</h2>
          <button 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 hover:opacity-90"
            style={{ backgroundColor: theme.accent }}
            onClick={() => setIsModalOpen(true)}
          >
          <UserPlus size={18} /> Add Automatically Generated Account
        </button>
      </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {["all", "student", "teacher", "admin"].map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
              filterRole === role 
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md" 
                : "bg-gray-50 dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-indigo-400"
            }`}
          >
            {role}s
          </button>
        ))}
      </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-inner bg-gray-50/30 dark:bg-gray-900/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/60">
                <tr>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">System ID</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Auth Identifier</th>
                  <th className="px-6 py-4 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Assignment</th>
                  <th className="px-6 py-4 text-center text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className={`hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors ${user.active === false ? 'opacity-50 grayscale bg-gray-50/50' : ''}`}>
                    <td className="px-6 py-4 text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">{user.school_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-black text-sm text-gray-900 dark:text-white tracking-tight">{user.full_name}</div>
                      <div className="inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest text-white shadow-sm" style={{ backgroundColor: user.active === false ? "#64748b" : (user.role === "admin" ? "#ef4444" : user.role === "teacher" ? "#3b82f6" : "#10b981") }}>
                        {user.active === false ? "Deactivated" : user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 lowercase">{user.email}</td>
                    <td className="px-6 py-4 text-[11px] font-bold text-gray-600 dark:text-gray-300 max-w-[150px] truncate">
                      {user.role === "teacher" ? user.assigned_subjects?.join(", ") || "None" : user.assigned_class || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:shadow-md transition-all active:scale-95" onClick={() => resetPassword(user._id)} title="Reset Password">
                          <RefreshCw size={16} />
                        </button>
                        {user.active !== false && (
                          <button className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:shadow-md transition-all active:scale-95" onClick={() => handleDeactivate(user._id)} title="Deactivate">
                            <UserX size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[2000] p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-2xl w-full max-w-lg space-y-6 border border-gray-100 dark:border-gray-700/50 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Provision New Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={24} /></button>
            </div>
            {message && <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase tracking-widest text-center">{message}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Full Legal Name</label>
                <input className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm text-gray-900 dark:text-white" type="text" required value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder="e.g., Alima Charamanda" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest opacity-50">Privilege Level</label>
                <select className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none font-bold text-sm text-gray-900 dark:text-white" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value, assigned_class: "", assigned_subjects: [] })}>
                  <option value="student">🎓 Student Account</option>
                  <option value="teacher">📝 Teacher Account</option>
                  <option value="admin">🛡️ System Administrator</option>
                </select>
              </div>
              {formData.role !== "admin" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-50">{formData.role === "student" ? "Current Class" : "Assigned Classes"}</label>
                  <input className="w-full p-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 outline-none font-bold text-sm text-gray-900 dark:text-white" type="text" value={formData.assigned_class} onChange={(e) => setFormData({ ...formData, assigned_class: e.target.value })} placeholder={formData.role === "student" ? "e.g., 1A" : "e.g., 1A, 2B"} />
                </div>
              )}
              {formData.role === "teacher" && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4"><BookOpen size={16} /> Assign Subjects</span>
                  <div className="grid grid-cols-2 gap-3">
                    {subjectOptions.map(sub => (
                      <label key={sub} className="flex items-center gap-2 text-[11px] font-bold cursor-pointer group">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={formData.assigned_subjects.includes(sub)} onChange={() => handleSubjectCheckbox(sub)} />
                        <span>{sub}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-tight leading-relaxed">
                <Sparkles size={20} className="shrink-0" />
                <span>Automation Active: System IDs and Emails generate dynamically. Standard temporary password is <b>1234</b>.</span>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Commit Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;