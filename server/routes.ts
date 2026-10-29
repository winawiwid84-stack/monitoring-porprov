import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';
import { authMiddleware, optionalAuth, requireRole, generateToken, logAudit, AuthRequest } from './auth.js';

export const router = Router();

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan kata sandi wajib diisi.' });
  }

  const user = db.prepare(`
    SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.assigned_post_id, u.status,
           ur.role_id as role
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    WHERE u.username = ? OR u.email = ?
  `).get(username, username) as any;

  if (!user || user.status !== 'active') {
    return res.status(401).json({ error: 'Username/kata sandi salah atau akun nonaktif.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Username atau kata sandi tidak cocok.' });
  }

  const token = generateToken({
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role || 'viewer',
    assigned_post_id: user.assigned_post_id,
  });

  logAudit(
    { id: user.id, username: user.username, email: user.email, full_name: user.full_name, role: user.role, assigned_post_id: user.assigned_post_id },
    'LOGIN',
    'Autentikasi',
    user.id,
    `Pengguna ${user.username} (${user.role}) berhasil masuk`,
    req
  );

  res.json({
    message: 'Login berhasil.',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role || 'viewer',
      assigned_post_id: user.assigned_post_id,
    }
  });
});

router.get('/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

router.post('/auth/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru harus diisi.' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.id) as any;
  if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
    return res.status(400).json({ error: 'Kata sandi saat ini tidak valid.' });
  }

  const newHash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(newHash, req.user!.id);

  logAudit(req.user, 'PASSWORD_CHANGE', 'Pengguna', req.user!.id, 'Mengubah kata sandi mandiri', req);
  res.json({ message: 'Kata sandi berhasil diperbarui.' });
});

router.post('/auth/reset-password', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { user_id, default_password } = req.body;
  if (!user_id) return res.status(400).json({ error: 'ID Pengguna wajib disertakan.' });

  const pass = default_password || 'bandungjuara2026';
  const newHash = bcrypt.hashSync(pass, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(newHash, user_id);

  logAudit(req.user, 'PASSWORD_RESET', 'Pengguna', user_id, `Reset kata sandi pengguna oleh admin ke default`, req);
  res.json({ message: `Kata sandi pengguna berhasil direset menjadi: ${pass}` });
});

