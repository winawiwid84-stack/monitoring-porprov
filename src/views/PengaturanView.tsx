import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext.tsx';
import {
  Settings,
  Database,
  FileCode,
  Download,
  HelpCircle,
  Server,
  Key,
  Shield,
  Layers,
  CheckCircle,
  Copy,
  Box,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { LaravelDeployModal } from '../components/LaravelDeployModal.tsx';

export const PengaturanView: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showLaravelModal, setShowLaravelModal] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const data = await api.getBackupJson();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Backup_Relasional_KONI_Kota_Bandung_PORPROV2026_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Gagal mengunduh cadangan: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Dokumentasi Arsitektur, ERD & Backup Database</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi lengkap skema 24 tabel relasional, akun demo, alur kerja, dan asumsi konfirmasi
          </p>
        </div>

        {user?.role === 'admin' && (
          <button
            onClick={handleDownloadBackup}
            disabled={downloading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{downloading ? 'Mengekspor...' : 'Unduh Cadangan Database (JSON)'}</span>
          </button>
        )}
      </div>

      {/* Special Laravel Deployment Banner */}
      <div className="bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 text-white p-5 rounded-2xl border border-red-700/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white rounded-md">
              Laravel Backend Ready
            </span>
            <span className="text-xs text-rose-300 font-mono">/laravel-backend</span>
          </div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-rose-400" />
            <span>Paket Migrasi & API Laravel 11/12 Tersedia</span>
          </h3>
          <p className="text-xs text-rose-200/90 max-w-2xl leading-relaxed">
            Sistem telah dilengkapi kode backend Laravel lengkap mencakup 24 tabel migrasi relasional, Model Eloquent, REST Controller, Seeder KONI Kota Bandung, serta konfigurasi Docker Compose & Nginx.
          </p>
        </div>

        <button
          onClick={() => setShowLaravelModal(true)}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 shadow-sm"
        >
          <Box className="w-4 h-4" />
          <span>Buka Panduan & Kode Deploy Laravel</span>
        </button>
      </div>

      {/* Grid of Tech Stack & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Arsitektur Backend</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Express.js full-stack pada Node.js dengan Vite middleware terintegrasi di port 3000. REST API modular mencakup autentikasi JWT, validasi input ketat, dan logging audit trail.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Relasional SQLite</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            24 tabel relasional dengan foreign key terindeks (<code className="bg-slate-100 px-1 rounded text-slate-800">PRAGMA foreign_keys = ON</code>), constraint unik, validasi check status, timestamp otomatis, dan integritas ACID.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Firebase Cloud & Auth</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cloud Firestore Enterprise (<code className="bg-slate-100 px-1 rounded text-slate-800">asia-southeast1</code>) dengan Zero-Trust Security Rules, Google SSO login, dan sinkronisasi real-time multi-posko terenkripsi.
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Keamanan & RBAC</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Enkripsi kata sandi menggunakan <code className="bg-slate-100 px-1 rounded text-slate-800">bcrypt</code>, proteksi rahasia rekam medis atlet, dan kontrol akses berbasis peran (RBAC) pada tiap endpoint.
          </p>
        </div>
      </div>

      {/* Account Demo Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Daftar Akun Demo untuk Pengujian Tiap Peran
            </h3>
            <p className="text-[11px] text-slate-500">Kata sandi seluruh akun demo: <code className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">bandungjuara2026</code></p>
          </div>
          <span className="text-[11px] text-slate-400">Gunakan dropdown navbar untuk ganti peran cepat</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Nama Lengkap & Jabatan Demo</th>
                <th className="py-3 px-4">Hak Akses Utama</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Object.keys(DEMO_CREDENTIALS) as (keyof typeof DEMO_CREDENTIALS)[]).map((key) => {
                const cred = DEMO_CREDENTIALS[key];
                return (
                  <tr key={key} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-emerald-800 uppercase font-mono">{key}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{cred.username}</td>
                    <td className="py-3 px-4 text-slate-700">{cred.name}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {key === 'admin'
                        ? 'Full Akses Sistem, Master Data, Reset Password, Verifikasi Target'
                        : key === 'pengurus_pusat'
                        ? 'Melihat Seluruh Data, Mengambil Keputusan, Eskalasi, Sidang Protes'
                        : key === 'koordinator_posko'
                        ? 'Kelola Laporan Posko, Kendala Posko, Armada Transportasi'
                        : key === 'tim_teknis'
                        ? 'Jadwal Pertandingan, Catat Skor Hasil, Verifikasi Teknis Cabor'
                        : key === 'tim_medis'
                        ? 'Akses Khusus Rekam Medis & Kesehatan Atlet, Rujukan RS'
                        : 'Melihat Ringkasan Eksekutif & Laporan (Read-Only)'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => copyToClipboard(cred.username, key)}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                        title="Salin Username"
                      >
                        {copiedKey === key ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relational Database Schema ERD Documentation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-900 text-sm">
            Dokumentasi Skema Relasional ERD (24 Tabel Relasional)
          </h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Berikut adalah struktur 24 entitas tabel relasional yang telah diimplementasikan dengan foreign keys, indeks, dan integritas data:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">1. users & roles</span>
            <p className="text-[11px] text-slate-500 font-sans">Autentikasi akun pengguna, hash bcrypt, dan penugasan posko.</p>
            <div className="text-[10px] text-slate-400">users (id, username, password_hash, assigned_post_id)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">2. sports & events</span>
            <p className="text-[11px] text-slate-500 font-sans">78 Cabor dan 911 nomor pertandingan yang diikuti kontingen.</p>
            <div className="text-[10px] text-slate-400">events.sport_id &rarr; sports.id (FK CASCADE)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">3. athletes & officials</span>
            <p className="text-[11px] text-slate-500 font-sans">1.366 atlet, 307 pelatih, 161 official, dan 86 manajer cabor.</p>
            <div className="text-[10px] text-slate-400">athletes.sport_id &rarr; sports.id (FK CASCADE)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">4. host_regions & venues</span>
            <p className="text-[11px] text-slate-500 font-sans">12 Daerah tuan rumah PORPROV XV dan fasilitas gelanggang pertandingan.</p>
            <div className="text-[10px] text-slate-400">venues.region_id &rarr; host_regions.id (FK CASCADE)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">5. posts & post_personnel</span>
            <p className="text-[11px] text-slate-500 font-sans">Posko Bekasi, Bogor, Bandung dan pengelolaan personel siaga per bidang.</p>
            <div className="text-[10px] text-slate-400">post_personnel.post_id &rarr; posts.id (FK CASCADE)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">6. fixtures & results</span>
            <p className="text-[11px] text-slate-500 font-sans">Jadwal tanding, status penundaan, skor perolehan, dan verifikasi.</p>
            <div className="text-[10px] text-slate-400">results.fixture_id &rarr; fixtures.id (FK CASCADE UNIQUE)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">7. medals</span>
            <p className="text-[11px] text-slate-500 font-sans">Perolehan emas, perak, perunggu dengan status verifikasi resmi.</p>
            <div className="text-[10px] text-slate-400">medals.sport_id &rarr; sports.id (FK CASCADE)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">8. daily_reports & issues</span>
            <p className="text-[11px] text-slate-500 font-sans">Laporan harian posko, kendala operasional, dan eskalasi ke pusat.</p>
            <div className="text-[10px] text-slate-400">issues.daily_report_id &rarr; daily_reports.id</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">9. issue_updates</span>
            <p className="text-[11px] text-slate-500 font-sans">Riwayat kronologis penanganan tindak lanjut kendala.</p>
            <div className="text-[10px] text-slate-400">issue_updates.issue_id &rarr; issues.id (FK CASCADE)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">10. medical_cases (Proteksi Khusus)</span>
            <p className="text-[11px] text-slate-500 font-sans">Catatan penanganan cedera & rujukan medis dengan akses terbatas.</p>
            <div className="text-[10px] text-slate-400">medical_cases.athlete_id &rarr; athletes.id (FK CASCADE)</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">11. accommodations & transport</span>
            <p className="text-[11px] text-slate-500 font-sans">Manajemen okupansi hotel/asrama dan penugasan armada operasional.</p>
            <div className="text-[10px] text-slate-400">accommodations.post_id &rarr; posts.id</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-emerald-800 font-sans">12. protests, audit_logs & app_settings</span>
            <p className="text-[11px] text-slate-500 font-sans">Advokasi hukum perwasitan, audit trail keamanan, konfigurasi 171 & 76.</p>
            <div className="text-[10px] text-slate-400">audit_logs (user_id, action, module, timestamp)</div>
          </div>
        </div>
      </div>

      {/* Assumptions & Confirmation Questions */}
      <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
          <HelpCircle className="w-5 h-5 text-amber-700" />
          <span>Daftar Asumsi & Pertanyaan Konfirmasi untuk Data Belum Lengkap</span>
        </div>
        <p className="text-xs text-amber-950 leading-relaxed">
          Sesuai instruksi pengguna agar tidak mengarang data resmi dan menandai data yang perlu diverifikasi admin, sistem mencatat poin-poin berikut:
        </p>

        <ul className="list-disc pl-5 text-xs text-amber-900 space-y-2">
          <li>
            <strong>Angka 171 dan 76:</strong> Ditempatkan dalam modul konfigurasi target khusus dengan status <em>Belum Terverifikasi</em> secara default. Admin perlu memastikan apakah 171 adalah target medali emas atau total medali unggulan, dan apakah 76 adalah target medali perak atau potensi cabor bela diri.
          </li>
          <li>
            <strong>Rincian Kontingen:</strong> Angka 1.366 atlet, 307 pelatih, 161 official, dan 86 manajer (total 1.920) telah terkonfigurasi pada master data dan dapat disesuaikan sewaktu-waktu sesuai SK Kontingen definitif dari KONI Kota Bandung.
          </li>
          <li>
            <strong>Posko & Personel:</strong> 3 posko yang dipaparkan (Asrama Haji Bekasi/Depok, House Tell Bogor, dan Kantor KONI Pajajaran Bandung) dapat diperbarui alamat, nomor kontak, serta susunan petugas per bidangnya secara fleksibel.
          </li>
        </ul>
      </div>

      {/* Laravel Deployment Blueprint & Guide Modal */}
      <LaravelDeployModal
        isOpen={showLaravelModal}
        onClose={() => setShowLaravelModal(false)}
      />
    </div>
  );
};
