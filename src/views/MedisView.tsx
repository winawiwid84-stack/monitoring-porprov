import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { MedicalCase, Athlete, Sport, Post } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  HeartPulse,
  Plus,
  ShieldAlert,
  AlertTriangle,
  Hospital,
  Activity,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react';

export const MedisView: React.FC = () => {
  const { user, canAccessMedical } = useAuth();
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterUrgency, setFilterUrgency] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null);

  // Forms
  const [caseForm, setCaseForm] = useState({
    athlete_id: '',
    sport_id: '',
    post_id: '',
    incident_type: 'cedera_tanding',
    urgency_level: 'sedang',
    diagnosis_summary: '',
    treatment_given: '',
    hospital_referral: '',
    medic_officer_name: user?.full_name || 'dr. Rina Safitri, Sp.KO',
    incident_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    status: 'observasi',
  });

  const [updateForm, setUpdateForm] = useState({
    status: 'observasi',
    treatment_given: '',
    hospital_referral: '',
  });

  const loadData = async () => {
    if (!canAccessMedical) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [cRes, aRes, sRes, pRes] = await Promise.all([
        api.getMedicalCases({
          urgency_level: filterUrgency || undefined,
          status: filterStatus || undefined,
        }),
        api.getAthletes(),
        api.getSports(),
        api.getPosts(),
      ]);
      setCases(cRes);
      setAthletes(aRes);
      setSports(sRes);
      setPosts(pRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterUrgency, filterStatus, canAccessMedical]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMedicalCase(caseForm);
      setShowAddModal(false);
      loadData();
      alert('Catatan medis berhasil disimpan dengan status rahasia.');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan catatan medis');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    try {
      await api.updateMedicalCase(selectedCase.id, updateForm);
      setShowUpdateModal(false);
      loadData();
      alert('Status medis atlet berhasil diperbarui.');
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status');
    }
  };

  // Access Control Guard
  if (!canAccessMedical) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto my-8 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Akses Rekam Medis Terbatas</h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          Sesuai dengan kode etik kerahasiaan medis dan regulasi PORPROV XV Jawa Barat, modul ini
          hanya dapat diakses oleh <strong>Tim Medis</strong>, <strong>Pengurus Pusat</strong>, dan{' '}
          <strong>Admin Sistem</strong>. Data kesehatan atlet tidak dipublikasikan ke publik.
        </p>
        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-slate-600 text-xs">
          Peran aktif Anda: <span className="font-bold uppercase text-slate-800">{user?.role}</span>
        </div>
      </div>
    );
  }

  const ongoingCases = cases.filter((c) => c.status !== 'pulih_siap_tanding').length;
  const emergencyCases = cases.filter((c) => c.urgency_level === 'darurat' || c.urgency_level === 'tinggi').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Kerahasiaan Medis Atlet Dijamin Terproteksi</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-600" />
            <span>Tim Medis, Fisioterapi & Kesejahteraan Atlet</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan penanganan cedera tanding, penyakit akut, terapi pemulihan, dan rujukan rumah sakit
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Input Rekam Medis Baru</span>
        </button>
      </div>

      {/* Stats Counter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-rose-800">KASUS AKTIF DALAM OBSERVASI</div>
            <div className="text-2xl font-black text-rose-900 mt-1">{ongoingCases} Orang</div>
          </div>
          <Activity className="w-8 h-8 text-rose-400" />
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-800">URGENSI TINGGI / RUJUKAN RS</div>
            <div className="text-2xl font-black text-amber-900 mt-1">{emergencyCases} Kasus</div>
          </div>
          <Hospital className="w-8 h-8 text-amber-400" />
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-800">TELAH PULIH & SIAP TANDING</div>
            <div className="text-2xl font-black text-emerald-900 mt-1">
              {cases.filter((c) => c.status === 'pulih_siap_tanding').length} Atlet
            </div>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
        <span className="font-semibold text-slate-600">Filter Kasus Medis:</span>

        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          className="px-2.5 py-1.5 border rounded-lg"
        >
          <option value="">Semua Tingkat Urgensi</option>
          <option value="darurat">Darurat (Emergency)</option>
          <option value="tinggi">Tinggi</option>
          <option value="sedang">Sedang</option>
          <option value="rendah">Rendah</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-1.5 border rounded-lg"
        >
          <option value="">Semua Status Medis</option>
          <option value="observasi">Observasi Posko</option>
          <option value="rawat_jalan">Rawat Jalan</option>
          <option value="rawat_inap">Rawat Inap RS</option>
          <option value="pulih_siap_tanding">Pulih Siap Tanding</option>
          <option value="tidak_dapat_lanjut">Tidak Dapat Lanjut</option>
        </select>
      </div>

      {/* Table of Medical Records */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Urgensi & Waktu</th>
                <th className="py-3 px-4">Nama Atlet & Cabor</th>
                <th className="py-3 px-4">Jenis Kejadian & Diagnosis</th>
                <th className="py-3 px-4">Tindakan Penanganan</th>
                <th className="py-3 px-4">Faskes / RS Rujukan</th>
                <th className="py-3 px-4">Status Kebugaran</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Tidak ada catatan kasus medis tercatat.
                  </td>
                </tr>
              ) : (
                cases.map((mc) => (
                  <tr key={mc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge type="urgency" value={mc.urgency_level} />
                      <div className="text-[10px] text-slate-400 mt-1">{mc.incident_time}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{mc.athlete_name}</div>
                      <div className="text-slate-500 text-[11px]">
                        {mc.sport_name} (Gol. Darah: {mc.blood_type || '-'})
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="capitalize bg-slate-100 px-2 py-0.5 rounded font-semibold text-slate-700 text-[10px]">
                        {mc.incident_type.replace(/_/g, ' ')}
                      </span>
                      <p className="text-slate-800 text-xs font-medium mt-1">{mc.diagnosis_summary}</p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-600 text-xs">{mc.treatment_given}</p>
                      <div className="text-[10px] text-slate-400 mt-0.5">Petugas: {mc.medic_officer_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {mc.hospital_referral ? (
                        <div className="text-rose-700 font-bold flex items-center gap-1">
                          <Hospital className="w-3.5 h-3.5 shrink-0" />
                          <span>{mc.hospital_referral}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Klinik Posko ({mc.post_name || 'Lokal'})</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800">
                        {mc.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedCase(mc);
                          setUpdateForm({
                            status: mc.status,
                            treatment_given: mc.treatment_given,
                            hospital_referral: mc.hospital_referral || '',
                          });
                          setShowUpdateModal(true);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                      >
                        Update Penanganan
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add Medical Case */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Input Rekam Medis & Penanganan Atlet"
        subtitle="Data bersifat rahasia dan hanya dapat diakses tenaga medis/pimpinan kontingen"
      >
        <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pilih Atlet *</label>
              <select
                required
                value={caseForm.athlete_id}
                onChange={(e) => {
                  const ath = athletes.find((a) => a.id === e.target.value);
                  setCaseForm({
                    ...caseForm,
                    athlete_id: e.target.value,
                    sport_id: ath?.sport_id || '',
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih Atlet</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} ({a.sport_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Posko / Tempat Penanganan</label>
              <select
                value={caseForm.post_id}
                onChange={(e) => setCaseForm({ ...caseForm, post_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih Posko</option>
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.location_name})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Kejadian Medis *</label>
              <select
                value={caseForm.incident_type}
                onChange={(e) => setCaseForm({ ...caseForm, incident_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              >
                <option value="cedera_tanding">Cedera Tanding (Sprain/Strain/Fraktur/Memar)</option>
                <option value="kelelahan_dehidrasi">Kelelahan Ekstrem & Dehidrasi</option>
                <option value="penyakit_akut">Penyakit Akut (Demam/Flu/Pencernaan)</option>
                <option value="kondisi_psikis_stres">Kondisi Psikis & Kecemasan Bertanding</option>
                <option value="gangguan_nutrisi">Gangguan Nutrisi / Berat Badan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tingkat Urgensi *</label>
              <select
                value={caseForm.urgency_level}
                onChange={(e) => setCaseForm({ ...caseForm, urgency_level: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg font-bold"
              >
                <option value="rendah">Rendah (Dapat rawat jalan ringan)</option>
                <option value="sedang">Sedang (Perlu observasi berkala posko)</option>
                <option value="tinggi">Tinggi (Pemeriksaan spesialis RS)</option>
                <option value="darurat">Darurat (Ambulans & IGD Segera)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Diagnosis Medis Sementara *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Sprain ligamen pergelangan kaki kanan derajat 1"
              value={caseForm.diagnosis_summary}
              onChange={(e) => setCaseForm({ ...caseForm, diagnosis_summary: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg font-semibold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tindakan Penanganan yang Diberikan *</label>
            <textarea
              required
              rows={2}
              placeholder="Tindakan medis/fisioterapi (misal: RICE protocol, analgetik oral, tapping, kompres)"
              value={caseForm.treatment_given}
              onChange={(e) => setCaseForm({ ...caseForm, treatment_given: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Rujukan Rumah Sakit (Bila Ada)</label>
              <input
                type="text"
                placeholder="Contoh: RSUD Kota Bekasi / RS PMI Bogor"
                value={caseForm.hospital_referral}
                onChange={(e) => setCaseForm({ ...caseForm, hospital_referral: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Kebugaran Awal</label>
              <select
                value={caseForm.status}
                onChange={(e) => setCaseForm({ ...caseForm, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="observasi">Observasi Posko</option>
                <option value="rawat_jalan">Rawat Jalan</option>
                <option value="rawat_inap">Rawat Inap RS</option>
                <option value="pulih_siap_tanding">Pulih & Siap Tanding</option>
                <option value="tidak_dapat_lanjut">Diskualifikasi Medis (Tidak Dapat Lanjut)</option>
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
              className="px-4 py-2 font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
            >
              Simpan Rekam Medis
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Update Status & Treatment */}
      <Modal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Perkembangan Kasus Medis"
        subtitle={`Atlet: ${selectedCase?.athlete_name} (${selectedCase?.sport_name})`}
      >
        <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Kebugaran Atlet Terbaru *</label>
            <select
              value={updateForm.status}
              onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            >
              <option value="observasi">Dalam Observasi Fisioterapi</option>
              <option value="rawat_jalan">Rawat Jalan Berkala</option>
              <option value="rawat_inap">Rawat Inap Faskes/RS</option>
              <option value="pulih_siap_tanding">✅ Pulih Sepenuhnya & Siap Tanding</option>
              <option value="tidak_dapat_lanjut">❌ Tidak Dapat Melanjutkan Pertandingan</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tindakan Tambahan / Progres Pemulihan</label>
            <textarea
              rows={3}
              value={updateForm.treatment_given}
              onChange={(e) => setUpdateForm({ ...updateForm, treatment_given: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">RS Rujukan</label>
            <input
              type="text"
              value={updateForm.hospital_referral}
              onChange={(e) => setUpdateForm({ ...updateForm, hospital_referral: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowUpdateModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Perbarui Status
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