router.get('/auth/users', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.email, u.full_name, u.phone, u.assigned_post_id, u.status, u.created_at,
           ur.role_id as role, p.name as post_name
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN posts p ON u.assigned_post_id = p.id
    ORDER BY u.created_at ASC
  `).all();
  res.json(users);
});

router.post('/auth/users', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { username, email, full_name, phone, role, assigned_post_id, password } = req.body;
  if (!username || !email || !full_name || !role) {
    return res.status(400).json({ error: 'Username, email, nama lengkap, dan peran wajib diisi.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(400).json({ error: 'Username atau email sudah digunakan.' });
  }

  const id = `usr_${Date.now()}`;
  const pass = password || 'bandungjuara2026';
  const hash = bcrypt.hashSync(pass, 10);

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO users (id, username, email, password_hash, full_name, phone, assigned_post_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(id, username, email, hash, full_name, phone || null, assigned_post_id || null);

    db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(id, role);
  });
  tx();

  logAudit(req.user, 'CREATE_USER', 'Pengguna', id, `Menambahkan pengguna baru ${username} dengan peran ${role}`, req);
  res.json({ message: 'Pengguna berhasil ditambahkan.', id });
});

router.put('/auth/users/:id', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { full_name, phone, role, assigned_post_id, status } = req.body;

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE users SET full_name = ?, phone = ?, assigned_post_id = ?, status = ?, updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(full_name, phone || null, assigned_post_id || null, status || 'active', id);

    if (role) {
      db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
      db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(id, role);
    }
  });
  tx();

  logAudit(req.user, 'UPDATE_USER', 'Pengguna', id, `Memperbarui profil pengguna ${id}`, req);
  res.json({ message: 'Data pengguna berhasil diperbarui.' });
});

// ==========================================
// 2. DASHBOARD & OVERVIEW
// ==========================================

router.get('/dashboard/stats', optionalAuth, (req: AuthRequest, res: Response) => {
  // Contingent numbers from settings/master
  const settingsRows = db.prepare('SELECT key, value, label, is_verified FROM app_settings').all() as any[];
  const settingsMap: Record<string, any> = {};
  for (const s of settingsRows) {
    settingsMap[s.key] = s;
  }

  // Active counts from tables
  const totalSports = (db.prepare('SELECT COUNT(*) as count FROM sports').get() as any).count;
  const totalEvents = (db.prepare('SELECT COUNT(*) as count FROM events WHERE is_followed = 1').get() as any).count;
  const totalAthletes = (db.prepare('SELECT COUNT(*) as count FROM athletes WHERE deleted_at IS NULL').get() as any).count;
  const totalCoaches = (db.prepare("SELECT COUNT(*) as count FROM officials WHERE role_type = 'pelatih' AND deleted_at IS NULL").get() as any).count;
  const totalMechOfficials = (db.prepare("SELECT COUNT(*) as count FROM officials WHERE role_type = 'official_mekanik' AND deleted_at IS NULL").get() as any).count;
  const totalManagers = (db.prepare("SELECT COUNT(*) as count FROM officials WHERE role_type = 'manajer' AND deleted_at IS NULL").get() as any).count;

  // Medals tally
  const medalsWon = db.prepare(`
    SELECT 
      SUM(CASE WHEN medal_type = 'emas' THEN 1 ELSE 0 END) as gold,
      SUM(CASE WHEN medal_type = 'perak' THEN 1 ELSE 0 END) as silver,
      SUM(CASE WHEN medal_type = 'perunggu' THEN 1 ELSE 0 END) as bronze,
      COUNT(*) as total,
      SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_count,
      SUM(CASE WHEN is_verified = 0 THEN 1 ELSE 0 END) as unverified_count
    FROM medals
  `).get() as any;

  // Fixtures today & upcoming
  const todayDate = new Date().toISOString().split('T')[0];
  const fixturesToday = db.prepare(`
    SELECT f.*, s.name as sport_name, v.name as venue_name, r.name as region_name, res.outcome, res.score_bandung, res.score_opponent
    FROM fixtures f
    JOIN sports s ON f.sport_id = s.id
    LEFT JOIN venues v ON f.venue_id = v.id
    LEFT JOIN host_regions r ON v.region_id = r.id
    LEFT JOIN results res ON f.id = res.fixture_id
    WHERE DATE(f.scheduled_time) = DATE('now', 'localtime') OR DATE(f.scheduled_time) = '2026-10-29'
    ORDER BY f.scheduled_time ASC
  `).all();

  // Issues status
  const issuesStats = db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'baru' THEN 1 ELSE 0 END) as baru,
      SUM(CASE WHEN status = 'diproses' THEN 1 ELSE 0 END) as diproses,
      SUM(CASE WHEN status = 'menunggu' THEN 1 ELSE 0 END) as menunggu,
      SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
      SUM(CASE WHEN priority = 'kritis' OR priority = 'tinggi' THEN 1 ELSE 0 END) as high_priority,
      SUM(CASE WHEN escalated_to_central = 1 AND status != 'selesai' THEN 1 ELSE 0 END) as escalated_open
    FROM issues
  `).get() as any;

  // Recent unresolved issues
  const unresolvedIssues = db.prepare(`
    SELECT i.*, p.name as post_name, s.name as sport_name, u.full_name as reporter_name
    FROM issues i
    LEFT JOIN posts p ON i.post_id = p.id
    LEFT JOIN sports s ON i.sport_id = s.id
    LEFT JOIN users u ON i.reported_by = u.id
    WHERE i.status != 'selesai'
    ORDER BY 
      CASE i.priority WHEN 'kritis' THEN 1 WHEN 'tinggi' THEN 2 WHEN 'sedang' THEN 3 ELSE 4 END,
      i.created_at DESC
    LIMIT 6
  `).all();

  // Daily reports count
  const dailyReportsCount = (db.prepare('SELECT COUNT(*) as count FROM daily_reports').get() as any).count;

  // Posts summary
  const postsOverview = db.prepare(`
    SELECT p.*, r.name as region_name,
      (SELECT COUNT(*) FROM post_personnel WHERE post_id = p.id AND is_active = 1) as personnel_count,
      (SELECT COUNT(*) FROM daily_reports WHERE post_id = p.id) as reports_count,
      (SELECT COUNT(*) FROM issues WHERE post_id = p.id AND status != 'selesai') as open_issues_count
    FROM posts p
    LEFT JOIN host_regions r ON p.region_id = r.id
  `).all();

  // Host regions coverage
  const totalHostRegions = (db.prepare('SELECT COUNT(*) as count FROM host_regions').get() as any).count;

  // Medical stats (aggregated for general view without sensitive details)
  const medicalOverview = db.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      SUM(CASE WHEN status != 'pulih_siap_tanding' THEN 1 ELSE 0 END) as ongoing_cases,
      SUM(CASE WHEN urgency_level IN ('tinggi', 'darurat') THEN 1 ELSE 0 END) as urgent_cases
    FROM medical_cases
  `).get() as any;

  res.json({
    timestamp: new Date().toISOString(),
    contingent: {
      total_contingent_target: parseInt(settingsMap['total_contingent']?.value || '1920', 10),
      total_athletes: totalAthletes || parseInt(settingsMap['total_athletes']?.value || '1366', 10),
      total_coaches: totalCoaches || parseInt(settingsMap['total_coaches']?.value || '307', 10),
      total_officials: totalMechOfficials || parseInt(settingsMap['total_officials']?.value || '161', 10),
      total_managers: totalManagers || parseInt(settingsMap['total_managers']?.value || '86', 10),
      total_sports: totalSports || parseInt(settingsMap['total_sports']?.value || '78', 10),
      total_events_followed: totalEvents || parseInt(settingsMap['total_events_joined']?.value || '911', 10),
      total_events_all: parseInt(settingsMap['total_events_all']?.value || '1156', 10),
      host_regions_count: totalHostRegions,
    },
    targets: {
      primary: settingsMap['target_medal_primary'],
      secondary: settingsMap['target_medal_secondary'],
      bronze_est: settingsMap['target_medal_bronze_est'],
    },
    medals: {
      gold: medalsWon?.gold || 0,
      silver: medalsWon?.silver || 0,
      bronze: medalsWon?.bronze || 0,
      total: medalsWon?.total || 0,
      verified: medalsWon?.verified_count || 0,
      unverified: medalsWon?.unverified_count || 0,
      standing_estimate: 'Peringkat 1 - 2 (Persaingan Utama Jabar Juara)',
    },
    fixtures_today: fixturesToday,
    issues_summary: issuesStats,
    unresolved_issues: unresolvedIssues,
    daily_reports_count: dailyReportsCount,
    posts: postsOverview,
    medical_overview: medicalOverview,
    app_settings: settingsMap,
  });
});

// ==========================================
// 3. MASTER DATA: SPORTS & EVENTS
// ==========================================

router.get('/sports', optionalAuth, (req: AuthRequest, res: Response) => {
  const sports = db.prepare(`
    SELECT s.*, v.name as primary_venue_name,
      (SELECT COUNT(*) FROM events WHERE sport_id = s.id AND is_followed = 1) as actual_events_count,
      (SELECT COUNT(*) FROM athletes WHERE sport_id = s.id AND deleted_at IS NULL) as athlete_count
    FROM sports s
    LEFT JOIN venues v ON s.primary_venue_id = v.id
    ORDER BY s.name ASC
  `).all();
  res.json(sports);
});

router.post('/sports', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { code, name, category, total_events, joined_events, target_gold, target_silver, target_bronze, target_notes, primary_venue_id } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'Kode cabor dan nama cabor wajib diisi.' });

  const id = `sp_${code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
  db.prepare(`
    INSERT INTO sports (id, code, name, category, total_events, joined_events, target_gold, target_silver, target_bronze, target_verified, target_notes, primary_venue_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, code.toUpperCase(), name, category || 'Lainnya', total_events || 0, joined_events || 0, target_gold || 0, target_silver || 0, target_bronze || 0, target_notes || null, primary_venue_id || null);

  logAudit(req.user, 'CREATE_SPORT', 'Master Cabor', id, `Menambahkan cabor ${name}`, req);
  res.json({ message: 'Cabang olahraga berhasil ditambahkan.', id });
});

router.put('/sports/:id', authMiddleware, requireRole(['admin', 'pengurus_pusat']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, category, total_events, joined_events, target_gold, target_silver, target_bronze, target_verified, target_notes, primary_venue_id } = req.body;

  db.prepare(`
    UPDATE sports SET name = ?, category = ?, total_events = ?, joined_events = ?, target_gold = ?, target_silver = ?, target_bronze = ?, target_verified = ?, target_notes = ?, primary_venue_id = ?
    WHERE id = ?
  `).run(name, category, total_events, joined_events, target_gold, target_silver, target_bronze, target_verified ? 1 : 0, target_notes, primary_venue_id || null, id);

  logAudit(req.user, 'UPDATE_SPORT', 'Master Cabor', id, `Memperbarui target dan data cabor ${name}`, req);
  res.json({ message: 'Data cabor berhasil diperbarui.' });
});

router.get('/events', optionalAuth, (req: AuthRequest, res: Response) => {
  const { sport_id } = req.query;
  let query = `
    SELECT e.*, s.name as sport_name
    FROM events e
    JOIN sports s ON e.sport_id = s.id
  `;
  const params: any[] = [];
  if (sport_id) {
    query += ' WHERE e.sport_id = ?';
    params.push(sport_id);
  }
  query += ' ORDER BY s.name ASC, e.name ASC';
  const events = db.prepare(query).all(...params);
  res.json(events);
});

router.post('/events', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { sport_id, name, gender, is_followed, potential_medal, potential_verified } = req.body;
  if (!sport_id || !name) return res.status(400).json({ error: 'Cabor dan nama nomor pertandingan wajib diisi.' });

  const id = `ev_${Date.now()}`;
  db.prepare(`
    INSERT INTO events (id, sport_id, name, gender, is_followed, potential_medal, potential_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, sport_id, name, gender || 'putra', is_followed !== undefined ? (is_followed ? 1 : 0) : 1, potential_medal || 'belum_diverifikasi', potential_verified ? 1 : 0);

  logAudit(req.user, 'CREATE_EVENT', 'Master Nomor', id, `Menambahkan nomor ${name}`, req);
  res.json({ message: 'Nomor pertandingan berhasil ditambahkan.', id });
});

