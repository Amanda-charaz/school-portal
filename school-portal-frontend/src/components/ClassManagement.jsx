import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { PlusCircle, Edit, Trash2, Users, BookOpen, X, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ClassManagement = ({ theme }) => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]); // For formTeacher dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null); // For edit mode
  const [classMembers, setClassMembers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    formTeacher: '' // Stores teacher's _id
  });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/admin/classes');
      setClasses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setMessage({ type: 'error', text: 'Failed to load classes.' });
    }
  };

  const fetchTeachers = async () => {
    try {
      // Fetches all users with role 'teacher' for the formTeacher dropdown
      const response = await api.get('/admin/users/role/teacher');
      setTeachers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch teachers:", err);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    try {
      if (selectedClass) {
        await api.put(`/admin/classes/${selectedClass._id}`, formData);
        setMessage({ type: 'success', text: 'Class updated successfully!' });
      } else {
        await api.post('/admin/classes', formData);
        setMessage({ type: 'success', text: 'Class created successfully!' });
      }
      fetchClasses();
      closeModal();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save class.' });
    }
  };

  const handleDelete = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class? This action cannot be undone.")) return;
    setMessage({ type: '', text: '' });
    try {
      await api.delete(`/admin/classes/${classId}`);
      setMessage({ type: 'success', text: 'Class deleted successfully!' });
      fetchClasses();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to delete class.' });
    }
  };

  const viewMembers = async (cls) => {
    setSelectedClass(cls);
    try {
      const response = await api.get(`/admin/classes/${cls.name}/members`);
      setClassMembers(response.data);
      setIsMemberModalOpen(true);
    } catch (err) {
      alert("Failed to load class roster.");
    }
  };

  const openModal = (cls = null) => {
    setSelectedClass(cls);
    setFormData({
      name: cls ? cls.name : '',
      description: cls ? cls.description : '',
      formTeacher: cls && cls.formTeacher ? cls.formTeacher._id : ''
    });
    setMessage({ type: '', text: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
    setFormData({ name: '', description: '', formTeacher: '' });
  };

  return (
    <div className="w-full space-y-6" style={{ color: theme.text }}>
      <div className="p-6 rounded-2xl shadow-md border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <BookOpen size={28} color={theme.accent} /> Manage Classes
          </h2>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all active:scale-95 text-sm shadow-lg"
          >
            <PlusCircle size={18} /> Add New Class
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <AlertCircle size={20} />
            <span>{message.text}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.inputBorder}` }}>
                <th className="p-3 text-[10px] font-bold uppercase opacity-50">Class Name</th>
                <th className="p-3 text-[10px] font-bold uppercase opacity-50">Description</th>
                <th className="p-3 text-[10px] font-bold uppercase opacity-50">Form Teacher</th>
                <th className="p-3 text-[10px] font-bold uppercase opacity-50 text-right">Management</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center opacity-50 italic">No classes created yet.</td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls._id} style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                    <td className="p-3 font-bold text-sm">{cls.name}</td>
                    <td className="p-3 text-sm opacity-70">{cls.description || 'N/A'}</td>
                    <td className="p-3 text-sm">
                      {cls.formTeacher ? `${cls.formTeacher.full_name} (${cls.formTeacher.school_id})` : 'Unassigned'}
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => viewMembers(cls)} className="text-indigo-500 hover:text-indigo-700 p-1" title="View Students">
                        <Users size={18} />
                      </button>
                      <button onClick={() => openModal(cls)} className="text-blue-500 hover:text-blue-700 p-1">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(cls._id)} className="text-red-500 hover:text-red-700 p-1 ml-2">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6" style={{ backgroundColor: theme.card, color: theme.text }}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{selectedClass ? 'Edit Class' : 'Add New Class'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            {message.text && (
              <div className={`p-3 rounded-xl flex items-center gap-3 text-sm font-medium border ${
                message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <AlertCircle size={20} />
                <span>{message.text}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 opacity-70">Class Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="e.g., 1A, Grade 10-B"
                  className="w-full p-3 rounded-xl border outline-none text-sm font-bold"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 opacity-70">Description (Optional)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="e.g., Junior Secondary, Science Stream"
                  rows="3"
                  className="w-full p-3 rounded-xl border outline-none text-sm"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 opacity-70">Form Teacher</label>
                <select
                  name="formTeacher"
                  value={formData.formTeacher}
                  onChange={handleFormChange}
                  className="w-full p-3 rounded-xl border outline-none text-sm font-bold"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                >
                  <option value="">-- Select Form Teacher --</option>
                  {teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.full_name} ({teacher.school_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2 rounded-xl border font-bold text-sm transition-colors hover:bg-gray-100"
                  style={{ borderColor: theme.inputBorder, color: theme.text }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm transition-all active:scale-95 hover:bg-indigo-700 shadow-lg"
                >
                  {selectedClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="p-8 rounded-2xl shadow-lg w-full max-w-lg space-y-6" style={{ backgroundColor: theme.card, color: theme.text }}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Class Roster: {selectedClass?.name}</h3>
                <p className="text-xs opacity-50 uppercase font-bold tracking-widest">{classMembers.length} Enrolled Members</p>
              </div>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {classMembers.map(member => (
                <div key={member._id} className="flex justify-between items-center p-3 rounded-xl border" style={{ borderColor: theme.inputBorder, backgroundColor: theme.inputBg }}>
                  <div>
                    <div className="text-sm font-bold">{member.full_name}</div>
                    <div className="text-[10px] opacity-50 uppercase font-mono">{member.school_id}</div>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${member.role === 'teacher' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => setIsMemberModalOpen(false)} className="w-full py-3 rounded-xl font-bold bg-gray-100 hover:bg-gray-200 transition-colors" style={{ color: '#1f2937' }}>Close Roster</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;