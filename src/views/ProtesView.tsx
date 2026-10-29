import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Protest, Sport, Fixture } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Scale,
  Plus,
  Gavel,
  ShieldAlert,
  FileCheck2,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const ProtesView: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [protests, setProtests] = useState<Protest[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [selectedProtest, setSelectedProtest] = useState<Protest | null>(null);

  // Forms
  const [protestForm, setProtestForm] = useState({
    sport_id: '',
    fixture_id: '',
    protest_type: 'teknis_perwasitan',
    description: '',
    reporter_name: user?.full_name || '',
    reporter_role: 'Manajer Cabor / Advokat KONI',
    submission_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    fee_deposit_status: 'lunas',
  });

  const [decisionForm, setDecisionForm] = useState({
    hearing_status: 'diproses_dewan_hakim',
    decision_summary: '',
    is_confidential: false,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [pRes, sRes, fRes] = await Promise.all([
        api.getProtests(),
        api.getSports(),
        api.getFixtures(),
      ]);
      setProtests(pRes);
      setSports(sRes);
      setFixtures(fRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProtest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createProtest(protestForm);
      setShowAddModal(false);
      setProtestForm({
        sport_id: '',
        fixture_id: '',
        protest_type: 'teknis_perwasitan',
        description: '',
        reporter_name: user?.full_name || '',
        reporter_role: 'Manajer Cabor / Advokat KONI',
        submission_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
        fee_deposit_status: 'lunas',
      });
      loadData();
      alert('Protes resmi berhasil diajukan dan dicatat sistem.');
    } catch (err: any) {
      alert(err.message || 'Gagal mengajukan protes');
    }
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProtest) return;
    try {
      await api.updateProtest(selectedProtest.id, decisionForm);
      setShowDecisionModal(false);
      loadData();
      alert('Keputusan dewan hakim berhasil disimpan.');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan keputusan dewan hakim');
    }
  };

  const canSubmit = hasRole(['admin', 'pengurus_pusat', 'tim_teknis', 'koordinator_posko']);
  const canDecide = hasRole(['admin', 'pengurus_pusat']);

  const getHearingBadge = (status: string) => {
    switch (status) {
      case 'diajukan':
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-xs font-semibold">Diajukan</span>;
      case 'diproses_dewan_hakim':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-xs font-semibold animate-pulse">Sidang Dewan Hakim</span>;
      case 'dikabulkan_penuh':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-xs font-bold">Dikabulkan Penuh</span>;
      case 'dikabulkan_sebagian':
        return <span className="bg-teal-100 text-teal-800 border border-teal-300 px-2 py-0.5 rounded text-xs font-bold">Dikabulkan Sebagian</span>;
      case 'ditolak':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-xs font-bold">Ditolak</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-600" />
            <span>Advokasi, Protes Resmi & Keabsahan Atlet</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan sengketa teknis perwasitan, keabsahan mutasi atlet kontingen lawan, dan sidang Dewan Hakim PORPROV
          </p>
        </div>

        {canSubmit && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Protes Resmi</span>
          </button>
        )}
      </div>

      {/* Protests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protests.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl border text-slate-400">
            Tidak ada laporan protes resmi atau sengketa aktif.
          </div>
        ) : (
          protests.map((prt) => (
            <div key={prt.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {prt.sport_name}
                    </span>
                    <span className="capitalize text-xs font-semibold text-indigo-700">
                      {prt.protest_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {getHearingBadge(prt.hearing_status)}
                </div>

                <p className="text-xs text-slate-800 mt-2 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {prt.description}
                </p>

                {prt.decision_summary && (
                  <div className="mt-2.5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                      <Gavel className="w-3.5 h-3.5" />
                      <span>Keputusan Dewan Hakim / Panpel:</span>
                    </div>
                    <p className="text-xs text-indigo-950 font-medium leading-relaxed">{prt.decision_summary}</p>
                    {prt.decided_at && (
                      <div className="text-[10px] text-indigo-700 pt-1">
                        Diputuskan pada: {prt.decided_at}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
                <div>
                  Pelapor: <strong>{prt.reporter_name}</strong> ({prt.reporter_role || 'Official'})
                </div>
                <div className="flex items-center gap-2">
                  <span>Waktu: {prt.submission_time.split(' ')[0]}</span>
                  {canDecide && (
                    <button
                      onClick={() => {
                        setSelectedProtest(prt);
                        setDecisionForm({
                          hearing_status: prt.hearing_status,
                          decision_summary: prt.decision_summary || '',
                          is_confidential: prt.is_confidential === 1,
                        });
                        setShowDecisionModal(true);
                      }}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded font-bold"
                    >
                      Update Keputusan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal 1: Submit Protest */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Formulir Pengajuan Protes Resmi"
        subtitle="Dokumentasi formal sengketa pertandingan ke Dewan Hakim PORPROV XV Jabar"
      >
        <form onSubmit={handleCreateProtest} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cabang Olahraga Terkait *</label>
              <select
                required
                value={protestForm.sport_id}
                onChange={(e) => setProtestForm({ ...protestForm, sport_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih Cabang Olahraga</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Protes / Keberatan *</label>
              <select
                value={protestForm.protest_type}
                onChange={(e) => setProtestForm({ ...protestForm, protest_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              >
                <option value="teknis_perwasitan">Teknis Perwasitan & Penilaian Juri</option>
                <option value="keabsahan_atlet">Keabsahan Atlet (Mutasi / Usia / Dokumen)</option>
                <option value="disiplin_etika">Disiplin & Pelanggaran Etika Olahraga</option>
                <option value="administrasi_pertandingan">Administrasi & Jadwal Pertandingan</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pertandingan Terkait (Opsional)</label>
            <select
              value={protestForm.fixture_id}
              onChange={(e) => setProtestForm({ ...protestForm, fixture_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Tidak terikat jadwal spesifik / Sengketa umum</option>
              {fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.sport_name} - {f.athlete_or_team} vs {f.opponent} ({f.scheduled_time.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Uraian Alasan Protes & Kronologi *</label>
            <textarea
              required
              rows={4}
              placeholder="Uraikan secara jelas dasar keberatan, nomor poin pasal regulasi teknis yang dilanggar, serta bukti yang dilampirkan"
              value={protestForm.description}
              onChange={(e) => setProtestForm({ ...protestForm, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Pelapor / Penanggung Jawab *</label>
              <input
                type="text"
                required
                value={protestForm.reporter_name}
                onChange={(e) => setProtestForm({ ...protestForm, reporter_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Uang Deposit Protes (Regulasi PORPROV)</label>
              <select
                value={protestForm.fee_deposit_status}
                onChange={(e) => setProtestForm({ ...protestForm, fee_deposit_status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="lunas">Lunas Diserahkan ke Panpel</option>
                <option value="belum_lunas">Belum Diserahkan</option>
                <option value="bebas_biaya">Bebas Biaya (Administratif)</option>
              </select>
            </div>
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
              className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
            >
              Daftarkan Protes
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Decision Update */}
      <Modal
        isOpen={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
        title="Sidang & Keputusan Dewan Hakim"
        subtitle={selectedProtest?.sport_name}
      >
        <form onSubmit={handleSaveDecision} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Sidang / Hasil Protes *</label>
            <select
              value={decisionForm.hearing_status}
              onChange={(e) => setDecisionForm({ ...decisionForm, hearing_status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg font-bold text-sm"
            >
              <option value="diproses_dewan_hakim">Sedang Disidangkan Dewan Hakim</option>
              <option value="dikabulkan_penuh">✅ DIKABULKAN PENUH (Protes Diterima)</option>
              <option value="dikabulkan_sebagian">⚠️ DIKABULKAN SEBAGIAN</option>
              <option value="ditolak">❌ DITOLAK (Hasil Pertandingan Tetap Sah)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rangkuman Putusan Dewan Hakim *</label>
            <textarea
              required
              rows={4}
              placeholder="Isi berita acara dan putusan resmi Dewan Hakim / Technical Delegate"
              value={decisionForm.decision_summary}
              onChange={(e) => setDecisionForm({ ...decisionForm, decision_summary: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="confidential_protest_check"
              checked={decisionForm.is_confidential}
              onChange={(e) => setDecisionForm({ ...decisionForm, is_confidential: e.target.checked })}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="confidential_protest_check" className="font-semibold text-slate-700 cursor-pointer">
              Tandai dokumen sebagai Rahasia Internal (Hanya Pengurus Pusat)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowDecisionModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Putusan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
