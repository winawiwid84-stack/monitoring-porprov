import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Fixture, Sport, HostRegion, Post, Venue } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trophy,
  History,
  CalendarRange,
  ListFilter,
} from 'lucide-react';

export const JadwalHasilView: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [regions, setRegions] = useState<HostRegion[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    sport_id: '',
    stage: 'Penyisihan',
    scheduled_time: '',
    opponent: '',
    athlete_or_team: '',
    venue_id: '',
    post_id: '',
    status: 'terjadwal',
    delay_reason: '',
    source_update: 'Panpel Cabor PORPROV',
  });

  const [resultData, setResultData] = useState({
    score_bandung: '',
    score_opponent: '',
    outcome: 'menang',
    summary: '',
    round_result: '',
    rank_obtained: 1,
    is_verified: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fRes, sRes, rRes, pRes, vRes] = await Promise.all([
        api.getFixtures({
          sport_id: selectedSport || undefined,
          region_id: selectedRegion || undefined,
          status: selectedStatus || undefined,
          date: selectedDate || undefined,
          search: searchQuery || undefined,
        }),
        api.getSports(),
        api.getHostRegions(),
        api.getPosts(),
        api.getVenues(),
      ]);
      setFixtures(fRes);
      setSports(sRes);
      setRegions(rRes);
      setPosts(pRes);
      setVenues(vRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSport, selectedRegion, selectedStatus, selectedDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createFixture(formData);
      setShowCreateModal(false);
      setFormData({
        sport_id: '',
        stage: 'Penyisihan',
        scheduled_time: '',
        opponent: '',
        athlete_or_team: '',
        venue_id: '',
        post_id: '',
        status: 'terjadwal',
        delay_reason: '',
        source_update: 'Panpel Cabor PORPROV',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan jadwal');
    }
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture) return;
    try {
      await api.updateFixture(selectedFixture.id, {
        ...selectedFixture,
        scheduled_time: formData.scheduled_time,
        status: formData.status,
        delay_reason: formData.delay_reason,
        source_update: formData.source_update,
      });
      setShowRescheduleModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui jadwal');
    }
  };

  const handleSaveResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixture) return;
    try {
      await api.recordResult(selectedFixture.id, resultData);
      setShowResultModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan hasil');
    }
  };

  const canEdit = hasRole(['admin', 'pengurus_pusat', 'tim_teknis']);

  // Group fixtures by date for calendar view
  const groupedByDate: Record<string, Fixture[]> = {};
  fixtures.forEach((f) => {
    const d = f.scheduled_time.split(' ')[0] || 'Unknown';
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(f);
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>Jadwal & Hasil Pertandingan Kontingen</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring jadwal tanding, pergeseran waktu resmi, dan pencatatan hasil skor pertandingan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch View Mode */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 inline mr-1" />
              Daftar
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5 inline mr-1" />
              Kalender
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pertandingan</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Cari Atlet / Lawan / Cabor</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Cabang Olahraga</label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Cabor (78)</option>
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Daerah Tuan Rumah</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Daerah (12)</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Status Pertandingan</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="terjadwal">Terjadwal</option>
              <option value="berlangsung">Sedang Berlangsung</option>
              <option value="selesai">Selesai</option>
              <option value="ditunda">Ditunda</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Tanggal</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </form>
      </div>

      {/* Fixtures Content */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Waktu & Tempat</th>
                  <th className="py-3 px-4">Cabor & Babak</th>
                  <th className="py-3 px-4">Atlet / Tim Kota Bandung</th>
                  <th className="py-3 px-4">Lawan Tanding</th>
                  <th className="py-3 px-4">Status & Hasil</th>
                  <th className="py-3 px-4">Sumber & Pembaruan</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixtures.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      Tidak ada data jadwal pertandingan ditemukan.
                    </td>
                  </tr>
                ) : (
                  fixtures.map((fix) => (
                    <tr key={fix.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{fix.scheduled_time.split(' ')[0]}</div>
                        <div className="text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{fix.scheduled_time.split(' ')[1]?.slice(0, 5) || fix.scheduled_time} WIB</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{fix.venue_name || 'Venue PORPROV'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {fix.sport_name}
                        </span>
                        <div className="text-slate-500 mt-1">{fix.stage}</div>
                        {fix.event_name && <div className="text-[10px] text-slate-400">{fix.event_name}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {fix.athlete_or_team}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {fix.opponent}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <StatusBadge type="status" value={fix.status} />
                            {fix.outcome && <StatusBadge type="outcome" value={fix.outcome} />}
                          </div>
                          {fix.score_bandung && (
                            <div className="font-bold text-emerald-800 text-xs">
                              Skor: {fix.score_bandung} - {fix.score_opponent}
                            </div>
                          )}
                          {fix.delay_reason && (
                            <div className="text-[10px] text-amber-700 bg-amber-50 p-1 rounded">
                              Tunda: {fix.delay_reason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        <div>{fix.source_update || 'Panpel'}</div>
                        {fix.last_updater_name && (
                          <div className="text-slate-400 mt-0.5">Oleh: {fix.last_updater_name}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedFixture(fix);
                                  setFormData({
                                    ...formData,
                                    scheduled_time: fix.scheduled_time,
                                    status: fix.status,
                                    delay_reason: fix.delay_reason || '',
                                    source_update: fix.source_update || '',
                                  });
                                  setShowRescheduleModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-900"
                                title="Ubah Jadwal / Status"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFixture(fix);
                                  setResultData({
                                    score_bandung: fix.score_bandung || '',
                                    score_opponent: fix.score_opponent || '',
                                    outcome: fix.outcome || 'menang',
                                    summary: fix.result_summary || '',
                                    round_result: '',
                                    rank_obtained: 1,
                                    is_verified: true,
                                  });
                                  setShowResultModal(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-semibold text-[11px] flex items-center gap-1"
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Input Skor</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Calendar View Grouped by Date */
        <div className="space-y-6">
          {Object.keys(groupedByDate).sort().map((dateStr) => (
            <div key={dateStr} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{dateStr}</h3>
                    <p className="text-xs text-slate-500">{groupedByDate[dateStr].length} Pertandingan Terjadwal</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedByDate[dateStr].map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold bg-white text-slate-800 border px-1.5 py-0.5 rounded">
                          {f.sport_name}
                        </span>
                        <StatusBadge type="status" value={f.status} />
                      </div>
                      <div className="font-bold text-slate-900 text-xs">
                        {f.athlete_or_team} vs {f.opponent}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>{f.stage}</span>
                        <span>•</span>
                        <span>{f.scheduled_time.split(' ')[1]?.slice(0, 5)} WIB</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{f.venue_name}</div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      {f.score_bandung ? (
                        <div className="font-bold text-emerald-700">
                          {f.score_bandung} - {f.score_opponent} ({f.outcome})
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Belum bertanding</span>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            setSelectedFixture(f);
                            setShowResultModal(true);
                          }}
                          className="text-emerald-700 font-semibold hover:underline text-[11px]"
                        >
                          Kelola Hasil
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Create Fixture */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tambah Jadwal Pertandingan Baru"
        subtitle="Mendaftarkan jadwal pertandingan atlet/tim kontingen Kota Bandung"
      >
        <form onSubmit={handleCreateFixture} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cabang Olahraga *</label>
              <select
                required
                value={formData.sport_id}
                onChange={(e) => setFormData({ ...formData, sport_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih Cabang Olahraga</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Babak Pertandingan</label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Penyisihan">Penyisihan</option>
                <option value="Babak 16 Besar">Babak 16 Besar</option>
                <option value="Perempat Final">Perempat Final</option>
                <option value="Semi Final">Semi Final</option>
                <option value="Final">Final Perebutan Emas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Atlet / Tim Kota Bandung *</label>
              <input
                type="text"
                required
                placeholder="Nama Atlet atau Tim Beregu"
                value={formData.athlete_or_team}
                onChange={(e) => setFormData({ ...formData, athlete_or_team: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lawan / Kontingen Lawan *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Kab. Bekasi / Atlet X"
                value={formData.opponent}
                onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jadwal Tanggal & Waktu *</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Venue Pertandingan</label>
              <select
                value={formData.venue_id}
                onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih Venue</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.region_name})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Jadwal
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Reschedule Fixture (Log History) */}
      <Modal
        isOpen={showRescheduleModal}
        onClose={() => setShowRescheduleModal(false)}
        title="Perbarui Jadwal Pertandingan"
        subtitle={`Pertandingan: ${selectedFixture?.athlete_or_team} vs ${selectedFixture?.opponent}`}
      >
        <form onSubmit={handleUpdateSchedule} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Waktu Pertandingan Baru</label>
            <input
              type="text"
              required
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <p className="text-[11px] text-slate-400 mt-1">Format: YYYY-MM-DD HH:MM:SS</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Pertandingan</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="terjadwal">Terjadwal</option>
              <option value="berlangsung">Sedang Berlangsung</option>
              <option value="selesai">Selesai</option>
              <option value="ditunda">Ditunda</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>

          {formData.status === 'ditunda' && (
            <div>
              <label className="block font-semibold text-amber-800 mb-1">Alasan Penundaan *</label>
              <textarea
                required
                rows={2}
                placeholder="Alasan resmi dari panpel teknis cabor (misal: cuaca hujan, perbaikan venue)"
                value={formData.delay_reason}
                onChange={(e) => setFormData({ ...formData, delay_reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sumber Pembaruan / Verifikator</label>
            <input
              type="text"
              value={formData.source_update}
              onChange={(e) => setFormData({ ...formData, source_update: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-slate-500 text-[11px]">
            Setiap pembaruan waktu atau penundaan jadwal otomatis dicatat dalam audit log sistem dengan identitas akun Anda ({user?.username}).
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowRescheduleModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Record Match Result */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Catat Hasil Pertandingan"
        subtitle={`${selectedFixture?.athlete_or_team} vs ${selectedFixture?.opponent} (${selectedFixture?.sport_name})`}
      >
        <form onSubmit={handleSaveResult} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Skor Kota Bandung *</label>
              <input
                type="text"
                required
                placeholder="Misal: 21-17, 21-15 atau 3"
                value={resultData.score_bandung}
                onChange={(e) => setResultData({ ...resultData, score_bandung: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Skor Lawan *</label>
              <input
                type="text"
                required
                placeholder="Misal: 19-21, 14-21 atau 1"
                value={resultData.score_opponent}
                onChange={(e) => setResultData({ ...resultData, score_opponent: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hasil Pertandingan *</label>
              <select
                value={resultData.outcome}
                onChange={(e) => setResultData({ ...resultData, outcome: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              >
                <option value="menang">MENANG (Kota Bandung)</option>
                <option value="kalah">KALAH</option>
                <option value="seri">SERI (Draw)</option>
                <option value="walkout">Walk Out (W.O)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peringkat / Posisi Akhir</label>
              <input
                type="number"
                min={1}
                value={resultData.rank_obtained}
                onChange={(e) => setResultData({ ...resultData, rank_obtained: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ringkasan Jalannya Pertandingan</label>
            <textarea
              rows={3}
              placeholder="Rangkuman pertandingan, catatan teknis, atau faktor kemenangan/kekalahan"
              value={resultData.summary}
              onChange={(e) => setResultData({ ...resultData, summary: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowResultModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Hasil Pertandingan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