// ==========================================
// 4. MASTER DATA: ATHLETES & OFFICIALS
// ==========================================

router.get('/athletes', optionalAuth, (req: AuthRequest, res: Response) => {
  const { sport_id, status, search } = req.query;
  let query = `
    SELECT a.*, s.name as sport_name
    FROM athletes a
    JOIN sports s ON a.sport_id = s.id
    WHERE a.deleted_at IS NULL
  `;
  const params: any[] = [];

  if (sport_id) {
    query += ' AND a.sport_id = ?';
    params.push(sport_id);
  }
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (a.full_name LIKE ? OR a.registration_number LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY a.full_name ASC';

  const athletes = db.prepare(query).all(...params);
  res.json(athletes);
});

router.post('/athletes', authMiddleware, requireRole(['admin', 'pengurus_pusat']), (req: AuthRequest, res: Response) => {
  const { registration_number, sport_id, full_name, nickname, gender, birth_date, blood_type, phone, status, is_verified } = req.body;
  if (!sport_id || !full_name || !gender) {
    return res.status(400).json({ error: 'Cabor, nama lengkap, dan jenis kelamin wajib diisi.' });
  }

  const id = `ath_${Date.now()}`;
  db.prepare(`
    INSERT INTO athletes (id, registration_number, sport_id, full_name, nickname, gender, birth_date, blood_type, phone, status, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, registration_number || `BDG-2026-${Date.now().toString().slice(-4)}`, sport_id, full_name, nickname || null, gender, birth_date || null, blood_type || null, phone || null, status || 'siap_tanding', is_verified ? 1 : 0);

  logAudit(req.user, 'CREATE_ATHLETE', 'Master Atlet', id, `Mendaftarkan atlet ${full_name}`, req);
  res.json({ message: 'Atlet berhasil ditambahkan.', id });
});

router.put('/athletes/:id', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'tim_medis']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { sport_id, full_name, nickname, gender, birth_date, blood_type, phone, status, is_verified } = req.body;

  db.prepare(`
    UPDATE athletes SET sport_id = ?, full_name = ?, nickname = ?, gender = ?, birth_date = ?, blood_type = ?, phone = ?, status = ?, is_verified = ?
    WHERE id = ?
  `).run(sport_id, full_name, nickname, gender, birth_date, blood_type, phone, status, is_verified ? 1 : 0, id);

  logAudit(req.user, 'UPDATE_ATHLETE', 'Master Atlet', id, `Memperbarui data atlet ${full_name}`, req);
  res.json({ message: 'Data atlet berhasil diperbarui.' });
});

router.delete('/athletes/:id', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.prepare("UPDATE athletes SET deleted_at = datetime('now', 'localtime') WHERE id = ?").run(id);
  logAudit(req.user, 'DELETE_ATHLETE', 'Master Atlet', id, `Menghapus atlet ${id}`, req);
  res.json({ message: 'Atlet berhasil dihapus (soft-delete).' });
});

router.get('/officials', optionalAuth, (req: AuthRequest, res: Response) => {
  const { sport_id, role_type } = req.query;
  let query = `
    SELECT o.*, s.name as sport_name
    FROM officials o
    JOIN sports s ON o.sport_id = s.id
    WHERE o.deleted_at IS NULL
  `;
  const params: any[] = [];
  if (sport_id) {
    query += ' AND o.sport_id = ?';
    params.push(sport_id);
  }
  if (role_type) {
    query += ' AND o.role_type = ?';
    params.push(role_type);
  }
  query += ' ORDER BY o.role_type ASC, o.full_name ASC';
  const officials = db.prepare(query).all(...params);
  res.json(officials);
});

router.post('/officials', authMiddleware, requireRole(['admin', 'pengurus_pusat']), (req: AuthRequest, res: Response) => {
  const { sport_id, full_name, role_type, phone, license_number, notes } = req.body;
  if (!sport_id || !full_name || !role_type) {
    return res.status(400).json({ error: 'Cabor, nama lengkap, dan jenis peran wajib diisi.' });
  }

  const id = `off_${Date.now()}`;
  db.prepare(`
    INSERT INTO officials (id, sport_id, full_name, role_type, phone, license_number, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, sport_id, full_name, role_type, phone || null, license_number || null, notes || null);

  logAudit(req.user, 'CREATE_OFFICIAL', 'Master Official', id, `Menambahkan ${role_type} ${full_name}`, req);
  res.json({ message: 'Official/Pelatih/Manajer berhasil ditambahkan.', id });
});

// ==========================================
// 5. MASTER DATA: POSKO, PERSONEL, TUAN RUMAH & VENUE
// ==========================================

router.get('/posts', optionalAuth, (req: AuthRequest, res: Response) => {
  const posts = db.prepare(`
    SELECT p.*, r.name as region_name,
      (SELECT COUNT(*) FROM post_personnel WHERE post_id = p.id AND is_active = 1) as active_personnel_count
    FROM posts p
    LEFT JOIN host_regions r ON p.region_id = r.id
    ORDER BY p.name ASC
  `).all();
  res.json(posts);
});

router.put('/posts/:id', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'koordinator_posko']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, region_id, location_name, address, coordinator_name, contact_phone, status, notes } = req.body;

  // Koordinator posko only allowed to edit their assigned post
  if (req.user?.role === 'koordinator_posko' && req.user.assigned_post_id !== id) {
    return res.status(403).json({ error: 'Anda hanya berhak memperbarui posko penugasan Anda.' });
  }

  db.prepare(`
    UPDATE posts SET name = ?, region_id = ?, location_name = ?, address = ?, coordinator_name = ?, contact_phone = ?, status = ?, notes = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(name, region_id || null, location_name, address, coordinator_name, contact_phone, status || 'aktif', notes || null, id);

  logAudit(req.user, 'UPDATE_POST', 'Posko Kontingen', id, `Memperbarui data posko ${name} (Lokasi: ${location_name})`, req);
  res.json({ message: 'Data posko berhasil diperbarui.' });
});

router.get('/post-personnel', optionalAuth, (req: AuthRequest, res: Response) => {
  const { post_id } = req.query;
  let query = `
    SELECT pp.*, p.name as post_name
    FROM post_personnel pp
    JOIN posts p ON pp.post_id = p.id
  `;
  const params: any[] = [];
  if (post_id) {
    query += ' WHERE pp.post_id = ?';
    params.push(post_id);
  }
  query += ' ORDER BY pp.post_id ASC, pp.division ASC, pp.full_name ASC';
  const personnel = db.prepare(query).all(...params);
  res.json(personnel);
});

router.post('/post-personnel', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'koordinator_posko']), (req: AuthRequest, res: Response) => {
  const { post_id, full_name, division, position, phone, notes } = req.body;
  if (!post_id || !full_name || !division || !position) {
    return res.status(400).json({ error: 'Posko, nama lengkap, bidang/divisi, dan jabatan wajib diisi.' });
  }

  const id = `psn_${Date.now()}`;
  db.prepare(`
    INSERT INTO post_personnel (id, post_id, full_name, division, position, phone, notes, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(id, post_id, full_name, division, position, phone || null, notes || null);

  logAudit(req.user, 'CREATE_PERSONNEL', 'Personel Posko', id, `Menambahkan personel ${full_name} di ${division}`, req);
  res.json({ message: 'Personel posko berhasil didaftarkan.', id });
});

router.put('/post-personnel/:id', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'koordinator_posko']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { post_id, full_name, division, position, phone, notes, is_active } = req.body;

  db.prepare(`
    UPDATE post_personnel SET post_id = ?, full_name = ?, division = ?, position = ?, phone = ?, notes = ?, is_active = ?
    WHERE id = ?
  `).run(post_id, full_name, division, position, phone || null, notes || null, is_active ? 1 : 0, id);

  logAudit(req.user, 'UPDATE_PERSONNEL', 'Personel Posko', id, `Memperbarui personel ${full_name}`, req);
  res.json({ message: 'Data personel posko berhasil diperbarui.' });
});

