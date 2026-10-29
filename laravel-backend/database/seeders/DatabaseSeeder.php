<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with KONI Kota Bandung PORPROV XV 2026 data.
     */
    public function run(): void
    {
        $now = now();

        // 1. ROLES
        $roles = [
            ['id' => 'admin', 'name' => 'Administrator Sistem', 'description' => 'Akses penuh seluruh modul, manajemen user & database'],
            ['id' => 'pengurus_pusat', 'name' => 'Pengurus Pusat KONI', 'description' => 'Pemantauan eksekutif perolehan medali & arahan kontingen'],
            ['id' => 'koordinator_posko', 'name' => 'Koordinator Posko Wilayah', 'description' => 'Penanggung jawab posko Bekasi, Bogor, atau Bandung'],
            ['id' => 'tim_monev', 'name' => 'Tim Monitoring & Evaluasi', 'description' => 'Petugas visitasi lapangan, input laporan harian & rating'],
            ['id' => 'tim_teknis', 'name' => 'Tim Teknis & Pertandingan', 'description' => 'Verifikasi skor, perolehan medali, dan jadwal tanding'],
            ['id' => 'tim_medis', 'name' => 'Tim Medis & Kesehatan', 'description' => 'Penanganan cedera atlet & rekam medis konfidensial'],
        ];
        foreach ($roles as $r) {
            DB::table('roles')->updateOrInsert(['id' => $r['id']], array_merge($r, ['created_at' => $now, 'updated_at' => $now]));
        }

        // 2. HOST REGIONS (12 Tuan Rumah)
        $regions = [
            ['id' => 'reg_bekasi_kota', 'name' => 'Kota Bekasi', 'code' => 'BKS-KOTA', 'is_primary' => true],
            ['id' => 'reg_bekasi_kab', 'name' => 'Kabupaten Bekasi', 'code' => 'BKS-KAB', 'is_primary' => false],
            ['id' => 'reg_bogor_kota', 'name' => 'Kota Bogor', 'code' => 'BGR-KOTA', 'is_primary' => true],
            ['id' => 'reg_bogor_kab', 'name' => 'Kabupaten Bogor', 'code' => 'BGR-KAB', 'is_primary' => false],
            ['id' => 'reg_bandung_kota', 'name' => 'Kota Bandung', 'code' => 'BDG-KOTA', 'is_primary' => true],
            ['id' => 'reg_bandung_kab', 'name' => 'Kabupaten Bandung', 'code' => 'BDG-KAB', 'is_primary' => false],
            ['id' => 'reg_kbb', 'name' => 'Kabupaten Bandung Barat', 'code' => 'KBB', 'is_primary' => false],
            ['id' => 'reg_cimahi', 'name' => 'Kota Cimahi', 'code' => 'CMH', 'is_primary' => false],
            ['id' => 'reg_depok', 'name' => 'Kota Depok', 'code' => 'DPK', 'is_primary' => false],
            ['id' => 'reg_karawang', 'name' => 'Kabupaten Karawang', 'code' => 'KRW', 'is_primary' => false],
            ['id' => 'reg_subang', 'name' => 'Kabupaten Subang', 'code' => 'SBG', 'is_primary' => false],
            ['id' => 'reg_cirebon', 'name' => 'Kota / Kab. Cirebon', 'code' => 'CRB', 'is_primary' => false],
        ];
        foreach ($regions as $reg) {
            DB::table('host_regions')->updateOrInsert(['id' => $reg['id']], array_merge($reg, ['created_at' => $now, 'updated_at' => $now]));
        }

        // 3. POSTS (3 Posko Utama)
        $posts = [
            [
                'id' => 'post_bekasi',
                'name' => 'Posko Wilayah Bekasi & Depok',
                'region_id' => 'reg_bekasi_kota',
                'location_name' => 'Asrama Haji Kota Bekasi / Grand Cikarang',
                'address' => 'Jl. Kemakmuran No. 72, Marga Jaya, Kec. Bekasi Selatan, Kota Bekasi',
                'coordinator_name' => 'Drs. H. Asep Mulyana, M.M.',
                'contact_phone' => '0812-2233-4455',
                'status' => 'aktif',
                'notes' => 'Melayani cabor renang, taekwondo, bela diri dan akuatik area Bekasi & sekitarnya.'
            ],
            [
                'id' => 'post_bogor',
                'name' => 'Posko Wilayah Bogor & Sekitarnya',
                'region_id' => 'reg_bogor_kota',
                'location_name' => 'House Tell Bogor / Sentul Nirwana',
                'address' => 'Jl. Pajajaran No. 102, Baranangsiang, Kec. Bogor Timur, Kota Bogor',
                'coordinator_name' => 'Rian Hidayat, S.Pd., M.Or.',
                'contact_phone' => '0813-8899-7766',
                'status' => 'aktif',
                'notes' => 'Melayani cabor panahan, menembak, atletik, dan balap sepeda.'
            ],
            [
                'id' => 'post_bandung',
                'name' => 'Posko Pusat Kontingen Bandung (Sekretariat)',
                'region_id' => 'reg_bandung_kota',
                'location_name' => 'Gedung KONI Kota Bandung / Pajajaran Sport Center',
                'address' => 'Jl. Pajajaran No. 37, Pasir Kaliki, Kec. Cicendo, Kota Bandung',
                'coordinator_name' => 'Dr. H. Nuryadi, M.Pd.',
                'contact_phone' => '0811-2233-9900',
                'status' => 'aktif',
                'notes' => 'Posko Induk & Crisis Center Kontingen Kota Bandung.'
            ],
        ];
        foreach ($posts as $p) {
            DB::table('posts')->updateOrInsert(['id' => $p['id']], array_merge($p, ['created_at' => $now, 'updated_at' => $now]));
        }

        // 4. USERS
        $defaultPassword = Hash::make('KoniBandung2026!');
        $users = [
            [
                'id' => 'usr_admin',
                'username' => 'admin_koni',
                'email' => 'admin@konikotabandung.id',
                'password' => $defaultPassword,
                'full_name' => 'Super Administrator KONI',
                'phone' => '081122334455',
                'assigned_post_id' => 'post_bandung',
                'status' => 'active',
                'role' => 'admin',
            ],
            [
                'id' => 'usr_pengurus',
                'username' => 'ketua_kontingen',
                'email' => 'ketua@konikotabandung.id',
                'password' => $defaultPassword,
                'full_name' => 'Ketua Kontingen Kota Bandung',
                'phone' => '081233445566',
                'assigned_post_id' => 'post_bandung',
                'status' => 'active',
                'role' => 'pengurus_pusat',
            ],
            [
                'id' => 'usr_posko_bks',
                'username' => 'korlap_bekasi',
                'email' => 'posko.bekasi@konikotabandung.id',
                'password' => $defaultPassword,
                'full_name' => 'Koordinator Posko Bekasi (H. Asep)',
                'phone' => '081222334455',
                'assigned_post_id' => 'post_bekasi',
                'status' => 'active',
                'role' => 'koordinator_posko',
            ],
            [
                'id' => 'usr_monev',
                'username' => 'tim_monev1',
                'email' => 'monev@konikotabandung.id',
                'password' => $defaultPassword,
                'full_name' => 'Tim Monev Satgas KONI (Agus S.)',
                'phone' => '081344556677',
                'assigned_post_id' => 'post_bogor',
                'status' => 'active',
                'role' => 'tim_monev',
            ],
            [
                'id' => 'usr_medis',
                'username' => 'dokter_satgas',
                'email' => 'medis@konikotabandung.id',
                'password' => $defaultPassword,
                'full_name' => 'dr. Farhan, Sp.KO (Koord. Medis)',
                'phone' => '081566778899',
                'assigned_post_id' => 'post_bekasi',
                'status' => 'active',
                'role' => 'tim_medis',
            ],
        ];

        foreach ($users as $u) {
            $roleId = $u['role'];
            unset($u['role']);
            DB::table('users')->updateOrInsert(['id' => $u['id']], array_merge($u, ['created_at' => $now, 'updated_at' => $now]));
            DB::table('user_roles')->updateOrInsert(
                ['user_id' => $u['id'], 'role_id' => $roleId],
                ['assigned_at' => $now]
            );
        }

        // 5. PRIORITY SPORTS
        $sports = [
            ['id' => 'sport_renang', 'code' => 'RN-01', 'name' => 'Renang & Akuatik', 'category' => 'Akuatik', 'total_events' => 42, 'joined_events' => 40, 'target_gold' => 14, 'target_silver' => 8, 'target_bronze' => 6],
            ['id' => 'sport_panahan', 'code' => 'PA-02', 'name' => 'Panahan (Archery)', 'category' => 'Akurasi', 'total_events' => 18, 'joined_events' => 18, 'target_gold' => 8, 'target_silver' => 5, 'target_bronze' => 4],
            ['id' => 'sport_taekwondo', 'code' => 'TK-03', 'name' => 'Taekwondo', 'category' => 'Bela Diri', 'total_events' => 24, 'joined_events' => 22, 'target_gold' => 9, 'target_silver' => 6, 'target_bronze' => 5],
            ['id' => 'sport_silat', 'code' => 'PS-04', 'name' => 'Pencak Silat', 'category' => 'Bela Diri', 'total_events' => 22, 'joined_events' => 22, 'target_gold' => 11, 'target_silver' => 5, 'target_bronze' => 4],
            ['id' => 'sport_bulutangkis', 'code' => 'BT-05', 'name' => 'Bulutangkis', 'category' => 'Raket', 'total_events' => 7, 'joined_events' => 7, 'target_gold' => 5, 'target_silver' => 2, 'target_bronze' => 1],
            ['id' => 'sport_atletik', 'code' => 'AT-06', 'name' => 'Atletik', 'category' => 'Terukur', 'total_events' => 46, 'joined_events' => 42, 'target_gold' => 15, 'target_silver' => 10, 'target_bronze' => 8],
            ['id' => 'sport_judo', 'code' => 'JD-07', 'name' => 'Judo', 'category' => 'Bela Diri', 'total_events' => 18, 'joined_events' => 18, 'target_gold' => 7, 'target_silver' => 4, 'target_bronze' => 3],
            ['id' => 'sport_menembak', 'code' => 'MB-08', 'name' => 'Menembak', 'category' => 'Akurasi', 'total_events' => 32, 'joined_events' => 28, 'target_gold' => 10, 'target_silver' => 6, 'target_bronze' => 5],
        ];
        foreach ($sports as $s) {
            DB::table('sports')->updateOrInsert(['id' => $s['id']], array_merge($s, ['created_at' => $now, 'updated_at' => $now]));
        }

        // 6. DEFAULT APP SETTINGS
        DB::table('app_settings')->updateOrInsert(
            ['key' => 'medal_targets'],
            [
                'value' => json_encode(['target_gold' => 171, 'target_silver' => 76, 'target_bronze' => 95, 'status' => 'official_target']),
                'description' => 'Target medali resmi kontingen KONI Kota Bandung PORPROV XV 2026',
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );
    }
}
