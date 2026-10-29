import React from 'react';

interface StatusBadgeProps {
  type: 'status' | 'priority' | 'verified' | 'medal' | 'outcome' | 'urgency';
  value: string | number;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, className = '' }) => {
  const strVal = String(value).toLowerCase();

  // Verification status
  if (type === 'verified') {
    const isVerified = strVal === '1' || strVal === 'true' || strVal === 'terverifikasi';
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
          isVerified
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
        } ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-600' : 'bg-amber-500'}`} />
        {isVerified ? 'Terverifikasi' : 'Belum Diverifikasi (Perlu Cek)'}
      </span>
    );
  }

  // Match / general status
  if (type === 'status') {
    switch (strVal) {
      case 'terjadwal':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 ${className}`}>Terjadwal</span>;
      case 'berlangsung':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Sedang Berlangsung
          </span>
        );
      case 'selesai':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 ${className}`}>Selesai</span>;
      case 'ditunda':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300 ${className}`}>Ditunda</span>;
      case 'dibatalkan':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-300 ${className}`}>Dibatalkan</span>;
      case 'baru':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 ${className}`}>Baru</span>;
      case 'diproses':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200 ${className}`}>Diproses</span>;
      case 'menunggu':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200 ${className}`}>Menunggu</span>;
      case 'terkirim':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 border border-teal-200 ${className}`}>Terkirim</span>;
      case 'aktif':
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 ${className}`}>Aktif</span>;
      default:
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 ${className}`}>{value}</span>;
    }
  }

  // Priority
  if (type === 'priority') {
    switch (strVal) {
      case 'kritis':
        return <span className={`px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white ${className}`}>KRITIS</span>;
      case 'tinggi':
        return <span className={`px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-white ${className}`}>TINGGI</span>;
      case 'sedang':
        return <span className={`px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800 border border-sky-300 ${className}`}>Sedang</span>;
      case 'rendah':
        return <span className={`px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}>Rendah</span>;
      default:
        return <span className={`px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-700 ${className}`}>{value}</span>;
    }
  }

  // Medals
  if (type === 'medal') {
    switch (strVal) {
      case 'emas':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 ${className}`}>
            🥇 EMAS
          </span>
        );
      case 'perak':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-400 ${className}`}>
            🥈 PERAK
          </span>
        );
      case 'perunggu':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-950 border border-amber-600 ${className}`}>
            🥉 PERUNGGU
          </span>
        );
      default:
        return <span className={`px-2 py-0.5 text-xs ${className}`}>{value}</span>;
    }
  }

  // Urgency for medical
  if (type === 'urgency') {
    switch (strVal) {
      case 'darurat':
        return <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white animate-bounce ${className}`}>DARURAT (EMERGENCY)</span>;
      case 'tinggi':
        return <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white ${className}`}>Tinggi</span>;
      case 'sedang':
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 ${className}`}>Sedang</span>;
      case 'rendah':
        return <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 ${className}`}>Rendah</span>;
      default:
        return <span className={`px-2 py-0.5 rounded-full text-xs ${className}`}>{value}</span>;
    }
  }

  // Outcome
  if (type === 'outcome') {
    switch (strVal) {
      case 'menang':
        return <span className={`px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white ${className}`}>MENANG</span>;
      case 'kalah':
        return <span className={`px-2 py-0.5 rounded text-xs font-bold bg-rose-500 text-white ${className}`}>KALAH</span>;
      case 'seri':
        return <span className={`px-2 py-0.5 rounded text-xs font-medium bg-slate-400 text-white ${className}`}>SERI</span>;
      case 'walkout':
        return <span className={`px-2 py-0.5 rounded text-xs font-bold bg-purple-600 text-white ${className}`}>W.O.</span>;
      default:
        return <span className={`px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500 ${className}`}>Belum Ada</span>;
    }
  }

  return <span className={`px-2 py-0.5 rounded text-xs bg-slate-100 ${className}`}>{value}</span>;
};