router.get('/host-regions', optionalAuth, (req: AuthRequest, res: Response) => {
  const regions = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM venues WHERE region_id = r.id) as venues_count
    FROM host_regions r
    ORDER BY r.is_primary DESC, r.name ASC
  `).all();
  res.json(regions);
});

router.get('/venues', optionalAuth, (req: AuthRequest, res: Response) => {
  const venues = db.prepare(`
    SELECT v.*, r.name as region_name
    FROM venues v
    JOIN host_regions r ON v.region_id = r.id
    ORDER BY r.name ASC, v.name ASC
  `).all();
  res.json(venues);
});

// ==========================================
// 6. FIXTURES & MATCH RESULTS
// ==========================================

router.get('/fixtures', optionalAuth, (req: AuthRequest, res: Response) => {
  const { sport_id, region_id, post_id, status, date, search } = req.query;
  let query = `
    SELECT f.*, s.name as sport_name, e.name as event_name, v.name as venue_name, r.name as region_name, p.name as post_name,
           u.full_name as last_updater_name,
           res.score_bandung, res.score_opponent, res.outcome, res.summary as result_summary, res.is_verified as result_verified
    FROM fixtures f
    JOIN sports s ON f.sport_id = s.id
    LEFT JOIN events e ON f.event_id = e.id
    LEFT JOIN venues v ON f.venue_id = v.id
    LEFT JOIN host_regions r ON v.region_id = r.id
    LEFT JOIN posts p ON f.post_id = p.id
    LEFT JOIN users u ON f.last_updated_by = u.id
    LEFT JOIN results res ON f.id = res.fixture_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (sport_id) {
    query += ' AND f.sport_id = ?';
    params.push(sport_id);
  }
  if (region_id) {
    query += ' AND v.region_id = ?';
    params.push(region_id);
  }
  if (post_id) {
    query += ' AND f.post_id = ?';
    params.push(post_id);
  }
  if (status) {
    query += ' AND f.status = ?';
    params.push(status);
  }
  if (date) {
    query += ' AND DATE(f.scheduled_time) = DATE(?)';
    params.push(date);
  }
  if (search) {
    query += ' AND (f.athlete_or_team LIKE ? OR f.opponent LIKE ? OR s.name LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY f.scheduled_time ASC';
  const fixtures = db.prepare(query).all(...params);
  res.json(fixtures);
});

router.post('/fixtures', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'tim_teknis']), (req: AuthRequest, res: Response) => {
  const { sport_id, event_id, venue_id, post_id, match_code, stage, scheduled_time, opponent, athlete_or_team, status, delay_reason, source_update } = req.body;
  if (!sport_id || !scheduled_time || !opponent || !athlete_or_team) {
    return res.status(400).json({ error: 'Cabor, jadwal waktu, lawan, dan nama atlet/tim wajib diisi.' });
  }

  const id = `fix_${Date.now()}`;
  db.prepare(`
    INSERT INTO fixtures (id, sport_id, event_id, venue_id, post_id, match_code, stage, scheduled_time, opponent, athlete_or_team, status, delay_reason, source_update, last_updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sport_id, event_id || null, venue_id || null, post_id || null, match_code || null, stage || 'Penyisihan', scheduled_time, opponent, athlete_or_team, status || 'terjadwal', delay_reason || null, source_update || 'Panpel Cabor PORPROV', req.user!.id);

  logAudit(req.user, 'CREATE_FIXTURE', 'Jadwal Pertandingan', id, `Membuat jadwal pertandingan ${athlete_or_team} vs ${opponent} pada ${scheduled_time}`, req);
  res.json({ message: 'Jadwal pertandingan berhasil ditambahkan.', id });
});

router.put('/fixtures/:id', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'tim_teknis', 'koordinator_posko']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { event_id, venue_id, post_id, match_code, stage, scheduled_time, opponent, athlete_or_team, status, delay_reason, source_update } = req.body;

  const oldFix = db.prepare('SELECT scheduled_time, status, delay_reason FROM fixtures WHERE id = ?').get(id) as any;
  if (!oldFix) return res.status(404).json({ error: 'Jadwal pertandingan tidak ditemukan.' });

  db.prepare(`
    UPDATE fixtures SET event_id = ?, venue_id = ?, post_id = ?, match_code = ?, stage = ?, scheduled_time = ?, opponent = ?, athlete_or_team = ?, status = ?, delay_reason = ?, source_update = ?, last_updated_by = ?, updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(event_id || null, venue_id || null, post_id || null, match_code || null, stage || null, scheduled_time, opponent, athlete_or_team, status, delay_reason || null, source_update || 'Update Lapangan', req.user!.id, id);

  logAudit(
    req.user,
    'UPDATE_FIXTURE',
    'Jadwal Pertandingan',
    id,
    `Perubahan jadwal: status (${oldFix.status} -> ${status}), waktu (${oldFix.scheduled_time} -> ${scheduled_time}). Alasan: ${delay_reason || 'Pembaruan rutin'}`,
    req
  );

  res.json({ message: 'Jadwal pertandingan berhasil diperbarui.' });
});

router.post('/fixtures/:id/result', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'tim_teknis']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { score_bandung, score_opponent, outcome, summary, round_result, rank_obtained, is_verified } = req.body;

  const fix = db.prepare('SELECT id, sport_id, athlete_or_team FROM fixtures WHERE id = ?').get(id) as any;
  if (!fix) return res.status(404).json({ error: 'Pertandingan tidak ditemukan.' });

  const resultId = `res_${Date.now()}`;
  db.prepare(`
    INSERT INTO results (id, fixture_id, score_bandung, score_opponent, outcome, summary, round_result, rank_obtained, verified_by, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(fixture_id) DO UPDATE SET
      score_bandung = excluded.score_bandung,
      score_opponent = excluded.score_opponent,
      outcome = excluded.outcome,
      summary = excluded.summary,
      round_result = excluded.round_result,
      rank_obtained = excluded.rank_obtained,
      verified_by = excluded.verified_by,
      is_verified = excluded.is_verified,
      updated_at = datetime('now', 'localtime')
  `).run(resultId, id, score_bandung || '', score_opponent || '', outcome || 'belum_ada', summary || '', round_result || '', rank_obtained || null, is_verified ? req.user!.id : null, is_verified ? 1 : 0);

  // Auto update fixture status to selesai if outcome is final
  if (['menang', 'kalah', 'seri', 'walkout'].includes(outcome)) {
    db.prepare("UPDATE fixtures SET status = 'selesai', updated_at = datetime('now', 'localtime') WHERE id = ?").run(id);
  }

  logAudit(req.user, 'RECORD_RESULT', 'Hasil Pertandingan', id, `Mencatat hasil: skor ${score_bandung} - ${score_opponent} (${outcome}). Ringkasan: ${summary}`, req);
  res.json({ message: 'Hasil pertandingan berhasil disimpan.' });
});

