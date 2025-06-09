import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Droplet as DropletHalf, Utensils, Syringe, BookText, BarChart3, User, Settings, Menu, X, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/glucose', icon: <DropletHalf size={20} />, label: 'Glucose' },
    { path: '/meals', icon: <Utensils size={20} />, label: 'Meals' },
    { path: '/insulin', icon: <Syringe size={20} />, label: 'Insulin' },
    // { path: '/journal', icon: <BookText size={20} />, label: 'Journal' },
    { path: '/reports', icon: <BarChart3 size={20} />, label: 'Reports' },
    { path: '/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  const activeNavClass = 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400';
  const inactiveNavClass = 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-30">
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-white dark:bg-gray-800 shadow-md"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar for desktop */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 flex-col w-64 px-4 py-8 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-20">
        <div className="flex items-center mb-8">
          <DropletHalf className="text-sky-600 mr-2" size={28} />
          <h1 className="text-xl font-bold">DiaSync</h1>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                location.pathname === item.path ? activeNavClass : inactiveNavClass
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.diabetesType}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <aside 
        className={`lg:hidden fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-20 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <DropletHalf className="text-sky-600 mr-2" size={24} />
            <h1 className="text-lg font-bold">DiaSync</h1>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                location.pathname === item.path ? activeNavClass : inactiveNavClass
              }`}
              onClick={toggleMobileMenu}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="ml-2 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.diabetesType}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut size={16} />}
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        ></div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="container mx-auto px-4 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;