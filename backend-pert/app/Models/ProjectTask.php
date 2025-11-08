<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectTask extends Model
{
    protected $fillable = ['project_id','code','duration','predecessors'];

    protected $casts = [ 'predecessors' => 'array' ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}