// ==========================================
// 7. MEDALS (PEROLEHAN MEDALI)
// ==========================================

router.get('/medals', optionalAuth, (req: AuthRequest, res: Response) => {
  const { sport_id, medal_type, is_verified } = req.query;
  let query = `
    SELECT m.*, s.name as sport_name, e.name as event_name, u.full_name as verifier_name
    FROM medals m
    JOIN sports s ON m.sport_id = s.id
    LEFT JOIN events e ON m.event_id = e.id
    LEFT JOIN users u ON m.verified_by = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (sport_id) {
    query += ' AND m.sport_id = ?';
    params.push(sport_id);
  }
  if (medal_type) {
    query += ' AND m.medal_type = ?';
    params.push(medal_type);
  }
  if (is_verified !== undefined) {
    query += ' AND m.is_verified = ?';
    params.push(is_verified === 'true' || is_verified === '1' ? 1 : 0);
  }
  query += ' ORDER BY m.awarded_date DESC, m.created_at DESC';

  const medals = db.prepare(query).all(...params);

  // Group by cabor tally
  const tally = db.prepare(`
    SELECT s.name as sport_name, s.code,
      SUM(CASE WHEN m.medal_type = 'emas' THEN 1 ELSE 0 END) as gold,
      SUM(CASE WHEN m.medal_type = 'perak' THEN 1 ELSE 0 END) as silver,
      SUM(CASE WHEN m.medal_type = 'perunggu' THEN 1 ELSE 0 END) as bronze,
      COUNT(m.id) as total,
      s.target_gold, s.target_silver, s.target_bronze
    FROM sports s
    LEFT JOIN medals m ON s.id = m.sport_id
    GROUP BY s.id
    HAVING total > 0 OR s.target_gold > 0
    ORDER BY gold DESC, silver DESC, bronze DESC
  `).all();

  res.json({ medals, tally });
});

router.post('/medals', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'tim_teknis']), (req: AuthRequest, res: Response) => {
  const { sport_id, event_id, fixture_id, medal_type, athlete_or_team, awarded_date, source, is_verified, notes } = req.body;
  if (!sport_id || !medal_type || !athlete_or_team || !awarded_date) {
    return res.status(400).json({ error: 'Cabor, jenis medali, nama atlet/tim, dan tanggal medali wajib diisi.' });
  }

  const id = `med_${Date.now()}`;
  db.prepare(`
    INSERT INTO medals (id, sport_id, event_id, fixture_id, medal_type, athlete_or_team, awarded_date, source, is_verified, verified_by, verified_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    sport_id,
    event_id || null,
    fixture_id || null,
    medal_type,
    athlete_or_team,
    awarded_date,
    source || 'Panitia Resmi Pertandingan',
    is_verified ? 1 : 0,
    is_verified ? req.user!.id : null,
    is_verified ? new Date().toISOString() : null,
    notes || null
  );

  logAudit(req.user, 'CREATE_MEDAL', 'Medali', id, `Pencatatan Medali ${medal_type.toUpperCase()} untuk ${athlete_or_team}`, req);
  res.json({ message: 'Perolehan medali berhasil dicatat.', id });
});

router.put('/medals/:id/verify', authMiddleware, requireRole(['admin', 'pengurus_pusat']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { is_verified, notes } = req.body;

  db.prepare(`
    UPDATE medals SET is_verified = ?, verified_by = ?, verified_at = datetime('now', 'localtime'), notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(is_verified ? 1 : 0, req.user!.id, notes || null, id);

  logAudit(req.user, 'VERIFY_MEDAL', 'Medali', id, `Status verifikasi medali diubah menjadi ${is_verified ? 'TERVERIFIKASI' : 'BELUM DIVERIFIKASI'}`, req);
  res.json({ message: 'Status verifikasi medali berhasil diperbarui.' });
});

// Configure and verify Target Medali 171 & 76
router.put('/settings/medal-targets', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { primary_val, primary_label, primary_desc, secondary_val, secondary_label, secondary_desc, is_verified } = req.body;

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE app_settings SET value = ?, label = ?, description = ?, is_verified = ?, verified_by = ?, verified_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime')
      WHERE key = 'target_medal_primary'
    `).run(primary_val, primary_label, primary_desc, is_verified ? 1 : 0, req.user!.id);

    db.prepare(`
      UPDATE app_settings SET value = ?, label = ?, description = ?, is_verified = ?, verified_by = ?, verified_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime')
      WHERE key = 'target_medal_secondary'
    `).run(secondary_val, secondary_label, secondary_desc, is_verified ? 1 : 0, req.user!.id);
  });
  tx();

  logAudit(req.user, 'VERIFY_TARGET_CONFIG', 'Pengaturan Target Medali', 'target_medal_primary', `Verifikasi & penyesuaian label target medali (Primer: ${primary_val} '${primary_label}', Sekunder: ${secondary_val} '${secondary_label}')`, req);
  res.json({ message: 'Konfigurasi dan verifikasi target medali berhasil disimpan.' });
});

// ==========================================
// 8. MONITORING POSKO & LAPORAN HARIAN
// ==========================================

router.get('/daily-reports', optionalAuth, (req: AuthRequest, res: Response) => {
  const { post_id, date, status } = req.query;
  let query = `
    SELECT dr.*, p.name as post_name, p.location_name, u.full_name as reporter_name, s.name as sport_name
    FROM daily_reports dr
    JOIN posts p ON dr.post_id = p.id
    JOIN users u ON dr.reporter_id = u.id
    LEFT JOIN sports s ON dr.sport_id = s.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (post_id) {
    query += ' AND dr.post_id = ?';
    params.push(post_id);
  }
  if (date) {
    query += ' AND dr.report_date = ?';
    params.push(date);
  }
  if (status) {
    query += ' AND dr.status = ?';
    params.push(status);
  }
  query += ' ORDER BY dr.report_date DESC, dr.created_at DESC';

  const reports = db.prepare(query).all(...params);
  res.json(reports);
});

router.post('/daily-reports', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'koordinator_posko', 'tim_monev']), (req: AuthRequest, res: Response) => {
  const { post_id, sport_id, fixture_id, report_date, title, activity_summary, field_conditions, follow_up_action, status, photo_url, rating, findings, recommendation } = req.body;
  if (!post_id || !title || !activity_summary || !report_date) {
    return res.status(400).json({ error: 'Posko, judul laporan, tanggal, dan uraian kegiatan wajib diisi.' });
  }

  const id = `rep_${Date.now()}`;
  db.prepare(`
    INSERT INTO daily_reports (id, post_id, reporter_id, sport_id, fixture_id, report_date, title, activity_summary, field_conditions, follow_up_action, status, photo_url, rating, findings, recommendation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    post_id,
    req.user!.id,
    sport_id || null,
    fixture_id || null,
    report_date,
    title,
    activity_summary,
    field_conditions || null,
    follow_up_action || null,
    status || 'terkirim',
    photo_url || null,
    rating || null,
    findings || null,
    recommendation || null
  );

  logAudit(req.user, 'CREATE_REPORT', 'Laporan Harian / Monev', id, `Mengirim laporan '${title}' untuk posko ${post_id} (Rating: ${rating || '-'})`, req);
  res.json({ message: 'Laporan posko / hasil monitoring berhasil dikirim.', id });
});

