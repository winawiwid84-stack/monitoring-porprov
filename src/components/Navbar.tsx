import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import { Shield, UserCheck, Key, LogOut, ChevronDown, Bell, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { api } from '../lib/api.ts';

interface NavbarProps {
  unresolvedCount: number;
  onNavigateToIssues: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ unresolvedCount, onNavigateToIssues }) => {
  const { user, switchDemoRole, logout } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  const handleRoleSelect = async (role: UserRole) => {
    setShowRoleMenu(false);
    await switchDemoRole(role);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    setPassMessage(null);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPassMessage({ text: 'Kata sandi berhasil diubah.', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setShowPassModal(false), 1500);
    } catch (err: any) {
      setPassMessage({ text: err.message || 'Gagal mengubah kata sandi', type: 'error' });
    } finally {
      setSavingPass(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pengurus_pusat': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'koordinator_posko': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'tim_monev': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'tim_teknis': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'tim_medis': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white shadow-lg border-b border-emerald-800/40">
        {/* Top Info Banner */}
        <div className="bg-emerald-900/60 px-4 py-1 text-xs border-b border-emerald-700/30">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-emerald-200">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">PORPROV XV Jawa Barat 2026</span>
              <span className="hidden sm:inline text-emerald-400">•</span>
              <span className="hidden sm:inline">28 Oktober – 20 November 2026</span>
              <span className="hidden md:inline text-emerald-400">•</span>
              <span className="hidden md:inline">Pembukaan: 7 Nov (Kota Bekasi) | Penutupan: 20 Nov (Kota Bogor)</span>
            </div>
            <div className="flex items-center gap-3 text-emerald-300 text-[11px]">
              <span className="bg-emerald-800/80 px-2 py-0.5 rounded text-white font-medium">12 Daerah Tuan Rumah</span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-medium">3 Posko Aktif</span>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-600 flex items-center justify-center shadow-md ring-2 ring-emerald-400/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                    KONI KOTA BANDUNG
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-yellow-400 text-slate-900 px-1.5 py-0.5 rounded">
                      JUARA
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-emerald-300/90 font-medium">
                  Sistem Monitoring Kontingen – PORPROV XV Jawa Barat 2026
                </p>
              </div>
            </div>

            {/* Right Action & Role Switcher */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Unresolved issues indicator button */}
              {unresolvedCount > 0 && (
                <button
                  onClick={onNavigateToIssues}
                  className="hidden sm:flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                  title="Lihat kendala posko yang belum selesai"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>{unresolvedCount} Kendala Aktif</span>
                </button>
              )}

              {/* Demo Role Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs transition shadow-sm"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <div className="text-left hidden sm:block">
                    <div className="text-[10px] text-slate-400 leading-none">Pilih Peran Demo:</div>
                    <div className="font-semibold text-white capitalize leading-tight">
                      {DEMO_CREDENTIALS[user?.role || 'admin']?.label || user?.role}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
                </button>

                {showRoleMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Ganti Akun & Hak Akses</p>
                        <p className="text-[11px] text-slate-500">Uji hak akses peran sesuai spesifikasi teknis:</p>
                      </div>
                      <div className="py-1">
                        {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((rKey) => {
                          const cred = DEMO_CREDENTIALS[rKey];
                          const isActive = user?.role === rKey;
                          return (
                            <button
                              key={rKey}
                              onClick={() => handleRoleSelect(rKey)}
                              className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 transition ${
                                isActive ? 'bg-emerald-50/80 text-emerald-900 font-bold' : 'text-slate-700'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span>{cred.label}</span>
                                  {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                                </div>
                                <div className="text-[11px] text-slate-500 font-normal">{cred.name}</div>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${getRoleBadgeColor(rKey)}`}>
                                {rKey}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-slate-100 pt-1 mt-1 px-3">
                        <button
                          onClick={() => {
                            setShowRoleMenu(false);
                            setShowPassModal(true);
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-2 rounded hover:bg-slate-100"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Ubah Kata Sandi Saya</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Profile Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center ring-1 ring-emerald-400">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <div className="font-semibold text-white truncate max-w-[140px]">{user?.full_name?.split(' ')[0]}</div>
                  <div className="text-[10px] text-emerald-300 truncate max-w-[140px]">
                    {user?.assigned_post_id ? 'Petugas Posko' : 'Pusat'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPassModal}
        onClose={() => setShowPassModal(false)}
        title="Ubah Kata Sandi"
        subtitle={`Pengguna saat ini: ${user?.username} (${user?.full_name})`}
        maxWidth="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passMessage && (
            <div
              className={`p-3 rounded-lg text-xs font-medium ${
                passMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {passMessage.text}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Masukkan kata sandi saat ini"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default demo: bandungjuara2026</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPassModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={savingPass}
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
            >
              {savingPass ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};
