<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\MedicalCase;
use App\Models\Protest;
use App\Models\Setting;
use App\Models\AuditLog;
use Illuminate\Support\Str;

class MedicalController extends Controller
{
    public function getMedicalCases(Request $request)
    {
        $query = MedicalCase::with(['athlete', 'sport']);

        if ($request->filled('sport_id')) {
            $query->where('sport_id', $request->sport_id);
        }
        if ($request->filled('urgency_level')) {
            $query->where('urgency_level', $request->urgency_level);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('incident_time', 'desc')->get());
    }

    public function createMedicalCase(Request $request)
    {
        $validated = $request->validate([
            'athlete_id' => 'required|exists:athletes,id',
            'sport_id' => 'required|exists:sports,id',
            'incident_type' => 'required|string',
            'urgency_level' => 'required|in:rendah,sedang,tinggi,darurat',
            'diagnosis_summary' => 'required|string',
            'treatment_given' => 'required|string',
            'hospital_referral' => 'nullable|string',
            'medic_officer_name' => 'required|string',
            'incident_time' => 'required|date',
            'post_id' => 'nullable|string',
        ]);

        $case = MedicalCase::create(array_merge($validated, [
            'id' => 'medcase_' . Str::random(10),
            'status' => 'observasi',
            'created_by' => $request->user()->id,
            'is_confidential' => true,
        ]));

        return response()->json($case, 201);
    }

    public function updateMedicalCase(Request $request, string $id)
    {
        $case = MedicalCase::findOrFail($id);
        $case->update($request->all());
        return response()->json($case);
    }
}
