import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ClassSummaryWidget = () => {
  const { theme } = useTheme();
  const [summary, setSummary] = useState({ totalStudents: 0, attendanceRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get('/attendance/class-summary');
        setSummary(response.data);
      } catch (err) {
        console.error("Failed to fetch class summary", err);
        setError(err.response?.data?.message || 'Failed to load class summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const cardStyle = {
    padding: '20px',
    backgroundColor: theme.card,
    borderRadius: '12px',
    border: `1px solid ${theme.inputBorder}`,
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  if (error) {
    return (
      <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontSize: '14px', marginBottom: '20px' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', width: '100%', marginBottom: '20px' }}>
      {/* Total Students Card */}
      <div style={cardStyle}>
        <div style={{ padding: '12px', backgroundColor: '#eef2ff', borderRadius: '10px' }}>
          <Users color="#6366f1" size={28} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '11px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Students</p>
          <h3 style={{ margin: '4px 0 0', fontSize: '28px', color: theme.text, fontWeight: '800' }}>{loading ? '...' : summary.totalStudents}</h3>
        </div>
      </div>

      {/* Attendance Rate Card */}
      <div style={cardStyle}>
        <div style={{ padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '10px' }}>
          <CheckCircle color="#10b981" size={28} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '11px', color: theme.subText, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Rate</p>
          <h3 style={{ margin: '4px 0 0', fontSize: '28px', color: theme.text, fontWeight: '800' }}>{loading ? '...' : `${summary.attendanceRate}%`}</h3>
        </div>
      </div>
    </div>
  );
};

export default ClassSummaryWidget;