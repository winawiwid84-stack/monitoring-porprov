import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { AuditLog } from '../types/index.ts';
import { History, Shield, Filter, Search, RefreshCw, UserCheck } from 'lucide-react';

export const AuditLogView: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        module: filterModule || undefined,
        action: filterAction || undefined,
        limit: 100,
      });
      setLogs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filterModule, filterAction]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <span>Audit Trail & Log Keamanan Sistem</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan mutlak seluruh aktivitas penting: siapa, peran, modul, waktu, dan rincian perubahan data
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-slate-600">Filter Log:</span>

        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="px-2.5 py-1.5 border rounded-lg"
        >
          <option value="">Semua Modul</option>
          <option value="Autentikasi">Autentikasi & Login</option>
          <option value="Jadwal Pertandingan">Jadwal Pertandingan</option>
          <option value="Hasil Pertandingan">Hasil Pertandingan</option>
          <option value="Medali">Medali</option>
          <option value="Kendala Posko">Kendala Posko</option>
          <option value="Laporan Harian">Laporan Harian</option>
          <option value="Kesehatan Atlet">Kesehatan Atlet (Medis)</option>
          <option value="Master Cabor">Master Cabor</option>
          <option value="Master Atlet">Master Atlet</option>
          <option value="Pengaturan Target Medali">Pengaturan Target Medali</option>
        </select>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-2.5 py-1.5 border rounded-lg"
        >
          <option value="">Semua Aksi</option>
          <option value="LOGIN">LOGIN</option>
          <option value="CREATE">CREATE / TAMBAH</option>
          <option value="UPDATE">UPDATE / UBAH</option>
          <option value="VERIFY">VERIFIKASI</option>
          <option value="DELETE">DELETE / HAPUS</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu & IP</th>
                <th className="py-3 px-4">Pengguna & Peran</th>
                <th className="py-3 px-4">Modul & Aksi</th>
                <th className="py-3 px-4">ID Record</th>
                <th className="py-3 px-4">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 font-sans">
                    Tidak ada log audit tercatat.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{log.timestamp}</div>
                      <div className="text-[10px] text-slate-400">{log.ip_address || '127.0.0.1'}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <div className="font-bold text-slate-900">{log.username}</div>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <div className="font-bold text-emerald-800">{log.module}</div>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {log.record_id || '-'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
