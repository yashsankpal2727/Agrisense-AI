import React from 'react';
import { Home, Scan, TrendingUp, History, User, Leaf } from 'lucide-react';

export const Navbar = ({
  activePage,
  onNavigate,
  userName = '',
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'upload', label: 'Analysis', icon: <Scan className="w-5 h-5" /> },
    { id: 'market', label: 'Market Price', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'history', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5 fill-current text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-emerald-950 font-['Space_Grotesk']">
                  AgriSense <span className="text-emerald-600">AI</span>
                </span>
              </div>
              <p className="text-[10px] font-medium text-emerald-700/80 tracking-wide uppercase">
                Smart Produce Grading
              </p>
            </div>
          </button>

          {/* Desktop/Tablet Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-emerald-50/70 p-1.5 rounded-2xl border border-emerald-100/60">
            {navItems.map((item) => {
              const isActive =
                activePage === item.id ||
                (item.id === 'upload' && (activePage === 'analyzing' || activePage === 'result'));
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/25'
                      : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-100/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Top Right Utilities */}
          <div className="flex items-center gap-2.5">
            {/* Quick Profile avatar */}
            <button
              onClick={() => onNavigate('profile')}
              className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center font-bold text-xs hover:ring-2 hover:ring-emerald-400 transition cursor-pointer"
              title={userName}
            >
              {userName.charAt(0).toUpperCase() || '?'}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-emerald-100/60 overflow-x-auto">
          {navItems.map((item) => {
            const isActive =
              activePage === item.id ||
              (item.id === 'upload' && (activePage === 'analyzing' || activePage === 'result'));
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
