import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';

const OutstandingBalanceWidget = () => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOutstandingBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/accounts/outstanding-balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch financial data');
      }

      const data = await response.json();
      setBalance(data.totalOutstanding);
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Connection Error: Accounting service unreachable.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutstandingBalance();
  }, [fetchOutstandingBalance]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZW', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border-l-4 border-red-500 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Total Outstanding Fees
          </p>
          {loading ? (
            <h3 className="text-2xl font-bold mt-1 text-gray-400 animate-pulse">Loading...</h3>
          ) : error ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-red-500 dark:text-red-400">
                {error.includes('Connection') ? <WifiOff size={16} className="inline mr-1" /> : <AlertCircle size={16} className="inline mr-1" />}
                Service Unavailable
              </span>
              <button 
                onClick={fetchOutstandingBalance}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                title="Retry connection"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          ) : (
            <h3 className="text-3xl font-extrabold mt-1 text-gray-900 dark:text-white">
              {formatCurrency(balance)}
            </h3>
          )}
        </div>
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
          <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default OutstandingBalanceWidget;