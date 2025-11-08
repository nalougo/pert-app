<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\PertService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class PertApiController extends Controller
{
    public function calculate(Request $request, PertService $pert)
    {
        try {
            // Validation
            $validated = $request->validate([
                't0' => ['nullable', 'integer', 'min:1'],
                'tasks' => ['required', 'array', 'min:1'],
                'tasks.*.id' => ['required', 'string'],
                'tasks.*.duration' => ['required', 'numeric', 'gt:0'],
                'tasks.*.predecessors' => ['array'],
                'tasks.*.predecessors.*' => ['string'],
            ]);

            // Préparer les données
            $prepared = [];
            $validNames = [];

            foreach ($validated['tasks'] as $task) {
                $taskId = strtoupper(trim($task['id']));
                $validNames[] = $taskId;

                // Nettoyer les prédécesseurs
                $predecessors = array_map(function($pred) {
                    return strtoupper(trim($pred));
                }, $task['predecessors'] ?? []);

                // Filtrer les auto-dépendances
                $predecessors = array_filter($predecessors, function($pred) use ($taskId) {
                    return $pred !== $taskId && !empty($pred);
                });

                $prepared[] = [
                    'name' => $taskId,
                    'expected_duration' => max(1, round($task['duration'])),
                    'predecessors' => array_values($predecessors),
                ];
            }

            // Vérifier que les prédécesseurs existent
            foreach ($prepared as $task) {
                foreach ($task['predecessors'] as $pred) {
                    if (!in_array($pred, $validNames, true)) {
                        return response()->json([
                            'message' => "Le prédécesseur '{$pred}' n'existe pas.",
                        ], 422);
                    }
                }
            }

            $t0 = (int)($validated['t0'] ?? 1);

            // Calculer le diagramme PERT
            $result = $pert->compute($prepared, $t0);

            // Formater la réponse pour le frontend React
            $tasks = [];
            foreach ($result['order'] as $taskName) {
                $tasks[] = [
                    'id' => $taskName,
                    'duration' => $prepared[array_search($taskName, array_column($prepared, 'name'))]['expected_duration'],
                    'predecessors' => $prepared[array_search($taskName, array_column($prepared, 'name'))]['predecessors'],
                    'earliestStart' => $result['ES'][$taskName] ?? 0,
                    'earliestFinish' => $result['EF'][$taskName] ?? 0,
                    'latestStart' => $result['LS'][$taskName] ?? 0,
                    'latestFinish' => $result['LF'][$taskName] ?? 0,
                    'totalFloat' => $result['slack'][$taskName] ?? 0,
                    'freeFloat' => $result['free_slack'][$taskName] ?? 0,
                    'isCritical' => in_array($taskName, $result['critical']),
                    'level' => $this->calculateLevel($taskName, $prepared),
                ];
            }

            // Calculer les arêtes critiques
            $criticalEdges = [];
            foreach ($result['critical'] as $criticalTask) {
                $taskData = $prepared[array_search($criticalTask, array_column($prepared, 'name'))];
                foreach ($taskData['predecessors'] as $pred) {
                    if (in_array($pred, $result['critical'])) {
                        $criticalEdges[] = [
                            'from' => $pred,
                            'to' => $criticalTask,
                        ];
                    }
                }
            }

            $response = [
                'tasks' => $tasks,
                'projectDuration' => $result['duration'],
                'criticalPath' => $result['critical'],
                'criticalEdges' => $criticalEdges,
            ];

            // ===== SAUVEGARDE EN FICHIER JSON =====
            $this->saveProjectToFile($validated['tasks'], $t0, $response);

            return response()->json($response);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('PERT API Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Erreur lors du calcul: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sauvegarder le projet et ses résultats dans un fichier JSON
     */
    private function saveProjectToFile(array $inputTasks, int $t0, array $results): void
    {
        try {
            // Créer le dossier projects s'il n'existe pas
            if (!Storage::exists('projects')) {
                Storage::makeDirectory('projects');
            }

            // Nom du fichier avec timestamp
            $filename = 'projects/project_' . time() . '_' . uniqid() . '.json';

            // Données à sauvegarder
            $data = [
                'created_at' => now()->toIso8601String(),
                't0' => $t0,
                'input_tasks' => $inputTasks,
                'results' => $results,
            ];

            // Sauvegarder en JSON
            Storage::put($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            Log::info("Projet PERT sauvegardé dans: {$filename}");

        } catch (\Exception $e) {
            Log::error('Erreur lors de la sauvegarde du projet: ' . $e->getMessage());
            // On ne bloque pas la réponse si la sauvegarde échoue
        }
    }

    /**
     * Lister tous les projets sauvegardés
     */
    public function listProjects()
    {
        try {
            $files = Storage::files('projects');
            $projects = [];

            foreach ($files as $file) {
                if (pathinfo($file, PATHINFO_EXTENSION) === 'json') {
                    $content = json_decode(Storage::get($file), true);
                    $projects[] = [
                        'filename' => basename($file),
                        'created_at' => $content['created_at'] ?? null,
                        't0' => $content['t0'] ?? null,
                        'tasks_count' => count($content['input_tasks'] ?? []),
                        'project_duration' => $content['results']['projectDuration'] ?? null,
                    ];
                }
            }

            // Trier par date (plus récent en premier)
            usort($projects, function($a, $b) {
                return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
            });

            return response()->json([
                'projects' => $projects,
                'total' => count($projects),
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la liste des projets: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la récupération des projets',
            ], 500);
        }
    }

    /**
     * Récupérer un projet spécifique
     */
    public function getProject(string $filename)
    {
        try {
            $filepath = 'projects/' . $filename;

            if (!Storage::exists($filepath)) {
                return response()->json([
                    'message' => 'Projet non trouvé',
                ], 404);
            }

            $content = json_decode(Storage::get($filepath), true);

            return response()->json($content);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération du projet: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la récupération du projet',
            ], 500);
        }
    }

    /**
     * Supprimer un projet
     */
    public function deleteProject(string $filename)
    {
        try {
            $filepath = 'projects/' . $filename;

            if (!Storage::exists($filepath)) {
                return response()->json([
                    'message' => 'Projet non trouvé',
                ], 404);
            }

            Storage::delete($filepath);

            return response()->json([
                'message' => 'Projet supprimé avec succès',
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur lors de la suppression du projet: ' . $e->getMessage());
            return response()->json([
                'message' => 'Erreur lors de la suppression du projet',
            ], 500);
        }
    }

    /**
     * Calculer le niveau d'une tâche (pour le positionnement dans le diagramme)
     */
    private function calculateLevel(string $taskName, array $tasks): int
    {
        $taskData = null;
        foreach ($tasks as $t) {
            if ($t['name'] === $taskName) {
                $taskData = $t;
                break;
            }
        }

        if (!$taskData || empty($taskData['predecessors'])) {
            return 0;
        }

        $maxPredLevel = 0;
        foreach ($taskData['predecessors'] as $pred) {
            $predLevel = $this->calculateLevel($pred, $tasks);
            $maxPredLevel = max($maxPredLevel, $predLevel);
        }

        return $maxPredLevel + 1;
    }
}
