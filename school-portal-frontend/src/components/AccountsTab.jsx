import React, { useState, useEffect } from 'react';
import OutstandingBalanceWidget from './OutstandingBalanceWidget';
import { PlusCircle, Receipt, ArrowUpRight, ArrowDownRight, User, AlertCircle, WifiOff, RefreshCw, X } from 'lucide-react';

const AccountsTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Transaction Form State
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    type: 'Income',
    category: 'Tuition',
    amount: '',
    user: '',
    description: ''
  });

  const token = localStorage.getItem('token');

  // Unified data gathering
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch both endpoints concurrently
      const [resTransactions, resUsers] = await Promise.all([
        fetch('/api/accounts/summary', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        }),
        fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        })
      ]);

      if (!resTransactions.ok) throw new Error('Failed to fetch transaction history.');
      
      const transactionsData = await resTransactions.json();
      setTransactions(transactionsData);

      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setSystemUsers(usersData);
      }
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Connection Error: The accounting service is currently unreachable. Please check your internet connection or contact the administrator.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Contextual form rebalancing
  const handleTypeToggle = (selectedType) => {
    setFormData({
      ...formData,
      type: selectedType,
      category: selectedType === 'Income' ? 'Tuition' : 'Salary',
      user: '' // Clear link mapping
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage({ type: '', text: '' });

    const payload = {
      ...formData,
      amount: parseFloat(formData.amount)
    };
    
    // If no specific student/staff profile is bound, safely remove key
    if (!payload.user) delete payload.user;

    try {
      const response = await fetch('/api/accounts/transaction', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error executing ledger write operation.');
      }

      setFormMessage({ type: 'success', text: '💸 Transaction successfully committed to ledger!' });
      
      // Clear transactional state variables
      setFormData({
        type: 'Income',
        category: 'Tuition',
        amount: '',
        user: '',
        description: ''
      });

      // Instantly trigger live datatable redraws
      const freshTransactionsRes = await fetch('/api/accounts/summary', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (freshTransactionsRes.ok) {
        const freshData = await freshTransactionsRes.json();
        setTransactions(freshData);
      }

    } catch (err) {
      setFormMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZW', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (type) => {
    return type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  // Dynamically isolate potential accounts matching user type
  const targetedProfiles = systemUsers.filter(user => 
    formData.type === 'Income' ? user.role === 'student' : user.role === 'teacher'
  );

  return (
    <div className="p-6">
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Accounts Overview</h2>

      {/* Outstanding Balance Widget */}
      <div className="mb-8">
        <OutstandingBalanceWidget />
      </div>

      {/* Grid Architecture Blueprint split into Form Panel + Ledger table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 📥 RECORD FORM COMPONENT CORES */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 h-fit">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="text-blue-600 dark:text-blue-400" size={20} />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Record Transaction</h3>
            </div>
            <button 
              onClick={() => setFormData({ type: 'Income', category: 'Tuition', amount: '', user: '', description: '' })}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Clear form"
            >
              <X size={20} />
            </button>
          </div>

          {formMessage.text && (
            <div className={`p-3 rounded-lg text-sm font-medium mb-4 border ${
              formMessage.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' 
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
            }`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {/* Toggle Switch Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Movement Direction
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <button
                  type="button"
                  onClick={() => handleTypeToggle('Income')}
                  className={`py-2 px-3 text-xs font-bold rounded-md transition-all ${
                    formData.type === 'Income'
                      ? 'bg-green-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  <ArrowUpRight size={14} className="inline mr-1" /> Asset Income
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeToggle('Expense')}
                  className={`py-2 px-3 text-xs font-bold rounded-md transition-all ${
                    formData.type === 'Expense'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  <ArrowDownRight size={14} className="inline mr-1" /> Cost Expense
                </button>
              </div>
            </div>

            {/* Amount entry block */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Value Amount ($ USD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Category selection block */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Category Grouping
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {formData.type === 'Income' ? (
                  <>
                    <option value="Tuition">Tuition Fees</option>
                    <option value="Other">Other Operational Income</option>
                  </>
                ) : (
                  <>
                    <option value="Salary">Staff Salary</option>
                    <option value="Maintenance">Campus Maintenance</option>
                    <option value="Utilities">Utilities (Electricity, Water)</option>
                    <option value="Other">Other Operational Expenses</option>
                  </>
                )}
              </select>
            </div>

            {/* Conditional profile drop menus tracking system accounts */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                {formData.type === 'Income' ? 'Student Payer Account Link' : 'Staff Payee Recipient (Optional)'}
              </label>
              <select
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="">-- General General-Ledger Posting (Unlinked) --</option>
                {targetedProfiles.map(u => (
                  <option key={u._id} value={u._id}>
                    [{u.school_id}] {u.full_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Memo Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Ledger Narrative Memo
              </label>
              <textarea
                rows="2"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Audit tracking notes..."
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full p-3 font-bold text-white rounded-lg transition-all flex items-center justify-center gap-2 ${
                submitting 
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                  : formData.type === 'Income' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Receipt size={16} /> {submitting ? 'Posting Entry...' : 'Commit Transaction Log'}
            </button>
          </form>
        </div>

        {/* 📑 HISTORICAL LEDGER DATATABLE BLOCK */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md transition-all hover:shadow-lg xl:col-span-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Transaction History</h3>

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 animate-pulse">Loading transactions...</p>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
              {error.includes('Connection') ? <WifiOff size={48} className="text-red-400 mb-4" /> : <AlertCircle size={48} className="text-red-400 mb-4" />}
              <h4 className="text-lg font-bold text-red-800 dark:text-red-400 mb-1">Financial Service Unavailable</h4>
              <p className="text-red-600 dark:text-red-500 text-sm max-w-md mb-6">{error}</p>
              <button 
                onClick={fetchData}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Retry Connection
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No transactions recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category Allocation</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Related User</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="odd:bg-white even:bg-gray-50/30 dark:odd:bg-gray-800 dark:even:bg-gray-700/20 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.type === 'Income' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {transaction.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={transaction.description}>
                        {transaction.description || <span className="italic text-gray-400">No description</span>}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-bold ${getCategoryColor(transaction.type)}`}>
                        {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {transaction.user?.full_name ? (
                          <div className="flex items-center gap-1.5">
                            <User size={14} className="text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-gray-200">{transaction.user.full_name}</span>
                            <span className="px-2 py-0.5 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded font-mono border border-blue-100 dark:border-blue-800">({transaction.user.school_id})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">General Log</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AccountsTab;
