<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Athlete extends Model
{
    use SoftDeletes;

    protected $table = 'athletes';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'registration_number', 'sport_id', 'full_name', 'nickname',
        'gender', 'birth_date', 'blood_type', 'phone', 'status', 'is_verified'
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'birth_date' => 'date',
    ];

    public function sport()
    {
        return $this->belongsTo(Sport::class, 'sport_id');
    }

    public function medicalCases()
    {
        return $this->hasMany(MedicalCase::class, 'athlete_id');
    }
}
