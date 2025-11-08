<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Task;
use App\Services\PertService;

class PertController extends Controller
{
    public function form()
    {
        // Restaurer les dernières données depuis la session si disponibles
        // (utilisé uniquement si old() n'a pas de données, c'est-à-dire quand on revient depuis la page résultat)
        $sessionData = session('last_pert_input', null);
        return view('pert.form', ['session_input' => $sessionData]);
    }

    public function generate(Request $request, PertService $pert)
    {
        // DEBUG: Log des données brutes reçues
        Log::info('Raw Request Input:', ['tasks' => $request->input('tasks'), 't0' => $request->input('t0')]);
        
        // Filtrer les tâches vides avant validation (celles sans nom)
        // Nettoyer aussi les prédécesseurs vides/null avant validation
        $tasksInput = $request->input('tasks', []);
        $tasksFiltered = [];
        foreach ($tasksInput as $idx => $task) {
            $name = trim($task['name'] ?? '');
            if (!empty($name)) {
                // Nettoyer les prédécesseurs vides/null et convertir en strings
                if (isset($task['predecessors']) && is_array($task['predecessors'])) {
                    $task['predecessors'] = array_filter(
                        array_map(function($p) {
                            $p = trim($p ?? '');
                            return empty($p) ? null : (string)$p;
                        }, $task['predecessors']),
                        function($p) { return $p !== null; }
                    );
                    $task['predecessors'] = array_values($task['predecessors']); // réindexer
                } else {
                    $task['predecessors'] = [];
                }
                $tasksFiltered[] = $task;
            }
        }
        
        // Remplacer dans la requête pour la validation
        $request->merge(['tasks' => $tasksFiltered]);

        $validated = $request->validate([
            't0' => ['nullable','integer','min:0'],
            'tasks' => ['required','array','min:1'],
            'tasks.*.name' => ['required','string'],
            // Autoriser soit durée unique, soit a/m/b
            'tasks.*.duration' => ['nullable','numeric','gt:0','required_without_all:tasks.*.optimistic,tasks.*.most_likely,tasks.*.pessimistic'],
            'tasks.*.optimistic' => ['nullable','numeric','gt:0','required_without:tasks.*.duration'],
            'tasks.*.most_likely' => ['nullable','numeric','gt:0','required_without:tasks.*.duration'],
            'tasks.*.pessimistic' => ['nullable','numeric','gt:0','required_without:tasks.*.duration'],
            'tasks.*.predecessors' => ['array'],
            'tasks.*.predecessors.*' => ['nullable', 'string'],
        ]);

        // Map input -> array prêt pour PERT
        $prepared = [];
        $nameMap = []; // Normaliser les noms (trim, uppercase) pour éviter les mélanges
        foreach ($validated['tasks'] as $idx => $t) {
            $name = strtoupper(trim($t['name'] ?? ''));
            if (empty($name)) continue;
            
            // Nettoyer les prédécesseurs vides et normaliser
            // IMPORTANT: Filtrer aussi les auto-dépendances (une tâche ne peut pas se précéder elle-même)
            $predsRaw = $t['predecessors'] ?? [];
            
            // DEBUG: Log pour chaque tâche
            Log::info("Task {$idx} ({$name}):", ['raw_predecessors' => $predsRaw]);
            
            $preds = [];
            foreach ($predsRaw as $p) {
                $p = trim($p ?? '');
                if (empty($p)) continue;
                
                // Si le prédécesseur contient des espaces ou des virgules, le parser en plusieurs
                // Ex: "C G" ou "C,G" devient ["C", "G"]
                if (preg_match('/[\s,;]+/', $p)) {
                    $split = preg_split('/[\s,;]+/', $p);
                    foreach ($split as $singlePred) {
                        $singlePred = strtoupper(trim($singlePred));
                        if (!empty($singlePred) && $singlePred !== $name) {
                            $preds[] = $singlePred;
                        }
                    }
                } else {
                    $p = strtoupper($p);
                    // Ignorer les auto-dépendances
                    if ($p !== $name) {
                        $preds[] = $p;
                    }
                }
            }
            
            // Dédupliquer les prédécesseurs
            $preds = array_unique($preds);
            $preds = array_values($preds); // réindexer
            
            Log::info("Task {$idx} ({$name}) cleaned predecessors:", ['cleaned' => $preds]);
            
            // Vérifier que la durée est valide
            $duration = (float)($t['duration'] ?? 0);
            if ($duration <= 0) {
                return back()->withErrors(['error' => "La tâche '{$name}' a une durée invalide ou manquante."])->withInput();
            }
            
            $task = Task::fromInput(array_merge($t, ['name' => $name]));
            
            // Normaliser le nom et mapper pour les prédécesseurs
            $nameMap[$name] = $name;
            
            $prepared[] = [
                'name' => $name,
                'expected_duration' => max(1, round($task->expected_duration)), // au moins 1 jour
                'predecessors' => $preds,
            ];
        }
        
        // Vérifier que les prédécesseurs référencés existent
        // Note: Les auto-dépendances ont déjà été filtrées ci-dessus
        $validNames = array_column($prepared, 'name');
        foreach ($prepared as $idx => $task) {
            foreach ($task['predecessors'] as $pred) {
                if (!in_array($pred, $validNames, true)) {
                    return back()->withErrors(['error' => "Le prédécesseur '{$pred}' référencé par '{$task['name']}' n'existe pas."])->withInput();
                }
            }
        }
        

        if (empty($prepared)) {
            return back()->withErrors(['error' => 'Aucune tâche valide à traiter. Vérifiez que les tâches ont un nom et une durée.'])->withInput();
        }

        $t0 = (int)($validated['t0'] ?? 1);
        
        // DEBUG: Log des données préparées pour vérification
        Log::info('PERT Prepared Data:', ['prepared' => $prepared]);
        
        try {
            $result = $pert->compute($prepared, $t0);
            
            // Vérification que le calcul a fonctionné
            if (empty($result['order']) || empty($result['ES']) || empty($result['EF'])) {
                return back()->withErrors(['error' => 'Erreur dans le calcul PERT: aucune donnée générée. Vérifiez vos dépendances.'])->withInput();
            }
        } catch (\Exception $e) {
            Log::error('PERT Error:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Erreur lors du calcul PERT: ' . $e->getMessage()])->withInput();
        }

        // Stocker les données validées dans la session pour les restaurer si l'utilisateur revient
        session(['last_pert_input' => $validated]);

        return view('pert.result', [
            'result' => $result,
        ]);
    }

    
}