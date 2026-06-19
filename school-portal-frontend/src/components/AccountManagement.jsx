import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { termLabels } from '../utils/academicUtils';
import { DollarSign, PlusCircle, History, TrendingUp, User, CreditCard, Download, Trash2, Filter } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const AccountManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('transactions'); // 'transactions' or 'billing'
  const [selectedTerm, setSelectedTerm] = useState('all');
  const [formData, setFormData] = useState({
    user: '',
    amount: '',
    category: 'Tuition',
    type: 'Income',
    description: '',
    term: '1'
  });
  const [billingData, setBillingData] = useState({
    student_id: '',
    term: '1',
    year: new Date().getFullYear().toString(),
    base_amount: '',
    discount: '0',
    fines: '0',
  });
  const { theme } = useTheme();
  const [message, setMessage] = useState({ type: '', text: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const categories = ['Tuition', 'Salary', 'Maintenance', 'Utilities', 'Stationery', 'Other'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [transRes, balanceRes, usersRes] = await Promise.all([
        api.get('/accounts/summary'),
        api.get('/accounts/outstanding-balance'),
        api.get('/admin/users')
      ]);
      setTransactions(transRes.data);
      setOutstandingBalance(balanceRes.data.totalOutstanding);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch accounting data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/accounts/transaction', formData);
      setMessage({ type: 'success', text: 'Transaction recorded successfully!' });
      setFormData({ ...formData, user: '', amount: '', description: '' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to record transaction' });
    }
  };

  const handleBillingSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/fees/invoice', billingData);
      setMessage({ type: 'success', text: 'Fee invoice generated successfully!' });
      setBillingData({ student_id: '', term: '1', year: new Date().getFullYear().toString(), base_amount: '', discount: '0', fines: '0' });
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate fee invoice' });
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/accounts/transaction/${deleteConfirm}`);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete transaction' });
    }
  };

  const handleDownloadReceipt = async (transactionId) => {
    try {
      const response = await api.get(`/accounts/receipt/${transactionId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt_${transactionId.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download receipt');
    }
  };

  const handleDownloadSummary = async () => {
    try {
      const response = await api.get(`/accounts/summary/report`, {
        params: { term: selectedTerm },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const termLabel = selectedTerm === 'all' ? 'Full_Financial_Summary' : `Financial_Summary_Term_${selectedTerm}`;
      link.setAttribute('download', `${termLabel}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download financial summary report.');
    }
  };

  const calculateTotalBilling = () => {
    return (Number(billingData.base_amount) || 0) + (Number(billingData.fines) || 0) - (Number(billingData.discount) || 0);
  };

  const filteredTransactions = transactions.filter(t => 
    selectedTerm === 'all' || String(t.term) === selectedTerm
  );

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  if (loading) return <div className="p-10 text-center animate-pulse font-black text-gray-400">Loading Financial Records...</div>;

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => setActiveSubTab('transactions')} className={`pb-2 px-2 text-sm font-bold transition-all ${activeSubTab === 'transactions' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Ledger Transactions</button>
        <button onClick={() => setActiveSubTab('billing')} className={`pb-2 px-2 text-sm font-bold transition-all ${activeSubTab === 'billing' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}>Student Billing (Invoicing)</button>
      </div>

      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-2">
        <button 
          onClick={handleDownloadSummary}
          className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Download size={16} /> Download {selectedTerm === 'all' ? 'Full' : 'Term'} Summary
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Filter size={18} className="opacity-40" style={{ color: theme.text }} />
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
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">
            <TrendingUp size={16} /> Total Income
          </div>
          <div className="text-3xl font-black" style={{ color: theme.text }}>${totalIncome.toLocaleString()}</div>
        </div>
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 mb-2">
            <CreditCard size={16} /> Total Expenses
          </div>
          <div className="text-3xl font-black" style={{ color: theme.text }}>${totalExpenses.toLocaleString()}</div>
        </div>
        <div className="p-6 rounded-2xl border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">
            <DollarSign size={16} /> Outstanding Fees
          </div>
          <div className="text-3xl font-black" style={{ color: theme.text }}>${outstandingBalance.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Transaction Form */}
        <div className="lg:w-1/3 p-6 rounded-2xl border h-fit" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
          {activeSubTab === 'transactions' ? (
            <>
              <h3 className="text-lg font-black mb-6 flex items-center gap-2" style={{ color: theme.text }}>
                <PlusCircle className="text-indigo-500" size={20} /> New Transaction
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Related User (Optional)</label>
                  <select
                    className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                    style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                    value={formData.user}
                    onChange={e => setFormData({ ...formData, user: e.target.value })}
                  >
                    <option value="">-- General / System --</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.full_name} ({u.school_id})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Type</label>
                    <select
                      className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                      style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Category</label>
                    <select
                      className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                      style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Academic Term</label>
                  <select
                    className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                    style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                    value={formData.term}
                    onChange={e => setFormData({ ...formData, term: e.target.value })}
                  >
                    {Object.entries(termLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Amount ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                    style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                    value={formData.amount}
                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Description</label>
                  <textarea
                    rows="3"
                    className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none resize-none"
                    style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-700 transition-all">
                  Record Transaction
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 className="text-lg font-black mb-6 flex items-center gap-2" style={{ color: theme.text }}>
                <CreditCard className="text-emerald-500" size={20} /> Student Term Billing
              </h3>
              <form onSubmit={handleBillingSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Select Student</label>
                  <select
                    required
                    className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                    style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                    value={billingData.student_id}
                    onChange={e => setBillingData({ ...billingData, student_id: e.target.value })}
                  >
                    <option value="">-- Choose Student --</option>
                    {users.filter(u => u.role === 'student').map(u => (
                      <option key={u._id} value={u._id}>{u.full_name} ({u.school_id})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Term</label>
                    <select
                      className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                      style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                      value={billingData.term}
                      onChange={e => setBillingData({ ...billingData, term: e.target.value })}
                    >
                      {Object.entries(termLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Year</label>
                    <input
                      type="number"
                      required
                      className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                      style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                      value={billingData.year}
                      onChange={e => setBillingData({ ...billingData, year: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Base Tuition Amount ($)</label>
                  <input
                    type="number"
                    required
                    className="w-full p-2.5 rounded-xl border text-sm font-bold outline-none"
                    style={{ backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.inputBorder }}
                    value={billingData.base_amount}
                    onChange={e => setBillingData({ ...billingData, base_amount: e.target.value })}
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Discount ($)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/10 text-sm font-bold outline-none"
                      style={{ color: theme.text }}
                      value={billingData.discount}
                      onChange={e => setBillingData({ ...billingData, discount: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-school-red mb-1">Fines ($)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 rounded-xl border border-red-100 bg-red-50/10 text-sm font-bold outline-none"
                      style={{ color: theme.text }}
                      value={billingData.fines}
                      onChange={e => setBillingData({ ...billingData, fines: e.target.value })}
                    />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
                   <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Calculated Total Invoice</div>
                   <div className="text-2xl font-black" style={{ color: theme.text }}>${calculateTotalBilling().toLocaleString()}</div>
                </div>
                <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-700 transition-all">
                  Generate Fee Invoice
                </button>
              </form>
            </>
          )}
          {message.text && (
          <p className={`mt-4 text-center text-xs font-bold ${message.type === 'success' ? 'text-emerald-500' : 'text-school-red'}`}>
              {message.text}
            </p>
          )}
        </div>

        {/* History Table */}
        <div className="flex-1 p-6 rounded-2xl border" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
          <h3 className="text-lg font-black mb-6 flex items-center gap-2" style={{ color: theme.text }}>
            <History className="text-indigo-500" size={20} /> Transaction History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: theme.inputBorder }}>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-500">Date</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-500">Allocation / Window</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-500">Profile</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-500">Amount</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map(t => (
                  <tr key={t._id} className="border-b" style={{ borderColor: theme.inputBorder }}>
                    <td className="py-4 text-xs font-bold" style={{ color: theme.subText }}>{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-4">
                      <div className="text-xs font-black" style={{ color: theme.text }}>{t.category}</div>
                      <div className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">{termLabels[t.term] || `Term ${t.term}`}</div>
                    </td>
                    <td className="py-4 text-xs font-black" style={{ color: theme.text }}>{t.user?.full_name || 'General Ledger'}</td>
                    <td className={`py-4 text-xs font-black ${t.type === 'Income' ? 'text-emerald-500' : 'text-school-red'}`}>
                      {t.type === 'Income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                    <td className="py-4">
                      {t.type === 'Income' && (
                        <button
                          onClick={() => handleDownloadReceipt(t._id)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-indigo-500"
                          title="Download Receipt"
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reusable Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200" style={{ backgroundColor: theme.card }}>
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-school-red rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-black text-center mb-2" style={{ color: theme.text }}>Confirm Deletion</h3>
            <p className="text-sm font-bold text-center mb-8 opacity-60" style={{ color: theme.subText }}>Are you sure you want to remove this financial record? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all" style={{ borderColor: theme.inputBorder, color: theme.text }}>Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-school-red hover:bg-school-red-dark text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-900/20">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;