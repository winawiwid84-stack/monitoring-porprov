<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Medal;
use App\Models\Sport;
use App\Models\Setting;
use Illuminate\Support\Str;

class MedalController extends Controller
{
    public function getMedals(Request $request)
    {
        $query = Medal::with(['sport', 'verifiedBy']);

        if ($request->filled('sport_id')) {
            $query->where('sport_id', $request->sport_id);
        }
        if ($request->filled('medal_type')) {
            $query->where('medal_type', $request->medal_type);
        }
        if ($request->has('is_verified')) {
            $query->where('is_verified', filter_var($request->is_verified, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderBy('awarded_date', 'desc')->get());
    }

    public function createMedal(Request $request)
    {
        $validated = $request->validate([
            'sport_id' => 'required|exists:sports,id',
            'medal_type' => 'required|in:emas,perak,perunggu',
            'athlete_or_team' => 'required|string',
            'awarded_date' => 'required|date',
            'source' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $medal = Medal::create(array_merge($validated, [
            'id' => 'med_' . Str::random(10),
            'is_verified' => false,
        ]));

        return response()->json($medal, 201);
    }

    public function verifyMedal(Request $request, string $id)
    {
        $medal = Medal::findOrFail($id);

        $validated = $request->validate([
            'is_verified' => 'required|boolean',
            'notes' => 'nullable|string',
        ]);

        $medal->update([
            'is_verified' => $validated['is_verified'],
            'verified_by' => $request->user()?->id,
            'verified_at' => now(),
            'notes' => $validated['notes'] ?? $medal->notes,
        ]);

        return response()->json($medal);
    }

    public function updateMedalTargets(Request $request)
    {
        $validated = $request->validate([
            'target_gold' => 'required|integer|min:0',
            'target_silver' => 'required|integer|min:0',
            'target_bronze' => 'required|integer|min:0',
            'notes' => 'nullable|string',
        ]);

        Setting::updateOrCreate(
            ['key' => 'medal_targets'],
            [
                'value' => json_encode($validated),
                'description' => 'Target medali resmi kontingen KONI Kota Bandung'
            ]
        );

        return response()->json(['message' => 'Target medali berhasil diperbarui', 'data' => $validated]);
    }
}
