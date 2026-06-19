import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { termLabels } from '../utils/academicUtils';
import { CreditCard, DollarSign, Clock, AlertCircle, ExternalLink, Download, History, Filter } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const StudentFeesView = () => {
  const { theme } = useTheme();
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feesRes, transRes] = await Promise.allSettled([
          api.get('/fees/my-fees'),
          api.get('/accounts/my-transactions')
        ]);

        setFees(feesRes.status === 'fulfilled' ? feesRes.value.data : []);
        setTransactions(transRes.status === 'fulfilled' ? transRes.value.data : []);

        if (feesRes.status === 'rejected' && feesRes.reason.response?.status !== 404) {
          console.error("Fee Fetch Failure:", feesRes.reason);
          setError("Failed to load fee records");
        }
        
        if (transRes.status === 'rejected') {
          console.error("Transaction Fetch Failure:", transRes.reason);
        }
      } catch (err) {
        setError("Error connecting to financial services");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInitiatePayment = () => {
    if (totalBalance <= 0) return;
    // Integration point for a payment gateway (e.g., Paynow, Stripe, PayPal)
    alert(`Redirecting to secure payment portal to settle balance of $${totalBalance.toLocaleString()}...`);
    // window.open("PAYMENT_LINK_HERE", "_blank");
  };

  const handleDownloadInvoice = async (feeId) => {
    try {
      const response = await api.get(`/fees/invoice/${feeId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${feeId.slice(-6)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download invoice: ' + (err.response?.data?.message || err.message));
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
      alert('Failed to download receipt: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredFees = fees.filter(f => selectedTerm === 'all' || String(f.term) === selectedTerm);
  const totalBalance = filteredFees.reduce((sum, record) => sum + record.balance, 0);

  if (loading) return <div className="p-10 text-center animate-pulse font-black text-gray-400 uppercase tracking-widest text-xs">Syncing Financial Ledger...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Filter Header */}
      <div className="flex justify-end mb-2">
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

      {/* Summary Card */}
      <div className="p-8 rounded-3xl border shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
        <div className="flex items-center gap-5">
           <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
             <CreditCard size={32} />
           </div>
           <div>
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Aggregate Outstanding Balance</h3>
             <div className="text-4xl font-black tracking-tighter" style={{ color: totalBalance > 0 ? '#B22222' : theme.text }}>
                ${totalBalance.toLocaleString()}
             </div>
             {totalBalance > 0 && (
               <div className="mt-2 text-xs font-black text-school-red uppercase tracking-widest animate-pulse">
                 ⚠️ Outstanding Fees Detected
               </div>
             )}
           </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {totalBalance > 0 && (
            <>
              <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={16} /> Pending Payment
              </div>
              <button 
                onClick={handleInitiatePayment}
                className="w-full sm:w-auto px-6 py-3 bg-school-blue hover:bg-school-blue-dark text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} /> Pay Online
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fee Invoices Section */}
      <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
        <h3 className="text-sm font-black uppercase tracking-[0.1em] mb-6 flex items-center gap-2" style={{ color: theme.subText }}>
          <Clock className="text-indigo-500" size={18} /> Invoices & Fees
        </h3>
        {filteredFees.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-bold italic border-2 border-dashed rounded-xl" style={{ borderColor: theme.inputBorder }}>No financial records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: theme.inputBorder }}>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400">Process Date</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400">Term / Breakdown</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400">Status</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400 text-right">Invoiced</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400 text-right">Paid</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400 text-right">Balance</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map(f => (
                  <tr key={f._id} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors" style={{ borderColor: theme.inputBorder }}>
                    <td className="py-4 text-xs font-bold text-gray-500">{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td className="py-4">
                      <div className="text-xs font-black" style={{ color: theme.text }}>{termLabels[f.term] || `Term ${f.term}`} Tuition</div>
                      <div className="text-[9px] text-gray-400 font-bold">
                        Base: ${f.base_amount?.toLocaleString() || '0'} | 
                        <span className="text-emerald-500"> Disc: -${f.discount?.toLocaleString() || '0'}</span> | 
                        <span className="text-school-red"> Fine: +${f.fines?.toLocaleString() || '0'}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">Due: {new Date(f.due_date).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                        f.status === 'Paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        f.status === 'Partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                        'bg-red-50 text-school-red dark:bg-school-red-dark/20 dark:text-school-red-light'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-bold text-right" style={{ color: theme.text }}>${f.total_amount.toLocaleString()}</td>
                    <td className="py-4 text-xs font-bold text-right text-emerald-500">${f.paid_amount.toLocaleString()}</td>
                    <td className="py-4 text-xs font-black text-right" style={{ color: f.balance > 0 ? '#B22222' : theme.text }}>
                      ${f.balance.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(f._id)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-indigo-500"
                        title="Download Invoice"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Section */}
      <div className="p-6 rounded-2xl border shadow-sm" style={{ backgroundColor: theme.card, borderColor: theme.inputBorder }}>
        <h3 className="text-sm font-black uppercase tracking-[0.1em] mb-6 flex items-center gap-2" style={{ color: theme.subText }}>
          <History className="text-indigo-500" size={18} /> Payment History
        </h3>
        {transactions.length === 0 ? (
          <div className="p-10 text-center text-gray-400 font-bold italic border-2 border-dashed rounded-xl" style={{ borderColor: theme.inputBorder }}>No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b" style={{ borderColor: theme.inputBorder }}>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400">Date</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400">Category</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400">Description</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400 text-right">Amount</th>
                  <th className="py-3 text-[10px] font-black uppercase text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t._id} className="border-b hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors" style={{ borderColor: theme.inputBorder }}>
                    <td className="py-4 text-xs font-bold text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-gray-800" style={{ color: theme.text }}>
                        {t.category}
                      </span>
                    </td>
                    <td className="py-4 text-xs font-bold" style={{ color: theme.subText }}>{t.description || "N/A"}</td>
                    <td className="py-4 text-xs font-black text-right text-emerald-500">
                      +${t.amount.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => handleDownloadReceipt(t._id)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-indigo-500"
                        title="Download Receipt"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeesView;