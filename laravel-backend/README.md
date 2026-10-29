# Panduan Deployment Sistem Monitoring KONI Kota Bandung – PORPROV XV Jabar 2026 dengan Laravel

Paket ini menyediakan implementasi backend **Laravel 11/12 REST API** lengkap untuk Sistem Monitoring Kontingen KONI Kota Bandung PORPROV XV Jawa Barat 2026.

---

## 🏗️ Struktur Arsitektur

```
laravel-backend/
├── app/
│   ├── Http/Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── DashboardController.php
│   │   ├── SportController.php
│   │   ├── AthleteController.php
│   │   ├── FixtureController.php
│   │   ├── MedalController.php
│   │   ├── PoskoController.php
│   │   ├── MedicalController.php
│   │   ├── ProtestController.php
│   │   └── SettingController.php
│   └── Models/
│       ├── User.php
│       ├── Sport.php
│       ├── Athlete.php
│       ├── Fixture.php
│       ├── Medal.php
│       ├── Post.php
│       ├── Issue.php
│       └── MedicalCase.php
├── database/
│   ├── migrations/
│   │   └── 2026_01_01_000001_create_koni_system_tables.php (24 Tabel Relasional)
│   └── seeders/
│       └── DatabaseSeeder.php (Seeder Data Resmi Kontingen & Posko)
├── routes/
│   └── api.php (Seluruh REST Endpoint)
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
└── deploy.sh
```

---

## 🚀 Opsi 1: Deploy Instan Menggunakan Docker (Rekomendasi VPS / Cloud)

Jika Anda memiliki server VPS (Ubuntu/Debian) dengan Docker & Docker Compose:

1. Salin folder `laravel-backend/` ke server Anda:
   ```bash
   scp -r laravel-backend user@your-server-ip:/var/www/koni-laravel
   cd /var/www/koni-laravel
   ```

2. Jalankan container Laravel API dan MySQL:
   ```bash
   docker compose up -d --build
   ```

3. Jalankan migrasi dan data awal (seeder):
   ```bash
   docker compose exec app php artisan migrate --seed --force
   ```

Backend Laravel kini aktif di `http://your-server-ip:8000/api`.

---

## ⚙️ Opsi 2: Deploy Standar (VPS / Shared Hosting cPanel dengan Nginx/Apache)

### Prasyarat Server:
- PHP >= 8.2 (ekstensi: `pdo_mysql`, `mbstring`, `openssl`, `tokenizer`, `xml`, `curl`, `gd`)
- Composer v2
- MySQL 8.0+ atau MariaDB 10.5+

### Langkah-langkah:
1. **Clone/Salin Project & Install Dependency:**
   ```bash
   cd /var/www/koni-laravel
   cp .env.example .env
   composer install --no-dev --optimize-autoloader
   ```

2. **Konfigurasi Database di `.env`:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=koni_bandung_porprov2026
   DB_USERNAME=koni_dbuser
   DB_PASSWORD=PasswordDatabaseAnda
   ```

3. **Generate Key & Migrasi Database:**
   ```bash
   php artisan key:generate
   php artisan migrate --seed --force
   ```

4. **Optimasi Cache Produksi:**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

5. **Hak Akses Folder:**
   ```bash
   chmod -R 775 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

---

## 🌐 Menghubungkan Frontend React dengan Backend Laravel

Pada frontend React Vite di proyek ini, Anda cukup mengatur variabel lingkungan:

1. Buat atau perbarui `.env` pada root frontend:
   ```env
   VITE_API_URL=http://localhost:8000/api
   # atau domain server produksi Anda:
   # VITE_API_URL=https://api-koni.bandung.go.id/api
   ```

2. Build frontend:
   ```bash
   npm run build
   ```

3. Jika ingin disajikan langsung (Monolith) melalui Laravel, salin isi folder `dist/` ke folder `laravel-backend/public/`:
   ```bash
   cp -r dist/* /var/www/koni-laravel/public/
   ```
   Lalu tambahkan fallback route di `routes/web.php`:
   ```php
   Route::get('/{any}', function () {
       return file_get_contents(public_path('index.html'));
   })->where('any', '.*');
   ```

---

## 🔑 Akun Default Hasil Seeder

| Role / Jabatan | Username | Password |
|---|---|---|
| **Super Admin** | `admin_koni` | `KoniBandung2026!` |
| **Ketua Kontingen** | `ketua_kontingen` | `KoniBandung2026!` |
| **Koordinator Posko Bekasi** | `korlap_bekasi` | `KoniBandung2026!` |
| **Tim Monev Lapangan** | `tim_monev1` | `KoniBandung2026!` |
| **Tim Medis Satgas** | `dokter_satgas` | `KoniBandung2026!` |

---

## 📞 Integrasi & Kontak
KONI Kota Bandung – Komisi IT & Sistem Monitoring Kontingen PORPROV XV Jabar 2026.
