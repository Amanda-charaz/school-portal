import React, { useState } from 'react';
import { Menu, X, Home, BookOpen, User, LogOut, LayoutDashboard } from 'lucide-react';

/**
 * MainLayout provides a responsive wrapper for the entire application.
 * - Desktop: Sidebar + Main Content Area
 * - Mobile: Mobile Header + Slide-out Drawer
 */
const MainLayout = ({ children, userRole = 'student' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Define navigation items based on the user roles from your controllers
  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Results', icon: BookOpen, path: '/results' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="min-h-screen w-full flex bg-gray-100 transition-all duration-300">
      {/* --- MOBILE HEADER --- */}
      <header className="md:hidden bg-blue-700 text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-50">
        <h1 className="text-xl font-bold">School Portal</h1>
        <button onClick={toggleSidebar} className="p-1 hover:bg-blue-800 rounded-md">
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* --- SIDEBAR / DRAWER --- */}
      {/* This uses Tailwind's transform classes to slide in on mobile */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:inset-0 md:shadow-none border-r border-gray-200
        `}
      >
        <div className="h-full flex flex-col">
          <div className="hidden md:flex items-center p-6 border-b">
            <span className="text-2xl font-bold text-blue-700 uppercase tracking-wider">Portal</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.path}
                className="flex items-center gap-4 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors font-medium"
              >
                <item.icon size={20} />
                {item.label}
              </a>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <button className="flex items-center gap-4 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium">
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar for Desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8">
          <div className="text-sm text-gray-500">
            Welcome back, <span className="font-semibold text-gray-800">User</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              U
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 lg:p-12">
          {children}
        </div>
      </main>

      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default MainLayout;