<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fixture extends Model
{
    protected $table = 'fixtures';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'sport_id', 'event_id', 'venue_id', 'post_id', 'match_code',
        'stage', 'scheduled_time', 'opponent', 'athlete_or_team', 'status',
        'delay_reason', 'source_update', 'last_updated_by'
    ];

    protected $casts = [
        'scheduled_time' => 'datetime',
    ];

    public function sport()
    {
        return $this->belongsTo(Sport::class, 'sport_id');
    }

    public function result()
    {
        return $this->hasOne(Result::class, 'fixture_id');
    }

    public function venue()
    {
        return $this->belongsTo(Venue::class, 'venue_id');
    }

    public function post()
    {
        return $this->belongsTo(Post::class, 'post_id');
    }
}
