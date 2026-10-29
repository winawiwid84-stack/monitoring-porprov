import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DailyReport, Issue, IssueUpdate, Post, Sport } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Radio,
  FileText,
  AlertOctagon,
  Plus,
  Send,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  Calendar,
} from 'lucide-react';

export const PoskoLaporanView: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'laporan' | 'kendala'>('kendala');
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPost, setFilterPost] = useState('');
  const [filterIssueStatus, setFilterIssueStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modals
  const [showCreateReportModal, setShowCreateReportModal] = useState(false);
  const [showCreateIssueModal, setShowCreateIssueModal] = useState(false);
  const [showIssueDetailModal, setShowIssueDetailModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueUpdates, setIssueUpdates] = useState<IssueUpdate[]>([]);

  // Forms
  const [reportForm, setReportForm] = useState({
    post_id: user?.assigned_post_id || 'post_bekasi',
    sport_id: '',
    report_date: new Date().toISOString().split('T')[0],
    title: '',
    activity_summary: '',
    field_conditions: '',
    follow_up_action: '',
    status: 'terkirim',
  });

  const [issueForm, setIssueForm] = useState({
    post_id: user?.assigned_post_id || 'post_bekasi',
    sport_id: '',
    title: '',
    category: 'transportasi',
    description: '',
    priority: 'sedang',
    escalated_to_central: false,
  });

  const [updateActionText, setUpdateActionText] = useState('');
  const [updateTargetStatus, setUpdateTargetStatus] = useState('diproses');
  const [escalateToggle, setEscalateToggle] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rRes, iRes, pRes, sRes] = await Promise.all([
        api.getDailyReports({ post_id: filterPost || undefined }),
        api.getIssues({
          post_id: filterPost || undefined,
          status: filterIssueStatus || undefined,
          priority: filterPriority || undefined,
        }),
        api.getPosts(),
        api.getSports(),
      ]);
      setReports(rRes);
      setIssues(iRes);
      setPosts(pRes);
      setSports(sRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterPost, filterIssueStatus, filterPriority]);

  const handleOpenIssue = async (issue: Issue) => {
    setSelectedIssue(issue);
    setUpdateTargetStatus(issue.status);
    setEscalateToggle(issue.escalated_to_central === 1);
    try {
      const updates = await api.getIssueUpdates(issue.id);
      setIssueUpdates(updates);
      setShowIssueDetailModal(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDailyReport(reportForm);
      setShowCreateReportModal(false);
      setReportForm({
        post_id: user?.assigned_post_id || 'post_bekasi',
        sport_id: '',
        report_date: new Date().toISOString().split('T')[0],
        title: '',
        activity_summary: '',
        field_conditions: '',
        follow_up_action: '',
        status: 'terkirim',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim laporan');
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createIssue(issueForm);
      setShowCreateIssueModal(false);
      setIssueForm({
        post_id: user?.assigned_post_id || 'post_bekasi',
        sport_id: '',
        title: '',
        category: 'transportasi',
        description: '',
        priority: 'sedang',
        escalated_to_central: false,
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mencatat kendala');
    }
  };

  const handleAddIssueUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue || !updateActionText) return;
    try {
      await api.addIssueUpdate(selectedIssue.id, {
        action_taken: updateActionText,
        status_after: updateTargetStatus,
        escalated_to_central: escalateToggle,
      });
      setUpdateActionText('');
      const updates = await api.getIssueUpdates(selectedIssue.id);
      setIssueUpdates(updates);
      loadData();
      alert('Tindak lanjut berhasil disimpan.');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan tindak lanjut');
    }
  };

  const canReport = hasRole(['admin', 'pengurus_pusat', 'koordinator_posko']);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600" />
            <span>Monitoring Posko, Laporan Harian & Kendala Lapangan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengawasan, pengendalian, dan eskalasi terintegrasi dari 3 posko kontingen Kota Bandung
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canReport && (
            <>
              <button
                onClick={() => setShowCreateReportModal(true)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Kirim Laporan Harian</span>
              </button>
              <button
                onClick={() => setShowCreateIssueModal(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Laporkan Kendala</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Posko Info Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((p) => (
          <div
            key={p.id}
            onClick={() => setFilterPost(filterPost === p.id ? '' : p.id)}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              filterPost === p.id
                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="font-bold text-xs text-slate-900">{p.name}</span>
              <StatusBadge type="status" value={p.status} />
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{p.location_name}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-2 line-clamp-1">{p.address}</div>
            <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] flex justify-between text-slate-500">
              <span>Koord: <strong>{p.coordinator_name || '-'}</strong></span>
              <span className="font-semibold text-emerald-700">
                {filterPost === p.id ? 'Filter Aktif' : 'Klik untuk Filter'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Sub Tabs: Kendala vs Laporan Harian */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveSubTab('kendala')}
            className={`pb-3 text-xs font-bold transition relative ${
              activeSubTab === 'kendala'
                ? 'text-rose-600 border-b-2 border-rose-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4" />
              <span>Daftar Kendala & Tindak Lanjut</span>
              <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {issues.length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('laporan')}
            className={`pb-3 text-xs font-bold transition relative ${
              activeSubTab === 'laporan'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>Laporan Harian Posko</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {reports.length}
              </span>
            </span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 pb-2 text-xs">
          {activeSubTab === 'kendala' && (
            <>
              <select
                value={filterIssueStatus}
                onChange={(e) => setFilterIssueStatus(e.target.value)}
                className="px-2.5 py-1 border rounded-lg bg-white"
              >
                <option value="">Semua Status Kendala</option>
                <option value="baru">Baru</option>
                <option value="diproses">Diproses</option>
                <option value="menunggu">Menunggu</option>
                <option value="selesai">Selesai</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2.5 py-1 border rounded-lg bg-white"
              >
                <option value="">Semua Prioritas</option>
                <option value="kritis">Kritis</option>
                <option value="tinggi">Tinggi</option>
                <option value="sedang">Sedang</option>
                <option value="rendah">Rendah</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Sub Tab 1: Issues (Kendala) Table / Cards */}
      {activeSubTab === 'kendala' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Prioritas & Status</th>
                  <th className="py-3 px-4">Judul Kendala & Posko</th>
                  <th className="py-3 px-4">Kategori & Cabor</th>
                  <th className="py-3 px-4">Pelapor & Waktu</th>
                  <th className="py-3 px-4">Eskalasi Pusat</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      Tidak ada data kendala lapangan untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  issues.map((iss) => (
                    <tr
                      key={iss.id}
                      onClick={() => handleOpenIssue(iss)}
                      className="hover:bg-slate-50/70 cursor-pointer transition"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge type="priority" value={iss.priority} />
                          <StatusBadge type="status" value={iss.status} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{iss.title}</div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{iss.description}</p>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                          Posko: {iss.post_name || 'Umum'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="capitalize bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">
                          {iss.category.replace(/_/g, ' ')}
                        </span>
                        {iss.sport_name && (
                          <div className="text-[11px] text-slate-500 mt-1">{iss.sport_name}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-500">
                        <div>{iss.reporter_name || 'Petugas'}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{iss.created_at}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {iss.escalated_to_central === 1 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                            <ArrowUpRight className="w-3 h-3" />
                            Eskalasi Pusat
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Lokal Posko</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenIssue(iss);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                        >
                          Tindak Lanjut & Riwayat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sub Tab 2: Laporan Harian */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white rounded-2xl border text-slate-400">
              Belum ada laporan harian posko yang dikirimkan.
            </div>
          ) : (
            reports.map((rep) => (
              <div key={rep.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded">
                      {rep.post_name} ({rep.location_name})
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{rep.title}</h3>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>{rep.report_date}</div>
                    <StatusBadge type="status" value={rep.status} className="mt-1 inline-block" />
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-700">Rangkuman Aktivitas:</span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{rep.activity_summary}</p>
                  </div>
                  {rep.field_conditions && (
                    <div>
                      <span className="font-semibold text-slate-700">Kondisi Lapangan / Venue:</span>
                      <p className="text-slate-600 mt-0.5">{rep.field_conditions}</p>
                    </div>
                  )}
                  {rep.follow_up_action && (
                    <div>
                      <span className="font-semibold text-slate-700">Rencana Tindak Lanjut:</span>
                      <p className="text-emerald-800 font-medium mt-0.5">{rep.follow_up_action}</p>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>Pelapor: <strong>{rep.reporter_name}</strong></span>
                  {rep.sport_name && <span>Cabor Terkait: {rep.sport_name}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal 1: Create Daily Report */}
      <Modal
        isOpen={showCreateReportModal}
        onClose={() => setShowCreateReportModal(false)}
        title="Kirim Laporan Harian Posko"
        subtitle="Laporkan aktivitas, situasi lapangan, dan progres pendampingan atlet"
      >
        <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Posko Pelapor *</label>
              <select
                required
                value={reportForm.post_id}
                onChange={(e) => setReportForm({ ...reportForm, post_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.location_name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Laporan *</label>
              <input
                type="date"
                required
                value={reportForm.report_date}
                onChange={(e) => setReportForm({ ...reportForm, report_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Laporan *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Laporan Monitoring Hari Pertama Cabor Bulutangkis"
              value={reportForm.title}
              onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rangkuman Aktivitas & Monitoring *</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan aktivitas pengawasan, koordinasi, dan monitoring jadwal/tempat pertandingan atlet hari ini"
              value={reportForm.activity_summary}
              onChange={(e) => setReportForm({ ...reportForm, activity_summary: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kondisi Lapangan / Venue / Logistik</label>
            <textarea
              rows={2}
              placeholder="Catatan kondisi lapangan pertandingan, penginapan, dan kesiapan fasilitas"
              value={reportForm.field_conditions}
              onChange={(e) => setReportForm({ ...reportForm, field_conditions: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rencana Tindak Lanjut</label>
            <input
              type="text"
              placeholder="Tindakan yang perlu disiapkan untuk jadwal esok hari"
              value={reportForm.follow_up_action}
              onChange={(e) => setReportForm({ ...reportForm, follow_up_action: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowCreateReportModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Kirim Laporan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Create Issue */}
      <Modal
        isOpen={showCreateIssueModal}
        onClose={() => setShowCreateIssueModal(false)}
        title="Laporkan Kendala Lapangan Baru"
        subtitle="Pencatatan kendala operasional untuk ditangani posko atau dieskalasi ke pengurus pusat"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Posko Terkait</label>
              <select
                value={issueForm.post_id}
                onChange={(e) => setIssueForm({ ...issueForm, post_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kategori Kendala *</label>
              <select
                value={issueForm.category}
                onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="transportasi">Transportasi & Armada</option>
                <option value="penginapan_akomodasi">Penginapan & Hotel</option>
                <option value="konsumsi">Konsumsi & Nutrisi</option>
                <option value="teknis_tanding">Teknis Pertandingan & Venue</option>
                <option value="medis">Medis & Kesehatan</option>
                <option value="perwasitan_protes">Perwasitan / Keputusan Juri</option>
                <option value="perlengkapan">Perlengkapan & Peralatan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Kendala *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Keterlambatan Bus Penjemputan Cabor Sepak Bola"
              value={issueForm.title}
              onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Uraian Detail Kendala *</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan kronologi, dampak terhadap atlet/tim, dan estimasi kebutuhan solusi"
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Prioritas *</label>
              <select
                value={issueForm.priority}
                onChange={(e) => setIssueForm({ ...issueForm, priority: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="rendah">Rendah (Dapat diselesaikan bertahap)</option>
                <option value="sedang">Sedang (Perlu penanganan hari ini)</option>
                <option value="tinggi">Tinggi (Berdampak langsung ke tanding)</option>
                <option value="kritis">Kritis (Emergency / ancaman WO)</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={issueForm.escalated_to_central}
                  onChange={(e) => setIssueForm({ ...issueForm, escalated_to_central: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span className="font-semibold text-purple-900 text-xs">Eskalasi Langsung ke Pengurus Pusat</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowCreateIssueModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
            >
              Simpan & Teruskan Kendala
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Issue Detail & Follow-up Timeline */}
      <Modal
        isOpen={showIssueDetailModal}
        onClose={() => setShowIssueDetailModal(false)}
        title="Detail Kendala & Riwayat Tindak Lanjut"
        subtitle={selectedIssue?.title}
        maxWidth="4xl"
      >
        {selectedIssue && (
          <div className="space-y-6 text-xs">
            {/* Issue Summary Card */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge type="priority" value={selectedIssue.priority} />
                  <StatusBadge type="status" value={selectedIssue.status} />
                  {selectedIssue.escalated_to_central === 1 && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                      Eskalasi Pengurus Pusat
                    </span>
                  )}
                </div>
                <span className="text-slate-400">{selectedIssue.created_at}</span>
              </div>
              <p className="text-slate-800 text-sm leading-relaxed">{selectedIssue.description}</p>
              <div className="text-[11px] text-slate-500 flex flex-wrap gap-4 pt-2 border-t border-slate-200">
                <span>Posko: <strong>{selectedIssue.post_name || 'Umum'}</strong></span>
                <span>Kategori: <strong>{selectedIssue.category}</strong></span>
                <span>Pelapor: <strong>{selectedIssue.reporter_name}</strong></span>
              </div>
            </div>

            {/* Timeline of Follow-up updates */}
            <div>
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Riwayat Penanganan & Tindak Lanjut</span>
              </h4>

              {issueUpdates.length === 0 ? (
                <p className="text-slate-400 italic py-2">Belum ada tindakan yang dicatat untuk kendala ini.</p>
              ) : (
                <div className="relative border-l-2 border-emerald-500 ml-3 space-y-4 py-2">
                  {issueUpdates.map((upd) => (
                    <div key={upd.id} className="relative pl-6">
                      <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-xs" />
                      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{upd.user_name}</span>
                          <span className="text-slate-400">{upd.created_at}</span>
                        </div>
                        <p className="text-slate-700 text-xs">{upd.action_taken}</p>
                        <div className="text-[10px] text-slate-500 pt-1">
                          Status: <span className="font-semibold text-slate-700">{upd.status_before}</span> &rarr;{' '}
                          <span className="font-bold text-emerald-700">{upd.status_after}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form to add new follow up action */}
            {canReport && (
              <form onSubmit={handleAddIssueUpdate} className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-3">
                <h5 className="font-bold text-emerald-900 text-xs">Tambahkan Tindak Lanjut / Update Status</h5>
                <div>
                  <textarea
                    required
                    rows={2}
                    placeholder="Tuliskan tindakan penanganan yang telah dilakukan atau arahan pengurus pusat..."
                    value={updateActionText}
                    onChange={(e) => setUpdateActionText(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="font-semibold text-slate-700">Perbarui Status Menjadi:</label>
                    <select
                      value={updateTargetStatus}
                      onChange={(e) => setUpdateTargetStatus(e.target.value)}
                      className="px-2.5 py-1 border rounded-lg bg-white"
                    >
                      <option value="baru">Tetap Baru</option>
                      <option value="diproses">Sedang Diproses</option>
                      <option value="menunggu">Menunggu Konfirmasi</option>
                      <option value="selesai">Selesai (Tuntas)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-purple-900">
                    <input
                      type="checkbox"
                      checked={escalateToggle}
                      onChange={(e) => setEscalateToggle(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Eskalasi ke Pengurus Pusat</span>
                  </label>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Tindak Lanjut</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
