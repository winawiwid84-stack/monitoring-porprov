<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\SportController;
use App\Http\Controllers\Api\AthleteController;
use App\Http\Controllers\Api\FixtureController;
use App\Http\Controllers\Api\MedalController;
use App\Http\Controllers\Api\PoskoController;
use App\Http\Controllers\Api\MedicalController;
use App\Http\Controllers\Api\ProtestController;
use App\Http\Controllers\Api\SettingController;

/*
|--------------------------------------------------------------------------
| API Routes - Sistem Monitoring Kontingen KONI Kota Bandung PORPROV XV 2026
|--------------------------------------------------------------------------
| Seluruh endpoint RESTful terhubung dengan frontend React / SPA.
*/

// Health Check
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'KONI Kota Bandung PORPROV XV 2026 API',
        'framework' => 'Laravel ' . app()->version(),
        'timestamp' => now()->toIso8601String()
    ]);
});

// Authentication Public Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected Routes (Token / Sanctum Authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth Profile & Management
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::get('/users', [AuthController::class, 'getUsers']);
        Route::post('/users', [AuthController::class, 'createUser']);
        Route::put('/users/{id}', [AuthController::class, 'updateUser']);
    });

    // Dashboard Statistics & Overview
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);

    // Sports & Events (78 Cabor & 911 Nomor Pertandingan)
    Route::get('/sports', [SportController::class, 'getSports']);
    Route::post('/sports', [SportController::class, 'createSport']);
    Route::put('/sports/{id}', [SportController::class, 'updateSport']);
    Route::get('/events', [SportController::class, 'getEvents']);
    Route::post('/events', [SportController::class, 'createEvent']);

    // Athletes & Officials (1.366 Atlet, 307 Pelatih, 161 Official, 86 Manajer)
    Route::get('/athletes', [AthleteController::class, 'getAthletes']);
    Route::post('/athletes', [AthleteController::class, 'createAthlete']);
    Route::put('/athletes/{id}', [AthleteController::class, 'updateAthlete']);
    Route::delete('/athletes/{id}', [AthleteController::class, 'deleteAthlete']);
    Route::get('/officials', [AthleteController::class, 'getOfficials']);
    Route::post('/officials', [AthleteController::class, 'createOfficial']);

    // Host Regions (12 Tuan Rumah) & Venues
    Route::get('/host-regions', [PoskoController::class, 'getHostRegions']);
    Route::get('/venues', [PoskoController::class, 'getVenues']);

    // Posko Kontingen (Bekasi, Bogor, Bandung) & Personel
    Route::get('/posts', [PoskoController::class, 'getPosts']);
    Route::put('/posts/{id}', [PoskoController::class, 'updatePost']);
    Route::get('/post-personnel', [PoskoController::class, 'getPostPersonnel']);
    Route::post('/post-personnel', [PoskoController::class, 'createPostPersonnel']);
    Route::put('/post-personnel/{id}', [PoskoController::class, 'updatePostPersonnel']);

    // Fixtures (Jadwal) & Match Results
    Route::get('/fixtures', [FixtureController::class, 'getFixtures']);
    Route::post('/fixtures', [FixtureController::class, 'createFixture']);
    Route::put('/fixtures/{id}', [FixtureController::class, 'updateFixture']);
    Route::post('/fixtures/{id}/result', [FixtureController::class, 'recordResult']);

    // Medals & Target Settings
    Route::get('/medals', [MedalController::class, 'getMedals']);
    Route::post('/medals', [MedalController::class, 'createMedal']);
    Route::put('/medals/{id}/verify', [MedalController::class, 'verifyMedal']);
    Route::put('/settings/medal-targets', [MedalController::class, 'updateMedalTargets']);

    // Daily Reports & Field Issues (Posko Laporan & Monev)
    Route::get('/daily-reports', [PoskoController::class, 'getDailyReports']);
    Route::post('/daily-reports', [PoskoController::class, 'createDailyReport']);
    Route::get('/issues', [PoskoController::class, 'getIssues']);
    Route::post('/issues', [PoskoController::class, 'createIssue']);
    Route::get('/issues/{id}/updates', [PoskoController::class, 'getIssueUpdates']);
    Route::post('/issues/{id}/updates', [PoskoController::class, 'addIssueUpdate']);

    // Medical Cases (Akses Terbatas Medis & Tim Satgas)
    Route::get('/medical', [MedicalController::class, 'getMedicalCases']);
    Route::post('/medical', [MedicalController::class, 'createMedicalCase']);
    Route::put('/medical/{id}', [MedicalController::class, 'updateMedicalCase']);

    // Accommodations & Logistics Transportation
    Route::get('/accommodations', [PoskoController::class, 'getAccommodations']);
    Route::put('/accommodations/{id}', [PoskoController::class, 'updateAccommodation']);
    Route::get('/transport', [PoskoController::class, 'getTransportAssignments']);
    Route::put('/transport/{id}', [PoskoController::class, 'updateTransportAssignment']);

    // Protests & Legal Advocacy
    Route::get('/protests', [ProtestController::class, 'getProtests']);
    Route::post('/protests', [ProtestController::class, 'createProtest']);
    Route::put('/protests/{id}', [ProtestController::class, 'updateProtest']);

    // Settings, Backups & Audit Logs
    Route::get('/audit-logs', [SettingController::class, 'getAuditLogs']);
    Route::get('/settings', [SettingController::class, 'getSettings']);
    Route::put('/settings/{key}', [SettingController::class, 'updateSetting']);
    Route::get('/settings/backup-json', [SettingController::class, 'getBackupJson']);
    Route::get('/visit-photos', [SettingController::class, 'getVisitPhotos']);
});
