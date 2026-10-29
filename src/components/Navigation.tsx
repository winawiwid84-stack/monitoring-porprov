import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  CalendarDays,
  Radio,
  Medal,
  HeartPulse,
  Truck,
  Scale,
  Database,
  FileSpreadsheet,
  History,
  Settings,
  Lock,
  Camera,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'jadwal'
  | 'posko'
  | 'visit_photos'
  | 'medali'
  | 'medis'
  | 'logistik'
  | 'protes'
  | 'master'
  | 'laporan'
  | 'audit'
  | 'pengaturan';

interface NavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  unresolvedCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onChangeTab, unresolvedCount }) => {
  const { canAccessMedical, canManageMaster, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'jadwal', label: 'Jadwal & Hasil', icon: CalendarDays },
    { id: 'posko', label: 'Posko & Kendala', icon: Radio, badge: unresolvedCount > 0 ? unresolvedCount : null },
    { id: 'visit_photos', label: 'Galeri & Monev', icon: Camera },
    { id: 'medali', label: 'Medali & Target', icon: Medal },
    { id: 'medis', label: 'Medis & Kebugaran', icon: HeartPulse, restricted: !canAccessMedical },
    { id: 'logistik', label: 'Penginapan & Armada', icon: Truck },
    { id: 'protes', label: 'Protes & Hukum', icon: Scale },
    { id: 'master', label: 'Master Data', icon: Database },
    { id: 'laporan', label: 'Rekap & Ekspor', icon: FileSpreadsheet },
    { id: 'audit', label: 'Audit Log', icon: History, adminOnly: true },
    { id: 'pengaturan', label: 'ERD & Panduan', icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-[73px] z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isLocked = item.restricted || (item.adminOnly && user?.role !== 'admin' && user?.role !== 'pengurus_pusat');

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!isLocked) onChangeTab(item.id as ActiveTab);
                }}
                disabled={isLocked}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : isLocked
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isLocked ? 'text-slate-300' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white animate-pulse'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isLocked && <Lock className="w-3 h-3 text-slate-300" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
