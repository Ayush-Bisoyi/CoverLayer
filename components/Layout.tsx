import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  Brain,
  FileText,
  Activity,
  LogOut,
  Shield,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children?: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Insurer Partners', path: '/insurers', icon: Building2 },
    { name: 'Partners/Clients', path: '/partners', icon: Users },
    { name: 'Policy Catalog', path: '/catalog', icon: BookOpen },
    { name: 'Risk Engine', path: '/risk-engine', icon: Brain },
    { name: 'Policies', path: '/policies', icon: FileText },
    { name: 'Claims', path: '/claims', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-[#0f0f12] border-r border-[#1a1a20] flex-shrink-0 hidden md:flex flex-col justify-between">
        <div className="flex flex-col">
          <div className="p-6 border-b border-[#1a1a20] flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white">CoverLayer</span>
              <p className="text-[9px] text-indigo-400 font-bold tracking-widest leading-none mt-0.5">PLATFORM</p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5 pt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs'
                      : 'text-zinc-400 hover:bg-[#16161c] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {user && (
          <div className="p-4 border-t border-[#1a1a20] bg-[#121215]/50">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={user.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330"}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-indigo-500/20 shadow-md object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-white truncate leading-tight">{user.name}</p>
                <p className="text-[10px] text-zinc-500 truncate font-extrabold uppercase tracking-wider mt-0.5">{user.role}</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-955/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/35 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Top Bar */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-[#0f0f12] border-b border-[#1a1a20] h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shadow-xs">
              <div className="w-3.5 h-3.5 border-2 border-white rounded-sm"></div>
            </div>
            <span className="font-extrabold tracking-tight text-white text-lg">CoverLayer</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-[#0f0f12] border-b border-[#1a1a20] px-6 py-4 space-y-1.5 shadow-sm">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-xs'
                      : 'text-zinc-400 hover:bg-[#16161c] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            {user && (
              <div className="pt-4 mt-3 border-t border-[#1a1a20]">
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-xs font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 flex flex-col justify-between">
          <main className="p-4 md:p-8">
            {children}
          </main>

          <footer className="h-16 bg-[#0f0f12] border-t border-[#1a1a20] flex flex-col sm:flex-row items-center justify-between px-6 md:px-8 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest shrink-0 gap-2">
            <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center sm:justify-start">
              <span>Compliance ID: 19022-X</span>
              <span className="hidden sm:inline text-zinc-800">|</span>
              <span>Regulated by FINRA/FCA</span>
            </div>
            <div className="flex gap-4">
              <span className="text-indigo-400 hover:underline cursor-pointer">Help Center</span>
              <span className="text-zinc-800">|</span>
              <span className="hover:text-zinc-300 cursor-pointer">Terms & Privacy</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