router.get('/visit-photos', optionalAuth, (req: AuthRequest, res: Response) => {
  const photos = db.prepare(`
    SELECT dr.id, dr.post_id, dr.report_date, dr.title, dr.activity_summary, dr.field_conditions,
           dr.follow_up_action, dr.status, dr.photo_url, dr.rating, dr.findings, dr.recommendation,
           p.name as post_name, p.location_name, u.full_name as reporter_name
    FROM daily_reports dr
    JOIN posts p ON dr.post_id = p.id
    JOIN users u ON dr.reporter_id = u.id
    WHERE dr.photo_url IS NOT NULL AND dr.photo_url != ''
    ORDER BY dr.report_date DESC, dr.created_at DESC
  `).all();
  res.json(photos);
});

// Issues & Follow-up
router.get('/issues', optionalAuth, (req: AuthRequest, res: Response) => {
  const { post_id, category, priority, status, escalated } = req.query;
  let query = `
    SELECT i.*, p.name as post_name, s.name as sport_name, u.full_name as reporter_name, ua.full_name as assignee_name
    FROM issues i
    LEFT JOIN posts p ON i.post_id = p.id
    LEFT JOIN sports s ON i.sport_id = s.id
    LEFT JOIN users u ON i.reported_by = u.id
    LEFT JOIN users ua ON i.assigned_to = ua.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (post_id) {
    query += ' AND i.post_id = ?';
    params.push(post_id);
  }
  if (category) {
    query += ' AND i.category = ?';
    params.push(category);
  }
  if (priority) {
    query += ' AND i.priority = ?';
    params.push(priority);
  }
  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }
  if (escalated === 'true') {
    query += ' AND i.escalated_to_central = 1';
  }

  query += `
    ORDER BY 
      CASE i.status WHEN 'baru' THEN 1 WHEN 'diproses' THEN 2 WHEN 'menunggu' THEN 3 ELSE 4 END,
      CASE i.priority WHEN 'kritis' THEN 1 WHEN 'tinggi' THEN 2 WHEN 'sedang' THEN 3 ELSE 4 END,
      i.created_at DESC
  `;

  const issues = db.prepare(query).all(...params);
  res.json(issues);
});

router.post('/issues', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'koordinator_posko', 'tim_teknis', 'tim_medis']), (req: AuthRequest, res: Response) => {
  const { post_id, sport_id, daily_report_id, title, category, description, priority, escalated_to_central } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Judul kendala dan rincian deskripsi wajib diisi.' });
  }

  const id = `iss_${Date.now()}`;
  db.prepare(`
    INSERT INTO issues (id, post_id, sport_id, daily_report_id, title, category, description, priority, status, escalated_to_central, reported_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'baru', ?, ?)
  `).run(id, post_id || null, sport_id || null, daily_report_id || null, title, category || 'lainnya', description, priority || 'sedang', escalated_to_central ? 1 : 0, req.user!.id);

  logAudit(req.user, 'CREATE_ISSUE', 'Kendala Posko', id, `Mencatat kendala: ${title} (Prioritas: ${priority})`, req);
  res.json({ message: 'Kendala berhasil dicatat.', id });
});

router.get('/issues/:id/updates', optionalAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates = db.prepare(`
    SELECT iu.*, u.full_name as user_name, u.username
    FROM issue_updates iu
    JOIN users u ON iu.user_id = u.id
    WHERE iu.issue_id = ?
    ORDER BY iu.created_at ASC
  `).all(id);
  res.json(updates);
});

router.post('/issues/:id/updates', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'koordinator_posko']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { action_taken, status_after, notes, escalated_to_central } = req.body;
  if (!action_taken) return res.status(400).json({ error: 'Tindakan yang diambil wajib diisi.' });

  const issue = db.prepare('SELECT status, escalated_to_central FROM issues WHERE id = ?').get(id) as any;
  if (!issue) return res.status(404).json({ error: 'Kendala tidak ditemukan.' });

  const updateId = `isu_${Date.now()}`;
  const targetStatus = status_after || issue.status;

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO issue_updates (id, issue_id, user_id, action_taken, status_before, status_after, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(updateId, id, req.user!.id, action_taken, issue.status, targetStatus, notes || null);

    let resolvedAtSql = targetStatus === 'selesai' ? "datetime('now', 'localtime')" : null;

    db.prepare(`
      UPDATE issues SET 
        status = ?, 
        escalated_to_central = CASE WHEN ? IS NOT NULL THEN ? ELSE escalated_to_central END,
        resolution = CASE WHEN ? = 'selesai' THEN ? ELSE resolution END,
        resolved_at = CASE WHEN ? = 'selesai' THEN ${resolvedAtSql ? "datetime('now', 'localtime')" : "resolved_at"} ELSE resolved_at END,
        updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `).run(targetStatus, escalated_to_central !== undefined ? (escalated_to_central ? 1 : 0) : null, escalated_to_central !== undefined ? (escalated_to_central ? 1 : 0) : null, targetStatus, action_taken, targetStatus, id);
  });
  tx();

  logAudit(req.user, 'UPDATE_ISSUE', 'Kendala Posko', id, `Tindak lanjut kendala: ${action_taken} -> Status baru: ${targetStatus}`, req);
  res.json({ message: 'Tindak lanjut kendala berhasil ditambahkan.' });
});

// ==========================================
// 9. MEDICAL & ATHLETE WELFARE (AKSES TERBATAS!)
// ==========================================

router.get('/medical', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'tim_medis']), (req: AuthRequest, res: Response) => {
  const { sport_id, urgency_level, status } = req.query;
  let query = `
    SELECT mc.*, a.full_name as athlete_name, a.blood_type, a.gender, s.name as sport_name, p.name as post_name, u.full_name as created_by_name
    FROM medical_cases mc
    JOIN athletes a ON mc.athlete_id = a.id
    JOIN sports s ON mc.sport_id = s.id
    LEFT JOIN posts p ON mc.post_id = p.id
    LEFT JOIN users u ON mc.created_by = u.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (sport_id) {
    query += ' AND mc.sport_id = ?';
    params.push(sport_id);
  }
  if (urgency_level) {
    query += ' AND mc.urgency_level = ?';
    params.push(urgency_level);
  }
  if (status) {
    query += ' AND mc.status = ?';
    params.push(status);
  }
  query += ' ORDER BY mc.incident_time DESC';

  const cases = db.prepare(query).all(...params);
  res.json(cases);
});

