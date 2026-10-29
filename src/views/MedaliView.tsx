import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Medal, MedalTally, Sport, EventItem } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Trophy,
  Medal as MedalIcon,
  CheckCircle,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Target,
  Sparkles,
  Settings,
  Filter,
} from 'lucide-react';

export const MedaliView: React.FC = () => {
  const { user, canVerify, hasRole } = useAuth();
  const [medals, setMedals] = useState<Medal[]>([]);
  const [tally, setTally] = useState<MedalTally[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSport, setFilterSport] = useState('');
  const [filterMedalType, setFilterMedalType] = useState('');
  const [filterVerified, setFilterVerified] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);

  // Forms
  const [medalForm, setMedalForm] = useState({
    sport_id: '',
    event_id: '',
    medal_type: 'emas',
    athlete_or_team: '',
    awarded_date: new Date().toISOString().split('T')[0],
    source: 'Panitia Resmi Pertandingan',
    is_verified: true,
    notes: '',
  });

  const [targetConfigForm, setTargetConfigForm] = useState({
    primary_val: '171',
    primary_label: 'Target Medali Utama / Emas',
    primary_desc: 'Angka 171 diverifikasi sebagai target medali emas kontingen Kota Bandung',
    secondary_val: '76',
    secondary_label: 'Target Medali Sekunder / Perak',
    secondary_desc: 'Angka 76 diverifikasi sebagai target medali perak',
    is_verified: true,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRes, sRes, evRes, setRes] = await Promise.all([
        api.getMedals({
          sport_id: filterSport || undefined,
          medal_type: filterMedalType || undefined,
          is_verified: filterVerified ? filterVerified === 'true' : undefined,
        }),
        api.getSports(),
        api.getEvents(),
        api.getSettings(),
      ]);
      setMedals(mRes.medals);
      setTally(mRes.tally);
      setSports(sRes);
      setEvents(evRes);
      setSettings(setRes);

      // Preload target settings values
      const primarySetting = setRes.find((s: any) => s.key === 'target_medal_primary');
      const secondarySetting = setRes.find((s: any) => s.key === 'target_medal_secondary');
      if (primarySetting && secondarySetting) {
        setTargetConfigForm({
          primary_val: primarySetting.value,
          primary_label: primarySetting.label,
          primary_desc: primarySetting.description || '',
          secondary_val: secondarySetting.value,
          secondary_label: secondarySetting.label,
          secondary_desc: secondarySetting.description || '',
          is_verified: primarySetting.is_verified === 1,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterSport, filterMedalType, filterVerified]);

  const handleAddMedal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMedal(medalForm);
      setShowAddModal(false);
      setMedalForm({
        sport_id: '',
        event_id: '',
        medal_type: 'emas',
        athlete_or_team: '',
        awarded_date: new Date().toISOString().split('T')[0],
        source: 'Panitia Resmi Pertandingan',
        is_verified: true,
        notes: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan medali');
    }
  };

  const handleVerifyMedal = async (id: string, currentVerified: number) => {
    try {
      await api.verifyMedal(id, { is_verified: currentVerified !== 1 });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memverifikasi medali');
    }
  };

  const handleSaveTargetConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateMedalTargets(targetConfigForm);
      setShowTargetModal(false);
      loadData();
      alert('Konfigurasi dan verifikasi target medali berhasil diperbarui.');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan konfigurasi target');
    }
  };

  // Aggregated totals
  const totalGold = medals.filter((m) => m.medal_type === 'emas').length;
  const totalSilver = medals.filter((m) => m.medal_type === 'perak').length;
  const totalBronze = medals.filter((m) => m.medal_type === 'perunggu').length;
  const totalMedals = medals.length;
  const unverifiedCount = medals.filter((m) => m.is_verified === 0).length;

  const primarySetting = settings.find((s: any) => s.key === 'target_medal_primary');
  const secondarySetting = settings.find((s: any) => s.key === 'target_medal_secondary');

  const canEdit = hasRole(['admin', 'pengurus_pusat', 'tim_teknis']);
  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Top Banner & Target Medali Configuration Gate */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <Trophy className="w-3.5 h-3.5 text-yellow-200" />
              <span>Klasemen Perolehan Medali Kontingen KONI Kota Bandung</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Pusat Data Medali & Capaian Prestasi
            </h2>
            <p className="text-xs text-amber-100 mt-1 max-w-2xl leading-relaxed">
              Memantau perolehan medali resmi PORPROV XV Jawa Barat 2026 dengan sistem validasi ganda
              untuk mencegah selisih data antara panpel lapangan dan pusat komando.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowTargetModal(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Settings className="w-4 h-4" />
                <span>Konfigurasi Target (171 & 76)</span>
              </button>
            )}

            {canEdit && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 bg-white text-slate-900 hover:bg-amber-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Catat Medali Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Target 171 & 76 Config Card */}
        <div className="mt-5 p-4 bg-black/25 rounded-xl border border-white/20 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-xs uppercase tracking-wider text-yellow-200 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Konfigurasi Angka Paparan (171 & 76)
              </span>
              <StatusBadge type="verified" value={primarySetting?.is_verified ? 1 : 0} />
            </div>
            <p className="text-xs text-amber-100">
              {primarySetting?.description || 'Angka paparan memerlukan verifikasi pelabelan definitif dari admin.'}
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs font-semibold">
              <span className="bg-white/10 px-2 py-0.5 rounded">
                Target Primer: <strong className="text-white text-sm">{primarySetting?.value || '171'}</strong> ({primarySetting?.label})
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded">
                Target Sekunder: <strong className="text-white text-sm">{secondarySetting?.value || '76'}</strong> ({secondarySetting?.label})
              </span>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowTargetModal(true)}
              className="text-xs font-bold text-yellow-200 hover:text-white underline self-start md:self-center"
            >
              Ubah / Verifikasi Sekarang &rarr;
            </button>
          )}
        </div>
      </div>

      {/* KPI Medal Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <div className="text-xs font-bold text-amber-800">🥇 MEDALI EMAS</div>
          <div className="text-3xl font-black text-amber-900 mt-1">{totalGold}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">
            Target: <strong>{primarySetting?.value || '171'}</strong> ({Math.round((totalGold / parseInt(primarySetting?.value || '171', 10)) * 100)}%)
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 text-center">
          <div className="text-xs font-bold text-slate-700">🥈 MEDALI PERAK</div>
          <div className="text-3xl font-black text-slate-800 mt-1">{totalSilver}</div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Target: <strong>{secondarySetting?.value || '76'}</strong> ({Math.round((totalSilver / parseInt(secondarySetting?.value || '76', 10)) * 100)}%)
          </div>
        </div>

        <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-4 text-center">
          <div className="text-xs font-bold text-amber-950">🥉 MEDALI PERUNGGU</div>
          <div className="text-3xl font-black text-amber-950 mt-1">{totalBronze}</div>
          <div className="text-[11px] text-amber-800 mt-0.5">Estimasi: 95</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <div className="text-xs font-bold text-emerald-800">TOTAL MEDALI</div>
          <div className="text-3xl font-black text-emerald-900 mt-1">{totalMedals}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-semibold">Kontingen Juara</div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 text-center flex flex-col justify-center">
          <div className="text-xs font-bold text-slate-600">STATUS VERIFIKASI</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {totalMedals - unverifiedCount} / {totalMedals}
          </div>
          {unverifiedCount > 0 ? (
            <div className="text-[10px] text-amber-600 font-bold mt-0.5 animate-pulse">
              ⚠️ {unverifiedCount} Butuh Verifikasi
            </div>
          ) : (
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% Terverifikasi</div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Medali:</span>
          </div>

          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="px-2.5 py-1.5 border rounded-lg"
          >
            <option value="">Semua Cabang Olahraga</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={filterMedalType}
            onChange={(e) => setFilterMedalType(e.target.value)}
            className="px-2.5 py-1.5 border rounded-lg"
          >
            <option value="">Semua Jenis Medali</option>
            <option value="emas">🥇 Medali Emas</option>
            <option value="perak">🥈 Medali Perak</option>
            <option value="perunggu">🥉 Medali Perunggu</option>
          </select>

          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value)}
            className="px-2.5 py-1.5 border rounded-lg"
          >
            <option value="">Semua Status Verifikasi</option>
            <option value="true">Hanya Terverifikasi</option>
            <option value="false">Hanya Belum Diverifikasi</option>
          </select>
        </div>

        <div className="text-slate-400 text-[11px]">
          Menampilkan {medals.length} catatan medali
        </div>
      </div>

      {/* Two Tabs/Views: Daftar Medali Rinci & Rekap Cabor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Daftar Medali yang Diraih */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Daftar Rincian Perolehan Medali
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Jenis & Tanggal</th>
                  <th className="py-3 px-4">Cabor & Nomor</th>
                  <th className="py-3 px-4">Atlet / Tim Peraih</th>
                  <th className="py-3 px-4">Status Verifikasi</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      Tidak ada data medali untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  medals.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge type="medal" value={m.medal_type} />
                        <div className="text-[10px] text-slate-400 mt-1">{m.awarded_date}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{m.sport_name}</div>
                        <div className="text-slate-500 text-[11px]">{m.event_name || 'Nomor Pertandingan'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {m.athlete_or_team}
                        {m.notes && <div className="text-[10px] text-slate-400 font-normal">{m.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge type="verified" value={m.is_verified} />
                        {m.verifier_name && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Oleh: {m.verifier_name}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {canVerify && (
                          <button
                            onClick={() => handleVerifyMedal(m.id, m.is_verified)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                              m.is_verified === 1
                                ? 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                            }`}
                          >
                            {m.is_verified === 1 ? 'Batalkan Sah' : 'Verifikasi Sah'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Rekap Medali per Cabor & Target */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Rekapitulasi per Cabor & Target
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Perbandingan raihan riil terhadap target medali per cabang olahraga.
          </p>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {tally.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-slate-900">
                    {item.sport_name}
                    <span className="text-[10px] font-normal text-slate-400 ml-1">({item.code})</span>
                  </div>
                  <span className="font-black text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    Total: {item.total}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                  <span className="text-amber-800 font-bold">🥇 {item.gold} Emas</span>
                  <span className="text-slate-600 font-bold">🥈 {item.silver} Perak</span>
                  <span className="text-amber-950 font-bold">🥉 {item.bronze} Prg</span>
                </div>

                {item.target_gold > 0 && (
                  <div className="text-[10px] text-slate-500 flex justify-between bg-white p-1 rounded">
                    <span>Target Cabor: {item.target_gold} Emas</span>
                    <span className={item.gold >= item.target_gold ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
                      {Math.round((item.gold / item.target_gold) * 100)}% Capaian
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal 1: Add Medal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Catat Perolehan Medali Kontingen"
        subtitle="Pencatatan resmi medali kontingen KONI Kota Bandung"
      >
        <form onSubmit={handleAddMedal} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cabang Olahraga *</label>
              <select
                required
                value={medalForm.sport_id}
                onChange={(e) => setMedalForm({ ...medalForm, sport_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih Cabang Olahraga</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Medali *</label>
              <select
                value={medalForm.medal_type}
                onChange={(e) => setMedalForm({ ...medalForm, medal_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg font-bold"
              >
                <option value="emas">🥇 Medali Emas</option>
                <option value="perak">🥈 Medali Perak</option>
                <option value="perunggu">🥉 Medali Perunggu</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Atlet / Tim Peraih Medali *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Dimas Arya Pratama / Tim Beregu Bulutangkis"
              value={medalForm.athlete_or_team}
              onChange={(e) => setMedalForm({ ...medalForm, athlete_or_team: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tanggal Raihan *</label>
              <input
                type="date"
                required
                value={medalForm.awarded_date}
                onChange={(e) => setMedalForm({ ...medalForm, awarded_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sumber Pengesahan</label>
              <input
                type="text"
                value={medalForm.source}
                onChange={(e) => setMedalForm({ ...medalForm, source: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan / Nomor</label>
            <input
              type="text"
              placeholder="Contoh: Gaya Bebas 50m Putra - Rekor PORPROV Baru"
              value={medalForm.notes}
              onChange={(e) => setMedalForm({ ...medalForm, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_verified_check"
              checked={medalForm.is_verified}
              onChange={(e) => setMedalForm({ ...medalForm, is_verified: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="is_verified_check" className="font-semibold text-slate-700 cursor-pointer">
              Tandai langsung sebagai Terverifikasi Resmi
            </label>
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
              className="px-4 py-2 font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-xs"
            >
              Simpan Medali
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Admin Target Config (Addressing 171 & 76 Verification Requirement) */}
      <Modal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        title="Verifikasi & Pelabelan Target Medali (171 & 76)"
        subtitle="Sesuai konteks paparan, admin wajib melabeli dan memverifikasi makna angka 171 & 76"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveTargetConfig} className="space-y-4 text-xs">
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 leading-relaxed">
            <strong>Instruksi Sistem:</strong> Paparan mencantumkan angka 171 dan 76 tanpa penjelasan definitif.
            Sebagai Admin, Anda diminta menetapkan label resmi (misal: 171 sebagai Target Medali Emas, dan 76 sebagai Target Medali Perak atau Kategori Unggulan) serta menandai status verifikasinya.
          </div>

          {/* Setting 1: Primary (171) */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs">Konfigurasi Angka Paparan 1 (Default: 171)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Angka *</label>
                <input
                  type="text"
                  required
                  value={targetConfigForm.primary_val}
                  onChange={(e) => setTargetConfigForm({ ...targetConfigForm, primary_val: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-bold text-base"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Label Resmi *</label>
                <input
                  type="text"
                  required
                  value={targetConfigForm.primary_label}
                  onChange={(e) => setTargetConfigForm({ ...targetConfigForm, primary_label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Keterangan / Sumber Data</label>
              <textarea
                rows={2}
                value={targetConfigForm.primary_desc}
                onChange={(e) => setTargetConfigForm({ ...targetConfigForm, primary_desc: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Setting 2: Secondary (76) */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs">Konfigurasi Angka Paparan 2 (Default: 76)</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nilai Angka *</label>
                <input
                  type="text"
                  required
                  value={targetConfigForm.secondary_val}
                  onChange={(e) => setTargetConfigForm({ ...targetConfigForm, secondary_val: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-bold text-base"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Label Resmi *</label>
                <input
                  type="text"
                  required
                  value={targetConfigForm.secondary_label}
                  onChange={(e) => setTargetConfigForm({ ...targetConfigForm, secondary_label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Keterangan / Sumber Data</label>
              <textarea
                rows={2}
                value={targetConfigForm.secondary_desc}
                onChange={(e) => setTargetConfigForm({ ...targetConfigForm, secondary_desc: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <input
              type="checkbox"
              id="verify_target_check"
              checked={targetConfigForm.is_verified}
              onChange={(e) => setTargetConfigForm({ ...targetConfigForm, is_verified: e.target.checked })}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
            />
            <label htmlFor="verify_target_check" className="font-bold text-emerald-900 cursor-pointer">
              Sahkan dan Verifikasi: Saya menyatakan bahwa pelabelan target medali di atas telah sah dan terverifikasi oleh Binpres KONI Kota Bandung.
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowTargetModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan & Sahkan Konfigurasi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
