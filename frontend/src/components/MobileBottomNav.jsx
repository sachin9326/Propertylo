import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart, Plus, User, Search, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = () => {
    const location = useLocation();
    const { user } = useAuth();
    
    // Hide bottom nav on specific pages if needed
    if (location.pathname === '/auth' || location.pathname === '/post-property') {
        return null;
    }

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-[60] px-2 py-2 pb-4 flex justify-around items-end shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <Link to="/" className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${isActive('/') ? 'text-primary' : 'text-slate-500'}`}>
                    <Search size={22} className={isActive('/') ? 'stroke-[2.5px]' : ''} />
                    <span className="text-[10px] font-bold">Explore</span>
                </Link>

                <Link to="/ai-quiz" className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${isActive('/ai-quiz') ? 'text-violet-600' : 'text-slate-500'}`}>
                    <Heart size={22} className={isActive('/ai-quiz') ? 'stroke-[2.5px]' : ''} />
                    <span className="text-[10px] font-bold">Matches</span>
                </Link>

                {/* center add button matching the screenshot */}
                <Link to="/post-property" className="relative -top-1 flex flex-col items-center justify-center p-2 group">
                    <div className="w-[52px] h-[52px] bg-white border-[3px] border-slate-400/80 rounded-2xl flex items-center justify-center group-hover:border-primary group-hover:text-primary group-active:scale-95 transition-all text-slate-500 mb-2">
                        <Plus size={32} className="stroke-[3px]" />
                    </div>
                    <span className="text-xl text-slate-600 tracking-tight" style={{ fontFamily: 'sans-serif' }}>Sell/Rent</span>
                </Link>

                <Link to="/emi-calculator" className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${isActive('/emi-calculator') ? 'text-primary' : 'text-slate-500'}`}>
                    <Settings size={22} className={isActive('/emi-calculator') ? 'stroke-[2.5px]' : ''} />
                    <span className="text-[10px] font-bold">Tools</span>
                </Link>

                <Link to={user ? "/dashboard" : "/auth"} className={`flex flex-col items-center gap-1 p-2 w-16 transition-colors ${isActive('/dashboard') ? 'text-primary' : 'text-slate-500'}`}>
                    <User size={22} className={isActive('/dashboard') ? 'stroke-[2.5px]' : ''} />
                    <span className="text-[10px] font-bold">Profile</span>
                </Link>
            </div>
            {/* Spacer for bottom nav */}
            <div className="md:hidden h-24 w-full"></div>
        </>
    );
};

export default MobileBottomNav;