router.post('/medical', authMiddleware, requireRole(['admin', 'tim_medis']), (req: AuthRequest, res: Response) => {
  const { athlete_id, sport_id, post_id, incident_type, urgency_level, diagnosis_summary, treatment_given, hospital_referral, medic_officer_name, incident_time, status } = req.body;
  if (!athlete_id || !sport_id || !incident_type || !urgency_level || !diagnosis_summary || !treatment_given) {
    return res.status(400).json({ error: 'Atlet, cabor, jenis kejadian, tingkat urgensi, diagnosis, dan tindakan penanganan wajib diisi.' });
  }

  const id = `medc_${Date.now()}`;
  db.prepare(`
    INSERT INTO medical_cases (id, athlete_id, sport_id, post_id, incident_type, urgency_level, diagnosis_summary, treatment_given, hospital_referral, medic_officer_name, incident_time, status, is_confidential, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(id, athlete_id, sport_id, post_id || null, incident_type, urgency_level, diagnosis_summary, treatment_given, hospital_referral || null, medic_officer_name || req.user!.full_name, incident_time || new Date().toISOString(), status || 'observasi', req.user!.id);

  // If athlete has injury, update athlete status
  if (incident_type === 'cedera_tanding') {
    db.prepare("UPDATE athletes SET status = 'cedera' WHERE id = ?").run(athlete_id);
  }

  logAudit(req.user, 'CREATE_MEDICAL', 'Kesehatan Atlet', id, `Pencatatan medis rahasia: tingkat urgensi ${urgency_level}, jenis ${incident_type}`, req);
  res.json({ message: 'Catatan medis berhasil disimpan dengan proteksi akses rahasia.', id });
});

router.put('/medical/:id', authMiddleware, requireRole(['admin', 'tim_medis']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, treatment_given, hospital_referral } = req.body;

  const current = db.prepare('SELECT athlete_id FROM medical_cases WHERE id = ?').get(id) as any;
  if (!current) return res.status(404).json({ error: 'Catatan medis tidak ditemukan.' });

  db.prepare(`
    UPDATE medical_cases SET status = ?, treatment_given = COALESCE(?, treatment_given), hospital_referral = COALESCE(?, hospital_referral), updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(status, treatment_given || null, hospital_referral || null, id);

  // If status is pulih_siap_tanding, update athlete status to siap_tanding
  if (status === 'pulih_siap_tanding') {
    db.prepare("UPDATE athletes SET status = 'siap_tanding' WHERE id = ?").run(current.athlete_id);
  }

  logAudit(req.user, 'UPDATE_MEDICAL', 'Kesehatan Atlet', id, `Pembaruan status medis menjadi ${status}`, req);
  res.json({ message: 'Catatan medis berhasil diperbarui.' });
});

// ==========================================
// 10. ACCOMMODATION & TRANSPORTATION
// ==========================================

router.get('/accommodations', optionalAuth, (req: AuthRequest, res: Response) => {
  const accs = db.prepare(`
    SELECT a.*, r.name as region_name, p.name as post_name
    FROM accommodations a
    JOIN host_regions r ON a.region_id = r.id
    LEFT JOIN posts p ON a.post_id = p.id
    ORDER BY a.hotel_name ASC
  `).all();
  res.json(accs);
});

router.put('/accommodations/:id', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'koordinator_posko']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { current_occupancy, assigned_sports, notes } = req.body;

  db.prepare(`
    UPDATE accommodations SET current_occupancy = ?, assigned_sports = ?, notes = ?
    WHERE id = ?
  `).run(current_occupancy, assigned_sports, notes, id);

  logAudit(req.user, 'UPDATE_ACCOMMODATION', 'Akomodasi', id, `Update okupansi (${current_occupancy}) dan alokasi cabor`, req);
  res.json({ message: 'Data penginapan berhasil diperbarui.' });
});

router.get('/transport', optionalAuth, (req: AuthRequest, res: Response) => {
  const trips = db.prepare(`
    SELECT t.*, p.name as post_name, s.name as sport_name
    FROM transport_assignments t
    JOIN posts p ON t.post_id = p.id
    LEFT JOIN sports s ON t.sport_id = s.id
    ORDER BY t.departure_time DESC
  `).all();
  res.json(trips);
});

router.put('/transport/:id', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'koordinator_posko']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status, issue_note } = req.body;

  db.prepare(`
    UPDATE transport_assignments SET status = ?, issue_note = ?
    WHERE id = ?
  `).run(status, issue_note || null, id);

  logAudit(req.user, 'UPDATE_TRANSPORT', 'Transportasi', id, `Update status armada transport menjadi ${status}`, req);
  res.json({ message: 'Status armada transport berhasil diperbarui.' });
});

// ==========================================
// 11. PROTESTS & VIOLATIONS
// ==========================================

router.get('/protests', optionalAuth, (req: AuthRequest, res: Response) => {
  let query = `
    SELECT pr.*, s.name as sport_name, f.match_code, u.full_name as handler_name
    FROM protests pr
    JOIN sports s ON pr.sport_id = s.id
    LEFT JOIN fixtures f ON pr.fixture_id = f.id
    LEFT JOIN users u ON pr.handled_by = u.id
  `;
  // Restrict confidential protests from viewers
  if (req.user?.role === 'viewer') {
    query += ' WHERE pr.is_confidential = 0';
  }
  query += ' ORDER BY pr.submission_time DESC';

  const protests = db.prepare(query).all();
  res.json(protests);
});

router.post('/protests', authMiddleware, requireRole(['admin', 'pengurus_pusat', 'tim_teknis', 'koordinator_posko']), (req: AuthRequest, res: Response) => {
  const { fixture_id, sport_id, protest_type, description, reporter_name, reporter_role, submission_time, fee_deposit_status } = req.body;
  if (!sport_id || !protest_type || !description || !reporter_name) {
    return res.status(400).json({ error: 'Cabor, jenis protes, uraian laporan, dan nama pelapor wajib diisi.' });
  }

  const id = `prt_${Date.now()}`;
  db.prepare(`
    INSERT INTO protests (id, fixture_id, sport_id, protest_type, description, reporter_name, reporter_role, submission_time, fee_deposit_status, hearing_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'diajukan')
  `).run(id, fixture_id || null, sport_id, protest_type, description, reporter_name, reporter_role || 'Manajer Cabor', submission_time || new Date().toISOString(), fee_deposit_status || 'lunas');

  logAudit(req.user, 'CREATE_PROTEST', 'Protes & Hukum', id, `Pengajuan protes resmi ${protest_type} oleh ${reporter_name}`, req);
  res.json({ message: 'Protes resmi berhasil didaftarkan.', id });
});

