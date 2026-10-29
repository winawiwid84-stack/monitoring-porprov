<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Post;
use App\Models\HostRegion;
use App\Models\Venue;
use App\Models\DailyReport;
use App\Models\Issue;
use App\Models\IssueUpdate;
use App\Models\Accommodation;
use App\Models\TransportAssignment;
use Illuminate\Support\Str;

class PoskoController extends Controller
{
    public function getHostRegions()
    {
        return response()->json(HostRegion::with('venues')->get());
    }

    public function getVenues()
    {
        return response()->json(Venue::with('region')->get());
    }

    public function getPosts()
    {
        return response()->json(Post::with(['region', 'personnel'])->get());
    }

    public function updatePost(Request $request, string $id)
    {
        $post = Post::findOrFail($id);
        $post->update($request->all());
        return response()->json($post);
    }

    public function getPostPersonnel(Request $request)
    {
        $query = Post::with('personnel');
        if ($request->filled('post_id')) {
            $query->where('id', $request->post_id);
        }
        return response()->json($query->get());
    }

    public function getDailyReports(Request $request)
    {
        $query = DailyReport::with(['post', 'reporter', 'sport']);
        if ($request->filled('post_id')) {
            $query->where('post_id', $request->post_id);
        }
        if ($request->filled('date')) {
            $query->whereDate('report_date', $request->date);
        }
        return response()->json($query->orderBy('report_date', 'desc')->get());
    }

    public function createDailyReport(Request $request)
    {
        $validated = $request->validate([
            'post_id' => 'required|exists:posts,id',
            'report_date' => 'required|date',
            'title' => 'required|string',
            'activity_summary' => 'required|string',
            'field_conditions' => 'nullable|string',
            'follow_up_action' => 'nullable|string',
        ]);

        $report = DailyReport::create(array_merge($validated, [
            'id' => 'rep_' . Str::random(10),
            'reporter_id' => $request->user()->id,
            'status' => 'terkirim',
        ]));

        return response()->json($report, 201);
    }

    public function getIssues(Request $request)
    {
        $query = Issue::with(['post', 'sport', 'reporter', 'updates']);

        if ($request->filled('post_id')) {
            $query->where('post_id', $request->post_id);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function createIssue(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'category' => 'required|string',
            'description' => 'required|string',
            'priority' => 'required|in:rendah,sedang,tinggi,kritis',
            'post_id' => 'nullable|string',
            'sport_id' => 'nullable|string',
        ]);

        $issue = Issue::create(array_merge($validated, [
            'id' => 'iss_' . Str::random(10),
            'status' => 'baru',
            'reported_by' => $request->user()->id,
        ]));

        return response()->json($issue, 201);
    }

    public function getIssueUpdates(string $id)
    {
        return response()->json(IssueUpdate::where('issue_id', $id)->with('user')->orderBy('created_at', 'asc')->get());
    }

    public function addIssueUpdate(Request $request, string $id)
    {
        $issue = Issue::findOrFail($id);

        $validated = $request->validate([
            'action_taken' => 'required|string',
            'status_after' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $update = IssueUpdate::create([
            'id' => 'upd_' . Str::random(10),
            'issue_id' => $issue->id,
            'user_id' => $request->user()->id,
            'action_taken' => $validated['action_taken'],
            'status_before' => $issue->status,
            'status_after' => $validated['status_after'] ?? $issue->status,
            'notes' => $validated['notes'] ?? null,
        ]);

        if (!empty($validated['status_after'])) {
            $issue->status = $validated['status_after'];
            if ($validated['status_after'] === 'selesai') {
                $issue->resolved_at = now();
            }
            $issue->save();
        }

        return response()->json($update, 201);
    }

    public function getAccommodations()
    {
        return response()->json(Accommodation::with(['region', 'post'])->get());
    }

    public function getTransportAssignments()
    {
        return response()->json(TransportAssignment::with(['post', 'sport'])->get());
    }
}
