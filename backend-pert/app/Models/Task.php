<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'name','optimistic','most_likely','pessimistic','expected_duration','predecessors'
    ];

    protected $casts = [
        'predecessors' => 'array',
    ];

    public static function fromInput(array $t): self
    {
        if (isset($t['duration'])) {
            $expected = (float) $t['duration'];
            $t['optimistic'] = $t['optimistic'] ?? $expected;
            $t['most_likely'] = $t['most_likely'] ?? $expected;
            $t['pessimistic'] = $t['pessimistic'] ?? $expected;
        } else {
            $expected = ($t['optimistic'] + 4 * $t['most_likely'] + $t['pessimistic']) / 6.0;
        }
        return new self([
            'name' => $t['name'],
            'optimistic' => $t['optimistic'],
            'most_likely' => $t['most_likely'],
            'pessimistic' => $t['pessimistic'],
            'expected_duration' => $expected,
            'predecessors' => $t['predecessors'] ?? [],
        ]);
    }
}