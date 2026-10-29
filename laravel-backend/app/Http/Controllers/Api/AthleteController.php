<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Athlete;
use App\Models\Official;
use Illuminate\Support\Str;

class AthleteController extends Controller
{
    public function getAthletes(Request $request)
    {
        $query = Athlete::with('sport');

        if ($request->filled('sport_id')) {
            $query->where('sport_id', $request->sport_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        return response()->json($query->paginate($request->input('per_page', 50)));
    }

    public function createAthlete(Request $request)
    {
        $validated = $request->validate([
            'sport_id' => 'required|exists:sports,id',
            'full_name' => 'required|string',
            'gender' => 'required|in:L,P',
            'registration_number' => 'nullable|string|unique:athletes,registration_number',
            'birth_date' => 'nullable|date',
            'phone' => 'nullable|string',
        ]);

        $athlete = Athlete::create(array_merge($validated, [
            'id' => 'ath_' . Str::random(10),
            'status' => 'siap_tanding',
        ]));

        return response()->json($athlete, 201);
    }

    public function updateAthlete(Request $request, string $id)
    {
        $athlete = Athlete::findOrFail($id);
        $athlete->update($request->all());
        return response()->json($athlete);
    }

    public function deleteAthlete(string $id)
    {
        $athlete = Athlete::findOrFail($id);
        $athlete->delete();
        return response()->json(['message' => 'Atlet berhasil dihapus']);
    }

    public function getOfficials(Request $request)
    {
        $query = Official::with('sport');

        if ($request->filled('sport_id')) {
            $query->where('sport_id', $request->sport_id);
        }
        if ($request->filled('role_type')) {
            $query->where('role_type', $request->role_type);
        }

        return response()->json($query->get());
    }

    public function createOfficial(Request $request)
    {
        $validated = $request->validate([
            'sport_id' => 'required|exists:sports,id',
            'full_name' => 'required|string',
            'role_type' => 'required|in:pelatih,official_mekanik,manajer,tenaga_pendukung',
            'phone' => 'nullable|string',
        ]);

        $official = Official::create(array_merge($validated, [
            'id' => 'off_' . Str::random(10),
        ]));

        return response()->json($official, 201);
    }
}
