<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medal extends Model
{
    protected $table = 'medals';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'sport_id', 'event_id', 'fixture_id', 'medal_type',
        'athlete_or_team', 'awarded_date', 'source', 'is_verified',
        'verified_by', 'verified_at', 'notes'
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'awarded_date' => 'date',
        'verified_at' => 'datetime',
    ];

    public function sport()
    {
        return $this->belongsTo(Sport::class, 'sport_id');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
