import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { getUserInfo } from "../utils/authUtils";
import { 
  PlusCircle, 
  BookOpen, 
  Trophy, 
  ListChecks, 
  Save,
  Search,
  AlertCircle,
  Edit2,
  X,
  Trash2
} from 'lucide-react';

const Result = ({ theme, userInfo }) => {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [studentSearch, setStudentSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [teacherInfo, setTeacherSubjects] = useState({ subjects: [], role: '' });
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [formData, setFormData] = useState({
    student_id: "",
    subject: "",
    score: "",
    term: "1",
    year: new Date().getFullYear().toString() // Default to current year
  });

  // Aligned with UserManagement.jsx for consistency
  const subjectOptions = [
    "English Language", "Mathematics", "Shona", "Ndebele", "Heritage Studies",
    "Agriculture", "Combined Science", "Computer Science", "Commerce",
    "Principles of Accounts", "Business Studies", "Geography", "History"
  ];

  // Local helper to preview grade before submission
  const calculateGradePreview = (score) => {
    const num = Number(score);
    if (!score || isNaN(num)) return "-";
    if (num >= 80) return "A";
    if (num >= 70) return "B";
    if (num >= 60) return "C";
    if (num >= 50) return "D";
    if (num >= 40) return "E";
    return "U";
  };

  useEffect(() => {
    // Use passed userInfo prop if available, otherwise fallback to storage
    const info = userInfo || getUserInfo();
    
    // Ensure subjects are handled as an array even if stored as a string
    const subjectsArray = Array.isArray(info.assigned_subjects)
      ? info.assigned_subjects
      : (typeof info.assigned_subjects === 'string' 
          ? info.assigned_subjects.split(',').map(s => s.trim()).filter(Boolean)
          : []);

    setTeacherSubjects({
      subjects: subjectsArray,
      role: String(info.role || "").toLowerCase()
    });

    // Auto-select the first subject if none is selected yet
    if (subjectsArray.length > 0 && !formData.subject) {
      setFormData(prev => ({ ...prev, subject: subjectsArray[0] }));
    }

    fetchResults();
    fetchTeacherStudents();
  }, [userInfo]);

  const fetchTeacherStudents = async () => {
    try {
      const response = await api.get('/student/teacher/students');
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load students for your classes");
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      // Teachers fetch results via /api/result/all (filtered to their class in controller)
      const response = await api.get('/result/all');
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (result) => {
    setEditingId(result._id);
    setFormData({
      student_id: result.student?.school_id || "",
      subject: result.subject,
      score: result.score.toString(),
      term: result.term,
      year: result.year.toString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ ...formData, student_id: "", score: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editingId) {
        await api.put(`/result/${editingId}`, formData);
        setMessage({ type: 'success', text: '✅ Grade updated successfully!' });
        setEditingId(null);
      } else {
        await api.post("/result/add", formData);
        setMessage({ type: 'success', text: '🎉 Grade recorded successfully!' });
      }

      setFormData({ ...formData, student_id: "", score: "", year: new Date().getFullYear().toString() });
      setStudentSearch(''); // Clear the search term
      fetchResults();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || "Failed to submit result. Check subject assignment." 
      });
    }
  };

  const handleDeleteResult = async () => {
    try {
      await api.delete(`/result/${deleteConfirm}`);
      setMessage({ type: 'success', text: '🗑️ Result deleted successfully!' });
      setDeleteConfirm(null);
      fetchResults();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || "Failed to delete result." 
      });
      setDeleteConfirm(null);
    }
  };

  const filteredResults = results.filter(res => 
    res.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.student?.school_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchableStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.school_id.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.school_id === formData.student_id
  );

  if (loading && results.length === 0) {
    return <div className="p-8 text-center" style={{ color: theme.text }}>Accessing academic records...</div>;
  }

  return (
    <div className="w-full space-y-6" style={{ color: theme.text }}>
      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold border transition-all ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <Trophy size={20} /> : <AlertCircle size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="p-6 rounded-2xl shadow-md space-y-6 border h-fit" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold flex items-center gap-2">
              {editingId ? <Edit2 size={20} color={theme.accent} /> : <PlusCircle size={20} color={theme.accent} />}
              {editingId ? "Edit Grade" : "Record New Grade"}
            </h3>
            {editingId && (
              <button onClick={cancelEdit} className="text-xs opacity-50 hover:opacity-100 flex items-center gap-1">
                <X size={14} /> Cancel
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-60">Select Student</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 opacity-40" size={14} />
                <input 
                  type="text"
                  placeholder="Search name or ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border outline-none text-xs"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                />
              </div>
              <select 
                value={formData.student_id}
                onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                className="w-full p-3 rounded-xl border outline-none text-sm font-bold"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                required
                disabled={!!editingId} // Prevent changing student during edit
              >
                <option value="">-- Choose Student --</option>
                {searchableStudents.map(s => (
                  <option key={s._id} value={s.school_id}>{s.full_name} ({s.school_id})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase opacity-60">O-Level Subject</label>
              <select 
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                className="w-full p-3 rounded-xl border outline-none text-sm font-bold"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
              >
                {teacherInfo.role === 'admin' ? (
                  subjectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)
                ) : (
                  teacherInfo.subjects.map(opt => <option key={opt} value={opt}>{opt}</option>)
                )}
                {teacherInfo.role !== 'admin' && teacherInfo.subjects.length === 0 && <option disabled>No subjects assigned</option>}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase opacity-60">Term</label>
                <select 
                  value={formData.term}
                  onChange={(e) => setFormData({...formData, term: e.target.value})}
                  className="w-full p-3 rounded-xl border outline-none text-sm font-bold"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                >
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase opacity-60">Year</label>
                <input 
                  type="number" 
                  min="2000" // Assuming school started after 2000
                  max={new Date().getFullYear() + 5} // Allow for future entries
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  className="w-full p-3 rounded-xl border outline-none text-sm font-bold"
                  style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase opacity-60">Score (%)</label>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  Grade Preview: {calculateGradePreview(formData.score)}
                </span>
              </div>
              <input 
                type="number" 
                max="100"
                min="0"
                value={formData.score}
                onChange={(e) => setFormData({...formData, score: e.target.value})}
                className="w-full p-3 rounded-xl border outline-none text-sm font-bold"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 hover:opacity-90"
              style={{ backgroundColor: theme.accent }}
            >
              <Save size={18} /> {editingId ? "Update Grade" : "Commit Grade"}
            </button>
          </form>
        </div>

        {/* Results Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl shadow-md space-y-6 border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ListChecks size={20} color={theme.accent} /> Recent Submissions
            </h3>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-2.5 opacity-40" size={16} />
              <input 
                type="text"
                placeholder="Filter results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border outline-none text-xs"
                style={{ backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: `2px solid ${theme.inputBorder}` }}>
                  <th className="p-3 text-[10px] font-bold uppercase opacity-50">Student</th>
                  <th className="p-3 text-[10px] font-bold uppercase opacity-50">Subject</th>
                  <th className="p-3 text-[10px] font-bold uppercase opacity-50 text-center">Score</th>
                  <th className="p-3 text-[10px] font-bold uppercase opacity-50 text-center">Grade</th>
                  <th className="p-3 text-[10px] font-bold uppercase opacity-50 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((res) => (
                  <tr key={res._id} style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                    <td className="p-3">
                      <div className="font-bold text-sm">{res.student?.full_name}</div>
                      <div className="text-[10px] opacity-50 uppercase font-mono">{res.student?.school_id}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm font-medium">{res.subject}</div>
                      <div className="text-[10px] opacity-50">Term {res.term}</div>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-lg">{res.score}%</td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black border ${res.score >= 50 ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                        {res.grade}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => handleEdit(res)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 size={16} className="opacity-60" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(res._id)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={16} className="opacity-60" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4 border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Confirm Deletion</h3>
              <p className="text-sm opacity-60 mt-2">Are you sure you want to remove this record? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl font-bold border transition-all hover:bg-gray-50 dark:hover:bg-gray-800"
                style={{ borderColor: theme.inputBorder }}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteResult}
                className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#dc2626' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Result;