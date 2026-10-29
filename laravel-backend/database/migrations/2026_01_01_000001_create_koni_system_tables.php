<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations for KONI Kota Bandung PORPROV XV Jabar 2026 System.
     */
    public function up(): void
    {
        // 1. ROLES
        Schema::create('roles', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('permissions')->nullable();
            $table->timestamps();
        });

        // 2. HOST REGIONS (12 Daerah Tuan Rumah)
        Schema::create('host_regions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name')->unique();
            $table->string('code')->nullable();
            $table->boolean('is_primary')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // 3. VENUES
        Schema::create('venues', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('region_id');
            $table->string('name');
            $table->text('address')->nullable();
            $table->integer('capacity')->default(0);
            $table->string('contact_person')->nullable();
            $table->string('contact_phone')->nullable();
            $table->timestamps();

            $table->foreign('region_id')->references('id')->on('host_regions')->onDelete('cascade');
        });

        // 4. POSTS (Posko Kontingen)
        Schema::create('posts', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('region_id')->nullable();
            $table->string('location_name');
            $table->text('address');
            $table->string('coordinator_name')->nullable();
            $table->string('contact_phone')->nullable();
            $table->enum('status', ['aktif', 'persiapan', 'nonaktif'])->default('aktif');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('region_id')->references('id')->on('host_regions')->onDelete('set null');
        });

        // 5. USERS
        Schema::create('users', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->string('password'); // bcrypt hash
            $table->string('full_name');
            $table->string('phone')->nullable();
            $table->string('avatar_url')->nullable();
            $table->string('assigned_post_id')->nullable();
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('assigned_post_id')->references('id')->on('posts')->onDelete('set null');
        });

        // 6. USER_ROLES
        Schema::create('user_roles', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->string('role_id');
            $table->timestamp('assigned_at')->useCurrent();

            $table->unique(['user_id', 'role_id']);
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
        });

        // 7. POST PERSONNEL
        Schema::create('post_personnel', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('post_id');
            $table->string('full_name');
            $table->string('division');
            $table->string('position');
            $table->string('phone')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
        });

        // 8. SPORTS (78 Cabor)
        Schema::create('sports', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('category')->nullable();
            $table->integer('total_events')->default(0);
            $table->integer('joined_events')->default(0);
            $table->integer('target_gold')->default(0);
            $table->integer('target_silver')->default(0);
            $table->integer('target_bronze')->default(0);
            $table->boolean('target_verified')->default(false);
            $table->text('target_notes')->nullable();
            $table->string('primary_venue_id')->nullable();
            $table->timestamps();

            $table->foreign('primary_venue_id')->references('id')->on('venues')->onDelete('set null');
        });

        // 9. EVENTS (Nomor Pertandingan)
        Schema::create('events', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('sport_id');
            $table->string('name');
            $table->enum('gender', ['putra', 'putri', 'campuran', 'terbuka'])->default('putra');
            $table->boolean('is_followed')->default(true);
            $table->enum('potential_medal', ['emas', 'perak', 'perunggu', 'non_potensi', 'belum_diverifikasi'])->default('belum_diverifikasi');
            $table->boolean('potential_verified')->default(false);
            $table->timestamps();

            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('cascade');
        });

        // 10. ATHLETES (1.366 Atlet)
        Schema::create('athletes', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('registration_number')->nullable()->unique();
            $table->string('sport_id');
            $table->string('full_name');
            $table->string('nickname')->nullable();
            $table->enum('gender', ['L', 'P']);
            $table->date('birth_date')->nullable();
            $table->string('blood_type')->nullable();
            $table->string('phone')->nullable();
            $table->enum('status', ['siap_tanding', 'cedera', 'pemulihan', 'diskualifikasi'])->default('siap_tanding');
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('cascade');
        });

        // 11. TEAMS
        Schema::create('teams', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('sport_id');
            $table->string('event_id')->nullable();
            $table->string('name');
            $table->string('captain_name')->nullable();
            $table->integer('member_count')->default(0);
            $table->timestamps();

            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('cascade');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('set null');
        });

        // 12. OFFICIALS (307 Pelatih, 161 Official/Mekanik, 86 Manajer)
        Schema::create('officials', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('sport_id');
            $table->string('full_name');
            $table->enum('role_type', ['pelatih', 'official_mekanik', 'manajer', 'tenaga_pendukung']);
            $table->string('phone')->nullable();
            $table->string('license_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('cascade');
        });

        // 13. FIXTURES (Jadwal Pertandingan)
        Schema::create('fixtures', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('sport_id');
            $table->string('event_id')->nullable();
            $table->string('venue_id')->nullable();
            $table->string('post_id')->nullable();
            $table->string('match_code')->nullable();
            $table->string('stage')->nullable();
            $table->dateTime('scheduled_time');
            $table->string('opponent');
            $table->string('athlete_or_team');
            $table->enum('status', ['terjadwal', 'berlangsung', 'selesai', 'ditunda', 'dibatalkan'])->default('terjadwal');
            $table->text('delay_reason')->nullable();
            $table->string('source_update')->default('Panitia Pelaksana PORPROV XV');
            $table->string('last_updated_by')->nullable();
            $table->timestamps();

            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('cascade');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('set null');
            $table->foreign('venue_id')->references('id')->on('venues')->onDelete('set null');
            $table->foreign('post_id')->references('id')->on('posts')->onDelete('set null');
            $table->foreign('last_updated_by')->references('id')->on('users')->onDelete('set null');
        });

        // 14. RESULTS
        Schema::create('results', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('fixture_id')->unique();
            $table->string('score_bandung')->nullable();
            $table->string('score_opponent')->nullable();
            $table->enum('outcome', ['menang', 'kalah', 'seri', 'walkout', 'belum_ada'])->default('belum_ada');
            $table->text('summary')->nullable();
            $table->string('round_result')->nullable();
            $table->integer('rank_obtained')->nullable();
            $table->string('verified_by')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->timestamps();

            $table->foreign('fixture_id')->references('id')->on('fixtures')->onDelete('cascade');
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');
        });

        // 15. MEDALS (Perolehan Medali Kontingen)
        Schema::create('medals', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('sport_id');
            $table->string('event_id')->nullable();
            $table->string('fixture_id')->nullable();
            $table->enum('medal_type', ['emas', 'perak', 'perunggu']);
            $table->string('athlete_or_team');
            $table->date('awarded_date');
            $table->string('source')->default('Panitia Resmi Pertandingan');
            $table->boolean('is_verified')->default(false);
            $table->string('verified_by')->nullable();
            $table->dateTime('verified_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('cascade');
            $table->foreign('event_id')->references('id')->on('events')->onDelete('set null');
            $table->foreign('fixture_id')->references('id')->on('fixtures')->onDelete('set null');
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');
        });

        // 16. DAILY_REPORTS
        Schema::create('daily_reports', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('post_id');
            $table->string('reporter_id');
            $table->string('sport_id')->nullable();
            $table->string('fixture_id')->nullable();
            $table->date('report_date');
            $table->string('title');
            $table->text('activity_summary');
            $table->text('field_conditions')->nullable();
            $table->text('follow_up_action')->nullable();
            $table->enum('status', ['draft', 'terkirim', 'dievaluasi', 'selesai'])->default('terkirim');
            $table->string('photo_url')->nullable();
            $table->string('rating')->nullable();
            $table->text('findings')->nullable();
            $table->text('recommendation')->nullable();
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
            $table->foreign('reporter_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('set null');
            $table->foreign('fixture_id')->references('id')->on('fixtures')->onDelete('set null');
        });

        // 17. ISSUES
        Schema::create('issues', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('post_id')->nullable();
            $table->string('sport_id')->nullable();
            $table->string('daily_report_id')->nullable();
            $table->string('title');
            $table->enum('category', [
                'teknis_tanding', 'transportasi', 'penginapan_akomodasi',
                'konsumsi', 'medis', 'perwasitan_protes', 'perlengkapan', 'lainnya'
            ])->default('lainnya');
            $table->text('description');
            $table->enum('priority', ['rendah', 'sedang', 'tinggi', 'kritis'])->default('sedang');
            $table->enum('status', ['baru', 'diproses', 'menunggu', 'selesai'])->default('baru');
            $table->boolean('escalated_to_central')->default(false);
            $table->string('reported_by');
            $table->string('assigned_to')->nullable();
            $table->text('resolution')->nullable();
            $table->dateTime('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('posts')->onDelete('set null');
            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('set null');
            $table->foreign('daily_report_id')->references('id')->on('daily_reports')->onDelete('set null');
            $table->foreign('reported_by')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('assigned_to')->references('id')->on('users')->onDelete('set null');
        });

        // 18. ISSUE_UPDATES
        Schema::create('issue_updates', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('issue_id');
            $table->string('user_id');
            $table->text('action_taken');
            $table->string('status_before')->nullable();
            $table->string('status_after')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('issue_id')->references('id')->on('issues')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // 19. MEDICAL_CASES
        Schema::create('medical_cases', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('athlete_id');
            $table->string('sport_id');
            $table->string('post_id')->nullable();
            $table->enum('incident_type', [
                'cedera_tanding', 'penyakit_akut', 'kelelahan_dehidrasi',
                'kondisi_psikis_stres', 'gangguan_nutrisi', 'lainnya'
            ]);
            $table->enum('urgency_level', ['rendah', 'sedang', 'tinggi', 'darurat']);
            $table->text('diagnosis_summary');
            $table->text('treatment_given');
            $table->string('hospital_referral')->nullable();
            $table->string('medic_officer_name');
            $table->dateTime('incident_time');
            $table->enum('status', ['observasi', 'rawat_jalan', 'rawat_inap', 'pulih_siap_tanding', 'tidak_dapat_lanjut'])->default('observasi');
            $table->boolean('is_confidential')->default(true);
            $table->string('created_by');
            $table->timestamps();

            $table->foreign('athlete_id')->references('id')->on('athletes')->onDelete('cascade');
            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('cascade');
            $table->foreign('post_id')->references('id')->on('posts')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });

        // 20. ACCOMMODATIONS
        Schema::create('accommodations', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('region_id');
            $table->string('post_id')->nullable();
            $table->string('hotel_name');
            $table->text('address');
            $table->integer('total_capacity')->default(0);
            $table->integer('current_occupancy')->default(0);
            $table->text('assigned_sports')->nullable();
            $table->string('pic_name')->nullable();
            $table->string('pic_phone')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('region_id')->references('id')->on('host_regions')->onDelete('cascade');
            $table->foreign('post_id')->references('id')->on('posts')->onDelete('set null');
        });

        // 21. TRANSPORT_ASSIGNMENTS
        Schema::create('transport_assignments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('post_id');
            $table->string('sport_id')->nullable();
            $table->enum('vehicle_type', ['bus_besar', 'hiace_elf', 'mobil_operasional', 'ambulans', 'pickup_logistik']);
            $table->string('plate_number');
            $table->string('driver_name');
            $table->string('driver_phone');
            $table->text('route_plan');
            $table->string('departure_time')->nullable();
            $table->enum('status', ['standby', 'dalam_perjalanan', 'selesai', 'kendala_mogok_macet'])->default('standby');
            $table->text('issue_note')->nullable();
            $table->timestamps();

            $table->foreign('post_id')->references('id')->on('posts')->onDelete('cascade');
            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('set null');
        });

        // 22. PROTESTS
        Schema::create('protests', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('fixture_id')->nullable();
            $table->string('sport_id');
            $table->enum('protest_type', ['teknis_perwasitan', 'keabsahan_atlet', 'disiplin_etika', 'administrasi_pertandingan']);
            $table->text('description');
            $table->string('reporter_name');
            $table->string('reporter_role')->nullable();
            $table->dateTime('submission_time');
            $table->enum('fee_deposit_status', ['lunas', 'belum_lunas', 'bebas_biaya'])->default('lunas');
            $table->enum('hearing_status', ['diajukan', 'diproses_dewan_hakim', 'ditolak', 'dikabulkan_sebagian', 'dikabulkan_penuh'])->default('diajukan');
            $table->text('decision_summary')->nullable();
            $table->dateTime('decided_at')->nullable();
            $table->boolean('is_confidential')->default(false);
            $table->timestamps();

            $table->foreign('fixture_id')->references('id')->on('fixtures')->onDelete('set null');
            $table->foreign('sport_id')->references('id')->on('sports')->onDelete('cascade');
        });

        // 23. AUDIT_LOGS
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('user_id')->nullable();
            $table->string('action');
            $table->string('module');
            $table->text('description')->nullable();
            $table->string('ip_address')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });

        // 24. APP_SETTINGS
        Schema::create('app_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value');
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_settings');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('protests');
        Schema::dropIfExists('transport_assignments');
        Schema::dropIfExists('accommodations');
        Schema::dropIfExists('medical_cases');
        Schema::dropIfExists('issue_updates');
        Schema::dropIfExists('issues');
        Schema::dropIfExists('daily_reports');
        Schema::dropIfExists('medals');
        Schema::dropIfExists('results');
        Schema::dropIfExists('fixtures');
        Schema::dropIfExists('officials');
        Schema::dropIfExists('teams');
        Schema::dropIfExists('athletes');
        Schema::dropIfExists('events');
        Schema::dropIfExists('sports');
        Schema::dropIfExists('post_personnel');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('users');
        Schema::dropIfExists('posts');
        Schema::dropIfExists('venues');
        Schema::dropIfExists('host_regions');
        Schema::dropIfExists('roles');
    }
};
