export type UserRole = 'admin' | 'pengurus_pusat' | 'koordinator_posko' | 'tim_monev' | 'tim_teknis' | 'tim_medis' | 'viewer';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  assigned_post_id?: string | null;
  post_name?: string;
}

export interface Sport {
  id: string;
  code: string;
  name: string;
  category: string;
  total_events: number;
  joined_events: number;
  target_gold: number;
  target_silver: number;
  target_bronze: number;
  target_verified: number;
  target_notes?: string;
  primary_venue_id?: string;
  primary_venue_name?: string;
  actual_events_count?: number;
  athlete_count?: number;
}

export interface EventItem {
  id: string;
  sport_id: string;
  sport_name?: string;
  name: string;
  gender: 'putra' | 'putri' | 'campuran' | 'terbuka';
  is_followed: number;
  potential_medal: 'emas' | 'perak' | 'perunggu' | 'non_potensi' | 'belum_diverifikasi';
  potential_verified: number;
}

export interface Athlete {
  id: string;
  registration_number: string;
  sport_id: string;
  sport_name?: string;
  full_name: string;
  nickname?: string;
  gender: 'L' | 'P';
  birth_date?: string;
  blood_type?: string;
  phone?: string;
  status: 'siap_tanding' | 'cedera' | 'pemulihan' | 'diskualifikasi';
  is_verified: number;
}

export interface Official {
  id: string;
  sport_id: string;
  sport_name?: string;
  full_name: string;
  role_type: 'pelatih' | 'official_mekanik' | 'manajer' | 'tenaga_pendukung';
  phone?: string;
  license_number?: string;
  notes?: string;
}

export interface HostRegion {
  id: string;
  name: string;
  code: string;
  is_primary: number;
  notes?: string;
  venues_count?: number;
}

export interface Venue {
  id: string;
  region_id: string;
  region_name?: string;
  name: string;
  address?: string;
  capacity?: number;
  contact_person?: string;
  contact_phone?: string;
}

export interface Post {
  id: string;
  name: string;
  region_id?: string;
  region_name?: string;
  location_name: string;
  address: string;
  coordinator_name?: string;
  contact_phone?: string;
  status: 'aktif' | 'persiapan' | 'nonaktif';
  notes?: string;
  active_personnel_count?: number;
}

export interface PostPersonnel {
  id: string;
  post_id: string;
  post_name?: string;
  full_name: string;
  division: string;
  position: string;
  phone?: string;
  notes?: string;
  is_active: number;
}

export interface Fixture {
  id: string;
  sport_id: string;
  sport_name?: string;
  event_id?: string;
  event_name?: string;
  venue_id?: string;
  venue_name?: string;
  region_name?: string;
  post_id?: string;
  post_name?: string;
  match_code?: string;
  stage: string;
  scheduled_time: string;
  opponent: string;
  athlete_or_team: string;
  status: 'terjadwal' | 'berlangsung' | 'selesai' | 'ditunda' | 'dibatalkan';
  delay_reason?: string;
  source_update: string;
  last_updated_by?: string;
  last_updater_name?: string;
  score_bandung?: string;
  score_opponent?: string;
  outcome?: 'menang' | 'kalah' | 'seri' | 'walkout' | 'belum_ada';
  result_summary?: string;
  result_verified?: number;
}

export interface Medal {
  id: string;
  sport_id: string;
  sport_name?: string;
  event_id?: string;
  event_name?: string;
  fixture_id?: string;
  medal_type: 'emas' | 'perak' | 'perunggu';
  athlete_or_team: string;
  awarded_date: string;
  source: string;
  is_verified: number;
  verified_by?: string;
  verifier_name?: string;
  verified_at?: string;
  notes?: string;
}

export interface MedalTally {
  sport_name: string;
  code: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  target_gold: number;
  target_silver: number;
  target_bronze: number;
}

