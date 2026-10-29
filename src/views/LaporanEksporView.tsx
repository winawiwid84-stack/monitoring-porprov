import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Printer,
  FileText,
  Trophy,
  AlertOctagon,
  Radio,
  CheckCircle,
} from 'lucide-react';

export const LaporanEksporView: React.FC = () => {
  const { user, canAccessMedical } = useAuth();
  const [reportType, setReportType] = useState<'harian' | 'medali' | 'pertandingan' | 'kendala' | 'posko'>('harian');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);

  // Raw data stores
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [medals, setMedals] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, mRes, iRes, rRes, pRes] = await Promise.all([
          api.getFixtures(),
          api.getMedals(),
          api.getIssues(),
          api.getDailyReports(),
          api.getPosts(),
        ]);
        setFixtures(fRes);
        setMedals(mRes.medals);
        setIssues(iRes);
        setReports(rRes);
        setPosts(pRes);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Export to Excel / CSV
  const handleExportSpreadsheet = (format: 'xlsx' | 'csv') => {
    let rows: any[] = [];
    let title = 'Laporan';

    if (reportType === 'medali') {
      title = 'Rekapitulasi_Medali';
      rows = medals.map((m) => ({
        'Jenis Medali': m.medal_type.toUpperCase(),
        Cabor: m.sport_name,
        Nomor: m.event_name || '-',
        'Atlet/Tim': m.athlete_or_team,
        'Tanggal Raihan': m.awarded_date,
        Status: m.is_verified ? 'Terverifikasi' : 'Belum Verifikasi',
        'Petugas Verifikator': m.verifier_name || '-',
      }));
    } else if (reportType === 'pertandingan') {
      title = 'Jadwal_dan_Hasil_Pertandingan';
      rows = fixtures.map((f) => ({
        Waktu: f.scheduled_time,
        Cabor: f.sport_name,
        Babak: f.stage,
        'Atlet Kota Bandung': f.athlete_or_team,
        Lawan: f.opponent,
        Status: f.status,
        'Skor Bandung': f.score_bandung || '-',
        'Skor Lawan': f.score_opponent || '-',
        Hasil: f.outcome || '-',
        Venue: f.venue_name || '-',
      }));
    } else if (reportType === 'kendala') {
      title = 'Daftar_Kendala_Posko';
      rows = issues.map((i) => ({
        Judul: i.title,
        Posko: i.post_name || 'Umum',
        Kategori: i.category,
        Prioritas: i.priority,
        Status: i.status,
        'Eskalasi Pusat': i.escalated_to_central ? 'Ya' : 'Tidak',
        Pelapor: i.reporter_name,
        'Waktu Pelaporan': i.created_at,
      }));
    } else {
      title = 'Rekap_Harian_Posko';
      rows = reports.map((r) => ({
        Tanggal: r.report_date,
        Posko: r.post_name,
        Judul: r.title,
        'Rangkuman Aktivitas': r.activity_summary,
        'Kondisi Lapangan': r.field_conditions || '-',
        'Tindak Lanjut': r.follow_up_action || '-',
        Pelapor: r.reporter_name,
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan');

    const fileName = `KONI_Kota_Bandung_${title}_${new Date().toISOString().split('T')[0]}.${format}`;
    if (format === 'csv') {
      XLSX.writeFile(wb, fileName, { bookType: 'csv' });
    } else {
      XLSX.writeFile(wb, fileName);
    }
  };

  // Export to PDF using jsPDF & autotable
  const handleExportPDF = () => {
    setGenerating(true);
    try {
      const doc = new jsPDF('landscape');
      const timestamp = new Date().toLocaleString('id-ID');

      // Header Branding
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('KONI KOTA BANDUNG – PORPROV XV JAWA BARAT 2026', 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Laporan Resmi: ${reportType.toUpperCase()} | Periode: ${startDate} s/d ${endDate}`,
        14,
        21
      );
      doc.text(
        `Diekspor oleh: ${user?.full_name} (${user?.username} - ${user?.role}) pada ${timestamp}`,
        14,
        27
      );

      let head: string[][] = [];
      let body: string[][] = [];

      if (reportType === 'medali') {
        head = [['No', 'Jenis Medali', 'Cabor', 'Nomor', 'Atlet / Tim', 'Tanggal', 'Verifikasi']];
        body = medals.map((m, i) => [
          String(i + 1),
          m.medal_type.toUpperCase(),
          m.sport_name || '',
          m.event_name || '-',
          m.athlete_or_team,
          m.awarded_date,
          m.is_verified ? 'Sah' : 'Belum',
        ]);
      } else if (reportType === 'pertandingan') {
        head = [['No', 'Waktu', 'Cabor', 'Babak', 'Atlet Bandung', 'Lawan', 'Status', 'Skor', 'Hasil']];
        body = fixtures.map((f, i) => [
          String(i + 1),
          f.scheduled_time.split(' ')[1]?.slice(0, 5) || '',
          f.sport_name || '',
          f.stage || '',
          f.athlete_or_team,
          f.opponent,
          f.status,
          f.score_bandung ? `${f.score_bandung} - ${f.score_opponent}` : '-',
          f.outcome || '-',
        ]);
      } else if (reportType === 'kendala') {
        head = [['No', 'Judul Kendala', 'Posko', 'Kategori', 'Prioritas', 'Status', 'Eskalasi', 'Pelapor']];
        body = issues.map((iss, i) => [
          String(i + 1),
          iss.title,
          iss.post_name || 'Umum',
          iss.category,
          iss.priority.toUpperCase(),
          iss.status.toUpperCase(),
          iss.escalated_to_central ? 'YA' : 'TIDAK',
          iss.reporter_name || '-',
        ]);
      } else {
        head = [['No', 'Tanggal', 'Posko', 'Judul Laporan', 'Rangkuman Aktivitas', 'Pelapor']];
        body = reports.map((r, i) => [
          String(i + 1),
          r.report_date,
          r.post_name || '',
          r.title,
          r.activity_summary.slice(0, 80) + '...',
          r.reporter_name || '',
        ]);
      }

      autoTable(doc, {
        head,
        body,
        startY: 32,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [241, 245, 249] },
      });

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Dokumen Resmi Sistem Monitoring Kontingen KONI Kota Bandung - Halaman ${i} dari ${pageCount}`,
          14,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`Laporan_KONI_Kota_Bandung_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err: any) {
      alert('Gagal membuat PDF: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Pusat Laporan & Ekspor Data Operasional</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ekspor rekapitulasi harian dan rentang tanggal dalam format CSV, Excel (.xlsx), dan PDF (.pdf)
          </p>
        </div>

        <div className="text-right text-xs text-slate-500">
          <div>Otentikasi Pembuat: <strong className="text-slate-800">{user?.full_name}</strong></div>
          <div className="text-[11px] text-slate-400">Timestamp otomatis tertera di berkas ekspor</div>
        </div>
      </div>

      {/* Export Config Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-900 text-sm">Pilih Jenis & Parameter Laporan</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Laporan *</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full px-3 py-2 border rounded-lg font-semibold"
            >
              <option value="harian">Laporan Harian Posko (3 Posko)</option>
              <option value="medali">Rekapitulasi Perolehan Medali Kontingen</option>
              <option value="pertandingan">Jadwal & Hasil Pertandingan Lengkap</option>
              <option value="kendala">Daftar Kendala, Eskalasi & Penanganan</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Mulai Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => handleExportSpreadsheet('xlsx')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Format Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExportSpreadsheet('csv')}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Format CSV</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={generating}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{generating ? 'Membuat PDF...' : 'Cetak / Ekspor PDF Resmi (.pdf)'}</span>
          </button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3 pb-2 border-b">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Ringkasan Berkas Laporan ({reportType.toUpperCase()})
          </h4>
          <span className="text-xs text-slate-500">Pratinjau Data Siap Ekspor</span>
        </div>

        <div className="text-xs text-slate-600 space-y-2 bg-slate-50 p-4 rounded-xl">
          <div>
            Kontingen: <strong>KONI Kota Bandung</strong> | Event: <strong>PORPROV XV Jabar 2026</strong>
          </div>
          <div>
            Rentang Waktu: <strong>{startDate} s/d {endDate}</strong>
          </div>
          <div>
            Entitas Terdata:{' '}
            <strong>
              {reportType === 'medali'
                ? `${medals.length} Medali`
                : reportType === 'pertandingan'
                ? `${fixtures.length} Pertandingan`
                : reportType === 'kendala'
                ? `${issues.length} Kendala Posko`
                : `${reports.length} Laporan Harian`}
            </strong>
          </div>
          <div className="text-[11px] text-slate-400 pt-1">
            * Seluruh dokumen yang diekspor telah dilengkapi identitas akun pencetak ({user?.username}) dan timestamp untuk keperluan audit organisasi.
          </div>
        </div>
      </div>
    </div>
  );
};
