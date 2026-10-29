<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Fixture;
use App\Models\Result;
use Illuminate\Support\Str;

class FixtureController extends Controller
{
    public function getFixtures(Request $request)
    {
        $query = Fixture::with(['sport', 'result', 'venue', 'post']);

        if ($request->filled('sport_id')) {
            $query->where('sport_id', $request->sport_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date')) {
            $query->whereDate('scheduled_time', $request->date);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('athlete_or_team', 'like', "%{$search}%")
                  ->orWhere('opponent', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('scheduled_time')->get());
    }

    public function createFixture(Request $request)
    {
        $validated = $request->validate([
            'sport_id' => 'required|exists:sports,id',
            'scheduled_time' => 'required|date',
            'opponent' => 'required|string',
            'athlete_or_team' => 'required|string',
            'venue_id' => 'nullable|string',
            'post_id' => 'nullable|string',
            'stage' => 'nullable|string',
        ]);

        $fixture = Fixture::create(array_merge($validated, [
            'id' => 'fix_' . Str::random(10),
            'status' => 'terjadwal',
        ]));

        return response()->json($fixture, 201);
    }

    public function updateFixture(Request $request, string $id)
    {
        $fixture = Fixture::findOrFail($id);
        $fixture->update($request->all());
        return response()->json($fixture);
    }

    public function recordResult(Request $request, string $id)
    {
        $fixture = Fixture::findOrFail($id);

        $validated = $request->validate([
            'score_bandung' => 'required|string',
            'score_opponent' => 'required|string',
            'outcome' => 'required|in:menang,kalah,seri,walkout',
            'summary' => 'nullable|string',
        ]);

        $result = Result::updateOrCreate(
            ['fixture_id' => $fixture->id],
            array_merge($validated, [
                'id' => 'res_' . Str::random(10),
                'verified_by' => $request->user()?->id,
                'is_verified' => true,
            ])
        );

        $fixture->update(['status' => 'selesai']);

        return response()->json($result);
    }
}
