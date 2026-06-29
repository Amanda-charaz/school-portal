import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { getUserInfo } from "../utils/authUtils";
import { termLabels, calculateGrade, getGradeColor } from '../utils/academicUtils';
import { Award, AlertTriangle, Filter, Search, Download, Printer } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const StudentResultsView = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await api.get('/student/results');
        setResults(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        setError(err.response?.data?.message || "No results found for your account yet.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const handleDownloadFullTranscript = async () => {
    try {
      const userInfo = getUserInfo();
      const studentId = userInfo.id || userInfo._id;
      const studentName = userInfo.full_name;

      if (!studentId) {
        alert("Student session error. Please refresh and try again.");
        return;
      }

      const response = await api.get(`/result/transcript-report/${studentId}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${studentName.replace(/\s/g, '_')}_Transcript_${new Date().getFullYear()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate your academic transcript PDF.");
    }
  };

  if (loading) return <div className="p-8 text-center" style={{ color: theme.text }}>Loading academic transcript...</div>;

  if (error) {
    return (
      <div className="p-10 rounded-xl border flex flex-col items-center gap-4 text-center" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
        <AlertTriangle size={48} color="#f59e0b" />
        <div>
          <h3 className="font-bold text-lg" style={{ color: theme.text }}>Records Pending</h3>
          <p className="text-sm opacity-70" style={{ color: theme.subText }}>{error}</p>
        </div>
      </div>
    );
  }

  // Filter and group results by term
  const filteredBySearch = results.filter(r => 
    !searchTerm || 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(r.year).includes(searchTerm)
  );

  const termBlocks = Object.keys(termLabels)
    .filter(termKey => selectedTerm === 'all' || selectedTerm === termKey)
    .map(termKey => {
      const termResults = filteredBySearch.filter(r => String(r.term) === termKey);
      if (termResults.length === 0) return null;

      return (
        <div key={termKey} className="p-6 rounded-2xl shadow-sm border space-y-4" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
          <h3 className="text-sm font-black uppercase tracking-widest opacity-60 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }}></div>
            {termLabels[termKey]}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40">Subject Name</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Score</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Grade</th>
                </tr>
              </thead>
              <tbody>
                {termResults.map((res) => {
                  const gradeLetter = calculateGrade(res.score);
                  const gradeColor = getGradeColor(gradeLetter);

                  return (
                    <tr key={res._id} style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                      <td className="p-4">
                        <div className="text-sm font-black tracking-tight">{res.subject}</div>
                        <div className="text-[9px] opacity-40 font-bold uppercase tracking-tighter">Academic Year: {res.year}</div>
                      </td>
                      <td className="p-4 text-center font-black text-gray-600 dark:text-gray-400">{res.score}%</td>
                      <td className="p-4 text-right">
                        <div style={{ 
                          backgroundColor: `${gradeColor}15`,
                          color: gradeColor,
                          padding: '4px 12px',
                          borderRadius: '8px',
                          fontWeight: '900',
                          fontSize: '0.6875rem',
                          border: `1px solid ${gradeColor}30`,
                          display: 'inline-block',
                          textAlign: 'center',
                          minWidth: '40px'
                        }}>
                          {gradeLetter}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );
    })
    .filter(Boolean);

  return (
    <div className="w-full space-y-6" style={{ color: theme.text }}>
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 mb-2">
        <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3 shrink-0">
          <Award size={28} color={theme.accent} />
          Academic Transcripts
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-64 no-print">
            <Search className="absolute left-3 top-2.5 opacity-40" size={18} />
            <input 
              type="text"
              placeholder="Search subjects or year..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border text-sm outline-none transition-all"
              style={{ backgroundColor: theme.card, borderColor: theme.inputBorder, color: theme.text }}
            />
          </div>

          <Filter size={18} className="opacity-40 no-print" />
          <select 
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="flex-1 sm:w-64 p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer"
            style={{ backgroundColor: theme.card, borderColor: theme.inputBorder, color: theme.text }}
          >
            <option value="all">All Academic Terms</option>
            {Object.entries(termLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <div className="flex gap-3 no-print">
            <button 
              onClick={handleDownloadFullTranscript}
              disabled={results.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              <Download size={16} /> Download PDF
            </button>
            <button
              onClick={() => window.print()}
              className="w-full sm:w-auto px-6 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap"
            >
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
      </div>

      {results.length === 0 || termBlocks.length === 0 ? (
        <div className="p-10 text-center opacity-40 font-bold italic border-2 border-dashed rounded-2xl" style={{ borderColor: theme.inputBorder }}>
          {results.length === 0 
            ? "No official academic report cards generated yet." 
            : `No results matching your criteria found.`}
        </div>
      ) : (
        termBlocks
      )}
    </div>
  );
};

export default StudentResultsView;