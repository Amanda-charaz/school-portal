import React from 'react';
import { 
  Users, 
  ClipboardCheck, 
  TrendingUp, 
  BookOpen,
  PlusCircle,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeacherPortal = ({ setOpen, theme }) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: "Daily Attendance",
      desc: "Mark presence for today's classes",
      icon: <ClipboardCheck size={24} />,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
      action: () => setOpen && setOpen("attendance")
    },
    {
      title: "Manage Results",
      desc: "Enter O-Level subject grades",
      icon: <PlusCircle size={24} />,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
      action: () => setOpen && setOpen("results")
    },
    {
      title: "Class Performance",
      desc: "View class pass rates and trends",
      icon: <TrendingUp size={24} />,
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
      action: () => setOpen && setOpen("attendance")
    }
  ];

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Welcome Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700/50 relative overflow-hidden transition-all">
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
          Welcome back to the Faculty Portal
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg">
          Select a module below to manage your assigned students and academic records.
          </p>
        </div>
        {/* Decorative background icon */}
        <BookOpen size={220} className="absolute -right-12 -bottom-12 opacity-5 text-indigo-500 pointer-events-none transform -rotate-12" />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((item, idx) => (
          <div 
            key={idx} 
            onClick={item.action}
            className="group p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer flex items-center gap-5 active:scale-[0.98]"
          >
            <div className={`p-4 rounded-xl transition-colors ${item.bgColor} ${item.color}`}>
              {item.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-black text-gray-900 dark:text-white tracking-tight">{item.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed">{item.desc}</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:translate-x-1 transition-transform" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherPortal;