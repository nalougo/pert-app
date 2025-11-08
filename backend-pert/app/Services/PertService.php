<?php

namespace App\Services;

class PertService
{
    public function compute(array $tasks, int $t0 = 1): array
    {
        // tasks: [ name, expected_duration, predecessors[] ]
        $nameToTask = [];
        foreach ($tasks as $t) {
            $nameToTask[$t['name']] = [
                'duration' => (float) $t['expected_duration'],
                'pred' => $t['predecessors'] ?? [],
            ];
        }

        // Topological order (Kahn)
        $inDeg = [];
        foreach ($nameToTask as $n => $info) {
            $inDeg[$n] = count($info['pred']);
        }
        $queue = [];
        foreach ($inDeg as $n => $d) if ($d === 0) $queue[] = $n;

        $order = [];
        while ($queue) {
            $n = array_shift($queue);
            $order[] = $n;
            foreach ($nameToTask as $m => $info) {
                if (in_array($n, $info['pred'], true)) {
                    $inDeg[$m]--;
                    if ($inDeg[$m] === 0) $queue[] = $m;
                }
            }
        }
        
        // Vérifier que toutes les tâches sont dans l'ordre (sinon il y a un cycle)
        if (count($order) !== count($nameToTask)) {
            $missing = array_diff(array_keys($nameToTask), $order);
            throw new \Exception('Cycle détecté dans les dépendances. Tâches non triées: ' . implode(', ', $missing));
        }

        // Forward pass with integer rules (dates au plus tôt)
        // D+tot(T0) = T0
        $ES = $EF = [];
        foreach ($order as $n) {
            if (!isset($nameToTask[$n])) {
                continue; // ignorer si la tâche n'existe pas
            }
            $duration = (int)max(1, round($nameToTask[$n]['duration'])); // au moins 1
            if (count($nameToTask[$n]['pred']) === 0) {
                // Début de projet
                $ES[$n] = $t0; // D+tot = T0
                $EF[$n] = $ES[$n] + $duration - 1; // F+tot
            } else {
                $maxPredFtot = $t0 - 1; // commencer au moins à T0-1
                foreach ($nameToTask[$n]['pred'] as $p) {
                    if (isset($EF[$p])) {
                        $maxPredFtot = max($maxPredFtot, (int)$EF[$p]);
                    }
                }
                $ES[$n] = $maxPredFtot + 1;
                $EF[$n] = $ES[$n] + $duration - 1;
            }
        }

        // Project finish Tf = max(F+tot)
        $projectFinish = $t0;
        foreach ($EF as $val) {
            if ($val > 0) {
                $projectFinish = max($projectFinish, (int)$val);
            }
        }

        // Backward pass with integer rules (dates au plus tard)
        $LS = $LF = [];
        $reverse = array_reverse($order);
        foreach ($reverse as $n) {
            // Successeurs de n
            $succ = [];
            foreach ($nameToTask as $m => $info) {
                if (in_array($n, $info['pred'], true)) $succ[] = $m;
            }
            if (!isset($nameToTask[$n])) {
                continue;
            }
            $duration = (int)max(1, round($nameToTask[$n]['duration']));
            if (!$succ) {
                // Fin de projet
                $LF[$n] = $projectFinish; // F+tard
                $LS[$n] = $LF[$n] - $duration + 1; // D+tard
            } else {
                $minDtardSucc = PHP_INT_MAX;
                foreach ($succ as $s) {
                    if (isset($LS[$s])) {
                        $minDtardSucc = min($minDtardSucc, (int)$LS[$s]);
                    }
                }
                if ($minDtardSucc === PHP_INT_MAX) {
                    $minDtardSucc = $projectFinish;
                }
                $LF[$n] = $minDtardSucc - 1;
                $LS[$n] = $LF[$n] - $duration + 1;
            }
        }

        // Marges et chemin critique
        $slack = []; // marge totale = D+tard - D+tot
        $freeSlack = []; // marge libre = (min D+tot(succ)) - 1 - F+tot
        $critical = [];
        foreach ($order as $n) {
            if (!isset($ES[$n]) || !isset($LS[$n])) {
                continue; // ignorer si pas calculé
            }
            $slack[$n] = (int)$LS[$n] - (int)$ES[$n];
            // Successeurs
            $succ = [];
            foreach ($nameToTask as $m => $info) if (in_array($n, $info['pred'], true)) $succ[] = $m;
            if ($succ) {
                $minEsSucc = PHP_INT_MAX;
                foreach ($succ as $s) {
                    if (isset($ES[$s])) {
                        $minEsSucc = min($minEsSucc, (int)$ES[$s]);
                    }
                }
                if ($minEsSucc === PHP_INT_MAX) {
                    $freeSlack[$n] = $projectFinish - (int)$EF[$n];
                } else {
                    $freeSlack[$n] = $minEsSucc - 1 - (int)$EF[$n];
                }
            } else {
                $freeSlack[$n] = $projectFinish - (int)$EF[$n];
            }
            if ($slack[$n] === 0) $critical[] = $n;
        }

        // Mermaid (activity-on-node)
        $mermaid = "flowchart LR\n";
        foreach ($order as $n) {
            $mermaid .= "  {$n}[{$n}]\n";
        }
        foreach ($nameToTask as $n => $info) {
            foreach ($info['pred'] as $p) {
                $mermaid .= "  {$p} --> {$n}\n";
            }
        }
        $mermaid .= "classDef crit stroke:#d33,stroke-width:3px,color:#d33;\n";
        if (!empty($critical)) {
            $mermaid .= "class " . implode(',', $critical) . " crit\n";
        }

        return [
            'order' => $order,
            'ES' => $ES, 'EF' => $EF,
            'LS' => $LS, 'LF' => $LF,
            'slack' => $slack, // marge totale
            'free_slack' => $freeSlack,
            'critical' => $critical,
            'duration' => $projectFinish, // nombre de jours jusqu'à la fin
            't0' => $t0, // date de début du projet
            'mermaid' => $mermaid,
        ];
    }
}