export interface DailyReport {
  id: string;
  post_id: string;
  post_name?: string;
  location_name?: string;
  reporter_id: string;
  reporter_name?: string;
  sport_id?: string;
  sport_name?: string;
  fixture_id?: string;
  report_date: string;
  title: string;
  activity_summary: string;
  field_conditions?: string;
  follow_up_action?: string;
  status: 'draft' | 'terkirim' | 'dievaluasi' | 'selesai';
  photo_url?: string;
  rating?: string;
  findings?: string;
  recommendation?: string;
  created_at: string;
}

export interface Issue {
  id: string;
  post_id?: string;
  post_name?: string;
  sport_id?: string;
  sport_name?: string;
  daily_report_id?: string;
  title: string;
  category: 'teknis_tanding' | 'transportasi' | 'penginapan_akomodasi' | 'konsumsi' | 'medis' | 'perwasitan_protes' | 'perlengkapan' | 'lainnya';
  description: string;
  priority: 'rendah' | 'sedang' | 'tinggi' | 'kritis';
  status: 'baru' | 'diproses' | 'menunggu' | 'selesai';
  escalated_to_central: number;
  reported_by: string;
  reporter_name?: string;
  assigned_to?: string;
  assignee_name?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  user_id: string;
  user_name: string;
  username: string;
  action_taken: string;
  status_before?: string;
  status_after?: string;
  notes?: string;
  created_at: string;
}

export interface MedicalCase {
  id: string;
  athlete_id: string;
  athlete_name?: string;
  blood_type?: string;
  gender?: 'L' | 'P';
  sport_id: string;
  sport_name?: string;
  post_id?: string;
  post_name?: string;
  incident_type: 'cedera_tanding' | 'penyakit_akut' | 'kelelahan_dehidrasi' | 'kondisi_psikis_stres' | 'gangguan_nutrisi' | 'lainnya';
  urgency_level: 'rendah' | 'sedang' | 'tinggi' | 'darurat';
  diagnosis_summary: string;
  treatment_given: string;
  hospital_referral?: string;
  medic_officer_name: string;
  incident_time: string;
  status: 'observasi' | 'rawat_jalan' | 'rawat_inap' | 'pulih_siap_tanding' | 'tidak_dapat_lanjut';
  is_confidential: number;
  created_by_name?: string;
  created_at: string;
}

export interface Accommodation {
  id: string;
  region_id: string;
  region_name?: string;
  post_id?: string;
  post_name?: string;
  hotel_name: string;
  address: string;
  total_capacity: number;
  current_occupancy: number;
  assigned_sports?: string;
  pic_name?: string;
  pic_phone?: string;
  notes?: string;
}

export interface TransportAssignment {
  id: string;
  post_id: string;
  post_name?: string;
  sport_id?: string;
  sport_name?: string;
  vehicle_type: 'bus_besar' | 'hiace_elf' | 'mobil_operasional' | 'ambulans' | 'pickup_logistik';
  plate_number: string;
  driver_name: string;
  driver_phone: string;
  route_plan: string;
  departure_time?: string;
  status: 'standby' | 'dalam_perjalanan' | 'selesai' | 'kendala_mogok_macet';
  issue_note?: string;
}

export interface Protest {
  id: string;
  fixture_id?: string;
  match_code?: string;
  sport_id: string;
  sport_name?: string;
  protest_type: 'teknis_perwasitan' | 'keabsahan_atlet' | 'disiplin_etika' | 'administrasi_pertandingan';
  description: string;
  reporter_name: string;
  reporter_role?: string;
  submission_time: string;
  fee_deposit_status: 'lunas' | 'belum_lunas' | 'bebas_biaya';
  hearing_status: 'diajukan' | 'diproses_dewan_hakim' | 'ditolak' | 'dikabulkan_sebagian' | 'dikabulkan_penuh';
  decision_summary?: string;
  decided_at?: string;
  is_confidential: number;
  handled_by?: string;
  handler_name?: string;
}

export interface AuditLog {
  id: number;
  user_id?: string;
  username?: string;
  role?: string;
  action: string;
  module: string;
  record_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface AppSetting {
  key: string;
  value: string;
  label: string;
  category: string;
  description?: string;
  is_verified: number;
  verified_by?: string;
  verified_at?: string;
  updated_at: string;
}
