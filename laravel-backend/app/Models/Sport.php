<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sport extends Model
{
    protected $table = 'sports';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'code', 'name', 'category', 'total_events', 'joined_events',
        'target_gold', 'target_silver', 'target_bronze', 'target_verified',
        'target_notes', 'primary_venue_id'
    ];

    protected $casts = [
        'target_verified' => 'boolean',
        'total_events' => 'integer',
        'joined_events' => 'integer',
        'target_gold' => 'integer',
        'target_silver' => 'integer',
        'target_bronze' => 'integer',
    ];

    public function events()
    {
        return $this->hasMany(Event::class, 'sport_id');
    }

    public function athletes()
    {
        return $this->hasMany(Athlete::class, 'sport_id');
    }

    public function officials()
    {
        return $this->hasMany(Official::class, 'sport_id');
    }

    public function fixtures()
    {
        return $this->hasMany(Fixture::class, 'sport_id');
    }

    public function medals()
    {
        return $this->hasMany(Medal::class, 'sport_id');
    }

    public function primaryVenue()
    {
        return $this->belongsTo(Venue::class, 'primary_venue_id');
    }
}
