<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\AuditLog;
use App\Models\Sport;
use App\Models\Athlete;
use App\Models\Official;
use App\Models\Post;
use App\Models\Fixture;
use App\Models\Medal;
use App\Models\Issue;

class SettingController extends Controller
{
    public function getSettings()
    {
        return response()->json(Setting::all());
    }

    public function updateSetting(Request $request, string $key)
    {
        $setting = Setting::updateOrCreate(
            ['key' => $key],
            ['value' => is_array($request->value) ? json_encode($request->value) : $request->value]
        );

        return response()->json($setting);
    }

    public function getAuditLogs(Request $request)
    {
        $limit = $request->input('limit', 50);
        return response()->json(AuditLog::with('user')->orderBy('created_at', 'desc')->take($limit)->get());
    }

    public function getBackupJson()
    {
        return response()->json([
            'exported_at' => now()->toIso8601String(),
            'app' => 'Sistem Monitoring KONI Kota Bandung - PORPROV XV Jawa Barat 2026',
            'sports' => Sport::all(),
            'athletes_count' => Athlete::count(),
            'officials_count' => Official::count(),
            'posts' => Post::with('personnel')->get(),
            'medals' => Medal::all(),
            'issues' => Issue::with('updates')->get(),
            'fixtures' => Fixture::all(),
        ]);
    }

    public function getVisitPhotos()
    {
        // Sample recent photo documentation from Posko field visits
        return response()->json([
            [
                'id' => 'vphoto_1',
                'title' => 'Monitoring Posko Asrama Haji Bekasi',
                'url' => 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
                'post_name' => 'Posko Wilayah Bekasi & Depok',
                'date' => '2026-10-28',
                'caption' => 'Kunjungan Tim Monitoring & Evaluasi KONI Kota Bandung ke penginapan atlet bela diri.'
            ],
            [
                'id' => 'vphoto_2',
                'title' => 'Uji Coba Gelanggang Panahan Bogor',
                'url' => 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=800&q=80',
                'post_name' => 'Posko Wilayah Bogor & Sekitarnya',
                'date' => '2026-10-29',
                'caption' => 'Pengecekan fasilitas target dan kesiapan perlengkapan atlet panahan Kota Bandung.'
            ]
        ]);
    }
}
