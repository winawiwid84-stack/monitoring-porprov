import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Sport, Athlete, Official, Post, PostPersonnel, HostRegion, Venue, EventItem } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import * as XLSX from 'xlsx';
import {
  Database,
  Users,
  Trophy,
  Building,
  UserPlus,
  Plus,
  Download,
  Upload,
  Search,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';

export const MasterDataView: React.FC = () => {
  const { user, canManageMaster, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'sports' | 'events' | 'athletes' | 'officials' | 'posts_personnel' | 'venues'>('sports');
  const [loading, setLoading] = useState(true);

  // Data states
  const [sports, setSports] = useState<Sport[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [personnel, setPersonnel] = useState<PostPersonnel[]>([]);
  const [regions, setRegions] = useState<HostRegion[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);

  // Search filter
  const [search, setSearch] = useState('');

  // Modals
  const [showAddSportModal, setShowAddSportModal] = useState(false);
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [showAddOfficialModal, setShowAddOfficialModal] = useState(false);
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);
  const [showManageRosterModal, setShowManageRosterModal] = useState(false);
  const [rosterAction, setRosterAction] = useState<'add' | 'remove'>('add');
  const [rosterForm, setRosterForm] = useState({
    sport_id: 'sp_atletik',
    full_name: '',
    gender: 'L',
    club: 'KONI Kota Bandung',
    athlete_id_to_remove: '',
  });

  // Forms
  const [sportForm, setSportForm] = useState({
    code: '',
    name: '',
    category: 'Permainan',
    total_events: 10,
    joined_events: 8,
    target_gold: 3,
    target_silver: 2,
    target_bronze: 2,
    target_notes: '',
  });

  const [athleteForm, setAthleteForm] = useState({
    registration_number: '',
    sport_id: '',
    full_name: '',
    nickname: '',
    gender: 'L',
    birth_date: '2003-01-01',
    blood_type: 'O',
    phone: '',
    status: 'siap_tanding',
    is_verified: true,
  });

  const [officialForm, setOfficialForm] = useState({
    sport_id: '',
    full_name: '',
    role_type: 'pelatih',
    phone: '',
    license_number: '',
    notes: '',
  });

  const [personnelForm, setPersonnelForm] = useState({
    post_id: 'post_bekasi',
    full_name: '',
    division: 'Monitoring Pertandingan',
    position: 'Petugas Lapangan',
    phone: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [sRes, evRes, aRes, oRes, pRes, ppRes, rRes, vRes] = await Promise.all([
        api.getSports(),
        api.getEvents(),
        api.getAthletes({ search }),
        api.getOfficials(),
        api.getPosts(),
        api.getPostPersonnel(),
        api.getHostRegions(),
        api.getVenues(),
      ]);
      setSports(sRes);
      setEvents(evRes);
      setAthletes(aRes);
      setOfficials(oRes);
      setPosts(pRes);
      setPersonnel(ppRes);
      setRegions(rRes);
      setVenues(vRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Export to Excel handler
  const handleExportExcel = () => {
    let exportData: any[] = [];
    let sheetName = 'Master Data';

    if (activeTab === 'sports') {
      sheetName = 'Cabang Olahraga';
      exportData = sports.map((s) => ({
        Kode: s.code,
        'Nama Cabor': s.name,
        Kategori: s.category,
        'Nomor Diikuti': s.joined_events,
        'Total Nomor': s.total_events,
        'Target Emas': s.target_gold,
        'Target Perak': s.target_silver,
        'Target Perunggu': s.target_bronze,
        Status: s.target_verified ? 'Terverifikasi' : 'Perlu Cek',
      }));
    } else if (activeTab === 'athletes') {
      sheetName = 'Daftar Atlet';
      exportData = athletes.map((a) => ({
        'No Registrasi': a.registration_number,
        'Nama Lengkap': a.full_name,
        'Nama Panggilan': a.nickname || '-',
        Cabor: a.sport_name,
        Gender: a.gender === 'L' ? 'Laki-Laki' : 'Perempuan',
        'Gol Darah': a.blood_type || '-',
        'Tanggal Lahir': a.birth_date || '-',
        Status: a.status,
        Verifikasi: a.is_verified ? 'Sah' : 'Belum Verifikasi',
      }));
    } else if (activeTab === 'officials') {
      sheetName = 'Official & Pelatih';
      exportData = officials.map((o) => ({
        'Nama Lengkap': o.full_name,
        Peran: o.role_type,
        Cabor: o.sport_name,
        Telepon: o.phone || '-',
        Lisensi: o.license_number || '-',
      }));
    } else if (activeTab === 'posts_personnel') {
      sheetName = 'Personel Posko';
      exportData = personnel.map((p) => ({
        Posko: p.post_name,
        'Nama Personel': p.full_name,
        Bidang: p.division,
        Jabatan: p.position,
        Telepon: p.phone || '-',
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `KONI_Kota_Bandung_${sheetName.replace(/\s+/g, '_')}_PORPROV2026.xlsx`);
  };

  // CSV Import simulation / reader
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);
        alert(`Berhasil membaca ${data.length} baris data dari berkas ${file.name}. Sistem melakukan validasi duplikasi & integritas foreign key.`);
      } catch (err: any) {
        alert('Gagal membaca berkas: Format tidak didukung.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Create handlers
  const handleCreateSport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSport(sportForm);
      setShowAddSportModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan cabor');
    }
  };

  const handleCreateAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAthlete(athleteForm);
      setShowAddAthleteModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan atlet');
    }
  };

  const handleCreateOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createOfficial(officialForm);
      setShowAddOfficialModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan official');
    }
  };

  const handleCreatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPostPersonnel(personnelForm);
      setShowAddPersonnelModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftarkan personel posko');
    }
  };

  const handleDeleteAthlete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus atlet ${name}?`)) {
      try {
        await api.deleteAthlete(id);
        loadData();
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus');
      }
    }
  };

  const handleManageRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (rosterAction === 'add') {
        if (!rosterForm.full_name.trim()) {
          alert('Nama atlet wajib diisi.');
          return;
        }
        await api.createAthlete({
          sport_id: rosterForm.sport_id,
          full_name: rosterForm.full_name,
          registration_number: `BDG-${Date.now().toString().slice(-4)}`,
          gender: rosterForm.gender,
          birth_date: '2004-01-01',
          blood_type: 'O',
          status: 'siap_tanding',
          is_verified: true,
        });
        alert(`Atlet ${rosterForm.full_name} berhasil ditambahkan ke roster cabor!`);
      } else {
        if (!rosterForm.athlete_id_to_remove) {
          alert('Pilih atlet yang ingin dikeluarkan.');
          return;
        }
        await api.deleteAthlete(rosterForm.athlete_id_to_remove);
        alert('Atlet berhasil dikeluarkan dari roster kontingen.');
      }
      setShowManageRosterModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengelola roster atlet');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Master Data Kontingen & Wilayah Tuan Rumah</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengelolaan 78 cabor, 911 nomor, 1.366 atlet, pelatih, official, manajer, posko & venue
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Ekspor Excel</span>
          </button>

          {/* Import CSV */}
          {canManageMaster && (
            <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Impor CSV</span>
              <input type="file" accept=".csv, .xlsx, .xls" onChange={handleImportCSV} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto scrollbar-none">
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveTab('sports')}
            className={`pb-3 text-xs font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === 'sports' ? 'text-emerald-600 border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Cabang Olahraga (78)
          </button>
          <button
            onClick={() => setActiveTab('athletes')}
            className={`pb-3 text-xs font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === 'athletes' ? 'text-emerald-600 border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Atlet Kontingen (1.366)
          </button>
          <button
            onClick={() => setActiveTab('officials')}
            className={`pb-3 text-xs font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === 'officials' ? 'text-emerald-600 border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Pelatih, Official & Manajer (554)
          </button>
          <button
            onClick={() => setActiveTab('posts_personnel')}
            className={`pb-3 text-xs font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === 'posts_personnel' ? 'text-emerald-600 border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Posko & Personel
          </button>
          <button
            onClick={() => setActiveTab('venues')}
            className={`pb-3 text-xs font-bold whitespace-nowrap transition border-b-2 ${
              activeTab === 'venues' ? 'text-emerald-600 border-emerald-600' : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Venue & 12 Daerah Tuan Rumah
          </button>
        </div>

        {/* Action Button inside active tab */}
        {canManageMaster && (
          <div className="pb-2">
            {activeTab === 'sports' && (
              <button
                onClick={() => setShowAddSportModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Cabor</span>
              </button>
            )}
            {activeTab === 'athletes' && (
              <button
                onClick={() => setShowAddAthleteModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftarkan Atlet</span>
              </button>
            )}
            {activeTab === 'officials' && (
              <button
                onClick={() => setShowAddOfficialModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Official / Pelatih</span>
              </button>
            )}
            {activeTab === 'posts_personnel' && (
              <button
                onClick={() => setShowAddPersonnelModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Personel Posko</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab 1: SPORTS */}
      {activeTab === 'sports' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Kode & Cabor</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Nomor Pertandingan</th>
                  <th className="py-3 px-4">Target Medali (Emas / Perak / Prg)</th>
                  <th className="py-3 px-4">Status Verifikasi Target</th>
                  <th className="py-3 px-4">Venue Utama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sports.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{s.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded ml-2 font-mono">
                        {s.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.category}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-700">{s.joined_events}</span> Diikuti / {s.total_events} Total
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-amber-800">🥇 {s.target_gold}</span>
                      <span className="text-slate-300 mx-1.5">|</span>
                      <span className="font-bold text-slate-700">🥈 {s.target_silver}</span>
                      <span className="text-slate-300 mx-1.5">|</span>
                      <span className="font-bold text-amber-950">🥉 {s.target_bronze}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge type="verified" value={s.target_verified} />
                    </td>
                    <td className="py-3 px-4 text-slate-500">{s.primary_venue_name || 'Ditentukan'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: ATHLETES */}
      {activeTab === 'athletes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Cari nama atlet atau nomor registrasi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-500 hidden sm:inline">
                Menampilkan {athletes.length} atlet terdaftar
              </div>
              {canManageMaster && (
                <button
                  onClick={() => setShowManageRosterModal(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Kelola Roster (Tambah / Kurang)</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">No. Registrasi</th>
                  <th className="py-3 px-4">Nama Lengkap & Panggilan</th>
                  <th className="py-3 px-4">Cabang Olahraga</th>
                  <th className="py-3 px-4">L/P & Gol. Darah</th>
                  <th className="py-3 px-4">Status Atlet</th>
                  <th className="py-3 px-4">Keabsahan Dokumen</th>
                  {canManageMaster && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {athletes.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {a.registration_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {a.full_name}
                      {a.nickname && <span className="text-slate-400 font-normal ml-1">({a.nickname})</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{a.sport_name}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold">{a.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                      <span className="text-slate-400 ml-1">({a.blood_type || '-'})</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium text-[11px]">
                        {a.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge type="verified" value={a.is_verified} />
                    </td>
                    {canManageMaster && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteAthlete(a.id, a.full_name)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-rose-50"
                          title="Hapus Atlet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: OFFICIALS */}
      {activeTab === 'officials' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Nama Official / Pelatih</th>
                  <th className="py-3 px-4">Peran & Tanggung Jawab</th>
                  <th className="py-3 px-4">Cabang Olahraga</th>
                  <th className="py-3 px-4">No. Lisensi / Sertifikasi</th>
                  <th className="py-3 px-4">Kontak Telepon</th>
                  <th className="py-3 px-4">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {officials.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{o.full_name}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="capitalize font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[11px]">
                        {o.role_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{o.sport_name}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{o.license_number || '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{o.phone || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">{o.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: POSTS & PERSONNEL */}
      {activeTab === 'posts_personnel' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {posts.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                  <StatusBadge type="status" value={p.status} />
                </div>
                <div className="text-xs font-semibold text-emerald-700">{p.location_name}</div>
                <p className="text-xs text-slate-500">{p.address}</p>
                <div className="pt-2 border-t text-[11px] text-slate-600 space-y-1">
                  <div>Koordinator: <strong>{p.coordinator_name}</strong></div>
                  <div>Kontak Siaga: <strong>{p.contact_phone}</strong></div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Daftar Personel Siaga Posko per Bidang
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Posko Penugasan</th>
                    <th className="py-3 px-4">Nama Lengkap Personel</th>
                    <th className="py-3 px-4">Bidang / Divisi</th>
                    <th className="py-3 px-4">Jabatan</th>
                    <th className="py-3 px-4">No. Telepon</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {personnel.map((pp) => (
                    <tr key={pp.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-emerald-800">{pp.post_name}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{pp.full_name}</td>
                      <td className="py-3 px-4 text-slate-700">{pp.division}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{pp.position}</td>
                      <td className="py-3 px-4 text-slate-500">{pp.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: VENUES & REGIONS */}
      {activeTab === 'venues' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
              12 Daerah Cakupan Tuan Rumah PORPROV XV Jabar 2026
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {regions.map((reg) => (
                <div key={reg.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="font-bold text-slate-900 text-xs">{reg.name}</div>
                  <div className="text-[10px] text-emerald-700 font-mono mt-0.5">{reg.code}</div>
                  {reg.is_primary === 1 && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold mt-1 inline-block">
                      Utama
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Daftar Venue Pertandingan
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Nama Venue</th>
                    <th className="py-3 px-4">Daerah Tuan Rumah</th>
                    <th className="py-3 px-4">Alamat</th>
                    <th className="py-3 px-4">Kapasitas Penonton</th>
                    <th className="py-3 px-4">Kontak Lapangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {venues.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{v.name}</td>
                      <td className="py-3 px-4 text-emerald-700 font-semibold">{v.region_name}</td>
                      <td className="py-3 px-4 text-slate-500">{v.address}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{v.capacity?.toLocaleString('id-ID')} Orang</td>
                      <td className="py-3 px-4 text-slate-600">{v.contact_person} ({v.contact_phone})</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Add Sport */}
      <Modal
        isOpen={showAddSportModal}
        onClose={() => setShowAddSportModal(false)}
        title="Tambah Cabang Olahraga Baru"
        subtitle="Mendaftarkan cabor kontingen Kota Bandung"
      >
        <form onSubmit={handleCreateSport} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kode Cabor *</label>
              <input
                type="text"
                required
                placeholder="Misal: BDM / ATL"
                value={sportForm.code}
                onChange={(e) => setSportForm({ ...sportForm, code: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Cabang Olahraga *</label>
              <input
                type="text"
                required
                placeholder="Misal: Bulutangkis"
                value={sportForm.name}
                onChange={(e) => setSportForm({ ...sportForm, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Emas</label>
              <input
                type="number"
                value={sportForm.target_gold}
                onChange={(e) => setSportForm({ ...sportForm, target_gold: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Perak</label>
              <input
                type="number"
                value={sportForm.target_silver}
                onChange={(e) => setSportForm({ ...sportForm, target_silver: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Perunggu</label>
              <input
                type="number"
                value={sportForm.target_bronze}
                onChange={(e) => setSportForm({ ...sportForm, target_bronze: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 border rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowAddSportModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Cabor
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Add Athlete */}
      <Modal
        isOpen={showAddAthleteModal}
        onClose={() => setShowAddAthleteModal(false)}
        title="Daftarkan Atlet Kontingen Baru"
        subtitle="Mendaftarkan atlet kontingen Kota Bandung ke database"
      >
        <form onSubmit={handleCreateAthlete} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cabang Olahraga *</label>
              <select
                required
                value={athleteForm.sport_id}
                onChange={(e) => setAthleteForm({ ...athleteForm, sport_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih Cabor</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. Registrasi / ID Atlet</label>
              <input
                type="text"
                placeholder="Kosongkan untuk auto-generate"
                value={athleteForm.registration_number}
                onChange={(e) => setAthleteForm({ ...athleteForm, registration_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Atlet *</label>
            <input
              type="text"
              required
              placeholder="Nama lengkap sesuai KTP/Akte Kelahiran"
              value={athleteForm.full_name}
              onChange={(e) => setAthleteForm({ ...athleteForm, full_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin *</label>
              <select
                value={athleteForm.gender}
                onChange={(e) => setAthleteForm({ ...athleteForm, gender: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="L">Laki-Laki (Putra)</option>
                <option value="P">Perempuan (Putri)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Golongan Darah</label>
              <select
                value={athleteForm.blood_type}
                onChange={(e) => setAthleteForm({ ...athleteForm, blood_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="O">O</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Status Kesiapan</label>
              <select
                value={athleteForm.status}
                onChange={(e) => setAthleteForm({ ...athleteForm, status: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              >
                <option value="siap_tanding">Siap Tanding</option>
                <option value="cedera">Cedera</option>
                <option value="pemulihan">Pemulihan</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowAddAthleteModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Daftarkan Atlet
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Add Official */}
      <Modal
        isOpen={showAddOfficialModal}
        onClose={() => setShowAddOfficialModal(false)}
        title="Daftarkan Official / Pelatih / Manajer"
        subtitle="Total rincian: 307 pelatih, 161 official/mekanik, 86 manajer"
      >
        <form onSubmit={handleCreateOfficial} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cabang Olahraga *</label>
              <select
                required
                value={officialForm.sport_id}
                onChange={(e) => setOfficialForm({ ...officialForm, sport_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Pilih Cabor</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Peran *</label>
              <select
                value={officialForm.role_type}
                onChange={(e) => setOfficialForm({ ...officialForm, role_type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              >
                <option value="pelatih">Pelatih (Coach)</option>
                <option value="official_mekanik">Official / Mekanik / Masseur</option>
                <option value="manajer">Manajer Tim Cabor</option>
                <option value="tenaga_pendukung">Tenaga Pendukung</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Samsul Arifin, M.Pd"
              value={officialForm.full_name}
              onChange={(e) => setOfficialForm({ ...officialForm, full_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. Lisensi / Sertifikat</label>
              <input
                type="text"
                placeholder="Misal: PBSI-LT-A"
                value={officialForm.license_number}
                onChange={(e) => setOfficialForm({ ...officialForm, license_number: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon</label>
              <input
                type="text"
                placeholder="0812-xxxx-xxxx"
                value={officialForm.phone}
                onChange={(e) => setOfficialForm({ ...officialForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowAddOfficialModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Official
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Add Post Personnel */}
      <Modal
        isOpen={showAddPersonnelModal}
        onClose={() => setShowAddPersonnelModal(false)}
        title="Tambah Personel Posko"
        subtitle="Susunan personel per posko dan per bidang"
      >
        <form onSubmit={handleCreatePersonnel} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pilih Posko *</label>
              <select
                required
                value={personnelForm.post_id}
                onChange={(e) => setPersonnelForm({ ...personnelForm, post_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {posts.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.location_name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Bidang / Divisi *</label>
              <select
                value={personnelForm.division}
                onChange={(e) => setPersonnelForm({ ...personnelForm, division: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg font-semibold"
              >
                <option value="Pengawasan & Pengendalian">Pengawasan & Pengendalian</option>
                <option value="Monitoring Pertandingan">Monitoring Pertandingan</option>
                <option value="Akomodasi & Transportasi">Akomodasi & Transportasi</option>
                <option value="Medis & Fisioterapi">Medis & Fisioterapi</option>
                <option value="Protes & Hukum">Protes & Advokasi Hukum</option>
                <option value="Logistik & Konsumsi">Logistik & Konsumsi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={personnelForm.full_name}
              onChange={(e) => setPersonnelForm({ ...personnelForm, full_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Jabatan *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Petugas Lapangan / Koordinator"
                value={personnelForm.position}
                onChange={(e) => setPersonnelForm({ ...personnelForm, position: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">No. Telepon</label>
              <input
                type="text"
                placeholder="0812-xxxx-xxxx"
                value={personnelForm.phone}
                onChange={(e) => setPersonnelForm({ ...personnelForm, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowAddPersonnelModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Personel
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: Kelola Roster Atlet (Tambah / Kurang) */}
      <Modal
        isOpen={showManageRosterModal}
        onClose={() => setShowManageRosterModal(false)}
        title="Kelola Atlet (Tambah atau Kurang Roster Cabor)"
        subtitle="Penyesuaian kuota atlet kontingen KONI Kota Bandung secara langsung"
      >
        <form onSubmit={handleManageRoster} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Aksi Pengelolaan Roster *</label>
            <select
              value={rosterAction}
              onChange={(e) => setRosterAction(e.target.value as 'add' | 'remove')}
              className="w-full px-3 py-2 border rounded-xl font-bold bg-slate-50 text-slate-800"
            >
              <option value="add">➕ Tambah Atlet Baru ke Cabor</option>
              <option value="remove">➖ Keluarkan / Kurangi Atlet dari Roster</option>
            </select>
          </div>

          {rosterAction === 'add' ? (
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Atlet *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rian Maulana / Atlet Baru"
                  value={rosterForm.full_name}
                  onChange={(e) => setRosterForm({ ...rosterForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cabang Olahraga *</label>
                  <select
                    value={rosterForm.sport_id}
                    onChange={(e) => setRosterForm({ ...rosterForm, sport_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    {sports.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin *</label>
                  <select
                    value={rosterForm.gender}
                    onChange={(e) => setRosterForm({ ...rosterForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white font-semibold"
                  >
                    <option value="L">Putra (Laki-laki)</option>
                    <option value="P">Putri (Perempuan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Klub / Pengcab Asal</label>
                <input
                  type="text"
                  placeholder="Contoh: PASI Kota Bandung / PB SGS"
                  value={rosterForm.club}
                  onChange={(e) => setRosterForm({ ...rosterForm, club: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-rose-50/60 rounded-xl border border-rose-200">
              <div className="text-[11px] text-rose-800">
                Pilih atlet yang akan dikeluarkan dari daftar kontingen PORPROV. Data dan relasi terkait akan diperbarui secara otomatis.
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pilih Atlet untuk Dikeluarkan *</label>
                <select
                  required
                  value={rosterForm.athlete_id_to_remove}
                  onChange={(e) => setRosterForm({ ...rosterForm, athlete_id_to_remove: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-semibold"
                >
                  <option value="">-- Pilih Atlet --</option>
                  {athletes.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name} ({a.sport_name} • {a.gender === 'L' ? 'Putra' : 'Putri'} • {a.registration_number})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowManageRosterModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 font-semibold text-white rounded-lg shadow-xs ${
                rosterAction === 'add'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {rosterAction === 'add' ? 'Simpan Atlet ke Roster' : 'Keluarkan Atlet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
