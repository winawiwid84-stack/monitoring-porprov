#!/usr/bin/env bash
# ==============================================================================
# Script Otomatisasi Deploy Laravel - KONI Kota Bandung PORPROV XV Jabar 2026
# ==============================================================================
set -e

echo "🚀 [1/6] Memulai proses deployment Laravel KONI Kota Bandung..."

# Cek file .env
if [ ! -f .env ]; then
    echo "⚠️  File .env belum ditemukan, membuat dari .env.example..."
    cp .env.example .env
fi

# Install Composer dependencies
echo "📦 [2/6] Memasang dependency composer..."
composer install --no-dev --optimize-autoloader --no-interaction

# Generate Application Key jika belum ada
echo "🔑 [3/6] Memeriksa Application Key..."
php artisan key:generate --force

# Database Migration & Seeding
echo "🗄️  [4/6] Menjalankan migrasi database relasional (24 tabel)..."
php artisan migrate --force --seed

# Optimize Configuration & Route Cache
echo "⚡ [5/6] Mengoptimalkan cache config, event, dan route..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
echo "🔒 [6/6] Menyesuaikan hak akses direktori storage dan cache..."
chmod -R 775 storage bootstrap/cache

echo "✅ Deployment Laravel Berhasil Selesai!"
echo "🌐 API siap diakses pada port yang ditentukan (e.g., http://localhost:8000/api)"
