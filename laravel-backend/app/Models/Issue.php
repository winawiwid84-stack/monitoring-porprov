<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Issue extends Model
{
    protected $table = 'issues';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'post_id', 'sport_id', 'daily_report_id', 'title',
        'category', 'description', 'priority', 'status', 'escalated_to_central',
        'reported_by', 'assigned_to', 'resolution', 'resolved_at'
    ];

    protected $casts = [
        'escalated_to_central' => 'boolean',
        'resolved_at' => 'datetime',
    ];

    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id');
    }

    public function sport()
    {
        return $this->belongsTo(Sport::class, 'sport_id');
    }

    public function updates()
    {
        return $this->hasMany(IssueUpdate::class, 'issue_id')->orderBy('created_at', 'desc');
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
