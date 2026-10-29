import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Accommodation, TransportAssignment, Post } from '../types/index.ts';
import { StatusBadge } from '../components/StatusBadge.tsx';
import { Modal } from '../components/Modal.tsx';
import {
  Building,
  Truck,
  MapPin,
  Phone,
  Users,
  Edit2,
  Clock,
  AlertTriangle,
  Bus,
  Ambulance,
  Car,
} from 'lucide-react';

export const LogistikView: React.FC = () => {
  const { hasRole } = useAuth();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [trips, setTrips] = useState<TransportAssignment[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Active subtab
  const [activeTab, setActiveTab] = useState<'hotel' | 'transport'>('hotel');

  // Modals
  const [showEditAccModal, setShowEditAccModal] = useState(false);
  const [showEditTransModal, setShowEditTransModal] = useState(false);
  const [selectedAcc, setSelectedAcc] = useState<Accommodation | null>(null);
  const [selectedTrans, setSelectedTrans] = useState<TransportAssignment | null>(null);

  // Forms
  const [accForm, setAccForm] = useState({
    current_occupancy: 0,
    assigned_sports: '',
    notes: '',
  });

  const [transForm, setTransForm] = useState({
    status: 'standby',
    issue_note: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [aRes, tRes, pRes] = await Promise.all([
        api.getAccommodations(),
        api.getTransportAssignments(),
        api.getPosts(),
      ]);
      setAccommodations(aRes);
      setTrips(tRes);
      setPosts(pRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateAcc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcc) return;
    try {
      await api.updateAccommodation(selectedAcc.id, accForm);
      setShowEditAccModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui penginapan');
    }
  };

  const handleUpdateTrans = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrans) return;
    try {
      await api.updateTransportAssignment(selectedTrans.id, transForm);
      setShowEditTransModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui armada');
    }
  };

  const canEdit = hasRole(['admin', 'pengurus_pusat', 'koordinator_posko']);

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'bus_besar': return <Bus className="w-4 h-4 text-blue-600" />;
      case 'ambulans': return <Ambulance className="w-4 h-4 text-red-600" />;
      case 'hiace_elf': return <Truck className="w-4 h-4 text-emerald-600" />;
      default: return <Car className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>Penginapan & Transportasi Operasional Kontingen</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen keterisian hotel/asrama kontingen dan pemantauan pergerakan armada antar venue
          </p>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs">
          <button
            onClick={() => setActiveTab('hotel')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'hotel' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Building className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
            Penginapan & Hotel
          </button>
          <button
            onClick={() => setActiveTab('transport')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTab === 'transport' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Truck className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
            Armada & Rute Transport
          </button>
        </div>
      </div>

      {activeTab === 'hotel' ? (
        /* Hotel & Accommodation List */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {accommodations.map((acc) => {
            const percentage = Math.round((acc.current_occupancy / (acc.total_capacity || 1)) * 100);
            return (
              <div key={acc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
                      {acc.region_name}
                    </span>
                    {canEdit && (
                      <button
                        onClick={() => {
                          setSelectedAcc(acc);
                          setAccForm({
                            current_occupancy: acc.current_occupancy,
                            assigned_sports: acc.assigned_sports || '',
                            notes: acc.notes || '',
                          });
                          setShowEditAccModal(true);
                        }}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100"
                        title="Perbarui Okupansi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">{acc.hotel_name}</h3>
                  <div className="text-xs text-slate-500 flex items-start gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                    <span>{acc.address}</span>
                  </div>

                  {/* Occupancy bar */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-600">Okupansi Kamar</span>
                      <span className={percentage > 90 ? 'text-rose-600' : 'text-emerald-700'}>
                        {acc.current_occupancy} / {acc.total_capacity} Bed ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          percentage > 90 ? 'bg-rose-500' : percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Sports staying */}
                  <div className="mt-3 text-xs">
                    <span className="font-semibold text-slate-700">Cabor yang Menempati:</span>
                    <p className="text-slate-600 mt-0.5 leading-relaxed bg-emerald-50/40 p-2 rounded-lg border border-emerald-100">
                      {acc.assigned_sports || 'Belum ditetapkan'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>PIC: <strong>{acc.pic_name}</strong></span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <Phone className="w-3 h-3" />
                    {acc.pic_phone}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Transport Assignments Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Jenis & No. Polisi</th>
                  <th className="py-3 px-4">Pengemudi (Driver) & Kontak</th>
                  <th className="py-3 px-4">Rute Antar Jemput</th>
                  <th className="py-3 px-4">Posko / Cabor</th>
                  <th className="py-3 px-4">Waktu & Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getVehicleIcon(tr.vehicle_type)}
                        <div>
                          <div className="font-bold text-slate-900">{tr.plate_number}</div>
                          <div className="text-[10px] text-slate-400 uppercase">{tr.vehicle_type.replace(/_/g, ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{tr.driver_name}</div>
                      <div className="text-slate-500 text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{tr.driver_phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 max-w-xs">
                      {tr.route_plan}
                      {tr.issue_note && (
                        <div className="text-[10px] text-rose-700 bg-rose-50 p-1 rounded mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{tr.issue_note}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-900 font-medium">{tr.post_name}</div>
                      {tr.sport_name && (
                        <div className="text-[11px] text-emerald-700 font-semibold">{tr.sport_name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge type="status" value={tr.status} />
                      <div className="text-[10px] text-slate-400 mt-1">{tr.departure_time}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setSelectedTrans(tr);
                            setTransForm({
                              status: tr.status,
                              issue_note: tr.issue_note || '',
                            });
                            setShowEditTransModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                        >
                          Update Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Edit Accommodation */}
      <Modal
        isOpen={showEditAccModal}
        onClose={() => setShowEditAccModal(false)}
        title="Perbarui Okupansi Penginapan"
        subtitle={selectedAcc?.hotel_name}
      >
        <form onSubmit={handleUpdateAcc} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Keterisian Saat Ini (Maks: {selectedAcc?.total_capacity} Bed) *
            </label>
            <input
              type="number"
              required
              min={0}
              max={selectedAcc?.total_capacity || 500}
              value={accForm.current_occupancy}
              onChange={(e) => setAccForm({ ...accForm, current_occupancy: parseInt(e.target.value, 10) })}
              className="w-full px-3 py-2 border rounded-lg font-bold text-base"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Daftar Cabor yang Menginap</label>
            <input
              type="text"
              placeholder="Contoh: Bulutangkis, Sepak Bola, Bola Basket"
              value={accForm.assigned_sports}
              onChange={(e) => setAccForm({ ...accForm, assigned_sports: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              value={accForm.notes}
              onChange={(e) => setAccForm({ ...accForm, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowEditAccModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Transport Status */}
      <Modal
        isOpen={showEditTransModal}
        onClose={() => setShowEditTransModal(false)}
        title="Update Status Armada Transportasi"
        subtitle={`Armada: ${selectedTrans?.plate_number} (${selectedTrans?.driver_name})`}
      >
        <form onSubmit={handleUpdateTrans} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status Operasional *</label>
            <select
              value={transForm.status}
              onChange={(e) => setTransForm({ ...transForm, status: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-lg font-bold"
            >
              <option value="standby">Standby di Posko / Hotel</option>
              <option value="dalam_perjalanan">Sedang dalam Perjalanan ke Venue</option>
              <option value="selesai">Selesai Pengantaran / Penjemputan</option>
              <option value="kendala_mogok_macet">Kendala Kemacetan Parah / Mogok</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Catatan Kendala (Jika Ada)</label>
            <textarea
              rows={3}
              placeholder="Contoh: Terhambat macet di gerbang tol Pasteur selama 40 menit"
              value={transForm.issue_note}
              onChange={(e) => setTransForm({ ...transForm, issue_note: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowEditTransModal(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
            >
              Perbarui Status Armada
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
