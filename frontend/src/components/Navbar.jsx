import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, PlusCircle, LayoutDashboard, Calculator, TrendingUp,
  Menu, X, ChevronDown, Brain, Sparkles, Bell
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto max-w-screen-xl px-4 py-3 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 text-primary">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
            <span className="text-white font-extrabold text-sm leading-none">LE</span>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-800">LuxeEstates</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/"
            className={`px-4 py-2 rounded-lg transition-all font-medium text-sm ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:text-primary hover:bg-slate-50'}`}>
            Explore
          </Link>

          {/* Tools Dropdown */}
          <div className="relative">
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              onBlur={() => setTimeout(() => setToolsOpen(false), 200)}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-all font-medium text-sm ${toolsOpen ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:text-primary hover:bg-slate-50'}`}
            >
              Tools <ChevronDown size={14} className={`transition-transform duration-200 ${toolsOpen ? 'rotate-180' : ''}`} />
            </button>
            {toolsOpen && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <Link to="/emi-calculator"
                  onClick={() => setToolsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                  <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Calculator size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">EMI Calculator</p>
                    <p className="text-xs text-slate-400">Plan your home loan</p>
                  </div>
                </Link>
                <Link to="/roi-calculator"
                  onClick={() => setToolsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                  <div className="p-1.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <TrendingUp size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">ROI Calculator</p>
                    <p className="text-xs text-slate-400">Analyze investment returns</p>
                  </div>
                </Link>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <Link to="/ai-quiz"
                    onClick={() => setToolsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-violet-50 transition-colors group">
                    <div className="p-1.5 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors">
                      <Brain size={14} className="text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">AI Match Quiz</p>
                      <p className="text-xs text-slate-400">Personalize your search</p>
                    </div>
                    <span className="ml-auto text-[10px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">NEW</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {user ? (
            <>
              {/* AI Quiz badge — prompt if not done */}
              <Link to="/ai-quiz"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all font-medium text-sm ${isActive('/ai-quiz') ? 'bg-violet-100 text-violet-700' : 'text-violet-600 hover:bg-violet-50'}`}>
                <Brain size={15} />
                <span className="hidden lg:block">AI Match</span>
                <span className="inline-flex items-center justify-center w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
              </Link>

              {user.role === 'UPLOADER' && (
                <Link to="/post-property"
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors shadow-sm">
                  <PlusCircle size={15} />
                  <span>Post Property</span>
                </Link>
              )}

              <div className="flex items-center gap-1 ml-1 pl-3 border-l border-slate-200">
                <Link to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium ${isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:text-primary hover:bg-slate-50'}`}>
                  <LayoutDashboard size={15} />
                  <span className="hidden lg:block">Dashboard</span>
                </Link>

                {/* User avatar */}
                <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-700 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">{user.name?.[0]?.toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 hidden lg:block max-w-24 truncate">{user.name}</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={15} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/auth"
                className="px-4 py-2 text-slate-600 hover:text-primary font-medium text-sm rounded-lg hover:bg-slate-50 transition-colors">
                Login
              </Link>
              <Link to="/auth"
                className="px-5 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-blue-600 transition-colors shadow-md shadow-primary/20 text-sm">
                Sign Up Free
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          {mobileOpen ? <X size={22} className="text-slate-700" /> : <Menu size={22} className="text-slate-700" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          <Link to="/" onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm ${isActive('/') ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
            Explore
          </Link>
          <Link to="/ai-quiz" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-violet-700 bg-violet-50 font-semibold text-sm">
            <Brain size={16} /> AI Match Quiz
            <span className="ml-auto text-[10px] bg-violet-200 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">NEW</span>
          </Link>
          <Link to="/emi-calculator" onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm ${isActive('/emi-calculator') ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
            <Calculator size={15} /> EMI Calculator
          </Link>
          <Link to="/roi-calculator" onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm ${isActive('/roi-calculator') ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'}`}>
            <TrendingUp size={15} /> ROI Calculator
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm ${isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}>
                <LayoutDashboard size={15} /> Dashboard
              </Link>
              {user.role === 'UPLOADER' && (
                <Link to="/post-property" onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm">
                  <PlusCircle size={15} /> Post Property
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 font-medium text-sm"
              >
                <LogOut size={15} /> Logout
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Link to="/auth" onClick={() => setMobileOpen(false)}
                className="flex-1 py-3 text-center border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50">
                Login
              </Link>
              <Link to="/auth" onClick={() => setMobileOpen(false)}
                className="flex-1 py-3 text-center bg-primary text-white font-semibold rounded-xl text-sm hover:bg-blue-600">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
