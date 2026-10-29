import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'koni_bandung_porprov2026.db');
export const db = new Database(dbPath);

// Enable foreign keys and WAL mode for high performance and integrity
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    -- 1. ROLES
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      permissions TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 2. USERS
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      avatar_url TEXT,
      assigned_post_id TEXT,
      status TEXT CHECK(status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      deleted_at TEXT
    );

    -- 3. USER_ROLES
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      assigned_at TEXT DEFAULT (datetime('now', 'localtime')),
      UNIQUE(user_id, role_id)
    );

    -- 4. HOST_REGIONS (12 Daerah Tuan Rumah)
    CREATE TABLE IF NOT EXISTS host_regions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      code TEXT,
      is_primary INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 5. VENUES
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      region_id TEXT NOT NULL REFERENCES host_regions(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      address TEXT,
      capacity INTEGER DEFAULT 0,
      contact_person TEXT,
      contact_phone TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 6. POSTS (Posko Kontingen KONI Kota Bandung)
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region_id TEXT REFERENCES host_regions(id) ON DELETE SET NULL,
      location_name TEXT NOT NULL,
      address TEXT NOT NULL,
      coordinator_name TEXT,
      contact_phone TEXT,
      status TEXT CHECK(status IN ('aktif', 'persiapan', 'nonaktif')) DEFAULT 'aktif',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 7. POST_PERSONNEL
    CREATE TABLE IF NOT EXISTS post_personnel (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      division TEXT NOT NULL,
      position TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 8. SPORTS (78 Cabang Olahraga)
    CREATE TABLE IF NOT EXISTS sports (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      total_events INTEGER DEFAULT 0,
      joined_events INTEGER DEFAULT 0,
      target_gold INTEGER DEFAULT 0,
      target_silver INTEGER DEFAULT 0,
      target_bronze INTEGER DEFAULT 0,
      target_verified INTEGER DEFAULT 0,
      target_notes TEXT,
      primary_venue_id TEXT REFERENCES venues(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 9. EVENTS (Nomor Pertandingan)
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('putra', 'putri', 'campuran', 'terbuka')) DEFAULT 'putra',
      is_followed INTEGER DEFAULT 1,
      potential_medal TEXT CHECK(potential_medal IN ('emas', 'perak', 'perunggu', 'non_potensi', 'belum_diverifikasi')) DEFAULT 'belum_diverifikasi',
      potential_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 10. ATHLETES (1.366 Atlet)
    CREATE TABLE IF NOT EXISTS athletes (
      id TEXT PRIMARY KEY,
      registration_number TEXT UNIQUE,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      nickname TEXT,
      gender TEXT CHECK(gender IN ('L', 'P')) NOT NULL,
      birth_date TEXT,
      blood_type TEXT,
      phone TEXT,
      status TEXT CHECK(status IN ('siap_tanding', 'cedera', 'pemulihan', 'diskualifikasi')) DEFAULT 'siap_tanding',
      is_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      deleted_at TEXT
    );

    -- 11. TEAMS
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      captain_name TEXT,
      member_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 12. OFFICIALS (Pelatih: 307, Official/Mekanik: 161, Manajer: 86)
    CREATE TABLE IF NOT EXISTS officials (
      id TEXT PRIMARY KEY,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      role_type TEXT CHECK(role_type IN ('pelatih', 'official_mekanik', 'manajer', 'tenaga_pendukung')) NOT NULL,
      phone TEXT,
      license_number TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      deleted_at TEXT
    );

    -- 13. FIXTURES (Jadwal Pertandingan)
    CREATE TABLE IF NOT EXISTS fixtures (
      id TEXT PRIMARY KEY,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
      venue_id TEXT REFERENCES venues(id) ON DELETE SET NULL,
      post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
      match_code TEXT,
      stage TEXT,
      scheduled_time TEXT NOT NULL,
      opponent TEXT NOT NULL,
      athlete_or_team TEXT NOT NULL,
      status TEXT CHECK(status IN ('terjadwal', 'berlangsung', 'selesai', 'ditunda', 'dibatalkan')) DEFAULT 'terjadwal',
      delay_reason TEXT,
      source_update TEXT DEFAULT 'Panitia Pelaksana PORPROV XV',
      last_updated_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 14. RESULTS (Hasil Pertandingan)
    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      fixture_id TEXT UNIQUE NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
      score_bandung TEXT,
      score_opponent TEXT,
      outcome TEXT CHECK(outcome IN ('menang', 'kalah', 'seri', 'walkout', 'belum_ada')) DEFAULT 'belum_ada',
      summary TEXT,
      round_result TEXT,
      rank_obtained INTEGER,
      verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      is_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 15. MEDALS (Perolehan Medali)
    CREATE TABLE IF NOT EXISTS medals (
      id TEXT PRIMARY KEY,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
      fixture_id TEXT REFERENCES fixtures(id) ON DELETE SET NULL,
      medal_type TEXT CHECK(medal_type IN ('emas', 'perak', 'perunggu')) NOT NULL,
      athlete_or_team TEXT NOT NULL,
      awarded_date TEXT NOT NULL,
      source TEXT DEFAULT 'Panitia Resmi Pertandingan',
      is_verified INTEGER DEFAULT 0,
      verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      verified_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 16. DAILY_REPORTS (Laporan Harian Posko & Monev Lapangan)
    CREATE TABLE IF NOT EXISTS daily_reports (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sport_id TEXT REFERENCES sports(id) ON DELETE SET NULL,
      fixture_id TEXT REFERENCES fixtures(id) ON DELETE SET NULL,
      report_date TEXT NOT NULL,
      title TEXT NOT NULL,
      activity_summary TEXT NOT NULL,
      field_conditions TEXT,
      follow_up_action TEXT,
      status TEXT CHECK(status IN ('draft', 'terkirim', 'dievaluasi', 'selesai')) DEFAULT 'terkirim',
      photo_url TEXT,
      rating TEXT,
      findings TEXT,
      recommendation TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 17. ISSUES (Kendala di Posko & Lapangan)
    CREATE TABLE IF NOT EXISTS issues (
      id TEXT PRIMARY KEY,
      post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
      sport_id TEXT REFERENCES sports(id) ON DELETE SET NULL,
      daily_report_id TEXT REFERENCES daily_reports(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      category TEXT CHECK(category IN ('teknis_tanding', 'transportasi', 'penginapan_akomodasi', 'konsumsi', 'medis', 'perwasitan_protes', 'perlengkapan', 'lainnya')) DEFAULT 'lainnya',
      description TEXT NOT NULL,
      priority TEXT CHECK(priority IN ('rendah', 'sedang', 'tinggi', 'kritis')) DEFAULT 'sedang',
      status TEXT CHECK(status IN ('baru', 'diproses', 'menunggu', 'selesai')) DEFAULT 'baru',
      escalated_to_central INTEGER DEFAULT 0,
      reported_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
      resolution TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 18. ISSUE_UPDATES (Riwayat Tindak Lanjut Kendala)
    CREATE TABLE IF NOT EXISTS issue_updates (
      id TEXT PRIMARY KEY,
      issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action_taken TEXT NOT NULL,
      status_before TEXT,
      status_after TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 19. MEDICAL_CASES (Catatan Medis & Kesejahteraan Atlet - Akses Terbatas)
    CREATE TABLE IF NOT EXISTS medical_cases (
      id TEXT PRIMARY KEY,
      athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
      incident_type TEXT CHECK(incident_type IN ('cedera_tanding', 'penyakit_akut', 'kelelahan_dehidrasi', 'kondisi_psikis_stres', 'gangguan_nutrisi', 'lainnya')) NOT NULL,
      urgency_level TEXT CHECK(urgency_level IN ('rendah', 'sedang', 'tinggi', 'darurat')) NOT NULL,
      diagnosis_summary TEXT NOT NULL,
      treatment_given TEXT NOT NULL,
      hospital_referral TEXT,
      medic_officer_name TEXT NOT NULL,
      incident_time TEXT NOT NULL,
      status TEXT CHECK(status IN ('observasi', 'rawat_jalan', 'rawat_inap', 'pulih_siap_tanding', 'tidak_dapat_lanjut')) DEFAULT 'observasi',
      is_confidential INTEGER DEFAULT 1,
      created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 20. ACCOMMODATIONS (Penginapan Kontingen)
    CREATE TABLE IF NOT EXISTS accommodations (
      id TEXT PRIMARY KEY,
      region_id TEXT NOT NULL REFERENCES host_regions(id) ON DELETE CASCADE,
      post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
      hotel_name TEXT NOT NULL,
      address TEXT NOT NULL,
      total_capacity INTEGER DEFAULT 0,
      current_occupancy INTEGER DEFAULT 0,
      assigned_sports TEXT,
      pic_name TEXT,
      pic_phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 21. TRANSPORT_ASSIGNMENTS (Transportasi Operasional)
    CREATE TABLE IF NOT EXISTS transport_assignments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      sport_id TEXT REFERENCES sports(id) ON DELETE SET NULL,
      vehicle_type TEXT CHECK(vehicle_type IN ('bus_besar', 'hiace_elf', 'mobil_operasional', 'ambulans', 'pickup_logistik')) NOT NULL,
      plate_number TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      driver_phone TEXT NOT NULL,
      route_plan TEXT NOT NULL,
      departure_time TEXT,
      status TEXT CHECK(status IN ('standby', 'dalam_perjalanan', 'selesai', 'kendala_mogok_macet')) DEFAULT 'standby',
      issue_note TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 22. PROTESTS (Protes & Pelanggaran)
    CREATE TABLE IF NOT EXISTS protests (
      id TEXT PRIMARY KEY,
      fixture_id TEXT REFERENCES fixtures(id) ON DELETE SET NULL,
      sport_id TEXT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
      protest_type TEXT CHECK(protest_type IN ('teknis_perwasitan', 'keabsahan_atlet', 'disiplin_etika', 'administrasi_pertandingan')) NOT NULL,
      description TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_role TEXT,
      submission_time TEXT NOT NULL,
      fee_deposit_status TEXT CHECK(fee_deposit_status IN ('lunas', 'belum_lunas', 'bebas_biaya')) DEFAULT 'lunas',
      hearing_status TEXT CHECK(hearing_status IN ('diajukan', 'diproses_dewan_hakim', 'ditolak', 'dikabulkan_sebagian', 'dikabulkan_penuh')) DEFAULT 'diajukan',
      decision_summary TEXT,
      decided_at TEXT,
      is_confidential INTEGER DEFAULT 0,
      handled_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 23. ATTACHMENTS (Dokumentasi & Bukti)
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('daily_report', 'issue', 'medical_case', 'protest', 'fixture')),
      entity_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT,
      uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 24. AUDIT_LOGS (Audit Trail Sistem)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      username TEXT,
      role TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- 25. APP_SETTINGS (Pengaturan & Target Medali yang Perlu Verifikasi)
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      label TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      is_verified INTEGER DEFAULT 0,
      verified_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      verified_at TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- INDEXES for fast queries
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_fixtures_sport_time ON fixtures(sport_id, scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_fixtures_post_time ON fixtures(post_id, scheduled_time);
    CREATE INDEX IF NOT EXISTS idx_fixtures_status ON fixtures(status);
    CREATE INDEX IF NOT EXISTS idx_medals_sport ON medals(sport_id);
    CREATE INDEX IF NOT EXISTS idx_medals_type ON medals(medal_type);
    CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
    CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_medical_cases_urgency ON medical_cases(urgency_level);
  `);

  // Migration for daily_reports photo & monev columns
  try { db.exec('ALTER TABLE daily_reports ADD COLUMN photo_url TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE daily_reports ADD COLUMN rating TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE daily_reports ADD COLUMN findings TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE daily_reports ADD COLUMN recommendation TEXT'); } catch (e) {}

  // Ensure tim_monev role exists
  try {
    const hasMonev = db.prepare("SELECT id FROM roles WHERE id = 'tim_monev'").get();
    if (!hasMonev) {
      db.prepare('INSERT INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?)').run(
        'tim_monev',
        'Tim Monitoring & Evaluasi',
        'Melakukan inspeksi posko, penilaian kelayakan venue, dan dokumentasi foto kunjungan lapangan',
        '["view_all", "create_report", "manage_post"]'
      );
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('bandungjuara2026', salt);
      db.prepare(`
        INSERT OR IGNORE INTO users (id, username, email, password_hash, full_name, phone, assigned_post_id, status)
        VALUES ('usr_monev', 'monev', 'monev@koni-bandung.or.id', ?, 'Drs. H. Iwan Setiawan (Tim Monev Lapangan)', '0812-1000-0007', null, 'active')
      `).run(hash);
      db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run('usr_monev', 'tim_monev');
    }
  } catch (e) {}

  // Seed sample visit photos and ratings if not yet populated
  try {
    db.prepare(`UPDATE daily_reports SET photo_url = 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?w=800&auto=format&fit=crop&q=80', rating = 'Sangat Baik (A)', findings = 'Kesiapan venue GOR Patriot dan Asrama Haji prima', recommendation = 'Pertahankan koordinasi liaison officer' WHERE id = 'rep_1' AND (photo_url IS NULL OR photo_url = '')`).run();
    db.prepare(`UPDATE daily_reports SET photo_url = 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80', rating = 'Baik (B)', findings = 'Fasilitas House Tell memadai, pemulihan atlet terpantau tim medis', recommendation = 'Penyesuaian jadwal berangkat armada 30 menit lebih awal' WHERE id = 'rep_2' AND (photo_url IS NULL OR photo_url = '')`).run();
    db.prepare(`INSERT OR IGNORE INTO daily_reports (id, post_id, reporter_id, sport_id, fixture_id, report_date, title, activity_summary, field_conditions, follow_up_action, status, photo_url, rating, findings, recommendation) VALUES ('rep_3', 'post_bekasi', 'usr_posko_bekasi', 'sp_sepakbola', null, '2026-10-29', 'Inspeksi Lapangan Rumput Stadion Patriot Candrabhaga', 'Tim Monev bersama official sepak bola memeriksa kondisi lapangan utama dan ruang ganti.', 'Kondisi drainase dan rumput lapangan standar nasional sangat baik.', 'Penyediaan ruang fisioterapi portabel di dekat lorong atlet.', 'selesai', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80', 'Sangat Baik (A)', 'Fasilitas ruang ganti dan ruang medis stadion lengkap.', 'Siapkan armada cadangan untuk penjemputan tim.')`).run();
    db.prepare(`INSERT OR IGNORE INTO daily_reports (id, post_id, reporter_id, sport_id, fixture_id, report_date, title, activity_summary, field_conditions, follow_up_action, status, photo_url, rating, findings, recommendation) VALUES ('rep_4', 'post_bogor', 'usr_monev', 'sp_atletik', null, '2026-10-29', 'Monitoring Kesiapan Lintasan Lari Stadion Pakansari', 'Pengecekan lintasan tartan atletik nomor sprint 100m dan lompat jauh kontingen Kota Bandung.', 'Lintasan atletik sudah disertifikasi PASI Jabar, pencahayaan malam memadai.', 'Koordinasi tenda pemanasan resmi kontingen Kota Bandung di tribun timur.', 'selesai', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80', 'Sangat Baik (A)', 'Kesiapan fasilitas pemanasan atletik siap pakai.', 'Pastikan suplai ice bath dan fisioterapi standby.')`).run();
  } catch (e) {}

  // Seed default seed data if database is fresh
  seedInitialData();
}

function seedInitialData() {
  const roleCount = (db.prepare('SELECT COUNT(*) as count FROM roles').get() as { count: number }).count;
  if (roleCount > 0) return; // Already seeded

  console.log('Seeding initial relational database for KONI Kota Bandung PORPROV XV Jabar 2026...');

  const insertRole = db.prepare('INSERT INTO roles (id, name, description, permissions) VALUES (?, ?, ?, ?)');
  const rolesData = [
    ['admin', 'Admin Sistem', 'Mengelola pengguna, peran, master data, dan pengaturan sistem secara menyeluruh', '["all"]'],
    ['pengurus_pusat', 'Pengurus Pusat KONI', 'Melihat seluruh data, membuat keputusan, menugaskan tindak lanjut, dan mengakses laporan komprehensif', '["view_all", "make_decisions", "assign_tasks", "access_reports", "manage_protests"]'],
    ['koordinator_posko', 'Koordinator Posko', 'Mengelola laporan harian, kendala, logistik, dan aktivitas personel pada posko penugasannya', '["manage_post", "create_report", "manage_issues", "view_post_logistics"]'],
    ['tim_teknis', 'Tim Teknis Pertandingan', 'Mengelola jadwal, hasil pertandingan, dan informasi cabor sesuai penugasan', '["manage_fixtures", "record_results", "view_sports"]'],
    ['tim_medis', 'Tim Medis & Fisioterapi', 'Mengelola catatan medis, penanganan atlet cedera/sakit dengan hak akses terbatas dan rahasia', '["manage_medical", "view_athletes_medical"]'],
    ['viewer', 'Viewer / Pimpinan', 'Melihat ringkasan dashboard eksekutif dan laporan tanpa hak modifikasi data', '["view_dashboard", "view_reports"]']
  ];
  for (const r of rolesData) insertRole.run(r[0], r[1], r[2], r[3]);

  // Host Regions (12 Daerah Tuan Rumah)
  const insertRegion = db.prepare('INSERT INTO host_regions (id, name, code, is_primary, notes) VALUES (?, ?, ?, ?, ?)');
  const regions = [
    ['reg_bekasi_kota', 'Kota Bekasi', 'BKS-K', 1, 'Lokasi Pembukaan: 7 Nov 2026'],
    ['reg_bogor_kota', 'Kota Bogor', 'BGR-K', 1, 'Lokasi Penutupan: 20 Nov 2026'],
    ['reg_bandung_kota', 'Kota Bandung', 'BDG-K', 1, 'Home base Kontingen KONI Kota Bandung'],
    ['reg_depok_kota', 'Kota Depok', 'DPK-K', 0, 'Klaster Bersama Posko Bekasi'],
    ['reg_bekasi_kab', 'Kabupaten Bekasi', 'BKS-B', 0, 'Venue Cabor Akuatik & Menembak'],
    ['reg_bogor_kab', 'Kabupaten Bogor', 'BGR-B', 0, 'Venue Atletik & Paralayang'],
    ['reg_bandung_kab', 'Kabupaten Bandung', 'BDG-B', 0, 'Venue Si Jalak Harupat'],
    ['reg_bandung_barat', 'Kabupaten Bandung Barat', 'KBB', 0, 'Venue Panjat Tebing & Berkuda'],
    ['reg_cimahi_kota', 'Kota Cimahi', 'CMH-K', 0, 'Venue Menembak & Sepatu Roda'],
    ['reg_subang_kab', 'Kabupaten Subang', 'SBG-B', 0, 'Venue Balap Sepeda & Terbang Layang'],
    ['reg_ciamis_kab', 'Kabupaten Ciamis', 'CMS-B', 0, 'Venue BMX & Motocross'],
    ['reg_karawang_kab', 'Kabupaten Karawang', 'KRW-B', 0, 'Venue Dayung & Layar']
  ];
  for (const reg of regions) insertRegion.run(reg[0], reg[1], reg[2], reg[3], reg[4]);

  // Posko Kontingen (3 Posko Resmi yang dipaparkan)
  const insertPost = db.prepare('INSERT INTO posts (id, name, region_id, location_name, address, coordinator_name, contact_phone, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const postsData = [
    ['post_bekasi', 'Posko 1 (Kota Bekasi & Kota Depok)', 'reg_bekasi_kota', 'Asrama Haji', 'Jl. Kemakmuran No. 72, Margajaya, Kec. Bekasi Selatan, Kota Bekasi', 'Hendra Kurniawan, S.Pd', '0812-3456-7890', 'aktif', 'Melayani cabor wilayah Bekasi dan Depok'],
    ['post_bogor', 'Posko 2 (Kota Bogor & Sekitarnya)', 'reg_bogor_kota', 'House Tell', 'Jl. Pangrango No. 12, Babakan, Bogor Tengah, Kota Bogor', 'Ir. Rahmat Hidayat', '0813-8899-7711', 'aktif', 'Melayani cabor wilayah Bogor dan Sukabumi'],
    ['post_bandung', 'Posko 3 / Pusat (Kota Bandung)', 'reg_bandung_kota', 'Kantor KONI Kota Bandung', 'Jl. Pajajaran No. 37, Pasir Kaliki, Kec. Cicendo, Kota Bandung', 'Drs. H. Asep Suryana', '0811-2233-4455', 'aktif', 'Posko Komando Pusat & Pengendalian Operasional']
  ];
  for (const p of postsData) insertPost.run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8]);

  // Venues
  const insertVenue = db.prepare('INSERT INTO venues (id, region_id, name, address, capacity, contact_person, contact_phone) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const venuesData = [
    ['ven_patriot', 'reg_bekasi_kota', 'Stadion Patriot Candrabhaga', 'Jl. Ahmad Yani No. 2, Kota Bekasi', 30000, 'Wahyu Setiawan', '0812-9988-1122'],
    ['ven_gor_bekasi', 'reg_bekasi_kota', 'GOR Basket Patriot Bekasi', 'Kompleks Stadion Patriot, Kota Bekasi', 2500, 'Rizki Pratama', '0812-9988-3344'],
    ['ven_pajajaran_bogor', 'reg_bogor_kota', 'GOR Pajajaran Kota Bogor', 'Jl. Pemuda No. 4, Tanah Sareal, Kota Bogor', 3500, 'Bambang Irawan', '0815-4433-2211'],
    ['ven_pakansari', 'reg_bogor_kab', 'Stadion Pakansari Cibinong', 'Jl. Pakansari No. 1, Cibinong, Kab. Bogor', 31000, 'Agus Suparman', '0817-6655-4433'],
    ['ven_jalak_harupat', 'reg_bandung_kab', 'Stadion Si Jalak Harupat', 'Kutawaringin, Soreang, Kab. Bandung', 27000, 'Eman Sulaeman', '0813-2211-9988'],
    ['ven_arcamanik', 'reg_bandung_kota', 'Sport Jabar Arcamanik', 'Jl. Pacuan Kuda No. 140, Sukamiskin, Kota Bandung', 4000, 'Yudi Permana', '0812-7766-5544'],
    ['ven_kolam_upi', 'reg_bandung_kota', 'Kolam Renang FPOK UPI', 'Jl. Dr. Setiabudi No. 229, Kota Bandung', 1500, 'Dr. Roni Subagja', '0813-1122-3344']
  ];
  for (const v of venuesData) insertVenue.run(v[0], v[1], v[2], v[3], v[4], v[5], v[6]);

  // Users & Demo Accounts
  // Password hash for 'bandungjuara2026'
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('bandungjuara2026', salt);

  const insertUser = db.prepare('INSERT INTO users (id, username, email, password_hash, full_name, phone, assigned_post_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const insertUserRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');

  const demoUsers = [
    ['usr_admin', 'admin', 'admin@koni-bandung.or.id', 'Kang Dedi Supriatna', '0812-1000-0001', null, 'admin'],
    ['usr_pengurus', 'pengurus', 'pengurus@koni-bandung.or.id', 'Dr. H. Ahmad Fauzi (Ketua Harian / Komandan Kontingen)', '0812-1000-0002', 'post_bandung', 'pengurus_pusat'],
    ['usr_posko_bekasi', 'posko_bekasi', 'posko.bekasi@koni-bandung.or.id', 'Hendra Kurniawan, S.Pd (Koordinator Posko 1)', '0812-1000-0003', 'post_bekasi', 'koordinator_posko'],
    ['usr_teknis', 'teknis', 'teknis@koni-bandung.or.id', 'Budi Santoso, M.Or (Bidang Binpres & Pertandingan)', '0812-1000-0004', null, 'tim_teknis'],
    ['usr_medis', 'medis', 'medis@koni-bandung.or.id', 'dr. Rina Safitri, Sp.KO (Koordinator Medis)', '0812-1000-0005', null, 'tim_medis'],
    ['usr_viewer', 'pimpinan', 'pimpinan@koni-bandung.or.id', 'H. Nuryadi, S.Pd (Ketua Umum KONI Kota Bandung)', '0812-1000-0006', null, 'viewer']
  ];

  for (const u of demoUsers) {
    insertUser.run(u[0], u[1], u[2], passwordHash, u[3], u[4], u[5], 'active');
    insertUserRole.run(u[0], u[6]);
  }

  // App Settings (including 171 & 76 target verification and contingency totals)
  const insertSetting = db.prepare('INSERT INTO app_settings (key, value, label, category, description, is_verified, verified_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const settingsData = [
    ['event_name', 'PORPROV XV Jawa Barat 2026', 'Nama Kegiatan', 'Umum', 'Pekan Olahraga Provinsi Jawa Barat ke-XV Tahun 2026', 1, 'usr_admin'],
    ['event_dates', '28 Oktober – 20 November 2026', 'Jadwal Pelaksanaan', 'Umum', 'Periode keseluruhan penyelenggaraan pertandingan', 1, 'usr_admin'],
    ['opening_ceremony', '7 November 2026 di Kota Bekasi', 'Upacara Pembukaan', 'Umum', 'Pembukaan resmi PORPROV XV Jabar di Stadion Patriot Candrabhaga Kota Bekasi', 1, 'usr_admin'],
    ['closing_ceremony', '20 November 2026 di Kota Bogor', 'Upacara Penutupan', 'Umum', 'Penutupan resmi PORPROV XV Jabar di Kota Bogor', 1, 'usr_admin'],
    ['total_sports', '78', 'Total Cabang Olahraga', 'Kontingen', 'Jumlah cabang olahraga kontingen KONI Kota Bandung yang terdaftar', 1, 'usr_admin'],
    ['total_events_joined', '911', 'Nomor Pertandingan Diikuti', 'Kontingen', 'Nomor pertandingan yang diikuti kontingen Kota Bandung dari total 1.156 nomor', 1, 'usr_admin'],
    ['total_events_all', '1156', 'Total Nomor Keseluruhan PORPROV', 'Kontingen', 'Jumlah nomor pertandingan keseluruhan PORPROV XV Jawa Barat', 1, 'usr_admin'],
    ['total_athletes', '1366', 'Jumlah Atlet', 'Kontingen', 'Total atlet kontingen Kota Bandung yang didaftarkan', 1, 'usr_admin'],
    ['total_coaches', '307', 'Jumlah Pelatih', 'Kontingen', 'Total pelatih terdaftar kontingen Kota Bandung', 1, 'usr_admin'],
    ['total_officials', '161', 'Jumlah Official/Mekanik', 'Kontingen', 'Total official dan mekanik cabor', 1, 'usr_admin'],
    ['total_managers', '86', 'Jumlah Manajer Cabor', 'Kontingen', 'Total manajer tim cabang olahraga', 1, 'usr_admin'],
    ['total_contingent', '1920', 'Total Kontingen Keseluruhan', 'Kontingen', 'Jumlah keseluruhan kontingen Kota Bandung (atlet + pelatih + official + manajer)', 1, 'usr_admin'],
    // TARGET MEDALI 171 & 76 DENGAN VERIFIKASI ADMIN:
    ['target_medal_primary', '171', 'Target/Potensi Medali Primer (Angka Paparan: 171)', 'Target Medali', 'Catatan Konteks: Angka 171 tercantum dalam paparan tanpa penjelasan definitif. Perlu verifikasi admin apakah angka ini adalah Target Medali Emas atau Target Keseluruhan.', 0, null],
    ['target_medal_secondary', '76', 'Target/Potensi Medali Sekunder (Angka Paparan: 76)', 'Target Medali', 'Catatan Konteks: Angka 76 tercantum dalam paparan tanpa penjelasan definitif. Perlu verifikasi admin apakah angka ini adalah Target Medali Perak atau Potensi Kategori Tertentu.', 0, null],
    ['target_medal_bronze_est', '95', 'Estimasi Target Perunggu', 'Target Medali', 'Proyeksi medali perunggu kontingen Kota Bandung', 0, null],
    ['contingent_status_notes', 'Data rincian kontingen sedang dalam proses finalisasi SK Kontingen dan verifikasi keabsahan atlet oleh panitia.', 'Catatan Kelengkapan Data', 'Umum', 'Penanda status kelengkapan data operasional', 1, 'usr_admin']
  ];
  for (const s of settingsData) insertSetting.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6]);

  // Personnel for Posts
  const insertPersonnel = db.prepare('INSERT INTO post_personnel (id, post_id, full_name, division, position, phone, notes, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const personnelData = [
    ['psn_1', 'post_bekasi', 'Hendra Kurniawan, S.Pd', 'Pengawasan & Pengendalian', 'Koordinator Posko', '0812-3456-7890', 'Penanggung jawab posko 1', 1],
    ['psn_2', 'post_bekasi', 'Dani Ramdani, S.Kom', 'Monitoring Pertandingan', 'Petugas Monitoring Lapangan', '0812-3456-7891', 'Piket jadwal & update skor', 1],
    ['psn_3', 'post_bekasi', 'dr. Fajar Nugraha', 'Medis', 'Dokter Posko Bekasi', '0812-3456-7892', 'Siaga ambulans & faskes', 1],
    ['psn_4', 'post_bekasi', 'Agus Supriatna', 'Akomodasi & Transportasi', 'Koordinator Transportasi', '0812-3456-7893', 'Armada Asrama Haji', 1],
    ['psn_5', 'post_bogor', 'Ir. Rahmat Hidayat', 'Pengawasan & Pengendalian', 'Koordinator Posko', '0813-8899-7711', 'Penanggung jawab posko 2', 1],
    ['psn_6', 'post_bogor', 'Siti Maryam, S.Pd', 'Monitoring Pertandingan', 'Petugas Monitoring Lapangan', '0813-8899-7712', 'Piket atletik & bela diri', 1],
    ['psn_7', 'post_bogor', 'Ners. Riki Ridwan', 'Medis', 'Perawat Siaga', '0813-8899-7713', 'Posko House Tell', 1],
    ['psn_8', 'post_bandung', 'Drs. H. Asep Suryana', 'Pengawasan & Pengendalian', 'Koordinator Posko Komando', '0811-2233-4455', 'Pusat komando Pajajaran', 1],
    ['psn_9', 'post_bandung', 'Dedi Kusnadi, SH', 'Protes & Hukum', 'Advokasi Hukum & Protes', '0811-2233-4456', 'Penanganan sengketa & protes', 1]
  ];
  for (const p of personnelData) insertPersonnel.run(p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);

  // Representative Cabor (78 Cabor representation with rich key examples)
  const insertSport = db.prepare('INSERT INTO sports (id, code, name, category, total_events, joined_events, target_gold, target_silver, target_bronze, target_verified, target_notes, primary_venue_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const sportsData = [
    ['sp_bulutangkis', 'BDM', 'Bulutangkis', 'Permainan', 7, 7, 4, 2, 1, 1, 'Target unggulan emas beregu dan tunggal putra', 'ven_gor_bekasi'],
    ['sp_atletik', 'ATL', 'Atletik', 'Terukur', 46, 38, 8, 5, 4, 1, 'Target lari sprint 100m, 200m, dan lompat jauh', 'ven_pakansari'],
    ['sp_renang', 'AQ-SW', 'Renang', 'Terukur', 36, 30, 9, 6, 5, 1, 'Unggulan gaya bebas dan dada putra-putri', 'ven_kolam_upi'],
    ['sp_taekwondo', 'TKW', 'Taekwondo', 'Bela Diri', 21, 19, 5, 3, 2, 0, 'Kyorugi kelas ringan berpeluang emas', 'ven_pajajaran_bogor'],
    ['sp_pencak_silat', 'PSL', 'Pencak Silat', 'Bela Diri', 22, 20, 6, 4, 3, 1, 'Target dominasi kelas tanding dan seni', 'ven_pajajaran_bogor'],
    ['sp_karate', 'KRT', 'Karate', 'Bela Diri', 17, 16, 4, 3, 2, 0, 'Kata beregu dan kumite -67kg', 'ven_pajajaran_bogor'],
    ['sp_sepakbola', 'FBL', 'Sepak Bola', 'Permainan', 2, 2, 1, 1, 0, 1, 'Target finalis tim putra dan putri', 'ven_patriot'],
    ['sp_futsal', 'FTS', 'Futsal', 'Permainan', 2, 2, 1, 0, 1, 1, 'Target emas tim putra', 'ven_gor_bekasi'],
    ['sp_bola_basket', 'BSK', 'Bola Basket (5x5 & 3x3)', 'Permainan', 4, 4, 2, 1, 1, 1, 'Target medali 5x5 putra dan 3x3 putri', 'ven_gor_bekasi'],
    ['sp_bola_voli', 'VLY', 'Bola Voli (Indoor & Pasir)', 'Permainan', 4, 4, 2, 1, 0, 0, 'Tim indoor putri target emas', 'ven_jalak_harupat'],
    ['sp_panahan', 'ARC', 'Panahan', 'Akurasi', 18, 16, 5, 3, 2, 1, 'Nomor recurve dan compound', 'ven_arcamanik'],
    ['sp_menembak', 'SHT', 'Menembak', 'Akurasi', 32, 25, 6, 4, 3, 0, 'Air pistol dan rifle 10m', 'ven_arcamanik'],
    ['sp_panjat_tebing', 'CLB', 'Panjat Tebing', 'Terukur', 16, 14, 4, 2, 2, 1, 'Speed record dan lead putra', 'ven_arcamanik'],
    ['sp_catur', 'CHS', 'Catur', 'Konsentrasi', 18, 15, 3, 2, 2, 0, 'Nomor catur cepat dan kilat', 'ven_arcamanik'],
    ['sp_judo', 'JUD', 'Judo', 'Bela Diri', 18, 16, 4, 2, 3, 0, 'Kelas -66kg dan -73kg', 'ven_pajajaran_bogor'],
    ['sp_gulat', 'WRS', 'Gulat', 'Bela Diri', 18, 15, 3, 3, 2, 0, 'Gaya bebas dan greco-roman', 'ven_pajajaran_bogor'],
    ['sp_senam', 'GYM', 'Senam (Artistik & Ritmik)', 'Terukur', 20, 17, 4, 3, 2, 1, 'Artistik putri berpeluang emas', 'ven_arcamanik'],
    ['sp_dayung', 'ROW', 'Dayung (Rowing, Canoeing, TBR)', 'Terukur', 34, 28, 6, 5, 4, 0, 'Dragon boat & kayak putri', 'ven_arcamanik'],
    ['sp_sepatu_roda', 'RLS', 'Sepatu Roda', 'Terukur', 22, 18, 5, 3, 2, 1, 'Speed skating 500m dan relay', 'ven_arcamanik'],
    ['sp_esports', 'ESP', 'Esports', 'Konsentrasi', 8, 8, 3, 2, 1, 0, 'Mobile Legends & PUBG Mobile', 'ven_gor_bekasi']
  ];
  for (const s of sportsData) insertSport.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6], s[7], s[8], s[9], s[10], s[11]);

  // Events (Sample followed events)
  const insertEvent = db.prepare('INSERT INTO events (id, sport_id, name, gender, is_followed, potential_medal, potential_verified) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const eventsData = [
    ['ev_bdm_ms', 'sp_bulutangkis', 'Tunggal Putra', 'putra', 1, 'emas', 1],
    ['ev_bdm_ws', 'sp_bulutangkis', 'Tunggal Putri', 'putri', 1, 'perak', 1],
    ['ev_bdm_md', 'sp_bulutangkis', 'Ganda Putra', 'putra', 1, 'emas', 1],
    ['ev_atl_100m', 'sp_atletik', 'Lari 100 Meter Putra', 'putra', 1, 'emas', 1],
    ['ev_atl_200m', 'sp_atletik', 'Lari 200 Meter Putri', 'putri', 1, 'emas', 1],
    ['ev_atl_lj', 'sp_atletik', 'Lompat Jauh Putra', 'putra', 1, 'perak', 0],
    ['ev_aq_50m_free', 'sp_renang', '50m Gaya Bebas Putra', 'putra', 1, 'emas', 1],
    ['ev_aq_100m_breast', 'sp_renang', '100m Gaya Dada Putri', 'putri', 1, 'emas', 1],
    ['ev_tkw_k58', 'sp_taekwondo', 'Kyorugi Under 58kg Putra', 'putra', 1, 'emas', 0],
    ['ev_psl_tanding_c', 'sp_pencak_silat', 'Tanding Kelas C Putra (55-60kg)', 'putra', 1, 'emas', 1],
    ['ev_fbl_putra', 'sp_sepakbola', 'Beregu Sepak Bola Putra', 'putra', 1, 'emas', 1]
  ];
  for (const ev of eventsData) insertEvent.run(ev[0], ev[1], ev[2], ev[3], ev[4], ev[5], ev[6]);

  // Sample Athletes
  const insertAthlete = db.prepare('INSERT INTO athletes (id, registration_number, sport_id, full_name, nickname, gender, birth_date, blood_type, phone, status, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const athletesData = [
    ['ath_1', 'BDG-2026-BDM-001', 'sp_bulutangkis', 'Muhammad Farhan Ramadhan', 'Farhan', 'L', '2003-05-14', 'O', '0812-4455-6677', 'siap_tanding', 1],
    ['ath_2', 'BDG-2026-BDM-002', 'sp_bulutangkis', 'Syifa Nurul Aulia', 'Syifa', 'P', '2004-09-21', 'A', '0812-4455-6678', 'siap_tanding', 1],
    ['ath_3', 'BDG-2026-ATL-015', 'sp_atletik', 'Rian Hidayatulloh', 'Rian', 'L', '2002-11-03', 'B', '0813-2233-4411', 'siap_tanding', 1],
    ['ath_4', 'BDG-2026-AQ-008', 'sp_renang', 'Dimas Arya Pratama', 'Dimas', 'L', '2005-02-17', 'AB', '0813-2233-4422', 'siap_tanding', 1],
    ['ath_5', 'BDG-2026-TKW-004', 'sp_taekwondo', 'Faisal Abdul Aziz', 'Aziz', 'L', '2003-08-30', 'O', '0813-2233-4433', 'siap_tanding', 1],
    ['ath_6', 'BDG-2026-PSL-011', 'sp_pencak_silat', 'Ahmad Dani Saputra', 'Dani', 'L', '2001-04-12', 'A', '0813-2233-4444', 'siap_tanding', 1],
    ['ath_7', 'BDG-2026-FBL-009', 'sp_sepakbola', 'Bagus Kahfi Pratama', 'Bagus', 'L', '2002-01-16', 'B', '0813-2233-4455', 'siap_tanding', 1]
  ];
  for (const a of athletesData) insertAthlete.run(a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10]);

  // Sample Officials (Pelatih, Official/Mekanik, Manajer)
  const insertOfficial = db.prepare('INSERT INTO officials (id, sport_id, full_name, role_type, phone, license_number, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const officialsData = [
    ['off_1', 'sp_bulutangkis', 'Hariyanto, S.Pd', 'pelatih', '0812-3344-5566', 'PBSI-LT-A-042', 'Pelatih Kepala Bulutangkis'],
    ['off_2', 'sp_bulutangkis', 'Ir. H. Gunawan', 'manajer', '0811-9988-7766', 'KONI-MGR-014', 'Manajer Tim Bulutangkis'],
    ['off_3', 'sp_atletik', 'Samsul Arifin, M.Pd', 'pelatih', '0813-5566-7788', 'PASI-LT-018', 'Pelatih Lari Jarak Pendek'],
    ['off_4', 'sp_sepakbola', 'Yudi Guntara', 'pelatih', '0812-9900-1122', 'PSSI-LIC-B', 'Pelatih Kepala Sepak Bola'],
    ['off_5', 'sp_renang', 'Wahyu Hidayat', 'official_mekanik', '0813-7788-9900', 'PRSI-TEK-009', 'Teknis & Analis Gerak'],
    ['off_6', 'sp_pencak_silat', 'Drs. Encep Sujana', 'manajer', '0812-4455-9988', 'IPSI-MGR-007', 'Manajer Tim Pencak Silat']
  ];
  for (const o of officialsData) insertOfficial.run(o[0], o[1], o[2], o[3], o[4], o[5], o[6]);

  // Sample Fixtures (Jadwal Pertandingan)
  const insertFixture = db.prepare('INSERT INTO fixtures (id, sport_id, event_id, venue_id, post_id, match_code, stage, scheduled_time, opponent, athlete_or_team, status, delay_reason, source_update, last_updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const fixturesData = [
    ['fix_1', 'sp_bulutangkis', 'ev_bdm_ms', 'ven_gor_bekasi', 'post_bekasi', 'BDM-MS-R16', 'Babak 16 Besar', '2026-10-29 10:00:00', 'Kota Bekasi (Tuan Rumah)', 'Muhammad Farhan Ramadhan', 'selesai', null, 'Panitia Pertandingan PBSI Jabar', 'usr_teknis'],
    ['fix_2', 'sp_bulutangkis', 'ev_bdm_ws', 'ven_gor_bekasi', 'post_bekasi', 'BDM-WS-QF', 'Perempat Final', '2026-10-29 14:30:00', 'Kab. Bogor', 'Syifa Nurul Aulia', 'berlangsung', null, 'Wasit Utama Pertandingan', 'usr_teknis'],
    ['fix_3', 'sp_atletik', 'ev_atl_100m', 'ven_pakansari', 'post_bogor', 'ATL-100-FIN', 'Final Perebutan Emas', '2026-10-29 16:00:00', 'Kab. Ciamis & Kota Depok', 'Rian Hidayatulloh', 'terjadwal', null, 'Technical Delegate PASI', 'usr_teknis'],
    ['fix_4', 'sp_renang', 'ev_aq_50m_free', 'ven_kolam_upi', 'post_bandung', 'AQ-50F-FIN', 'Final', '2026-10-29 09:00:00', 'Kab. Bekasi', 'Dimas Arya Pratama', 'selesai', null, 'Official Timing PRSI', 'usr_teknis'],
    ['fix_5', 'sp_sepakbola', 'ev_fbl_putra', 'ven_patriot', 'post_bekasi', 'FBL-GRP-M1', 'Fase Grup Matchday 1', '2026-10-30 15:30:00', 'Kab. Bandung', 'Tim Sepak Bola Putra Kota Bandung', 'terjadwal', null, 'Panpel Cabor Sepakbola', 'usr_teknis'],
    ['fix_6', 'sp_taekwondo', 'ev_tkw_k58', 'ven_pajajaran_bogor', 'post_bogor', 'TKW-58-SF', 'Semi Final', '2026-10-29 11:30:00', 'Kab. Subang', 'Faisal Abdul Aziz', 'selesai', null, 'Dewan Wasit TI Jabar', 'usr_teknis']
  ];
  for (const f of fixturesData) insertFixture.run(f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8], f[9], f[10], f[11], f[12], f[13]);

  // Results for finished fixtures
  const insertResult = db.prepare('INSERT INTO results (id, fixture_id, score_bandung, score_opponent, outcome, summary, round_result, rank_obtained, verified_by, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const resultsData = [
    ['res_1', 'fix_1', '21-17, 21-14', '17-21, 14-21', 'menang', 'Menang straight game 2-0 melawan atlet tuan rumah Kota Bekasi, melaju ke Perempat Final', '2-0', 1, 'usr_teknis', 1],
    ['res_4', 'fix_4', '22.84 detik', '23.15 detik', 'menang', 'Meraih catatan waktu terbaik 22.84 detik, mengamankan Medali Emas pertama untuk Kota Bandung', 'Medali Emas', 1, 'usr_teknis', 1],
    ['res_6', 'fix_6', '2-1 (R1: 8-6, R2: 4-7, R3: 11-5)', '1-2', 'menang', 'Kemenangan dramatis ronde ke-3, lolos ke Babak Final', '2-1', 1, 'usr_teknis', 1]
  ];
  for (const r of resultsData) insertResult.run(r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9]);

  // Medals Won
  const insertMedal = db.prepare('INSERT INTO medals (id, sport_id, event_id, fixture_id, medal_type, athlete_or_team, awarded_date, source, is_verified, verified_by, verified_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const medalsData = [
    ['med_1', 'sp_renang', 'ev_aq_50m_free', 'fix_4', 'emas', 'Dimas Arya Pratama', '2026-10-29', 'Panitia Resmi Pertandingan', 1, 'usr_admin', '2026-10-29 10:15:00', 'Medali Emas Pertama Kontingen Kota Bandung - Gaya Bebas 50m Putra'],
    ['med_2', 'sp_atletik', 'ev_atl_200m', null, 'emas', 'Tim Putri Atletik', '2026-10-28', 'Panitia Resmi Pertandingan', 1, 'usr_admin', '2026-10-28 17:30:00', 'Lari 200m Putri - Hasil Resmi Panpel'],
    ['med_3', 'sp_taekwondo', 'ev_tkw_k58', null, 'perak', 'Siti Rahmawati', '2026-10-28', 'Panitia Resmi Pertandingan', 1, 'usr_admin', '2026-10-28 16:00:00', 'Kyorugi Putri Kelas Ringan'],
    ['med_4', 'sp_karate', null, null, 'perunggu', 'Rangga Wijaya', '2026-10-28', 'Laporan Posko Bogor', 0, null, null, 'Belum diverifikasi lembar resmi TD Karate']
  ];
  for (const m of medalsData) insertMedal.run(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7], m[8], m[9], m[10], m[11]);

  // Daily Reports
  const insertReport = db.prepare('INSERT INTO daily_reports (id, post_id, reporter_id, sport_id, fixture_id, report_date, title, activity_summary, field_conditions, follow_up_action, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const reportsData = [
    ['rep_1', 'post_bekasi', 'usr_posko_bekasi', 'sp_bulutangkis', 'fix_1', '2026-10-29', 'Laporan Monitoring Cabor Bulutangkis di GOR Patriot Bekasi', 'Seluruh kontingen bulutangkis tiba tepat waktu di venue. Atlet Farhan memenangkan pertandingan babak 16 besar dengan kondisi prima.', 'Kondisi AC venue sempat kurang dingin di pagi hari namun telah dikeluhkan ke panpel dan diperbaiki.', 'Tetap berkoordinasi dengan liaison officer untuk match sore hari.', 'terkirim'],
    ['rep_2', 'post_bogor', 'usr_pengurus', 'sp_taekwondo', 'fix_6', '2026-10-29', 'Monitoring Hari Pertama Posko 2 Bogor (House Tell)', 'Koordinasi penempatan atlet taekwondo dan atletik. Dapur umum dan logistik vitamin berjalan lancar. Satu atlet mengalami kram ringan dan telah ditangani tim fisioterapi posko.', 'Lalu lintas sekitar venue GOR Pajajaran cukup padat menjelang siang.', 'Diberlakukan penjemputan armada 30 menit lebih awal untuk pertandingan berikutnya.', 'terkirim']
  ];
  for (const dr of reportsData) insertReport.run(dr[0], dr[1], dr[2], dr[3], dr[4], dr[5], dr[6], dr[7], dr[8], dr[9], dr[10]);

  // Issues (Kendala)
  const insertIssue = db.prepare('INSERT INTO issues (id, post_id, sport_id, daily_report_id, title, category, description, priority, status, escalated_to_central, reported_by, assigned_to, resolution, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const issuesData = [
    ['iss_1', 'post_bekasi', 'sp_bulutangkis', 'rep_1', 'Keterlambatan armada penjemputan atlet dari Asrama Haji ke Venue', 'transportasi', 'Bus operasional terhambat kemacetan di pintu tol Bekasi Timur selama 35 menit sehingga atlet terlambat pemanasan.', 'tinggi', 'diproses', 1, 'usr_posko_bekasi', 'usr_pengurus', 'Diatur pengawalan rute alternatif dan jadwal berangkat dimajukan 45 menit.', null],
    ['iss_2', 'post_bogor', 'sp_taekwondo', null, 'Kekurangan es batu medis untuk terapi recovery cedera di Posko House Tell', 'medis', 'Stok ice pack habis karena kebutuhan penanganan kram dan memar atlet cabor bela diri meningkat.', 'sedang', 'baru', 0, 'usr_medis', 'usr_posko_bekasi', null, null],
    ['iss_3', 'post_bandung', 'sp_sepakbola', null, 'Permintaan tambahan suplemen energi & elektrolit atlet', 'konsumsi', 'Manajer tim sepak bola mengajukan 5 boks elektrolit isotonik tambahan untuk laga fase grup.', 'rendah', 'selesai', 0, 'usr_teknis', 'usr_pengurus', 'Telah disalurkan dari gudang logistik KONI Pajajaran sebanyak 6 boks.', '2026-10-28 20:00:00']
  ];
  for (const i of issuesData) insertIssue.run(i[0], i[1], i[2], i[3], i[4], i[5], i[6], i[7], i[8], i[9], i[10], i[11], i[12], i[13]);

  // Issue Updates
  const insertIssueUpdate = db.prepare('INSERT INTO issue_updates (id, issue_id, user_id, action_taken, status_before, status_after, notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertIssueUpdate.run('isu_1', 'iss_1', 'usr_pengurus', 'Eskalasi ke Koordinator Transportasi Pusat untuk penambahan 1 unit armada cadangan HiAce', 'baru', 'diproses', 'Armada cadangan standby di Asrama Haji mulai pukul 12:00');

  // Medical Cases (Akses Terbatas - Kesejahteraan Atlet)
  const insertMedical = db.prepare('INSERT INTO medical_cases (id, athlete_id, sport_id, post_id, incident_type, urgency_level, diagnosis_summary, treatment_given, hospital_referral, medic_officer_name, incident_time, status, is_confidential, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const medicalData = [
    ['medc_1', 'ath_5', 'sp_taekwondo', 'post_bogor', 'cedera_tanding', 'sedang', 'Sprain ligamen pergelangan kaki kanan derajat 1 pasca semi final', 'Kompres RICE (Rest, Ice, Compression, Elevation), tapping ankle & analgetik topikal', 'Klinik Kontingen House Tell (observasi)', 'dr. Rina Safitri, Sp.KO', '2026-10-29 12:15:00', 'observasi', 1, 'usr_medis'],
    ['medc_2', 'ath_3', 'sp_atletik', 'post_bogor', 'kelelahan_dehidrasi', 'rendah', 'Kram otot hamstring bilateral pasca latihan adaptasi cuaca', 'Massage fisioterapi, rehidrasi larutan elektrolit oral, peregangan pasif', null, 'Ners. Riki Ridwan', '2026-10-28 18:30:00', 'pulih_siap_tanding', 1, 'usr_medis'],
    ['medc_3', 'ath_7', 'sp_sepakbola', 'post_bekasi', 'penyakit_akut', 'sedang', 'Febris (demam 38.5C) disertai faringitis akut', 'Antipiretik Paracetamol 500mg, multivitamin, istirahat isolasi kamar terpisah', 'Rujukan siaga: RSUD Kota Bekasi', 'dr. Fajar Nugraha', '2026-10-29 08:00:00', 'rawat_jalan', 1, 'usr_medis']
  ];
  for (const mc of medicalData) insertMedical.run(mc[0], mc[1], mc[2], mc[3], mc[4], mc[5], mc[6], mc[7], mc[8], mc[9], mc[10], mc[11], mc[12], mc[13]);

  // Accommodations (Penginapan)
  const insertAcc = db.prepare('INSERT INTO accommodations (id, region_id, post_id, hotel_name, address, total_capacity, current_occupancy, assigned_sports, pic_name, pic_phone, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const accData = [
    ['acc_1', 'reg_bekasi_kota', 'post_bekasi', 'Asrama Haji Kota Bekasi (Gedung Mina & Madinah)', 'Jl. Kemakmuran No. 72, Kota Bekasi', 350, 280, 'Bulutangkis, Sepak Bola, Futsal, Bola Basket', 'Agus Supriatna', '0812-3456-7893', 'Posko Kontingen Bekasi berpusat di lobi utama Gedung Mina'],
    ['acc_2', 'reg_bogor_kota', 'post_bogor', 'House Tell Bogor', 'Jl. Pangrango No. 12, Kota Bogor', 220, 195, 'Atletik, Taekwondo, Pencak Silat, Karate', 'Ir. Rahmat Hidayat', '0813-8899-7711', 'Dekat dengan GOR Pajajaran Bogor'],
    ['acc_3', 'reg_bandung_kota', 'post_bandung', 'Wisma Atlet Pajajaran & Hotel Naripan', 'Jl. Pajajaran No. 37, Kota Bandung', 400, 310, 'Renang, Senam, Panahan, Panjat Tebing', 'Drs. H. Asep Suryana', '0811-2233-4455', 'Homebase atlet cabor klaster Bandung Raya']
  ];
  for (const ac of accData) insertAcc.run(ac[0], ac[1], ac[2], ac[3], ac[4], ac[5], ac[6], ac[7], ac[8], ac[9], ac[10]);

  // Transport Assignments
  const insertTrans = db.prepare('INSERT INTO transport_assignments (id, post_id, sport_id, vehicle_type, plate_number, driver_name, driver_phone, route_plan, departure_time, status, issue_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const transData = [
    ['tr_1', 'post_bekasi', 'sp_bulutangkis', 'hiace_elf', 'D 7101 BDG', 'Asep Suhendar', '0812-1111-2222', 'Asrama Haji Bekasi -> GOR Basket Patriot Bekasi', '2026-10-29 08:30:00', 'selesai', null],
    ['tr_2', 'post_bekasi', 'sp_sepakbola', 'bus_besar', 'D 7999 KNI', 'Ujang Mulyana', '0812-3333-4444', 'Asrama Haji Bekasi -> Stadion Patriot Candrabhaga', '2026-10-30 13:00:00', 'standby', null],
    ['tr_3', 'post_bogor', null, 'ambulans', 'D 9119 MED', 'Dadang Kosasih', '0812-5555-6666', 'Siaga Emergency Posko 2 House Tell - GOR Pajajaran', '2026-10-29 07:00:00', 'dalam_perjalanan', 'Patroli berkala ke venue bela diri'],
    ['tr_4', 'post_bekasi', null, 'mobil_operasional', 'D 1234 ABC', 'Iwan Setiawan', '0812-7777-8888', 'Logistik Suplemen & Makanan Asrama Haji', '2026-10-29 11:00:00', 'standby', null]
  ];
  for (const tr of transData) insertTrans.run(tr[0], tr[1], tr[2], tr[3], tr[4], tr[5], tr[6], tr[7], tr[8], tr[9], tr[10]);

  // Protests
  const insertProtest = db.prepare('INSERT INTO protests (id, fixture_id, sport_id, protest_type, description, reporter_name, reporter_role, submission_time, fee_deposit_status, hearing_status, decision_summary, decided_at, is_confidential, handled_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const protestsData = [
    ['prt_1', 'fix_1', 'sp_bulutangkis', 'teknis_perwasitan', 'Keberatan atas keputusan hakim garis set ke-1 poin 18-17 yang menganulir smash masuk', 'Ir. H. Gunawan', 'Manajer Tim Bulutangkis', '2026-10-29 10:45:00', 'lunas', 'diproses_dewan_hakim', 'Sedang ditinjau rekaman video review resmi bersama referee PBSI Jabar', null, 0, 'usr_pengurus'],
    ['prt_2', null, 'sp_karate', 'keabsahan_atlet', 'Dugaan mutasi atlet tidak sah kontingen lawan nomor kumite -67kg', 'Drs. Encep Sujana', 'Manajer Cabor', '2026-10-28 14:00:00', 'lunas', 'diajukan', 'Berkas mutasi atlet sedang diverifikasi oleh Tim Keabsahan KONI Jabar', null, 1, 'usr_admin']
  ];
  for (const pr of protestsData) insertProtest.run(pr[0], pr[1], pr[2], pr[3], pr[4], pr[5], pr[6], pr[7], pr[8], pr[9], pr[10], pr[11], pr[12], pr[13]);

  // Audit Logs
  const insertAudit = db.prepare('INSERT INTO audit_logs (user_id, username, role, action, module, record_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertAudit.run('usr_admin', 'admin', 'admin', 'INIT_SYSTEM', 'Sistem', 'sys_root', 'Inisialisasi sistem database relasional KONI Kota Bandung PORPROV XV Jabar 2026', '127.0.0.1');
  insertAudit.run('usr_teknis', 'teknis', 'tim_teknis', 'VERIFY', 'Medali', 'med_1', 'Verifikasi perolehan Medali Emas Renang 50m Gaya Bebas Putra', '127.0.0.1');
  insertAudit.run('usr_posko_bekasi', 'posko_bekasi', 'koordinator_posko', 'CREATE', 'Laporan Harian', 'rep_1', 'Pengiriman laporan harian posko 1 Asrama Haji Bekasi', '127.0.0.1');

  console.log('Database initialization & seeding completed successfully.');
}
