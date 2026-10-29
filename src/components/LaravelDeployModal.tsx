import React, { useState } from 'react';
import {
  Server,
  Copy,
  CheckCircle,
  Terminal,
  ExternalLink,
  Code2,
  Box,
  Check,
  ShieldCheck,
  Database,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Modal } from './Modal.tsx';
import { resolveApiUrl } from '../lib/api.ts';

interface LaravelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LaravelDeployModal: React.FC<LaravelDeployModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'docker' | 'vps' | 'artisan' | 'env' | 'connect'>('docker');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestConnection = async () => {
    const targetUrl = customApiUrl.trim() || 'http://localhost:8000/api';
    setTestResult({ status: 'testing' });
    try {
      const endpoint = targetUrl.replace(/\/+$/, '') + '/health';
      const res = await fetch(endpoint, { mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        setTestResult({
          status: 'success',
          message: `Koneksi berhasil! Layanan: ${data.service || 'Laravel API'} (${data.framework || 'Laravel'})`
        });
      } else {
        setTestResult({
          status: 'error',
          message: `Server merespons dengan status HTTP ${res.status}. Pastikan CORS telah diizinkan.`
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Tidak dapat terhubung ke ${targetUrl}. Pastikan server Laravel sedang berjalan (${err.message}).`
      });
    }
  };

  const dockerComposeSnippet = `services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: koni-bandung-laravel-api:latest
    container_name: koni_laravel_api
    restart: unless-stopped
    ports:
      - "8000:80"
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
      DB_CONNECTION: mysql
      DB_HOST: db
      DB_PORT: 3306
      DB_DATABASE: koni_bandung_porprov2026
      DB_USERNAME: koni_user
      DB_PASSWORD: KoniBandungSecret2026!
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./storage:/var/www/html/storage
    networks:
      - koni-network

  db:
    image: mysql:8.0
    container_name: koni_mysql_db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: koni_bandung_porprov2026
      MYSQL_USER: koni_user
      MYSQL_PASSWORD: KoniBandungSecret2026!
      MYSQL_ROOT_PASSWORD: RootSecureKoniPassword2026!
    ports:
      - "3306:3306"
    volumes:
      - koni_mysql_data:/var/lib/mysql
    networks:
      - koni-network

networks:
  koni-network:
    driver: bridge

volumes:
  koni_mysql_data:`;

  const artisanCommands = `# 1. Salin file environment
cp .env.example .env

# 2. Pasang dependensi composer
composer install --no-dev --optimize-autoloader

# 3. Generate App Key
php artisan key:generate

# 4. Jalankan migrasi relasional 24 tabel & data seeder KONI Bandung
php artisan migrate --seed --force

# 5. Optimalkan cache Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 6. Jalankan dev server lokal (port 8000)
php artisan serve --port=8000`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Panduan & Paket Deployment Laravel Backend" maxWidth="4xl">
      <div className="space-y-5 text-slate-800">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white/20 rounded-md">
                Laravel 11 / 12 REST API
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/90 text-white rounded-md">
                Tersedia di /laravel-backend
              </span>
            </div>
            <h3 className="text-lg font-bold">Deploy Sistem Kontingen KONI Kota Bandung</h3>
            <p className="text-xs text-rose-100 mt-1 max-w-xl">
              Paket backend Laravel lengkap dengan 24 skema tabel relasional, Eloquent Models, Sanctum Token Auth,
              dan REST Controller telah siap dijalankan di server lokal, VPS Ubuntu/Debian, atau Docker.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-2xl font-black bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
              PORPROV 2026
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'docker' ? 'bg-red-50 text-red-700 font-bold border border-red-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Opsi 1: Docker (Rekomendasi)</span>
          </button>
          <button
            onClick={() => setActiveTab('vps')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'vps' ? 'bg-red-50 text-red-700 font-bold border border-red-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Opsi 2: VPS / cPanel (Nginx/Apache)</span>
          </button>
          <button
            onClick={() => setActiveTab('artisan')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'artisan' ? 'bg-red-50 text-red-700 font-bold border border-red-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Perintah Artisan & Migrasi</span>
          </button>
          <button
            onClick={() => setActiveTab('connect')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'connect' ? 'bg-red-50 text-red-700 font-bold border border-red-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Tes Koneksi API</span>
          </button>
        </div>

        {/* Tab 1: Docker Deployment */}
        {activeTab === 'docker' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <Box className="w-4 h-4 text-red-600" />
                <span>Deploy 1-Perintah dengan Docker Compose</span>
              </h4>
              <p className="text-slate-600 leading-relaxed mb-3">
                Direktori <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">/laravel-backend</code> telah dilengkapi file <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">Dockerfile</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">docker-compose.yml</code>, dan <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800">nginx.conf</code>.
              </p>

              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] space-y-1 relative group">
                <button
                  onClick={() => copyToClipboard('cd laravel-backend && docker compose up -d --build && docker compose exec app php artisan migrate --seed --force', 'docker-cmd')}
                  className="absolute top-2 right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] flex items-center gap-1 border border-slate-700"
                >
                  {copiedKey === 'docker-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'docker-cmd' ? 'Tersalin' : 'Salin Perintah'}</span>
                </button>
                <p className="text-slate-400"># Jalankan di terminal root proyek:</p>
                <p>cd laravel-backend</p>
                <p>docker compose up -d --build</p>
                <p>docker compose exec app php artisan migrate --seed --force</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                <span className="font-bold text-slate-700 font-mono text-[11px]">laravel-backend/docker-compose.yml</span>
                <button
                  onClick={() => copyToClipboard(dockerComposeSnippet, 'docker-compose')}
                  className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-[10px] flex items-center gap-1"
                >
                  {copiedKey === 'docker-compose' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Salin File</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] overflow-x-auto max-h-56">
                {dockerComposeSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: VPS / cPanel Deployment */}
        {activeTab === 'vps' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-red-600" />
                <span>Tahapan Deploy di Ubuntu VPS / Nginx / Apache</span>
              </h4>

              <ol className="list-decimal pl-5 space-y-2 text-slate-700 leading-relaxed">
                <li>
                  <strong>Unggah Direktori Laravel:</strong> Pindahkan folder <code className="bg-slate-200 px-1 rounded font-mono">laravel-backend</code> ke <code className="bg-slate-200 px-1 rounded font-mono">/var/www/koni-monitoring</code> di server Anda.
                </li>
                <li>
                  <strong>Jalankan Script Otomatis:</strong> Telah disertakan script <code className="bg-slate-200 px-1 rounded font-mono">deploy.sh</code> yang melakukan instalasi composer, pembuatan app key, dan migrasi relasional:
                  <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] mt-1.5 flex items-center justify-between">
                    <span>chmod +x deploy.sh && ./deploy.sh</span>
                    <button
                      onClick={() => copyToClipboard('chmod +x deploy.sh && ./deploy.sh', 'sh-cmd')}
                      className="text-slate-300 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
                <li>
                  <strong>Sajikan Frontend React (Monolith):</strong> Jalankan <code className="bg-slate-200 px-1 rounded font-mono">npm run build</code> pada aplikasi React ini, lalu salin folder <code className="bg-slate-200 px-1 rounded font-mono">dist/*</code> ke <code className="bg-slate-200 px-1 rounded font-mono">public/</code> di Laravel untuk menjadikannya satu domain terpadu.
                </li>
                <li>
                  <strong>Kredensial Default Login:</strong>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-bold text-red-700">Admin:</span> admin_koni / KoniBandung2026!
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200">
                      <span className="font-bold text-emerald-700">Koord Posko:</span> korlap_bekasi / KoniBandung2026!
                    </div>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* Tab 3: Artisan Commands */}
        {activeTab === 'artisan' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-[11px] relative">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400 text-xs font-sans font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Daftar Perintah Artisan & Database Seeder</span>
                </span>
                <button
                  onClick={() => copyToClipboard(artisanCommands, 'artisan-all')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] flex items-center gap-1"
                >
                  {copiedKey === 'artisan-all' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>Salin Semua</span>
                </button>
              </div>
              <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {artisanCommands}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Connect & Test API */}
        {activeTab === 'connect' && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-red-600" />
                <span>Pengujian Koneksi Backend Laravel</span>
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Frontend telah dikonfigurasi untuk dapat beralih otomatis ke server Laravel Anda melalui variabel <code className="bg-slate-200 px-1 rounded font-mono">VITE_API_URL</code>.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="http://localhost:8000/api atau https://api.domain.com/api"
                  value={customApiUrl}
                  onChange={(e) => setCustomApiUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={testResult.status === 'testing'}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {testResult.status === 'testing' ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>Tes Health Endpoint</span>
                </button>
              </div>

              {testResult.status === 'success' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{testResult.message}</span>
                </div>
              )}

              {testResult.status === 'error' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800">
                  <p className="font-bold">Gagal Terhubung:</p>
                  <p className="text-[11px] mt-0.5">{testResult.message}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <span className="text-[11px] text-slate-500">
            File lengkap tersedia di direktori lokal <strong className="text-slate-700">/laravel-backend</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