router.put('/protests/:id', authMiddleware, requireRole(['admin', 'pengurus_pusat']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { hearing_status, decision_summary, is_confidential } = req.body;

  db.prepare(`
    UPDATE protests SET 
      hearing_status = ?, 
      decision_summary = ?, 
      decided_at = CASE WHEN ? IN ('ditolak', 'dikabulkan_sebagian', 'dikabulkan_penuh') THEN datetime('now', 'localtime') ELSE decided_at END,
      is_confidential = ?,
      handled_by = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(hearing_status, decision_summary || null, hearing_status, is_confidential ? 1 : 0, req.user!.id, id);

  logAudit(req.user, 'UPDATE_PROTEST', 'Protes & Hukum', id, `Keputusan protes: ${hearing_status}. Ringkasan: ${decision_summary}`, req);
  res.json({ message: 'Keputusan protes berhasil diperbarui.' });
});

// ==========================================
// 12. AUDIT LOGS & APP SETTINGS
// ==========================================

router.get('/audit-logs', authMiddleware, requireRole(['admin', 'pengurus_pusat']), (req: AuthRequest, res: Response) => {
  const { module, action, limit } = req.query;
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];
  if (module) {
    query += ' AND module = ?';
    params.push(module);
  }
  if (action) {
    query += ' AND action = ?';
    params.push(action);
  }
  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(parseInt(limit as string, 10) || 100);

  const logs = db.prepare(query).all(...params);
  res.json(logs);
});

router.get('/settings', optionalAuth, (req: AuthRequest, res: Response) => {
  const settings = db.prepare('SELECT * FROM app_settings ORDER BY category ASC, key ASC').all();
  res.json(settings);
});

router.put('/settings/:key', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { key } = req.params;
  const { value, label, description, is_verified } = req.body;

  db.prepare(`
    UPDATE app_settings SET 
      value = ?, 
      label = COALESCE(?, label), 
      description = COALESCE(?, description),
      is_verified = ?,
      verified_by = ?,
      verified_at = datetime('now', 'localtime'),
      updated_at = datetime('now', 'localtime')
    WHERE key = ?
  `).run(value, label || null, description || null, is_verified ? 1 : 0, req.user!.id, key);

  logAudit(req.user, 'UPDATE_SETTING', 'Pengaturan Sistem', key, `Memperbarui konfigurasi '${key}' menjadi '${value}' (Status Verifikasi: ${is_verified ? 'Sah' : 'Belum Verifikasi'})`, req);
  res.json({ message: 'Pengaturan berhasil diperbarui.' });
});

// Full database backup export
router.get('/settings/backup-json', authMiddleware, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const backup = {
    generated_at: new Date().toISOString(),
    generated_by: req.user!.username,
    sports: db.prepare('SELECT * FROM sports').all(),
    events: db.prepare('SELECT * FROM events').all(),
    athletes: db.prepare('SELECT * FROM athletes').all(),
    officials: db.prepare('SELECT * FROM officials').all(),
    posts: db.prepare('SELECT * FROM posts').all(),
    post_personnel: db.prepare('SELECT * FROM post_personnel').all(),
    fixtures: db.prepare('SELECT * FROM fixtures').all(),
    results: db.prepare('SELECT * FROM results').all(),
    medals: db.prepare('SELECT * FROM medals').all(),
    daily_reports: db.prepare('SELECT * FROM daily_reports').all(),
    issues: db.prepare('SELECT * FROM issues').all(),
    accommodations: db.prepare('SELECT * FROM accommodations').all(),
    transport_assignments: db.prepare('SELECT * FROM transport_assignments').all(),
    protests: db.prepare('SELECT * FROM protests').all(),
    settings: db.prepare('SELECT * FROM app_settings').all(),
  };

  logAudit(req.user, 'EXPORT_BACKUP', 'Sistem', 'backup', 'Melakukan ekspor cadangan penuh database JSON', req);
  res.json(backup);
});

// ==========================================
// 13. ASISTEN AI KEOLAHRAGAAN KONI
// ==========================================

router.post('/ai/ask', async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Pertanyaan wajib disertakan.' });
  }

  const systemInstruction = `Anda adalah Asisten AI Resmi Sistem Monitoring Kontingen KONI Kota Bandung pada PORPROV XV Jawa Barat 2026.
Konteks Kegiatan:
- Pelaksanaan: 28 Oktober – 20 November 2026.
- Pembukaan: 7 November 2026 di Kota Bekasi (Stadion Patriot Candrabhaga).
- Penutupan: 20 November 2026 di Kota Bogor.
- Cakupan Tuan Rumah: 12 daerah di Jawa Barat.
- Kontingen KONI Kota Bandung: 78 Cabang Olahraga, 911 nomor pertandingan yang diikuti dari 1.156 nomor keseluruhan, 1.366 atlet, 307 pelatih, 161 official/mekanik, 86 manajer, dan total kontingen 1.920 orang.
- Posko Kontingen:
  1. Posko 1 (Kota Bekasi & Depok): Asrama Haji Kota Bekasi (Jl. Kemakmuran No. 72)
  2. Posko 2 (Kota Bogor & sekitarnya): House Tell Hotel Bogor (Jl. Pangrango No. 12)
  3. Posko 3 / Pusat (Kota Bandung): Kantor KONI Kota Bandung (Jl. Pajajaran No. 37)
- Target Medali Paparan: Angka 171 (Target Utama / Emas) dan 76 (Target Sekunder / Perak) yang diverifikasi oleh Admin.
- Slogan: Bandung Juara Jabar Kahiji.
Jawablah dengan bahasa Indonesia yang ramah, profesional, ringkas, dan akurat.`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });
      return res.json({ answer: response.text || 'Tidak ada respons teks dari asisten.' });
    }
  } catch (err: any) {
    console.error('Gemini API call failed, using intelligent fallback:', err?.message);
  }

  // Fallback knowledge base if offline or API key absent
  const qLower = question.toLowerCase();
  let answer = '';
  if (qLower.includes('jadwal') || qLower.includes('tanggal') || qLower.includes('kapan') || qLower.includes('buka') || qLower.includes('tutup')) {
    answer = 'PORPROV XV Jawa Barat 2026 diselenggarakan pada 28 Oktober – 20 November 2026. Upacara Pembukaan berlangsung pada 7 November 2026 di Stadion Patriot Candrabhaga Kota Bekasi, dan Upacara Penutupan pada 20 November 2026 di Kota Bogor.';
  } else if (qLower.includes('posko') || qLower.includes('lokasi') || qLower.includes('asrama') || qLower.includes('hotel')) {
    answer = 'Kontingen Kota Bandung mengoperasikan 3 posko utama: Posko 1 (Bekasi & Depok) di Asrama Haji Kota Bekasi, Posko 2 (Bogor) di House Tell Hotel Bogor, dan Posko Pusat Komando di Kantor KONI Kota Bandung Jl. Pajajaran No. 37.';
  } else if (qLower.includes('atlet') || qLower.includes('kontingen') || qLower.includes('pelatih') || qLower.includes('cabor') || qLower.includes('nomor')) {
    answer = 'Kontingen KONI Kota Bandung berkekuatan total 1.920 personil, terdiri dari 1.366 atlet, 307 pelatih, 161 official/mekanik, dan 86 manajer yang bertanding pada 78 cabang olahraga dan 911 nomor pertandingan (dari 1.156 nomor PORPROV).';
  } else if (qLower.includes('target') || qLower.includes('medali') || qLower.includes('171') || qLower.includes('76')) {
    answer = 'Sesuai data paparan, angka 171 merupakan Target Utama / Potensi Medali Emas dan angka 76 merupakan Target Medali Sekunder / Perak yang diverifikasi oleh Admin & Bidang Binpres untuk mempertahankan supremasi Bandung Juara Umum.';
  } else if (qLower.includes('tuan rumah') || qLower.includes('daerah') || qLower.includes('venue')) {
    answer = 'PORPROV XV Jawa Barat 2026 diselenggarakan di 12 daerah tuan rumah: Kota Bekasi, Kab. Bekasi, Kota Bogor, Kab. Bogor, Kota Bandung, Kab. Bandung, Kab. Bandung Barat, Kota Cimahi, Kab. Subang, Kab. Ciamis, Kab. Karawang, dan Kab. Garut.';
  } else {
    answer = `Terima kasih atas pertanyaan Anda tentang "${question}". Kontingen KONI Kota Bandung siap berlaga di PORPROV XV Jabar 2026 dengan 1.366 atlet di 78 cabor. Anda dapat memantau jadwal terkini, perolehan medali, dan laporan posko langsung di sistem ini.`;
  }

  res.json({ answer });
});
