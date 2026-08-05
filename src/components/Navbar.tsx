import React from 'react';
import { User } from '../types';
import { ShieldCheck, User as UserIcon, LogOut, FileSpreadsheet, Users } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  activeAdmTab?: 'reports' | 'users';
  onSelectAdmTab?: (tab: 'reports' | 'users') => void;
  onLogout: () => void;
  onSwitchUser?: (email: string, role: 'usuario' | 'adm') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeAdmTab = 'reports',
  onSelectAdmTab,
  onLogout,
}) => {
  return (
    <header className="h-16 bg-white border-b border-brand-warm px-4 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Brand logo & title */}
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 bg-brand-yellow rounded-xl flex items-center justify-center text-brand-dark font-black text-lg shadow-sm">
            RC
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-brand-dark flex items-center gap-2">
            Report Center <span className="text-slate-400 font-normal">| RC OS</span>
          </h1>

          {/* ADM Navigation Tabs in Header */}
          {user && user.role === 'adm' && onSelectAdmTab && (
            <div className="hidden md:flex items-center gap-1.5 ml-4 pl-4 border-l border-brand-warm">
              <button
                type="button"
                id="tab-triagem"
                onClick={() => onSelectAdmTab('reports')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeAdmTab === 'reports'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-[#F8F5EC] hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Triagem DE OS
              </button>
              <button
                type="button"
                id="tab-gestor-usuarios"
                onClick={() => onSelectAdmTab('users')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeAdmTab === 'users'
                    ? 'bg-brand-yellow text-brand-dark shadow-xs'
                    : 'text-slate-600 hover:bg-[#F8F5EC] hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" /> Gestão de Usuários
              </button>
            </div>
          )}
        </div>

        {/* User Info & Quick Switchers */}
        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mode Indicator Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-[#F8F5EC] px-3.5 py-1.5 rounded-full border border-brand-warm">
              <div
                className={`w-2 h-2 rounded-full ${
                  user.role === 'adm' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Modo {user.role === 'adm' ? 'Administrador' : 'Consultor'}
              </span>
            </div>

            {/* User Info Avatar & Details */}
            <div className="flex items-center gap-3 border-l pl-3 sm:pl-4 border-brand-warm">
              <div className="text-right hidden sm:block">
                <p className="text-xs sm:text-sm font-bold leading-none text-slate-900">{user.nome}</p>
                <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider font-mono">
                  {user.email}
                </p>
              </div>
              <div className="w-9 h-9 bg-brand-yellow rounded-full border-2 border-white shadow-xs flex items-center justify-center text-brand-dark font-black text-xs uppercase">
                {user.nome
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
            </div>

            {/* Logout */}
            <button
              id="btn-logout"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
              title="Sair do sistema"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
