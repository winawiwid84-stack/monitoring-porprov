<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sport;
use App\Models\Event;
use Illuminate\Support\Str;

class SportController extends Controller
{
    public function getSports()
    {
        return response()->json(Sport::with('primaryVenue')->get());
    }

    public function createSport(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:sports,code',
            'name' => 'required|string',
            'category' => 'nullable|string',
            'total_events' => 'nullable|integer',
            'target_gold' => 'nullable|integer',
            'target_silver' => 'nullable|integer',
            'target_bronze' => 'nullable|integer',
        ]);

        $sport = Sport::create(array_merge($validated, [
            'id' => 'sport_' . Str::slug($validated['code']),
        ]));

        return response()->json($sport, 201);
    }

    public function updateSport(Request $request, string $id)
    {
        $sport = Sport::findOrFail($id);
        $sport->update($request->all());
        return response()->json($sport);
    }

    public function getEvents(Request $request)
    {
        $query = Event::with('sport');
        if ($request->filled('sport_id')) {
            $query->where('sport_id', $request->sport_id);
        }
        return response()->json($query->get());
    }

    public function createEvent(Request $request)
    {
        $validated = $request->validate([
            'sport_id' => 'required|exists:sports,id',
            'name' => 'required|string',
            'gender' => 'required|in:putra,putri,campuran,terbuka',
        ]);

        $event = Event::create(array_merge($validated, [
            'id' => 'ev_' . Str::random(10),
        ]));

        return response()->json($event, 201);
    }
}
