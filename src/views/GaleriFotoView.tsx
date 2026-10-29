import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { DailyReport, Post } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Camera,
  Plus,
  Calendar,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Eye,
  Building2,
  Filter,
  Search,
} from 'lucide-react';

export const GaleriFotoView: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [photos, setPhotos] = useState<DailyReport[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPost, setFilterPost] = useState('');
  const [filterRating, setFilterRating] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [zoomPhoto, setZoomPhoto] = useState<DailyReport | null>(null);

  // Form for new visit photo & monev
  const [form, setForm] = useState({
    post_id: 'post_bekasi',
    title: 'Kunjungan & Evaluasi Kesiapan Posko',
    activity_summary: 'Peninjauan fasilitas mess atlet dan kesiapan armada operasional posko.',
    findings: 'Kondisi mess atlet dan suplai konsumsi berjalan tertib dan tepat waktu.',
    recommendation: 'Pertahankan kesiagaan tim medis dan koordinasi rute perjalanan.',
    rating: 'Sangat Baik (A)',
    photo_url: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&auto=format&fit=crop&q=80',
    report_date: new Date().toISOString().split('T')[0],
    status: 'selesai',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [photoRes, postRes] = await Promise.all([
        api.getVisitPhotos(),
        api.getPosts(),
      ]);
      setPhotos(photoRes);
      setPosts(postRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createDailyReport({
        post_id: form.post_id,
        report_date: form.report_date,
        title: form.title,
        activity_summary: form.activity_summary,
        field_conditions: form.findings,
        follow_up_action: form.recommendation,
        status: form.status,
        photo_url: form.photo_url,
        rating: form.rating,
        findings: form.findings,
        recommendation: form.recommendation,
      });
      setShowAddModal(false);
      loadData();
      alert('Dokumentasi foto kunjungan & laporan monev berhasil disimpan!');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan dokumentasi');
    }
  };

  const filteredPhotos = photos.filter((p) => {
    if (filterPost && p.post_id !== filterPost) return false;
    if (filterRating && p.rating !== filterRating) return false;
    return true;
  });

  const canAdd = hasRole(['admin', 'pengurus_pusat', 'koordinator_posko', 'tim_monev']);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <span>Galeri & Dokumentasi Foto Kunjungan Lapangan</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokumentasi visual pemantauan posko, venue, mess atlet, dan pengawasan Tim Monev KONI Kota Bandung
          </p>
        </div>

        {canAdd && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Foto Kunjungan Baru</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Galeri:</span>
          </div>

          <select
            value={filterPost}
            onChange={(e) => setFilterPost(e.target.value)}
            className="px-2.5 py-1.5 border rounded-lg bg-white"
          >
            <option value="">Semua Posko Wilayah</option>
            {posts.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="px-2.5 py-1.5 border rounded-lg bg-white"
          >
            <option value="">Semua Penilaian Monev</option>
            <option value="Sangat Baik (A)">Sangat Baik (A)</option>
            <option value="Baik (B)">Baik (B)</option>
            <option value="Cukup / Perlu Perbaikan (C)">Cukup / Perlu Perbaikan (C)</option>
            <option value="Kritis">Kritis (Perlu Tindakan Cepat)</option>
          </select>
        </div>

        <div className="text-slate-400 text-[11px]">
          Menampilkan {filteredPhotos.length} dokumentasi visual
        </div>
      </div>

      {/* Photos Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          Belum ada foto kunjungan untuk filter yang dipilih.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Photo Thumbnail */}
                <div className="relative h-48 overflow-hidden bg-slate-900 group">
                  <img
                    src={item.photo_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                    onClick={() => setZoomPhoto(item)}
                    onError={(e: any) => {
                      e.target.src = 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs border border-white/10">
                      {item.post_name}
                    </span>
                    {item.rating && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                        {item.rating}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setZoomPhoto(item)}
                    className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs text-xs flex items-center gap-1 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Perbesar</span>
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.report_date}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-slate-600">
                      <User className="w-3 h-3 text-emerald-600" />
                      {item.reporter_name}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{item.title}</h3>

                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                    {item.activity_summary}
                  </p>

                  {/* Findings Box */}
                  {(item.findings || item.field_conditions) && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px]">
                      <span className="font-bold text-slate-700 block mb-0.5">Temuan Lapangan / Monev:</span>
                      <p className="text-slate-600 leading-relaxed">{item.findings || item.field_conditions}</p>
                    </div>
                  )}

                  {/* Recommendation */}
                  {(item.recommendation || item.follow_up_action) && (
                    <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px]">
                      <span className="font-bold text-emerald-900 block mb-0.5">Rekomendasi Tindak Lanjut:</span>
                      <p className="text-emerald-800 leading-relaxed">{item.recommendation || item.follow_up_action}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {item.location_name}
                </span>
                <StatusBadge type="status" value={item.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Add Monev Photo & Visit */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Form Hasil Monitoring & Evaluasi Lapangan (Tim Monev)"
        subtitle="Dokumentasi hasil kunjungan lapangan lengkap dengan penilaian dan foto"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pilih Posko / Wilayah *</label>
              <select
                required
                value={form.post_id}
                onChange={(e) => setForm({ ...form, post_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.location_name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Penilaian Umum Monev *</label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              >
                <option value="Sangat Baik (A)">Sangat Baik (A)</option>
                <option value="Baik (B)">Baik (B)</option>
                <option value="Cukup / Perlu Perbaikan (C)">Cukup / Perlu Perbaikan (C)</option>
                <option value="Kritis">Kritis (Perlu Tindakan Cepat)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Judul Kunjungan / Kegiatan *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kunjungan Tim Monev ke Posko Asrama Haji Bekasi"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Uraian Ringkasan Aktivitas *</label>
            <textarea
              required
              rows={2}
              placeholder="Uraikan kegiatan pemantauan hari ini..."
              value={form.activity_summary}
              onChange={(e) => setForm({ ...form, activity_summary: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Temuan Lapangan / Observasi *</label>
            <textarea
              required
              rows={3}
              placeholder="Uraikan hasil pemantauan kondisi venue, konsumsi, kesiapan atlet, dan fasilitas..."
              value={form.findings}
              onChange={(e) => setForm({ ...form, findings: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rekomendasi Tindak Lanjut *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Penambahan armada penjemputan cabor sepak bola"
              value={form.recommendation}
              onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">URL Foto Kunjungan / Dokumentasi *</label>
            <input
              type="url"
              required
              placeholder="https://images.unsplash.com/..."
              value={form.photo_url}
              onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">Masukkan URL foto dokumentasi berformat JPG / PNG.</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Hasil Kunjungan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Zoom Full Photo */}
      <Modal
        isOpen={!!zoomPhoto}
        onClose={() => setZoomPhoto(null)}
        title={zoomPhoto?.title || 'Foto Dokumentasi'}
        subtitle={`Lokasi: ${zoomPhoto?.post_name} • ${zoomPhoto?.report_date}`}
        maxWidth="4xl"
      >
        {zoomPhoto && (
          <div className="space-y-4">
            <div className="w-full h-96 bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <img
                src={zoomPhoto.photo_url}
                alt={zoomPhoto.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{zoomPhoto.title}</span>
                {zoomPhoto.rating && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                    {zoomPhoto.rating}
                  </span>
                )}
              </div>
              <p className="text-slate-600">{zoomPhoto.activity_summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <span className="font-bold text-slate-700">Temuan Lapangan:</span>
                  <p className="text-slate-600 mt-0.5">{zoomPhoto.findings || zoomPhoto.field_conditions || '-'}</p>
                </div>
                <div>
                  <span className="font-bold text-emerald-800">Rekomendasi Tindak Lanjut:</span>
                  <p className="text-emerald-700 mt-0.5">{zoomPhoto.recommendation || zoomPhoto.follow_up_action || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
