import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { termLabels } from '../utils/academicUtils';
import { useParams } from 'react-router-dom'; // Assuming react-router-dom for routing

const FeeHistory = ({ studentId: propStudentId, isStudentSelfService = false }) => {
  const { studentId: paramStudentId } = useParams(); // Get studentId from URL params if not provided as prop
  const studentId = isStudentSelfService ? null : (propStudentId || paramStudentId);

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeeHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        let endpoint = '';
        if (isStudentSelfService) {
          endpoint = `/fees/my-fees`;
        } else if (studentId) {
          endpoint = `/fees/student/${studentId}`;
        } else {
          setError('Student ID is missing.');
          setLoading(false);
          return;
        }

        const response = await api.get(endpoint);
        setFees(response.data);
      } catch (err) {
        console.error('Error fetching fee history:', err);
        setError(err.response?.data?.message || 'Failed to load fee history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (isStudentSelfService || studentId) {
      fetchFeeHistory();
    }
  }, [studentId, isStudentSelfService]);

  if (loading) {
    return <div className="text-center py-4">Loading fee history...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  if (fees.length === 0) {
    return <div className="text-center py-4">No fee records found for this student.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Fee History {isStudentSelfService ? 'for You' : `for Student ${studentId}`}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Term</th>
              <th className="py-2 px-4 border-b">Total Amount</th>
              <th className="py-2 px-4 border-b">Paid Amount</th>
              <th className="py-2 px-4 border-b">Balance</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Due Date</th>
              <th className="py-2 px-4 border-b">Recorded By</th>
              <th className="py-2 px-4 border-b">Recorded At</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee._id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{termLabels[fee.term] || fee.term || 'N/A'}</td>
                <td className="py-2 px-4 border-b">${fee.total_amount.toFixed(2)}</td>
                <td className="py-2 px-4 border-b">${fee.paid_amount.toFixed(2)}</td>
                <td className="py-2 px-4 border-b">${fee.balance.toFixed(2)}</td>
                <td className="py-2 px-4 border-b">{fee.status}</td>
                <td className="py-2 px-4 border-b">{new Date(fee.due_date).toLocaleDateString()}</td>
                <td className="py-2 px-4 border-b">{fee.received_by?.full_name || 'System'} ({fee.received_by?.school_id || 'N/A'})</td>
                <td className="py-2 px-4 border-b">{new Date(fee.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeeHistory;