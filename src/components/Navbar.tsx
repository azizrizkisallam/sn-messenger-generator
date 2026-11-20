import React from 'react';
import { LayoutDashboard, Users, MessageSquareQuote, Settings } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'database' | 'generator' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  participantCount: number;
  unconfirmedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  participantCount,
  unconfirmedCount,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number; badgeAlert?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'database',
      label: 'Database Peserta',
      icon: <Users className="w-4 h-4" />,
      badge: participantCount > 0 ? participantCount : undefined,
    },
    {
      id: 'generator',
      label: 'Message Generator',
      icon: <MessageSquareQuote className="w-4 h-4" />,
      badge: unconfirmedCount > 0 ? unconfirmedCount : undefined,
      badgeAlert: unconfirmedCount > 0,
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand SobatNgaji */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-base shadow-sm">
              SN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 tracking-tight text-base">SobatNgaji</span>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Message Generator
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Konsultasi Tahsin Gratis Asatidz SobatNgaji
              </p>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigasi Utama">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className={`text-xs px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? item.badgeAlert ? 'bg-amber-400 text-slate-950' : 'bg-emerald-600 text-white'
                          : item.badgeAlert ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Navigation Bar */}
        <nav className="md:hidden flex items-center justify-between border-t border-slate-100 py-1.5 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex-1 min-w-[70px] flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'text-emerald-700 font-semibold bg-emerald-50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2 text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold ${
                        item.badgeAlert ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-[11px] truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
