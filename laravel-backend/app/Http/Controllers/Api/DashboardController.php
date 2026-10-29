<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sport;
use App\Models\Athlete;
use App\Models\Official;
use App\Models\Fixture;
use App\Models\Medal;
use App\Models\Issue;
use App\Models\Post;

class DashboardController extends Controller
{
    /**
     * Get Aggregated Dashboard Statistics for KONI Kota Bandung Kontingen
     */
    public function getStats()
    {
        $totalSports = Sport::count();
        $totalAthletes = Athlete::count();
        $totalOfficials = Official::count();
        $totalPosts = Post::count();

        // Target Medals
        $targetGold = Sport::sum('target_gold') ?: 171; // Default KONI Bandung target
        $targetSilver = Sport::sum('target_silver') ?: 76;
        $targetBronze = Sport::sum('target_bronze') ?: 95;

        // Medals Acquired
        $goldCount = Medal::where('medal_type', 'emas')->count();
        $silverCount = Medal::where('medal_type', 'perak')->count();
        $bronzeCount = Medal::where('medal_type', 'perunggu')->count();

        // Fixtures Summary
        $upcomingMatches = Fixture::where('scheduled_time', '>=', now())
            ->where('status', 'terjadwal')
            ->count();
        $completedMatches = Fixture::where('status', 'selesai')->count();

        // Active Issues / Posko Alerts
        $openIssues = Issue::whereIn('status', ['baru', 'diproses', 'menunggu'])->count();
        $criticalIssues = Issue::whereIn('status', ['baru', 'diproses'])
            ->where('priority', 'kritis')
            ->count();

        return response()->json([
            'contingent' => [
                'athletes' => $totalAthletes,
                'officials' => $totalOfficials,
                'sports' => $totalSports,
                'posts' => $totalPosts,
                'total_contingent' => $totalAthletes + $totalOfficials
            ],
            'medals' => [
                'target' => [
                    'gold' => $targetGold,
                    'silver' => $targetSilver,
                    'bronze' => $targetBronze,
                    'total' => $targetGold + $targetSilver + $targetBronze,
                ],
                'acquired' => [
                    'gold' => $goldCount,
                    'silver' => $silverCount,
                    'bronze' => $bronzeCount,
                    'total' => $goldCount + $silverCount + $bronzeCount,
                ],
                'achievement_percent' => $targetGold > 0 ? round(($goldCount / $targetGold) * 100, 1) : 0,
            ],
            'matches' => [
                'upcoming' => $upcomingMatches,
                'completed' => $completedMatches,
            ],
            'issues' => [
                'open' => $openIssues,
                'critical' => $criticalIssues,
            ]
        ]);
    }
}
