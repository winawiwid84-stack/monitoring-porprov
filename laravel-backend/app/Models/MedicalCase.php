<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MedicalCase extends Model
{
    protected $table = 'medical_cases';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'athlete_id', 'sport_id', 'post_id', 'incident_type',
        'urgency_level', 'diagnosis_summary', 'treatment_given',
        'hospital_referral', 'medic_officer_name', 'incident_time',
        'status', 'is_confidential', 'created_by'
    ];

    protected $casts = [
        'incident_time' => 'datetime',
        'is_confidential' => 'boolean',
    ];

    public function athlete()
    {
        return $this->belongsTo(Athlete::class, 'athlete_id');
    }

    public function sport()
    {
        return $this->belongsTo(Sport::class, 'sport_id');
    }
}
