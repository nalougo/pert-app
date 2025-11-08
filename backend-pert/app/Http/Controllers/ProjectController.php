<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectTask;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Project::withCount('tasks')->latest()->get();
        return view('projects.index', compact('projects'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'tasks' => ['required','array','min:1'],
            'tasks.*.name' => ['required','string'],
            'tasks.*.duration' => ['required','numeric','gt:0'],
            'tasks.*.predecessors' => ['array'],
            'tasks.*.predecessors.*' => ['string'],
        ]);

        $project = Project::create(['name' => $validated['name']]);
        foreach ($validated['tasks'] as $t) {
            ProjectTask::create([
                'project_id' => $project->id,
                'code' => $t['name'],
                'duration' => $t['duration'],
                'predecessors' => $t['predecessors'] ?? [],
            ]);
        }

        return response()->json(['ok' => true, 'project_id' => $project->id]);
    }

    public function open(Project $project)
    {
        $tasks = $project->tasks()->orderBy('id')->get()->map(function ($pt) {
            return [
                'name' => $pt->code,
                'duration' => (float)$pt->duration,
                'predecessors' => $pt->predecessors ?? [],
            ];
        })->values()->all();

        return view('pert.form', [ 'prefill' => $tasks, 'project' => $project ]);
    }
}


