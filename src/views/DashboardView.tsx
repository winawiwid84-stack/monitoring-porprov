import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StatusBadge } from '../components/StatusBadge.tsx';
import {
  Trophy,
  Users,
  Target,
  Calendar,
  AlertOctagon,
  Clock,
  MapPin,
  RefreshCw,
  TrendingUp,
  FileText,
  Radio,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { user, canVerify } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterRegion, setFilterRegion] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardStats();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat ringkasan dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-sm">Memuat data monitoring kontingen KONI Kota Bandung...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl text-center my-6">
        <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h4 className="font-bold">Gagal Mengambil Data</h4>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={loadStats}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { contingent, medals, targets, fixtures_today, issues_summary, unresolved_issues, posts } = data || {};

  // Filtered fixtures
  const filteredFixtures = (fixtures_today || []).filter((f: any) => {
    if (filterSport && f.sport_id !== filterSport) return false;
    if (filterStatus && f.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome & Last Updated Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-700/60 text-emerald-200 text-xs px-3 py-1 rounded-full font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Target: Juara Umum PORPROV XV Jabar 2026</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Pusat Komando & Monitoring Kontingen Kota Bandung
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-3xl leading-relaxed">
              Memantau operasional 1.920 personil kontingen (1.366 atlet, 307 pelatih, 161 official, 86 manajer) di 78 cabang olahraga dan 3 posko wilayah Jawa Barat.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 text-xs">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>
                Pembaruan Terakhir:{' '}
                <strong className="text-white">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                </strong>
              </span>
              <button
                onClick={loadStats}
                className="p-1 hover:bg-slate-700 rounded text-emerald-400"
                title="Segarkan Data"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[11px] text-emerald-300/80">
              Status Peran Aktif: <strong className="text-white uppercase">{user?.role}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Target Medali Alert with 171 & 76 Verification Warning */}
      <div className="bg-amber-50/90 border border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-amber-950 text-sm sm:text-base">
                  Target & Potensi Medali Kontingen (Paparan: 171 & 76)
                </h4>
                <StatusBadge type="verified" value={targets?.primary?.is_verified ? 1 : 0} />
              </div>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                {targets?.primary?.description ||
                  'Angka 171 dan 76 tercantum dalam konteks paparan tanpa penjelasan definitif. Sistem mewajibkan Admin untuk memverifikasi dan melabeli artinya secara tepat.'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <span className="bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-md font-semibold">
                  Target Primer: <strong>{targets?.primary?.value || '171'}</strong> (
                  {targets?.primary?.label || 'Perlu Pelabelan'})
                </span>
                <span className="bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-md font-semibold">
                  Target Sekunder: <strong>{targets?.secondary?.value || '76'}</strong> (
                  {targets?.secondary?.label || 'Perlu Pelabelan'})
                </span>
                <span className="bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-md font-semibold">
                  Estimasi Perunggu: <strong>{targets?.bronze_est?.value || '95'}</strong>
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('medali')}
            className="self-start lg:self-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition whitespace-nowrap flex items-center gap-1.5"
          >
            <span>Verifikasi / Atur Target</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main KPI Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Medali Emas & Total */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Perolehan Medali</span>
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{medals?.gold || 0}</span>
              <span className="text-xs font-bold text-amber-600">🥇 Emas</span>
              <span className="text-slate-300">|</span>
              <span className="text-xl font-bold text-slate-700">{medals?.silver || 0}</span>
              <span className="text-xs font-semibold text-slate-500">🥈 Perak</span>
              <span className="text-slate-300">|</span>
              <span className="text-xl font-bold text-slate-700">{medals?.bronze || 0}</span>
              <span className="text-xs font-semibold text-amber-800">🥉 Prg</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span>Total: <strong>{medals?.total || 0} Medali</strong></span>
              <span className="text-emerald-600 font-semibold">{medals?.verified || 0} Sah</span>
            </div>
          </div>
        </div>

        {/* Card 2: Atlet & Kontingen */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Kontingen</span>
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{contingent?.total_contingent_target || 1920}</span>
              <span className="text-xs text-slate-500 font-medium">Orang</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
              <span>Atlet: <strong>{contingent?.total_athletes || 1366}</strong></span>
              <span>Pelatih: <strong>{contingent?.total_coaches || 307}</strong></span>
              <span>Off/Mgr: <strong>{(contingent?.total_officials || 161) + (contingent?.total_managers || 86)}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 3: Cabor & Nomor Pertandingan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cabor & Nomor</span>
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">{contingent?.total_sports || 78}</span>
              <span className="text-xs text-slate-500 font-medium">Cabor</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
              <span>Diikuti: <strong>{contingent?.total_events_followed || 911}</strong></span>
              <span>Total Nomor: <strong>{contingent?.total_events_all || 1156}</strong></span>
            </div>
          </div>
        </div>

        {/* Card 4: Kendala Lapangan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Kendala Lapangan</span>
            <div className="p-2 bg-rose-100 text-rose-800 rounded-xl">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-600">
                {(issues_summary?.baru || 0) + (issues_summary?.diproses || 0) + (issues_summary?.menunggu || 0)}
              </span>
              <span className="text-xs text-rose-700 font-medium">Belum Selesai</span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
              <span className="text-rose-600 font-bold">{issues_summary?.high_priority || 0} Prioritas Tinggi</span>
              <span className="text-purple-600 font-semibold">{issues_summary?.escalated_open || 0} Eskalasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posko Cards (3 Posko Resmi Kontingen) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Status 3 Posko Utama Kontingen
            </h3>
          </div>
          <button
            onClick={() => onNavigate('posko')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Kelola Posko & Laporan</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(posts || []).map((p: any) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                  <StatusBadge type="status" value={p.status} />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Lokasi: {p.location_name}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.address}</p>
                <div className="mt-3 text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl">
                  <div>Koordinator: <strong>{p.coordinator_name || '-'}</strong></div>
                  <div>Kontak Siaga: <strong>{p.contact_phone || '-'}</strong></div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500">{p.personnel_count || 0} Personil Siaga</span>
                <span className="text-slate-500">{p.reports_count || 0} Laporan Masuk</span>
                {p.open_issues_count > 0 ? (
                  <span className="text-rose-600 font-bold">{p.open_issues_count} Kendala</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Aman</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Layout: Today's Matches & Unresolved Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Jadwal Pertandingan Hari Ini */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Pertandingan Hari Ini & Hasil Terkini</span>
              </h3>
              <p className="text-xs text-slate-500">Daftar pertandingan kontingen Kota Bandung yang sedang atau akan berjalan</p>
            </div>
            <button
              onClick={() => onNavigate('jadwal')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 self-start sm:self-auto flex items-center gap-1"
            >
              <span>Lihat Kalender Lengkap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
            <span className="text-slate-500 font-medium">Filter Cepat:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Semua Status</option>
              <option value="terjadwal">Terjadwal</option>
              <option value="berlangsung">Sedang Berlangsung</option>
              <option value="selesai">Selesai</option>
              <option value="ditunda">Ditunda</option>
            </select>
          </div>

          {filteredFixtures.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Tidak ada pertandingan dengan filter yang dipilih untuk hari ini.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFixtures.map((f: any) => (
                <div
                  key={f.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {f.sport_name}
                      </span>
                      <span className="text-xs text-slate-500">{f.stage}</span>
                      <StatusBadge type="status" value={f.status} />
                      {f.outcome && <StatusBadge type="outcome" value={f.outcome} />}
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {f.athlete_or_team} <span className="text-slate-400 font-normal">vs</span> {f.opponent}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>Waktu: <strong>{f.scheduled_time.split(' ')[1]?.slice(0, 5) || f.scheduled_time} WIB</strong></span>
                      <span>Venue: {f.venue_name || f.region_name || 'Venue PORPROV'}</span>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:pl-4 sm:border-slate-200 shrink-0">
                    {f.score_bandung ? (
                      <div>
                        <div className="text-xs text-slate-400">Skor Akhir</div>
                        <div className="text-base font-black text-emerald-700">{f.score_bandung}</div>
                        <div className="text-[10px] text-slate-400">Lawan: {f.score_opponent}</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => onNavigate('jadwal')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition"
                      >
                        Input Skor
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Kendala Belum Selesai (Eskalasi & Urgent) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Kendala Lapangan Terkini</span>
              </h3>
              <button
                onClick={() => onNavigate('posko')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Semua
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Isu posko yang membutuhkan perhatian segera atau tindak lanjut dari pengurus pusat.
            </p>

            {(!unresolved_issues || unresolved_issues.length === 0) ? (
              <div className="text-center py-8 text-emerald-600 text-xs flex flex-col items-center">
                <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                <span>Seluruh posko dalam kondisi kondusif tanpa kendala aktif.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {unresolved_issues.map((issue: any) => (
                  <div
                    key={issue.id}
                    onClick={() => onNavigate('posko')}
                    className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 cursor-pointer transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge type="priority" value={issue.priority} />
                      <StatusBadge type="status" value={issue.status} />
                    </div>
                    <div className="font-semibold text-slate-800 text-xs line-clamp-1">{issue.title}</div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{issue.description}</p>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
                      <span>{issue.post_name || 'Pusat'}</span>
                      {issue.escalated_to_central === 1 && (
                        <span className="font-bold text-purple-600">Eskalasi Pusat</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('posko')}
              className="w-full py-2 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
            >
              <span>+ Buat Laporan / Kendala Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
