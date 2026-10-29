<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Protest;
use App\Models\Setting;
use App\Models\AuditLog;
use Illuminate\Support\Str;

class ProtestController extends Controller
{
    public function getProtests()
    {
        return response()->json(Protest::with(['sport', 'fixture'])->orderBy('submission_time', 'desc')->get());
    }

    public function createProtest(Request $request)
    {
        $validated = $request->validate([
            'sport_id' => 'required|exists:sports,id',
            'protest_type' => 'required|string',
            'description' => 'required|string',
            'reporter_name' => 'required|string',
            'submission_time' => 'required|date',
            'fixture_id' => 'nullable|string',
        ]);

        $protest = Protest::create(array_merge($validated, [
            'id' => 'prot_' . Str::random(10),
            'hearing_status' => 'diajukan',
            'fee_deposit_status' => 'lunas',
        ]));

        return response()->json($protest, 201);
    }

    public function updateProtest(Request $request, string $id)
    {
        $protest = Protest::findOrFail($id);
        $protest->update($request->all());
        return response()->json($protest);
    }
}
