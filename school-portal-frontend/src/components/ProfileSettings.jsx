import React, { useState } from 'react';
import api from '../api/axios';
import { Lock, Save, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ProfileSettings = ({ theme }) => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const toggleShow = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: 'Password updated successfully! ✅' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to change password. Please check your current password.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Account Security</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Update your password to keep your account safe.</p>
          </div>
        </div>

        {message.text && (
          <div className={`p-4 rounded-xl text-xs font-black uppercase tracking-widest mb-6 border ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: theme?.subText }}>Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handleChange}
                required
                className="w-full p-3 pl-10 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                style={{ backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }}
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={16} />
              <button type="button" onClick={() => toggleShow('current')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: theme?.subText }}>New Password</label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handleChange}
                required
                className="w-full p-3 pl-10 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                style={{ backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }}
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={16} />
              <button type="button" onClick={() => toggleShow('new')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest opacity-50" style={{ color: theme?.subText }}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full p-3 pl-10 rounded-2xl border outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                style={{ backgroundColor: theme?.inputBg, borderColor: theme?.inputBorder, color: theme?.text }}
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={16} />
              <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ backgroundColor: theme?.accent }}
          >
            <Save size={18} />
            {loading ? 'Processing...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;