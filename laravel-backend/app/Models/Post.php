<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $table = 'posts';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'name', 'region_id', 'location_name', 'address',
        'coordinator_name', 'contact_phone', 'status', 'notes'
    ];

    public function region()
    {
        return $this->belongsTo(HostRegion::class, 'region_id');
    }

    public function personnel()
    {
        return $this->hasMany(PostPersonnel::class, 'post_id');
    }

    public function dailyReports()
    {
        return $this->hasMany(DailyReport::class, 'post_id');
    }

    public function issues()
    {
        return $this->hasMany(Issue::class, 'post_id');
    }
}
