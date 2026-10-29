import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Navigation, ActiveTab } from './components/Navigation.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { JadwalHasilView } from './views/JadwalHasilView.tsx';
import { PoskoLaporanView } from './views/PoskoLaporanView.tsx';
import { MedaliView } from './views/MedaliView.tsx';
import { MedisView } from './views/MedisView.tsx';
import { LogistikView } from './views/LogistikView.tsx';
import { ProtesView } from './views/ProtesView.tsx';
import { MasterDataView } from './views/MasterDataView.tsx';
import { LaporanEksporView } from './views/LaporanEksporView.tsx';
import { GaleriFotoView } from './views/GaleriFotoView.tsx';
import { AuditLogView } from './views/AuditLogView.tsx';
import { PengaturanView } from './views/PengaturanView.tsx';
import { AiChatWidget } from './components/AiChatWidget.tsx';
import { api } from './lib/api.ts';
import { Sparkles } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [unresolvedCount, setUnresolvedCount] = useState<number>(0);

  const fetchIssuesCount = async () => {
    try {
      const stats = await api.getDashboardStats();
      const openCount = (stats?.issues_summary?.baru || 0) + (stats?.issues_summary?.diproses || 0) + (stats?.issues_summary?.menunggu || 0);
      setUnresolvedCount(openCount);
    } catch (err) {
      // Ignore initial stats load errors
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchIssuesCount();
      const interval = setInterval(fetchIssuesCount, 30000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-16 h-16 rounded-2xl bg-white p-1.5 flex items-center justify-center mb-4 shadow-xl ring-4 ring-emerald-500/20 overflow-hidden shrink-0">
          <img
            src="/assets/aistudio/logo_koni_kota_bdg_19156272.png"
            alt="Logo KONI Kota Bandung"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
          KONI KOTA BANDUNG
          <span className="text-[10px] uppercase font-bold tracking-widest bg-yellow-400 text-slate-900 px-2 py-0.5 rounded">
            JUARA
          </span>
        </h2>
        <p className="text-xs text-emerald-300 mt-1">Sistem Monitoring Kontingen – PORPROV XV Jawa Barat 2026</p>
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Menyiapkan sesi & data relasional...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        unresolvedCount={unresolvedCount}
        onNavigateToIssues={() => setActiveTab('posko')}
      />

      {/* Module Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        unresolvedCount={unresolvedCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView onNavigate={(t) => setActiveTab(t)} />}
        {activeTab === 'jadwal' && <JadwalHasilView />}
        {activeTab === 'posko' && <PoskoLaporanView />}
        {activeTab === 'visit_photos' && <GaleriFotoView />}
        {activeTab === 'medali' && <MedaliView />}
        {activeTab === 'medis' && <MedisView />}
        {activeTab === 'logistik' && <LogistikView />}
        {activeTab === 'protes' && <ProtesView />}
        {activeTab === 'master' && <MasterDataView />}
        {activeTab === 'laporan' && <LaporanEksporView />}
        {activeTab === 'audit' && <AuditLogView />}
        {activeTab === 'pengaturan' && <PengaturanView />}
      </main>

      {/* Floating AI Sports Assistant */}
      <AiChatWidget />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              KB
            </div>
            <span>
              <strong>KONI Kota Bandung</strong> © 2026 – PORPROV XV Jawa Barat (28 Okt – 20 Nov 2026)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Bandung Juara Jabar Kahiji</span>
            <span>•</span>
            <span>Sistem Monitoring Kontingen Terpadu</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
