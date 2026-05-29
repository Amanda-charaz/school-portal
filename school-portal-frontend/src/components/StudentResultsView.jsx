import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { BookOpen, Award, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

const StudentResultsView = ({ theme }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Fetches from router.get('/results', protect, studentOnly, getMyResults) in studentRoutes.js
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

  const getGradeColor = (gradeLetter) => {
    const letter = gradeLetter.split(':')[0].trim();
    if (letter === 'A') return '#10b981'; // Green
    if (letter === 'B') return '#3b82f6'; // Blue
    if (letter === 'C') return '#8b5cf6'; // Violet
    if (letter === 'D') return '#f59e0b'; // Amber
    if (letter === 'E') return '#6366f1'; // Indigo
    return '#ef4444'; // Red for U/F
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

  return (
    <div className="w-full space-y-6" style={{ color: theme.text }}>
      {/* Results Table */}
      <div className="p-6 rounded-xl shadow-md border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-3">
            <Award size={24} color={theme.accent} />
            Academic Results
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: `2px solid ${theme.inputBorder}` }}>
                <th className="p-4 text-xs font-bold uppercase" style={{ color: theme.subText }}>Module Code</th>
                <th className="p-4 text-xs font-bold uppercase" style={{ color: theme.subText }}>Module Name</th>
                <th className="p-4 text-xs font-bold uppercase text-center" style={{ color: theme.subText }}>Class</th>
                <th className="p-4 text-xs font-bold uppercase text-right" style={{ color: theme.subText }}>Decision</th>
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-sm" style={{ color: theme.subText }}>
                    No results recorded yet
                  </td>
                </tr>
              ) : (
                results.map((res) => (
                  <tr key={res._id} style={{ borderBottom: `1px solid ${theme.inputBorder}` }}>
                    <td className="p-4 font-bold">{res.subject}</td>
                    <td className="p-4 text-sm">{res.subject}</td>
                    <td className="p-4 text-center font-bold">{res.score}%</td>
                    <td className="p-4 text-right">
                      <div style={{ 
                        backgroundColor: `#10b98115`,
                        color: "#10b981",
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        border: '1px solid #10b98130',
                        display: 'inline-block'
                      }}>
                        ✓ P
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentResultsView;